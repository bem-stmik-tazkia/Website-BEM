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

import { useState, useEffect, useRef, useMemo } from "react";
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
  const [translatedFields, setTranslatedFields] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const prevLangRef = useRef<string>(targetLang);
  const prevIdRef = useRef<string>("");

  // Gunakan ID item sebagai dependency yang stabil
  const contentId = item ? String(item[contentIdField] ?? "") : "";

  useEffect(() => {
    if (!item) {
      setTranslatedFields({});
      return;
    }

    const isSameContent = contentId === prevIdRef.current;
    const isSameLang = targetLang === prevLangRef.current;

    // Reset ke konten asli jika bahasa adalah Indonesia
    if (targetLang === "id") {
      setTranslatedFields({});
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
      setTranslatedFields({});
      return;
    }

    setIsTranslating(true);
    prevLangRef.current = targetLang;
    prevIdRef.current = contentId;

    translateContentBatch(contentId, contentTable, fields, targetLang, options)
      .then((fields) => {
        setTranslatedFields(fields);
      })
      .catch(() => {
        setTranslatedFields({}); // fallback
      })
      .finally(() => {
        setIsTranslating(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentId, targetLang]);

  const data = useMemo(() => {
    if (!item) return null;
    if (targetLang === "id" || Object.keys(translatedFields).length === 0) return item;
    return { ...item, ...translatedFields };
  }, [item, targetLang, translatedFields]);

  return { data, isTranslating };
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
  const [translatedMap, setTranslatedMap] = useState<Record<string, Record<string, string>>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  // Track last processed signature to avoid re-running on same data
  const prevSignatureRef = useRef<string>("");

  // Buat signature stabil berupa string primitif dari ID-ID item
  const itemsIdString = items ? items.map(i => String(i[contentIdField] ?? "")).join(",") : "";

  useEffect(() => {
    const signature = targetLang + ":" + itemsIdString;

    if (!items || items.length === 0) {
      setTranslatedMap({});
      prevSignatureRef.current = signature;
      return;
    }

    if (targetLang === "id") {
      setTranslatedMap({});
      prevSignatureRef.current = signature;
      return;
    }

    // Skip jika tidak ada perubahan
    if (signature === prevSignatureRef.current) return;
    prevSignatureRef.current = signature;

    setIsTranslating(true);

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
        if (Object.keys(fields).length === 0) return { contentId, translatedFields: {} };

        const translatedFields = await translateContentBatch(
          contentId,
          contentTable,
          fields,
          targetLang,
          options
        );
        return { contentId, translatedFields };
      })
    )
      .then((results) => {
        const newMap: Record<string, Record<string, string>> = {};
        for (const res of results) {
          newMap[res.contentId] = res.translatedFields;
        }
        setTranslatedMap(newMap);
      })
      .catch(() => setTranslatedMap({}))
      .finally(() => setIsTranslating(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsIdString, targetLang]);

  // Combine latest items (with live views/likes) with translated text fields
  const data = useMemo(() => {
    if (!items) return [];
    if (targetLang === "id" || Object.keys(translatedMap).length === 0) {
      return items;
    }
    return items.map((item) => {
      const id = String(item[contentIdField] ?? "");
      const trans = translatedMap[id];
      return trans ? { ...item, ...trans } : item;
    });
  }, [items, targetLang, translatedMap, contentIdField]);

  return { data, isTranslating };
}
