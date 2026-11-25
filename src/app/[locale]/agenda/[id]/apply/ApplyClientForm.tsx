"use client";

import React, { useState, useEffect, useRef } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import Link from "next/link";
import {
  FiArrowLeft,
  FiAlertCircle,
  FiCheck,
  FiUpload,
  FiLink,
  FiLoader,
  FiImage,
  FiX,
  FiExternalLink,
  FiUsers,
  FiUser,
} from "react-icons/fi";
import { AgendaItem, AgendaKegiatan, DynamicFormField } from "@/types/agenda";
import { hasAnyFormQuestions } from "@/lib/registration-validation";
import { formatDateToIndo } from "@/utils/dateFormatter";
import { useToast } from "@/components/ui/Toast";
import SafeLottie from "@/components/ui/SafeLottie";
import { useTranslations } from "next-intl";
import { compressImage } from "@/lib/imageCompression";
import { getRegistrationImagePreviewUrl } from "@/lib/registration-utils";

function getRemainingCooldownMinutes(keys: string[], cooldownMinutes: number): number | null {
  const now = Date.now();
  const cooldownMs = cooldownMinutes * 60 * 1000;
  for (const key of keys) {
    const lastSubmitTime = localStorage.getItem(key);
    if (lastSubmitTime) {
      const timeDiff = now - parseInt(lastSubmitTime, 10);
      if (timeDiff < cooldownMs) {
        return Math.ceil((cooldownMs - timeDiff) / 60000);
      }
    }
  }
  return null;
}

function recordCooldownTimestamps(keys: string[]) {
  const nowStr = Date.now().toString();
  keys.forEach((key) => localStorage.setItem(key, nowStr));
}

