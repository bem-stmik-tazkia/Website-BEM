"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { Link, useRouter } from "@/i18n/routing";
import NativeLink from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowLeft,
  FiAlertCircle,
  FiAlertTriangle,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiUpload,
  FiLink,
  FiLoader,
  FiImage,
  FiX,
  FiExternalLink,
  FiUsers,
  FiUser,
  FiEdit3,
  FiLogOut,
  FiLock,
  FiLogIn,
  FiGrid,
} from "react-icons/fi";
import { AgendaItem, AgendaKegiatan, DynamicFormField } from "@/types/agenda";
import { hasAnyFormQuestions } from "@/lib/registration-validation";
import { formatDeadlineWib } from "@/utils/dateFormatter";
import { useToast } from "@/components/ui/Toast";
import SafeLottie from "@/components/ui/SafeLottie";
import { useTranslations, useLocale } from "next-intl";
import { useTranslatedList } from "@/hooks/useTranslatedContent";
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
  locale,
  t,
  value,
  placeholder,
  isInvalid,
  onChange,
  onErrorToast,
}: {
  fieldId: string;
  agendaId: string;
  locale: string;
  t: (key: string, values?: Record<string, string | number>) => string;
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
      onErrorToast(t("errImageFormat"));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      onErrorToast(t("errImageMaxRaw"));
      return;
    }

    try {
      setIsUploading(true);
      const compressed = await compressImage(file, 0.5, 1400);

      if (compressed.size > 2 * 1024 * 1024) {
        onErrorToast(t("errImageMaxCompressed"));
        return;
      }

      const fd = new FormData();
      fd.append("file", compressed);
      fd.append("agendaId", agendaId);
      fd.append("locale", locale);

      const res = await fetch("/api/volunteer/upload", {
        method: "POST",
        body: fd,
      });
      const result = await res.json();
      if (!res.ok || !result.publicUrl) {
        throw new Error(result.error || t("errImageUpload"));
      }

      onChange(result.publicUrl);
    } catch (err: any) {
      onErrorToast(err?.message || t("errImageUpload"));
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
              alt={t("photoPreviewAlt")}
              className="w-full h-full object-cover"
              onError={() => setPreviewErr(true)}
            />
          ) : (
            <FiImage size={24} className="text-on-surface-variant/60" />
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
            <FiCheck size={14} /> {t("photoAttached")}
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
              {t("viewPhoto")} <FiExternalLink size={12} />
            </a>
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 inline-flex items-center gap-1"
            >
              <FiX size={13} /> {t("removeReplacePhoto")}
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
          <FiUpload size={13} /> {t("uploadDirectTab")}
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
          <FiLink size={13} /> {t("pasteUrlTab")}
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
                  {t("compressingUploading")}
                </span>
              </>
            ) : (
              <>
                <FiImage className="text-2xl opacity-75" />
                <span className="text-xs font-bold text-on-surface">
                  {t("clickOrDragPhoto")}
                </span>
                <span className="text-[11px] opacity-75">
                  {t("photoUploadHint")}
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
              placeholder || t("urlInputPlaceholder")
            }
            className={`w-full bg-background border rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
              isInvalid
                ? "border-red-400 focus:border-red-500"
                : "border-outline-variant/50 focus:border-primary"
            }`}
          />
          <p className="text-[11px] text-on-surface-variant">
            {t("urlInputHint")}
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
  requiresLogin = false,
  currentUser = null,
  existingAppliedItemIds = [],
  hasExistingAgendaApplication = false,
}: {
  agenda: AgendaKegiatan;
  isClosed: boolean;
  isQuotaFull?: boolean;
  preselectedItemId?: string;
  requiresLogin?: boolean;
  currentUser?: { id: string; email: string; fullName: string } | null;
  existingAppliedItemIds?: string[];
  hasExistingAgendaApplication?: boolean;
}) {
  const [responses, setResponses] = useState<Record<string, string>>({});
  const items: AgendaItem[] = agenda.items || [];
  const hasItems = items.length > 0;
  const isVolunteer = agenda.type === "volunteer";
  const allowMultiple = !isVolunteer && agenda.allow_multiple_items !== false;
  const appliedItemSet = React.useMemo(
    () => new Set(existingAppliedItemIds),
    [existingAppliedItemIds]
  );

  const initialPreselectedIds = React.useMemo(() => {
    if (!hasItems || !preselectedItemId) return [];
    const target = items.find((it) => it.id === preselectedItemId);
    if (!target || appliedItemSet.has(target.id)) return [];
    const isFull =
      typeof target.quota === "number" && (target.filled_count || 0) >= target.quota;
    return isFull ? [] : [target.id];
  }, [hasItems, items, preselectedItemId, appliedItemSet]);

  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(initialPreselectedIds);
  const [hasModifiedSelection, setHasModifiedSelection] = useState(false);
  const [itemError, setItemError] = useState<string | null>(null);
  const [submittedItemNames, setSubmittedItemNames] = useState<string[]>([]);

  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Setelah submit berhasil, form panjang digantikan tampilan sukses yang ringkas.
  // Tanpa scroll ke atas, browser akan menjepit scroll ke bawah (area Footer).
  useEffect(() => {
    if (!isSuccess) return;
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    const frameId = requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    return () => cancelAnimationFrame(frameId);
  }, [isSuccess]);
  const [invalidFields, setInvalidFields] = useState<Record<string, string>>({});
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [pendingTargetUrl, setPendingTargetUrl] = useState<string | null>(null);
  const isLeavingRef = useRef(false);
  const { error: showErrorToast, success: showSuccessToast } = useToast();
  const t = useTranslations("ApplyForm");
  const locale = useLocale();
  const router = useRouter();
  const { data: translatedAgendaArr } = useTranslatedList([agenda], "agenda_kegiatan", locale, ["title"]);
  const displayTitle = translatedAgendaArr[0]?.title || agenda.title;
  const draftStorageKey = `draft_agenda_${agenda.id}`;

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

  const persistDraft = useCallback(
    (nextResponses: Record<string, string>, nextSelectedIds: string[]) => {
      try {
        const hasAnyResp = Object.values(nextResponses).some(
          (v) => typeof v === "string" && v.trim().length > 0
        );
        const selChanged =
          nextSelectedIds.join(",") !== initialPreselectedIds.join(",");
        if (!hasAnyResp && !selChanged) {
          localStorage.removeItem(draftStorageKey);
          return;
        }
        localStorage.setItem(
          draftStorageKey,
          JSON.stringify({
            responses: nextResponses,
            selectedItemIds: nextSelectedIds,
          })
        );
      } catch {
        // ignore storage errors
      }
    },
    [draftStorageKey, initialPreselectedIds]
  );

  // Pulihkan draf tersimpan saat halaman dimuat ulang / refresh (F5 tidak menghapus data)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftStorageKey);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object") {
        if ("responses" in parsed || "selectedItemIds" in parsed) {
          if (parsed.responses && typeof parsed.responses === "object") {
            setResponses(parsed.responses);
          }
          if (Array.isArray(parsed.selectedItemIds) && hasItems) {
            const availableIds = new Set(
              items
                .filter((it) => !(typeof it.quota === "number" && (it.filled_count || 0) >= it.quota))
                .map((it) => it.id)
            );
            const validRestored = parsed.selectedItemIds.filter((id: unknown) =>
              typeof id === "string" && availableIds.has(id)
            );
            setSelectedItemIds(validRestored);
            if (validRestored.join(",") !== initialPreselectedIds.join(",")) {
              setHasModifiedSelection(true);
            }
          }
        } else {
          // Format draf lama (flat key-value responses)
          setResponses(parsed);
        }
      }
    } catch {
      // ignore storage errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftStorageKey]);

  const hasNonEmptyResponse = Object.values(responses).some(
    (v) => typeof v === "string" && v.trim().length > 0
  );
  const isDirty =
    !isSuccess &&
    !isSubmitting &&
    !isClosed &&
    !isQuotaFull &&
    (hasNonEmptyResponse || hasModifiedSelection);

  const navigateCleanly = useCallback(
    (dest: string) => {
      if (/^https?:\/\//i.test(dest)) {
        try {
          const url = new URL(dest);
          if (url.origin !== window.location.origin) {
            window.location.assign(dest);
            return;
          }
          dest = `${url.pathname}${url.search}${url.hash}`;
        } catch {
          window.location.assign(dest);
          return;
        }
      }
      const localeMatch = dest.match(/^\/(id|en|ar|fr|ja)(\/.*|$)/);
      if (localeMatch) {
        const stripped = localeMatch[2] || "/";
        router.replace(stripped);
        return;
      }
      if (dest.startsWith("/admin")) {
        window.location.assign(dest);
        return;
      }
      router.replace(dest);
    },
    [router]
  );

  const requestLeave = useCallback(
    (targetUrl: string) => {
      if (!isDirty || isLeavingRef.current) {
        router.push(targetUrl);
        return;
      }
      setPendingTargetUrl(targetUrl);
      setShowLeaveModal(true);
    },
    [isDirty, router]
  );

  // Guard navigasi tautan internal (Navbar, Footer, Logo, dll) saat form sedang diisi
  useEffect(() => {
    if (!isDirty || isSubmitting) return;

    const handleLinkClick = (e: MouseEvent) => {
      if (isLeavingRef.current) return;
      const anchor = (e.target as HTMLElement).closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href") || "";
      if (!href || href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }
      if (anchor.href === window.location.href) return;

      e.preventDefault();
      e.stopPropagation();
      setPendingTargetUrl(anchor.href);
      setShowLeaveModal(true);
    };

    document.addEventListener("click", handleLinkClick, true);
    return () => document.removeEventListener("click", handleLinkClick, true);
  }, [isDirty, isSubmitting]);

  // Guard tombol Back browser / swipe back saat form sedang diisi
  useEffect(() => {
    if (!isDirty || isSubmitting) return;

    if (!window.history.state?.applyLeaveGuard) {
      window.history.pushState({ applyLeaveGuard: true }, "", window.location.href);
    }

    const handlePopState = () => {
      if (isLeavingRef.current) return;
      window.history.pushState({ applyLeaveGuard: true }, "", window.location.href);
      setPendingTargetUrl(`/agenda/${agenda.id}`);
      setShowLeaveModal(true);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isDirty, isSubmitting, agenda.id]);

  const handleStayOnForm = () => {
    setPendingTargetUrl(null);
    setShowLeaveModal(false);
  };

  const handleConfirmLeave = () => {
    isLeavingRef.current = true;
    try {
      localStorage.removeItem(draftStorageKey);
    } catch {
      // ignore storage errors
    }
    setResponses({});
    setSelectedItemIds([]);
    setHasModifiedSelection(false);
    setShowLeaveModal(false);
    const dest = pendingTargetUrl || `/agenda/${agenda.id}`;
    setPendingTargetUrl(null);
    navigateCleanly(dest);
  };

  const toggleItemSelection = (item: AgendaItem) => {
    const isFull =
      typeof item.quota === "number" && (item.filled_count || 0) >= item.quota;
    if (isFull || appliedItemSet.has(item.id)) return;

    setItemError(null);
    setHasModifiedSelection(true);
    setSelectedItemIds((prev) => {
      const next = allowMultiple
        ? prev.includes(item.id)
          ? prev.filter((id) => id !== item.id)
          : [...prev, item.id]
        : [item.id];
      persistDraft(responses, next);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isClosed || isQuotaFull) return;

    // Validasi pilihan posisi / cabang lomba
    if (hasItems && selectedItemIds.length === 0) {
      const msg = isVolunteer
        ? t("errSelectPosition")
        : t("errSelectCompetition");
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
      showErrorToast(t("errCooldown", { minutes: waitMinutes }));
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
            newInvalidFields[field.id] = t("errDocHttps");
            if (!firstInvalidId) firstInvalidId = field.id;
          } else if (value.length > 500) {
            newInvalidFields[field.id] = t("errDocMaxLength");
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
      showErrorToast(t("errCaptchaRequired"));
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
          locale,
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
      persistDraft(newResponses, selectedItemIds);
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
        className={`space-y-2 transition-all duration-300 p-3 sm:p-4 sm:-mx-4 rounded-2xl border ${
          isInvalid
            ? "bg-red-50/50 border-red-400"
            : "border-transparent bg-transparent"
        }`}
      >
        <label
          className={`text-sm font-bold flex flex-wrap gap-1 items-baseline break-words ${
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
              className="flex-1 min-w-0 bg-transparent px-3 sm:px-4 py-3 text-sm outline-none w-full"
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
              {field.placeholder || t("selectPlaceholder")}
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
              <span>{t("fileHint")}</span>
            </p>
          </div>
        )}

        {field.type === "image" && (
          <PublicImageField
            fieldId={field.id}
            agendaId={agenda.id}
            locale={locale}
            t={t}
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
      <div className="max-w-3xl mx-auto px-4 py-8 pb-24 lg:pb-8 text-center">
        <div className="w-40 h-40 sm:w-48 sm:h-48 mx-auto mb-2">
          <SafeLottie src="/animations/Succes.lottie" autoplay />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface mb-4">
          {t("successTitle")}
        </h1>
        <p className="text-on-surface-variant text-base sm:text-lg mb-6">
          {t("successDescPart1")}{" "}
          <strong className="text-on-surface">{displayTitle}</strong>.{" "}
          {t("successDescPart2")}
        </p>
        {submittedItemNames.length > 0 && (
          <div className="inline-flex flex-wrap items-center justify-center gap-2 mb-6 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-2xl max-w-full">
            <span className="text-xs font-bold text-emerald-800">
              {isVolunteer ? t("selectedPositionsSummary") : t("selectedCompetitionsSummary")}
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
        {currentUser && (
          <div className="max-w-lg mx-auto mb-7 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-start flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
              <FiClock size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-extrabold text-amber-900">
                {t("statusPendingBadge")}
              </p>
              <p className="text-xs text-amber-800/90 mt-1 leading-relaxed">
                {t("successPendingHint")}
              </p>
            </div>
          </div>
        )}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          {currentUser && (
            <Link
              href="/dashboard/kegiatan"
              className="inline-flex items-center justify-center gap-2 bg-primary text-white font-bold px-6 sm:px-7 py-3.5 rounded-xl hover:bg-primary/90 transition-all hover:-translate-y-0.5 hover:shadow-lg text-sm"
            >
              <FiGrid size={16} />
              <span>{t("viewStatusDashboard")}</span>
            </Link>
          )}
          <Link
            href={`/agenda/${agenda.id}`}
            className={`inline-flex items-center justify-center font-bold px-6 sm:px-7 py-3.5 rounded-xl transition-all text-sm ${
              currentUser
                ? "bg-surface border border-outline-variant/40 text-on-surface hover:border-primary hover:text-primary"
                : "bg-primary text-white hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-lg"
            }`}
          >
            {t("backToDetail")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-5 pb-24 lg:pb-8">
      <div className="mb-4 sm:mb-6">
        <button
          type="button"
          onClick={() => requestLeave(`/agenda/${agenda.id}`)}
          className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-medium text-sm cursor-pointer"
        >
          <FiArrowLeft size={16} /> {t("backToDetail")}
        </button>
      </div>

      <div className="bg-surface rounded-2xl md:rounded-3xl border border-outline-variant/30 shadow-lg overflow-hidden">
        {/* HEADER */}
        <div className="bg-primary p-5 sm:p-6 md:p-8 text-white">
          <span className="inline-block bg-white/20 text-white text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider mb-3 sm:mb-4">
            {t("formLabel")}
          </span>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold mb-2 break-words leading-tight">
            {displayTitle}
          </h1>
          <p className="text-white/80 text-xs sm:text-sm">
            {isClosed
              ? t("closedMsg")
              : isQuotaFull
              ? t("fullMsg")
              : agenda.deadline
              ? `${t("deadlineMsg")}: ${formatDeadlineWib(agenda.deadline, locale)}`
              : t("fillBelow")}
          </p>
        </div>

        {/* BODY */}
        <div className="p-4 sm:p-6 md:p-8">
          {isClosed || isQuotaFull ? (
            <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200 flex flex-col items-center text-center">
              <FiAlertCircle size={32} className="mb-3" />
              <h3 className="font-bold text-lg mb-1">
                {isQuotaFull ? t("quotaFull") : t("regClosed")}
              </h3>
              <p className="text-sm opacity-80">
                {t("cannotSubmit")}
                {isClosed && agenda.deadline ? ` (${t("closedAtLabel")} ${formatDeadlineWib(agenda.deadline, locale)})` : ""}
              </p>
            </div>
          ) : requiresLogin && !currentUser ? (
            <div className="bg-primary/5 border border-primary/20 p-6 md:p-8 rounded-2xl flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <FiLock size={26} />
              </div>
              <div className="max-w-md space-y-1.5">
                <h3 className="font-extrabold text-lg text-on-surface">
                  {t("loginRequiredTitle")}
                </h3>
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  {t("loginRequiredDesc")}
                </p>
              </div>
              <NativeLink
                href={`/masuk?next=${encodeURIComponent(
                  `/${locale}/agenda/${agenda.id}/apply${
                    preselectedItemId ? `?item=${preselectedItemId}` : ""
                  }`
                )}`}
                className="inline-flex items-center gap-2 bg-primary text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-primary/90 transition-all shadow-md"
              >
                <FiLogIn size={16} /> {t("loginNowBtn")}
              </NativeLink>
            </div>
          ) : (!hasItems && hasExistingAgendaApplication) || (hasItems && !allowMultiple && appliedItemSet.size > 0) ? (
            <div className="bg-emerald-50 text-emerald-800 p-5 sm:p-6 rounded-2xl border border-emerald-200 flex flex-col items-center text-center gap-2">
              <FiCheckCircle size={32} className="text-emerald-600" />
              <h3 className="font-bold text-lg">{t("alreadyRegisteredTitle")}</h3>
              <p className="text-sm opacity-90 max-w-md">{t("alreadyRegisteredDesc")}</p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 w-full sm:w-auto mt-3">
                <Link
                  href="/dashboard/kegiatan"
                  className="inline-flex items-center justify-center gap-2 bg-primary text-white font-bold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-xs sm:text-sm"
                >
                  <FiGrid size={15} />
                  <span>{t("viewStatusDashboard")}</span>
                </Link>
                <Link
                  href={`/agenda/${agenda.id}`}
                  className="inline-flex items-center justify-center bg-white border border-emerald-300 text-emerald-900 font-bold px-5 py-2.5 rounded-xl hover:bg-emerald-100/60 transition-colors text-xs sm:text-sm"
                >
                  {t("backToDetail")}
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {currentUser && (
                <div className="p-3 sm:p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs overflow-hidden">
                  <div className="flex items-start sm:items-center gap-2 text-on-surface min-w-0 w-full sm:w-auto">
                    <FiUser size={14} className="text-primary shrink-0 mt-0.5 sm:mt-0" />
                    <span className="min-w-0 flex-1 break-words leading-relaxed">
                      {t("loggedInAs")}:{" "}
                      <strong className="font-bold break-all">
                        {currentUser.email || currentUser.fullName}
                      </strong>
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1.5 sm:py-1 rounded-xl sm:rounded-full font-semibold w-full sm:w-fit max-w-full leading-snug shrink-0">
                    <FiClock size={12} className="shrink-0" />
                    <span>{t("pendingStatusNotice")}</span>
                  </span>
                </div>
              )}
              {/* PILIHAN POSISI / CABANG LOMBA */}
              {hasItems && (
                <div
                  id="field-wrapper-items"
                  className={`p-3.5 sm:p-4 md:p-5 rounded-2xl border space-y-3 transition-colors ${
                    itemError
                      ? "bg-red-50/50 border-red-400"
                      : "bg-primary/5 border-primary/20"
                  }`}
                >
                  <div>
                    <label className="text-sm font-extrabold text-on-surface flex items-center gap-1.5">
                      {isVolunteer
                        ? t("selectPositionLabel")
                        : allowMultiple
                        ? t("selectCompetitionMultiLabel")
                        : t("selectCompetitionLabel")}
                      <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {isVolunteer
                        ? t("selectPositionHint")
                        : allowMultiple
                        ? t("selectCompetitionMultiHint")
                        : t("selectCompetitionHint")}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {items.map((item) => {
                      const filled = item.filled_count || 0;
                      const hasQuota = typeof item.quota === "number";
                      const isFull = hasQuota && filled >= item.quota!;
                      const isAlreadyApplied = appliedItemSet.has(item.id);
                      const isDisabled = isFull || isAlreadyApplied;
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
                          disabled={isDisabled}
                          onClick={() => toggleItemSelection(item)}
                          className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2 ${
                            isDisabled
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
                                <p className="font-bold text-sm text-on-surface leading-snug break-words">
                                  {item.name}
                                </p>
                                {agenda.type === "event" && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-on-surface-variant mt-0.5">
                                    {item.participant_type === "tim" ? (
                                      <>
                                        <FiUsers size={10} /> {t("teamCategory")}
                                      </>
                                    ) : (
                                      <>
                                        <FiUser size={10} /> {t("individualCategory")}
                                      </>
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>

                            <span
                              className={`shrink-0 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                                isAlreadyApplied
                                  ? "bg-primary/15 text-primary"
                                  : isFull
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {isAlreadyApplied
                                ? t("alreadyRegisteredBadge")
                                : isFull
                                ? t("fullBadge")
                                : hasQuota
                                ? t("leftBadge", { count: remaining ?? 0 })
                                : t("openBadge")}
                            </span>
                          </div>

                          {item.description && (
                            <p className="text-[11px] text-on-surface-variant leading-relaxed line-clamp-2">
                              {item.description}
                            </p>
                          )}

                          <div className="w-full space-y-1 pt-1">
                            <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] font-semibold text-on-surface-variant">
                              <span>
                                {t("filledLabel")} <strong className="text-on-surface">{filled}</strong>
                                {hasQuota ? ` / ${item.quota}` : ""}
                              </span>
                              <span>
                                {hasQuota ? t("neededLabel", { count: item.quota ?? 0 }) : t("unlimitedLabel")}
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
                            {t("generalInfoTitle")}
                          </h3>
                        </div>
                      )}
                      {fields.map((field, idx) => renderFormField(field, idx + 1))}
                    </div>
                  )}

                  {hasItems && hasAnyItemExtraFields && selectedItems.length === 0 && (
                    <div className="p-4 rounded-xl bg-surface-variant/20 border border-dashed border-outline-variant/50 text-xs text-on-surface-variant text-center">
                      {isVolunteer ? t("selectItemPromptVol") : t("selectItemPromptComp")}
                    </div>
                  )}

                  {selectedItemSections.map(({ item, extra, startNum }) => (
                    <div
                      key={item.id}
                      className="p-4 sm:p-5 rounded-2xl border border-primary/25 bg-primary/[0.03] space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-primary/15">
                        <div className="min-w-0">
                          <p className="text-[11px] font-extrabold uppercase tracking-wider text-primary">
                            {isVolunteer ? t("specialQuestionsVol") : t("specialQuestionsComp")}
                          </p>
                          <h3 className="text-base font-extrabold text-on-surface break-words">
                            {item.name}
                          </h3>
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary shrink-0">
                          {t("questionsCount", { count: extra.length })}
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
              <div className="flex justify-center w-full my-4 min-h-[65px] overflow-x-auto">
                <Turnstile
                  ref={turnstileRef}
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
                  onSuccess={(token) => setTurnstileToken(token)}
                  onError={() => showErrorToast(t("errCaptchaLoad"))}
                  onExpire={() => setTurnstileToken("")}
                  options={{ theme: "light" }}
                />
              </div>

              <div className="pt-6 border-t border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {hasItems && selectedItemIds.length > 0 && (
                  <p className="text-xs font-semibold text-primary">
                    {isVolunteer
                      ? t("positionsSelected", { count: selectedItemIds.length })
                      : t("competitionsSelected", { count: selectedItemIds.length })}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting || !hasConfiguredQuestions || !turnstileToken}
                  className="w-full sm:w-auto sm:ml-auto bg-primary text-white font-bold px-8 py-3.5 rounded-xl hover:bg-primary/90 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

      {/* Modal Konfirmasi Keluar Saat Mengisi Form */}
      <AnimatePresence>
        {showLeaveModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-sm bg-surface border border-outline-variant/30 rounded-3xl shadow-2xl p-6 sm:p-7 relative overflow-hidden text-center"
            >
              <div className="relative mx-auto w-16 h-16 mb-4 flex items-center justify-center">
                <span className="absolute inset-0 rounded-2xl bg-amber-500/15 animate-ping opacity-30" />
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center justify-center shadow-inner">
                  <FiAlertTriangle size={30} className="drop-shadow-sm" />
                </div>
              </div>

              <h3 className="font-black text-lg text-on-surface tracking-tight">
                {t("leaveModalTitle")}
              </h3>

              <p className="text-xs sm:text-sm text-on-surface-variant mt-2 leading-relaxed px-1">
                {t("leaveModalDesc")}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 mt-6">
                <button
                  onClick={handleStayOnForm}
                  type="button"
                  className="py-2.5 px-4 rounded-xl border border-outline-variant/40 hover:bg-surface-variant/30 text-on-surface text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FiEdit3 size={15} />
                  <span>{t("leaveModalStay")}</span>
                </button>
                <button
                  onClick={handleConfirmLeave}
                  type="button"
                  className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-rose-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FiLogOut size={15} />
                  <span>{t("leaveModalConfirm")}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
