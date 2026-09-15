/**
 * Utility: Auto-Translate Konten Dinamis
 * 
 * Menggunakan MyMemory API (gratis, tanpa API key) dengan
 * Supabase sebagai cache layer agar tidak boros kuota.
 * 
 * Alur:
 * 1. Cek cache di Supabase → jika ada, return langsung
 * 2. Jika tidak ada → panggil MyMemory API
 * 3. Simpan hasil ke cache → return terjemahan
 */

import { createClient } from "@/utils/supabase/client";

// Bahasa yang didukung MyMemory
const SUPPORTED_LANGS = ["en", "ar", "fr", "ja"];

// Peta kode bahasa → format MyMemory
const LANG_MAP: Record<string, string> = {
  en: "en-GB",
  ar: "ar-SA",
  fr: "fr-FR",
  ja: "ja-JP",
  id: "id-ID",
};

/**
 * Hash sederhana untuk deteksi perubahan teks sumber
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

async function callGoogleTranslateAPI(text: string, targetLang: string): Promise<string | null> {
  if (!text || !text.trim()) return text;
  
  // Kode bahasa Google Translate sama dengan kode targetLang ("en", "ar", "ja", dsb)
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=id&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000), // Timeout 5 detik
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (data && data[0]) {
      // Gabungkan semua kalimat yang diterjemahkan
      const translated = data[0].map((item: any) => item[0]).join("");
      return translated;
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Terjemahkan satu field konten dengan caching di Supabase
 */
export async function translateContent(
  contentId: string,
  contentTable: string,
  fieldName: string,
  originalText: string,
  targetLang: string,
  options?: {
    expiresAt?: Date; // Untuk konten sementara (volunteer, dll)
  }
): Promise<string> {
  // Jika bahasa Indonesia atau tidak didukung → kembalikan teks asli
  if (targetLang === "id" || !SUPPORTED_LANGS.includes(targetLang)) {
    return originalText;
  }
  
  // Jika teks kosong → kembalikan langsung
  if (!originalText?.trim()) return originalText;
  
  const supabase = createClient();
  const sourceHash = simpleHash(originalText);
  
  // 1. Coba cek cache di Supabase (DINONAKTIFKAN SEMENTARA agar console bersih)
  /*
  try {
    const { data: cached, error: cacheErr } = await supabase
      .from("translations_cache")
      .select("translated_text, source_hash")
      .eq("content_id", contentId)
      .eq("content_table", contentTable)
      .eq("field_name", fieldName)
      .eq("target_lang", targetLang)
      .maybeSingle();
    
    // Cache ditemukan dan teks sumber belum berubah
    if (!cacheErr && cached && cached.source_hash === sourceHash) {
      return cached.translated_text;
    }
  } catch {
    // Tabel belum ada atau error lain — lanjut ke API
  }
  */

  // 2. Terjemahkan via Google API
  try {
    const translated = await callGoogleTranslateAPI(originalText, targetLang);
    
    if (!translated || translated === originalText) {
      return originalText; // Fallback ke teks asli
    }
    
    // 3. Simpan ke cache (DINONAKTIFKAN SEMENTARA)
    /*
    try {
      await supabase.from("translations_cache").upsert(
        {
          content_id: contentId,
          content_table: contentTable,
          field_name: fieldName,
          source_lang: "id",
          target_lang: targetLang,
          translated_text: translated,
          source_hash: sourceHash,
          expires_at: options?.expiresAt?.toISOString() ?? null,
        },
        {
          onConflict: "content_id,content_table,field_name,target_lang",
        }
      );
    } catch {
      // Abaikan error cache — terjemahan tetap dikembalikan
    }
    */
    
    return translated;
  } catch {
    return originalText;
  }
}

/**
 * Terjemahkan banyak field sekaligus (batch) untuk efisiensi
 * Mengurangi jumlah request ke API dengan menggabungkan field
 */
export async function translateContentBatch(
  contentId: string,
  contentTable: string,
  fields: Record<string, string>, // { fieldName: originalText }
  targetLang: string,
  options?: { expiresAt?: Date }
): Promise<Record<string, string>> {
  if (targetLang === "id" || !SUPPORTED_LANGS.includes(targetLang)) {
    return fields;
  }
  
  const results: Record<string, string> = {};
  
  // Terjemahkan semua field secara paralel
  await Promise.all(
    Object.entries(fields).map(async ([fieldName, originalText]) => {
      results[fieldName] = await translateContent(
        contentId,
        contentTable,
        fieldName,
        originalText,
        targetLang,
        options
      );
    })
  );
  
  return results;
}