function PublicImageField({
  fieldId,
  agendaId,
  value,
  placeholder,
  isInvalid,
  onChange,
  onErrorToast,
}: {
  fieldId: string;
  agendaId: string;
  value: string;
  placeholder?: string;
  isInvalid: boolean;
  onChange: (val: string) => void;
  onErrorToast: (msg: string) => void;
}) {
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewErr, setPreviewErr] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreviewErr(false);
  }, [value]);

  const previewUrl = getRegistrationImagePreviewUrl(value);

  const handleFileUpload = async (file?: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/") || file.type.includes("svg")) {
      onErrorToast("Format foto harus JPG, PNG, atau WebP.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      onErrorToast("Ukuran foto mentah maksimal 5MB.");
      return;
    }

    try {
      setIsUploading(true);
      const compressed = await compressImage(file, 0.5, 1400);

      if (compressed.size > 2 * 1024 * 1024) {
        onErrorToast("Ukuran foto setelah kompresi masih melebihi 2MB. Gunakan gambar yang lebih kecil.");
        return;
      }

      const fd = new FormData();
      fd.append("file", compressed);
      fd.append("agendaId", agendaId);

      const res = await fetch("/api/volunteer/upload", {
        method: "POST",
        body: fd,
      });
      const result = await res.json();
      if (!res.ok || !result.publicUrl) {
        throw new Error(result.error || "Gagal mengunggah foto.");
      }

      onChange(result.publicUrl);
    } catch (err: any) {
      onErrorToast(err?.message || "Gagal mengunggah foto.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (value) {
    return (
      <div className="p-3.5 rounded-2xl border border-outline-variant/40 bg-background flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-24 h-24 rounded-xl overflow-hidden border border-outline-variant/30 bg-surface-variant/30 flex items-center justify-center shrink-0">
          {previewUrl && !previewErr ? (
            <img
              src={previewUrl}
              alt="Preview foto terlampir"
              className="w-full h-full object-cover"
              onError={() => setPreviewErr(true)}
            />
          ) : (
            <FiImage size={24} className="text-on-surface-variant/60" />
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
            <FiCheck size={14} /> Foto terlampir
          </span>
          <p className="text-[11px] text-on-surface-variant truncate font-mono bg-surface-variant/20 px-2 py-1 rounded">
            {value}
          </p>
          <div className="flex items-center gap-3 pt-1">
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
            >
              Lihat <FiExternalLink size={12} />
            </a>
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 inline-flex items-center gap-1"
            >
              <FiX size={13} /> Hapus / Ganti
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1 bg-surface-variant/30 p-1 rounded-xl w-fit border border-outline-variant/20">
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            mode === "upload"
              ? "bg-surface text-primary shadow-xs"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <FiUpload size={13} /> Upload Foto Langsung
        </button>
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            mode === "url"
              ? "bg-surface text-primary shadow-xs"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <FiLink size={13} /> Tempel Link URL
        </button>
      </div>

      {mode === "upload" ? (
        <div>
          <input
            ref={fileInputRef}
            id={fieldId}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={isUploading}
            onChange={(e) => handleFileUpload(e.target.files?.[0])}
          />
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (!isUploading) handleFileUpload(e.dataTransfer.files?.[0]);
            }}
            className={`w-full p-5 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isUploading
                ? "border-primary bg-primary/5 text-primary"
                : isDragging
                ? "border-primary bg-primary/10 text-primary"
                : isInvalid
                ? "border-red-400 bg-red-50/40 text-red-600"
                : "border-outline-variant/50 bg-background hover:border-primary hover:bg-primary/5 text-on-surface-variant"
            }`}
          >
            {isUploading ? (
              <>
                <FiLoader className="animate-spin text-2xl text-primary" />
                <span className="text-xs font-bold text-primary">
                  Mengompres & mengunggah foto...
                </span>
              </>
            ) : (
              <>
                <FiImage className="text-2xl opacity-75" />
                <span className="text-xs font-bold text-on-surface">
                  Klik atau tarik foto ke sini
                </span>
                <span className="text-[11px] opacity-75">
                  Format JPG / PNG / WebP • Otomatis dikompres agar ringan
                </span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          <input
            type="url"
            id={fieldId}
            maxLength={500}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={
              placeholder || "https://drive.google.com/... atau https://canva.com/..."
            }
            className={`w-full bg-background border rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
              isInvalid
                ? "border-red-400 focus:border-red-500"
                : "border-outline-variant/50 focus:border-primary"
            }`}
          />
          <p className="text-[11px] text-on-surface-variant">
            Tempel tautan publik berawalan <code>https://</code> (Google Drive, Canva, Notion, dll).
          </p>
        </div>
      )}
    </div>
  );
}

export default function ApplyClientForm({
  agenda,
  isClosed,
  isQuotaFull = false,
  preselectedItemId,
}: {
  agenda: AgendaKegiatan;
  isClosed: boolean;
  isQuotaFull?: boolean;
  preselectedItemId?: string;
}) {
  const [responses, setResponses] = useState<Record<string, string>>({});
  const items: AgendaItem[] = agenda.items || [];
  const hasItems = items.length > 0;
  const isVolunteer = agenda.type === "volunteer";
  const allowMultiple = !isVolunteer && agenda.allow_multiple_items !== false;

  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(() => {
    if (!hasItems || !preselectedItemId) return [];
    const target = items.find((it) => it.id === preselectedItemId);
    if (!target) return [];
    const isFull =
      typeof target.quota === "number" && (target.filled_count || 0) >= target.quota;
    return isFull ? [] : [target.id];
  });
  const [itemError, setItemError] = useState<string | null>(null);
  const [submittedItemNames, setSubmittedItemNames] = useState<string[]>([]);

  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [invalidFields, setInvalidFields] = useState<Record<string, string>>({});
  const { error: showErrorToast, success: showSuccessToast } = useToast();
  const t = useTranslations("ApplyForm");

  const fields = agenda.form_schema || [];
  const selectedItems = items.filter((it) => selectedItemIds.includes(it.id));
  const activeExtraFields = selectedItems.flatMap((it) => it.extra_fields || []);
  const allActiveFields = [...fields, ...activeExtraFields];
  const hasAnyItemExtraFields = items.some((it) => (it.extra_fields || []).length > 0);
  const hasConfiguredQuestions = hasAnyFormQuestions(fields, items);
  const selectedItemSections = selectedItems.reduce<
    Array<{ item: AgendaItem; extra: DynamicFormField[]; startNum: number }>
  >((acc, item) => {
    const extra = item.extra_fields || [];
    if (extra.length === 0) return acc;
    const prevEnd =
      acc.length > 0
        ? acc[acc.length - 1].startNum + acc[acc.length - 1].extra.length
        : fields.length;
    acc.push({ item, extra, startNum: prevEnd });
    return acc;
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`draft_agenda_${agenda.id}`);
      if (saved) {
        setResponses(JSON.parse(saved));
      }
    } catch {
      // ignore storage errors
    }
  }, [agenda.id]);

  const toggleItemSelection = (item: AgendaItem) => {
    const isFull =
      typeof item.quota === "number" && (item.filled_count || 0) >= item.quota;
    if (isFull) return;

    setItemError(null);
    if (allowMultiple) {
      setSelectedItemIds((prev) =>
        prev.includes(item.id)
          ? prev.filter((id) => id !== item.id)
          : [...prev, item.id]
      );
    } else {
      setSelectedItemIds([item.id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isClosed || isQuotaFull) return;

    // Validasi pilihan posisi / cabang lomba
    if (hasItems && selectedItemIds.length === 0) {
      const msg = isVolunteer
        ? "Silakan pilih posisi yang ingin kamu lamar terlebih dahulu."
        : "Silakan pilih minimal 1 cabang lomba yang ingin diikuti.";
      setItemError(msg);
      showErrorToast(msg);
      document
        .getElementById("field-wrapper-items")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // Cooldown per item (atau per agenda jika tanpa sub-item)
    const cooldownKeys = hasItems
      ? selectedItemIds.map((id) => `last_volunteer_submit_${agenda.id}_${id}`)
      : [`last_volunteer_submit_${agenda.id}`];

    const waitMinutes = getRemainingCooldownMinutes(cooldownKeys, 3);
    if (waitMinutes !== null) {
      showErrorToast(
        `Tunggu ${waitMinutes} menit sebelum mendaftar ulang pada pilihan yang sama.`
      );
      return;
    }

    // Validate required fields and formats
    const newInvalidFields: Record<string, string> = {};
    let firstInvalidId: string | null = null;

    for (const field of allActiveFields) {
      const value = responses[field.id] || "";

      if (field.required && !value) {
        newInvalidFields[field.id] = t("errRequired");
        if (!firstInvalidId) firstInvalidId = field.id;
        continue;
      }

      if (value) {
        if (field.type === "email") {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            newInvalidFields[field.id] = t("errEmail");
            if (!firstInvalidId) firstInvalidId = field.id;
          }
        } else if (field.type === "number") {
          if (isNaN(Number(value))) {
            newInvalidFields[field.id] = t("errNumber");
            if (!firstInvalidId) firstInvalidId = field.id;
          }
        } else if (field.type === "tel") {
          const telRegex = /^\+?[0-9\s\-]{8,20}$/;
          if (!telRegex.test(value)) {
            newInvalidFields[field.id] = t("errPhone");
            if (!firstInvalidId) firstInvalidId = field.id;
          }
        } else if (field.type === "file" || field.type === "image") {
          if (!value.startsWith("https://")) {
            newInvalidFields[field.id] =
              "Tautan dokumen wajib menggunakan protokol https://";
            if (!firstInvalidId) firstInvalidId = field.id;
          } else if (value.length > 500) {
            newInvalidFields[field.id] = "Tautan dokumen maksimal 500 karakter";
            if (!firstInvalidId) firstInvalidId = field.id;
          }
        }
      }
    }

    if (Object.keys(newInvalidFields).length > 0) {
      setInvalidFields(newInvalidFields);
      showErrorToast(
        t("errFixFields", { count: Object.keys(newInvalidFields).length })
      );

      if (firstInvalidId) {
        const idToScroll = firstInvalidId;
        setTimeout(() => {
          document
            .getElementById(`field-wrapper-${idToScroll}`)
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      }
      return;
    }

    if (!turnstileToken) {
      showErrorToast("Silakan selesaikan verifikasi Captcha terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    setInvalidFields({});

    try {
      const activeFieldIds = new Set(allActiveFields.map((f) => f.id));
      const filteredResponses: Record<string, string> = {};
      for (const [key, val] of Object.entries(responses)) {
        if (activeFieldIds.has(key)) {
          filteredResponses[key] = val;
        }
      }

      const res = await fetch("/api/volunteer/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agendaId: agenda.id,
          itemIds: hasItems ? selectedItemIds : undefined,
          responses: filteredResponses,
          turnstileToken,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t("errorToast"));
      }

      setSubmittedItemNames(
        Array.isArray(data.selectedItems) ? data.selectedItems : []
      );
      setIsSuccess(true);
      showSuccessToast(t("successToast"));

      recordCooldownTimestamps(cooldownKeys);

      try {
        localStorage.removeItem(`draft_agenda_${agenda.id}`);
      } catch {
        // ignore
      }
    } catch (err: any) {
      showErrorToast(err.message || t("errorToast"));
      setTurnstileToken("");
      turnstileRef.current?.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (id: string, value: string) => {
    setResponses((prev) => {
      const newResponses = { ...prev, [id]: value };
      try {
        localStorage.setItem(
          `draft_agenda_${agenda.id}`,
          JSON.stringify(newResponses)
        );
      } catch {
        // ignore
      }
      return newResponses;
    });

    if (invalidFields[id]) {
      setInvalidFields((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    }
  };

  const renderFormField = (field: DynamicFormField, displayNumber: number) => {
    const errorMsg = invalidFields[field.id];
    const isInvalid = !!errorMsg;
    return (
      <div
        key={field.id}
        id={`field-wrapper-${field.id}`}
        className={`space-y-2 transition-all duration-300 p-4 -mx-4 rounded-2xl border ${
          isInvalid
            ? "bg-red-50/50 border-red-400"
            : "border-transparent bg-transparent"
        }`}
      >
        <label
          className={`text-sm font-bold flex gap-1 items-center ${
            isInvalid ? "text-red-700" : "text-on-surface"
          }`}
        >
          {displayNumber}. {field.label}
          {field.required ? (
            <span className="text-red-500">*</span>
          ) : (
            <span className="text-on-surface-variant/60 font-normal text-xs ml-1">
              ({t("optional")})
            </span>
          )}
        </label>

        {["text", "number", "email"].includes(field.type) && (
          <input
            type={field.type}
            required={field.required}
            maxLength={field.type === "number" ? 20 : 100}
            value={responses[field.id] || ""}
            onChange={(e) => handleChange(field.id, e.target.value)}
            placeholder={field.placeholder || t("placeholderText")}
            className={`w-full bg-background border rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
              isInvalid
                ? "border-red-400 focus:border-red-500"
                : "border-outline-variant/50 focus:border-primary"
            }`}
          />
        )}

        {field.type === "tel" && (
          <div
            className={`flex w-full bg-background border rounded-xl overflow-hidden transition-colors ${
              isInvalid
                ? "border-red-400 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500"
                : "border-outline-variant/50 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
            }`}
          >
            <div className="flex items-center justify-center px-4 bg-surface-variant/30 text-sm font-bold border-r border-inherit">
              +62
            </div>
            <input
              type="tel"
              required={field.required}
              maxLength={15}
              value={
                responses[field.id]
                  ? responses[field.id].replace(/^\+62/, "")
                  : ""
              }
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                if (val) {
                  handleChange(field.id, `+62${val}`);
                } else {
                  handleChange(field.id, "");
                }
              }}
              placeholder={field.placeholder || t("placeholderPhone")}
              className="flex-1 bg-transparent px-4 py-3 text-sm outline-none w-full"
            />
          </div>
        )}

        {field.type === "textarea" && (
          <textarea
            required={field.required}
            maxLength={500}
            value={responses[field.id] || ""}
            onChange={(e) => handleChange(field.id, e.target.value)}
            placeholder={field.placeholder || t("placeholderText")}
            className={`w-full bg-background border rounded-xl px-4 py-3 text-sm outline-none min-h-[120px] transition-colors ${
              isInvalid
                ? "border-red-400 focus:border-red-500"
                : "border-outline-variant/50 focus:border-primary"
            }`}
          />
        )}

        {field.type === "select" && (
          <select
            required={field.required}
            value={responses[field.id] || ""}
            onChange={(e) => handleChange(field.id, e.target.value)}
            className={`w-full bg-background border rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
              isInvalid
                ? "border-red-400 focus:border-red-500"
                : "border-outline-variant/50 focus:border-primary"
            }`}
          >
            <option value="">
              {field.placeholder || "-- Pilih Jawaban --"}
            </option>
            {(field.options || [])
              .map((o) => o.trim())
              .filter(Boolean)
              .map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
          </select>
        )}

        {field.type === "file" && (
          <div className="space-y-1.5">
            <input
              type="url"
              id={field.id}
              required={field.required}
              maxLength={500}
              value={responses[field.id] || ""}
              onChange={(e) => handleChange(field.id, e.target.value)}
              placeholder={
                field.placeholder ||
                "https://drive.google.com/... atau https://notion.so/..."
              }
              className={`w-full bg-background border rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
                isInvalid
                  ? "border-red-400 focus:border-red-500"
                  : "border-outline-variant/50 focus:border-primary"
              }`}
            />
            <p className="text-[11px] text-on-surface-variant flex items-start gap-1.5">
              <span className="shrink-0">🔗</span>
              <span>
                Lampirkan tautan publik (Google Drive, Notion, GitHub, LinkedIn, Figma, Canva, atau OneDrive). Pastikan izin akses dibuka untuk publik. Wajib diawali <code>https://</code> (maks. 500 karakter).
              </span>
            </p>
          </div>
        )}

        {field.type === "image" && (
          <PublicImageField
            fieldId={field.id}
            agendaId={agenda.id}
            value={responses[field.id] || ""}
            placeholder={field.placeholder}
            isInvalid={isInvalid}
            onChange={(val) => handleChange(field.id, val)}
            onErrorToast={showErrorToast}
          />
        )}

        {isInvalid && (
          <div className="text-red-600 text-xs font-bold flex items-center gap-1.5 mt-2">
            <FiAlertCircle size={14} />
            {t("questionError")} {errorMsg}
          </div>
        )}
      </div>
    );
  };

  if (isSuccess) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <div className="w-48 h-48 mx-auto mb-2">
          <SafeLottie src="/animations/Succes.lottie" autoplay />
        </div>
        <h1 className="text-3xl font-extrabold text-on-surface mb-4">
          {t("successTitle")}
        </h1>
        <p className="text-on-surface-variant text-lg mb-4">
          {t("successDescPart1")}{" "}
          <strong className="text-on-surface">{agenda.title}</strong>.{" "}
          {t("successDescPart2")}
        </p>
        {submittedItemNames.length > 0 && (
          <div className="inline-flex flex-wrap items-center justify-center gap-2 mb-8 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-2xl">
            <span className="text-xs font-bold text-emerald-800">
              {isVolunteer ? "Posisi Terpilih:" : "Cabang Lomba Terdaftar:"}
            </span>
            {submittedItemNames.map((name) => (
              <span
                key={name}
                className="text-xs font-extrabold bg-emerald-600 text-white px-3 py-1 rounded-full"
              >
                {name}
              </span>
            ))}
          </div>
        )}
        <div>
          <Link
            href={`/agenda/${agenda.id}`}
            className="inline-flex items-center justify-center bg-primary text-white font-bold px-8 py-3.5 rounded-xl hover:bg-primary/90 transition-all hover:-translate-y-1 hover:shadow-lg"
          >
            {t("backToDetail")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-5">
      <div className="mb-6">
        <Link
          href={`/agenda/${agenda.id}`}
          className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-medium text-sm"
        >
          <FiArrowLeft size={16} /> {t("backToDetail")}
        </Link>
      </div>

      <div className="bg-surface rounded-2xl md:rounded-3xl border border-outline-variant/30 shadow-lg overflow-hidden">
        {/* HEADER */}
        <div className="bg-primary p-6 md:p-8 text-white">
          <span className="inline-block bg-white/20 text-white text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider mb-4">
            {t("formLabel")}
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold mb-2">
            {agenda.title}
          </h1>
          <p className="text-white/80 text-sm">
            {isClosed
              ? t("closedMsg")
              : isQuotaFull
              ? t("fullMsg")
              : agenda.deadline
              ? `${t("deadlineMsg")}: ${formatDateToIndo(agenda.deadline)}`
              : t("fillBelow")}
          </p>
        </div>

        {/* BODY */}
        <div className="p-6 md:p-8">
          {isClosed || isQuotaFull ? (
            <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200 flex flex-col items-center text-center">
              <FiAlertCircle size={32} className="mb-3" />
              <h3 className="font-bold text-lg mb-1">
                {isQuotaFull ? t("quotaFull") : t("regClosed")}
              </h3>
              <p className="text-sm opacity-80">{t("cannotSubmit")}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {/* PILIHAN POSISI / CABANG LOMBA */}
              {hasItems && (
                <div
                  id="field-wrapper-items"
                  className={`p-4 md:p-5 rounded-2xl border space-y-3 transition-colors ${
                    itemError
                      ? "bg-red-50/50 border-red-400"
                      : "bg-primary/5 border-primary/20"
                  }`}
                >
                  <div>
                    <label className="text-sm font-extrabold text-on-surface flex items-center gap-1.5">
                      {isVolunteer
                        ? "Pilih Posisi yang Dilamar"
                        : allowMultiple
                        ? "Pilih Cabang Lomba (Bisa pilih lebih dari 1)"
                        : "Pilih Cabang Lomba"}
                      <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {isVolunteer
                        ? "Kuota langsung terisi oleh pendaftar tercepat. Posisi yang sudah penuh tidak dapat dipilih."
                        : allowMultiple
                        ? "Centang satu atau beberapa cabang lomba yang ingin kamu ikuti dalam satu formulir."
                        : "Pilih salah satu cabang lomba yang masih tersedia."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {items.map((item) => {
                      const filled = item.filled_count || 0;
                      const hasQuota = typeof item.quota === "number";
                      const isFull = hasQuota && filled >= item.quota!;
                      const remaining = hasQuota ? Math.max(0, item.quota! - filled) : null;
                      const isChecked = selectedItemIds.includes(item.id);
                      const pct =
                        hasQuota && item.quota! > 0
                          ? Math.min(100, Math.round((filled / item.quota!) * 100))
                          : 0;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          disabled={isFull}
                          onClick={() => toggleItemSelection(item)}
                          className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2 ${
                            isFull
                              ? "bg-surface-variant/30 border-outline-variant/30 opacity-60 cursor-not-allowed"
                              : isChecked
                              ? "bg-surface border-primary ring-2 ring-primary/25 shadow-xs"
                              : "bg-surface border-outline-variant/40 hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 w-full">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div
                                className={`mt-0.5 w-4 h-4 shrink-0 border flex items-center justify-center transition-colors ${
                                  allowMultiple ? "rounded" : "rounded-full"
                                } ${
                                  isChecked
                                    ? "bg-primary border-primary text-white"
                                    : "border-outline-variant bg-background"
                                }`}
                              >
                                {isChecked && <FiCheck size={11} />}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-sm text-on-surface leading-snug">
                                  {item.name}
                                </p>
                                {agenda.type === "event" && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-on-surface-variant mt-0.5">
                                    {item.participant_type === "tim" ? (
                                      <>
                                        <FiUsers size={10} /> Kategori Tim
                                      </>
                                    ) : (
                                      <>
                                        <FiUser size={10} /> Individu
                                      </>
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>

                            <span
                              className={`shrink-0 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                                isFull
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {isFull
                                ? "Penuh"
                                : hasQuota
                                ? `Sisa ${remaining}`
                                : "Terbuka"}
                            </span>
                          </div>

                          {item.description && (
                            <p className="text-[11px] text-on-surface-variant leading-relaxed line-clamp-2">
                              {item.description}
                            </p>
                          )}

                          <div className="w-full space-y-1 pt-1">
                            <div className="flex justify-between text-[11px] font-semibold text-on-surface-variant">
                              <span>
                                Terisi: <strong className="text-on-surface">{filled}</strong>
                                {hasQuota ? ` / ${item.quota}` : ""}
                              </span>
                              <span>
                                {hasQuota ? `Butuh ${item.quota}` : "Tanpa Batas"}
                              </span>
                            </div>
                            {hasQuota && (
                              <div className="w-full h-1.5 rounded-full bg-surface-variant/50 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    isFull
                                      ? "bg-rose-500"
                                      : pct >= 80
                                      ? "bg-amber-500"
                                      : "bg-emerald-500"
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {itemError && (
                    <div className="text-red-600 text-xs font-bold flex items-center gap-1.5">
                      <FiAlertCircle size={14} /> {itemError}
                    </div>
                  )}
                </div>
              )}

              {!hasConfiguredQuestions ? (
                <div className="text-center p-8 bg-surface-variant/20 rounded-xl text-on-surface-variant text-sm">
                  {t("noQuestions")}
                </div>
              ) : (
                <>
                  {fields.length > 0 && (
                    <div className="space-y-4">
                      {hasAnyItemExtraFields && (
                        <div className="pb-1 border-b border-outline-variant/20">
                          <h3 className="text-xs font-extrabold uppercase tracking-wider text-on-surface-variant">
                            Informasi Umum Pendaftar
                          </h3>
                        </div>
                      )}
                      {fields.map((field, idx) => renderFormField(field, idx + 1))}
                    </div>
                  )}

                  {hasItems && hasAnyItemExtraFields && selectedItems.length === 0 && (
                    <div className="p-4 rounded-xl bg-surface-variant/20 border border-dashed border-outline-variant/50 text-xs text-on-surface-variant text-center">
                      Pilih {isVolunteer ? "posisi" : "cabang lomba"} di atas untuk menampilkan pertanyaan khusus sesuai pilihanmu.
                    </div>
                  )}

                  {selectedItemSections.map(({ item, extra, startNum }) => (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl border border-primary/25 bg-primary/[0.03] space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-primary/15">
                        <div>
                          <p className="text-[11px] font-extrabold uppercase tracking-wider text-primary">
                            Pertanyaan Khusus {isVolunteer ? "Posisi" : "Cabang Lomba"}
                          </p>
                          <h3 className="text-base font-extrabold text-on-surface">
                            {item.name}
                          </h3>
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                          {extra.length} Pertanyaan
                        </span>
                      </div>
                      {extra.map((field, eIdx) =>
                        renderFormField(field, startNum + eIdx + 1)
                      )}
                    </div>
                  ))}
                </>
              )}

              {/* Cloudflare Turnstile Captcha */}
              <div className="flex justify-center w-full my-4 min-h-[65px]">
                <Turnstile
                  ref={turnstileRef}
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
                  onSuccess={(token) => setTurnstileToken(token)}
                  onError={() => showErrorToast("Gagal memuat verifikasi Captcha")}
                  onExpire={() => setTurnstileToken("")}
                  options={{ theme: "light" }}
                />
              </div>

              <div className="pt-6 border-t border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {hasItems && selectedItemIds.length > 0 && (
                  <p className="text-xs font-semibold text-primary">
                    {selectedItemIds.length}{" "}
                    {isVolunteer ? "posisi dipilih" : "cabang lomba dipilih"}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting || !hasConfiguredQuestions || !turnstileToken}
                  className="ml-auto bg-primary text-white font-bold px-8 py-3.5 rounded-xl hover:bg-primary/90 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                      {t("submitting")}
                    </>
                  ) : (
                    t("submitBtn")
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
