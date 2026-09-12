/**
 * React Hook: useTranslatedContent
 * 
 * Digunakan di komponen client-side untuk menerjemahkan
 * konten dinamis dari database secara otomatis.
 * 
 * Contoh penggunaan:
 * const { data, isTranslating } = useTranslatedContent(
 *   news,           // data asli dari DB
 *   "berita",       // nama tabel
 *   locale,         // bahasa aktif dari next-intl
 *   ["title", "excerpt"]  // field yang mau diterjemahkan
 * );
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { translateContentBatch } from "@/utils/translate";

type TranslateResult<T> = {
  data: T;
  isTranslating: boolean;
};

/**
 * Hook untuk menerjemahkan satu item
 */
export function useTranslatedContent<T extends Record<string, any>>(
  item: T | null | undefined,
  contentTable: string,
  targetLang: string,
  fieldsToTranslate: (keyof T)[],
  contentIdField: keyof T = "id",
  options?: { expiresAt?: Date }
): TranslateResult<T | null> {
  const [translated, setTranslated] = useState<T | null>(item ?? null);
  const [isTranslating, setIsTranslating] = useState(false);
  const prevLangRef = useRef<string>(targetLang);
  const prevIdRef = useRef<string>("");

  // Gunakan ID item sebagai dependency yang stabil, bukan object-nya
  const contentId = item ? String(item[contentIdField] ?? "") : "";

  useEffect(() => {
    if (!item) {
      setTranslated(null);
      return;
    }

    const isSameContent = contentId === prevIdRef.current;
    const isSameLang = targetLang === prevLangRef.current;

    // Reset ke konten asli jika bahasa adalah Indonesia
    if (targetLang === "id") {
      setTranslated(item);
      prevLangRef.current = targetLang;
      prevIdRef.current = contentId;
      return;
    }

    // Tidak perlu translate ulang jika konten dan bahasa sama
    if (isSameContent && isSameLang) return;

    const fields: Record<string, string> = {};
    for (const field of fieldsToTranslate) {
      const val = item[field];
      if (val && typeof val === "string") {
        fields[field as string] = val;
      }
    }

    if (Object.keys(fields).length === 0) {
      setTranslated(item);
      return;
    }

    setIsTranslating(true);
    prevLangRef.current = targetLang;
    prevIdRef.current = contentId;

    translateContentBatch(contentId, contentTable, fields, targetLang, options)
      .then((translatedFields) => {
        setTranslated({ ...item, ...translatedFields });
      })
      .catch(() => {
        setTranslated(item); // fallback
      })
      .finally(() => {
        setIsTranslating(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentId, targetLang]);

  return { data: translated, isTranslating };
}

/**
 * Hook untuk menerjemahkan array/list item
 */
export function useTranslatedList<T extends Record<string, any>>(
  items: T[],
  contentTable: string,
  targetLang: string,
  fieldsToTranslate: (keyof T)[],
  contentIdField: keyof T = "id",
  options?: { expiresAt?: Date }
): TranslateResult<T[]> {
  const [translated, setTranslated] = useState<T[]>(items);
  const [isTranslating, setIsTranslating] = useState(false);
  // Track last processed signature to avoid re-running on same data
  const prevSignatureRef = useRef<string>("");

  // Buat signature stabil berupa string primitif dari ID-ID item
  // Ini AMAN sebagai dependency karena string selalu dibandingkan by value
  const itemsIdString = items.map(i => String(i[contentIdField] ?? "")).join(",");

  useEffect(() => {
    const signature = targetLang + ":" + itemsIdString;

    if (!items || items.length === 0) {
      setTranslated([]);
      prevSignatureRef.current = signature;
      return;
    }

    // Skip jika tidak ada perubahan
    if (signature === prevSignatureRef.current) return;
    prevSignatureRef.current = signature;

    if (targetLang === "id") {
      setTranslated(items);
      return;
    }

    setIsTranslating(true);
    setTranslated(items);

    Promise.all(
      items.map(async (item) => {
        const contentId = String(item[contentIdField] ?? "");
        const fields: Record<string, string> = {};
        for (const field of fieldsToTranslate) {
          const val = item[field];
          if (val && typeof val === "string") {
            fields[field as string] = val;
          }
        }
        if (Object.keys(fields).length === 0) return item;

        const translatedFields = await translateContentBatch(
          contentId,
          contentTable,
          fields,
          targetLang,
          options
        );
        return { ...item, ...translatedFields };
      })
    )
      .then((results) => setTranslated(results))
      .catch(() => setTranslated(items))
      .finally(() => setIsTranslating(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsIdString, targetLang]);

  return { data: translated, isTranslating };
}
