"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { AgendaKegiatan } from "@/types/agenda";
import { submitVolunteerApplication } from "@/app/(internal)/admin/kegiatan/actions";
import FileUpload from "@/components/ui/FileUpload";
import ImageUpload from "@/components/ui/ImageUpload";
import { formatDateToIndo } from "@/utils/dateFormatter";
import { useToast } from "@/components/ui/Toast";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useTranslations } from "next-intl";

export default function ApplyClientForm({ agenda, isClosed, isQuotaFull = false }: { agenda: AgendaKegiatan, isClosed: boolean, isQuotaFull?: boolean }) {
  const router = useRouter();
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [invalidFields, setInvalidFields] = useState<Record<string, string>>({});
  const { error: showErrorToast, success: showSuccessToast } = useToast();
  const t = useTranslations("ApplyForm");

  const fields = agenda.form_schema || [];

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`draft_agenda_${agenda.id}`);
      if (saved) {
        setResponses(JSON.parse(saved));
      }
    } catch (e) {
      // ignore errors
    }
  }, [agenda.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isClosed || isQuotaFull) return;
    
    // Validate required fields and formats
    const newInvalidFields: Record<string, string> = {};
    let firstInvalidId: string | null = null;
    
    for (const field of fields) {
      const value = responses[field.id] || "";
      
      if (field.required && !value) {
        newInvalidFields[field.id] = t("errRequired");
        if (!firstInvalidId) firstInvalidId = field.id;
        continue;
      }

      if (value) {
        if (field.type === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            newInvalidFields[field.id] = t("errEmail");
            if (!firstInvalidId) firstInvalidId = field.id;
          }
        } else if (field.type === 'number') {
          if (isNaN(Number(value))) {
            newInvalidFields[field.id] = t("errNumber");
            if (!firstInvalidId) firstInvalidId = field.id;
          }
        } else if (field.type === 'tel') {
          const telRegex = /^\+?[0-9\s\-]{8,20}$/;
          if (!telRegex.test(value)) {
            newInvalidFields[field.id] = t("errPhone");
            if (!firstInvalidId) firstInvalidId = field.id;
          }
        }
      }
    }

    if (Object.keys(newInvalidFields).length > 0) {
      setInvalidFields(newInvalidFields);
      showErrorToast(t("errFixFields", { count: Object.keys(newInvalidFields).length }));
      
      // Auto-scroll to the FIRST unfilled field
      if (firstInvalidId) {
        const idToScroll = firstInvalidId;
        setTimeout(() => {
          const el = document.getElementById(`field-wrapper-${idToScroll}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
      
      return;
    }

    setIsSubmitting(true);
    setInvalidFields({});

    try {
      await submitVolunteerApplication(agenda.id, responses);
      setIsSuccess(true);
      showSuccessToast(t("successToast"));
      try {
        localStorage.removeItem(`draft_agenda_${agenda.id}`);
      } catch (e) {}
    } catch (err: any) {
      showErrorToast(err.message || t("errorToast"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (id: string, value: string) => {
    setResponses(prev => {
      const newResponses = { ...prev, [id]: value };
      try {
        localStorage.setItem(`draft_agenda_${agenda.id}`, JSON.stringify(newResponses));
      } catch (e) {}
      return newResponses;
    });
    
    if (invalidFields[id]) {
      setInvalidFields(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <div className="w-48 h-48 mx-auto mb-2">
          <DotLottieReact
            src="/animations/Succes.lottie"
            autoplay
          />
        </div>
        <h1 className="text-3xl font-extrabold text-on-surface mb-4">{t("successTitle")}</h1>
        <p className="text-on-surface-variant text-lg mb-8">
          {t("successDescPart1")} <strong className="text-on-surface">{agenda.title}</strong>. 
          {t("successDescPart2")}
        </p>
        <Link 
          href={`/agenda/${agenda.id}`}
          className="inline-flex items-center justify-center bg-primary text-white font-bold px-8 py-3.5 rounded-xl hover:bg-primary/90 transition-all hover:-translate-y-1 hover:shadow-lg"
        >
          {t("backToDetail")}
        </Link>
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
          <h1 className="text-2xl md:text-3xl font-extrabold mb-2">{agenda.title}</h1>
          <p className="text-white/80 text-sm">
            {isClosed 
              ? t("closedMsg") 
              : isQuotaFull
                ? t("fullMsg")
                : agenda.deadline ? `${t("deadlineMsg")}: ${formatDateToIndo(agenda.deadline)}` : t("fillBelow")}
          </p>
        </div>

        {/* BODY */}
        <div className="p-6 md:p-8">
          {isClosed || isQuotaFull ? (
            <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200 flex flex-col items-center text-center">
              <FiAlertCircle size={32} className="mb-3" />
              <h3 className="font-bold text-lg mb-1">{isQuotaFull ? t("quotaFull") : t("regClosed")}</h3>
              <p className="text-sm opacity-80">{t("cannotSubmit")}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {fields.length === 0 ? (
                <div className="text-center p-8 bg-surface-variant/20 rounded-xl text-on-surface-variant text-sm">
                  {t("noQuestions")}
                </div>
              ) : (
                fields.map((field, idx) => {
                  const errorMsg = invalidFields[field.id];
                  const isInvalid = !!errorMsg;
                  return (
                  <div 
                    key={field.id} 
                    id={`field-wrapper-${field.id}`} 
                    className={`space-y-2 transition-all duration-300 p-4 -mx-4 rounded-2xl border ${isInvalid ? 'bg-red-50/50 border-red-400' : 'border-transparent bg-transparent'}`}
                  >
                    <label className={`text-sm font-bold flex gap-1 items-center ${isInvalid ? 'text-red-700' : 'text-on-surface'}`}>
                      {idx + 1}. {field.label} 
                      {field.required ? (
                        <span className="text-red-500">*</span>
                      ) : (
                        <span className="text-on-surface-variant/60 font-normal text-xs ml-1">({t("optional")})</span>
                      )}
                    </label>
                    
                    {['text', 'number', 'email'].includes(field.type) && (
                      <input 
                        type={field.type} 
                        required={field.required}
                        maxLength={field.type === 'number' ? 20 : 100}
                        value={responses[field.id] || ""}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        placeholder={field.placeholder || t("placeholderText")}
                        className={`w-full bg-background border rounded-xl px-4 py-3 text-sm outline-none transition-colors ${isInvalid ? 'border-red-400 focus:border-red-500' : 'border-outline-variant/50 focus:border-primary'}`}
                      />
                    )}

                    {field.type === 'tel' && (
                      <div className={`flex w-full bg-background border rounded-xl overflow-hidden transition-colors ${isInvalid ? 'border-red-400 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500' : 'border-outline-variant/50 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary'}`}>
                        <div className="flex items-center justify-center px-4 bg-surface-variant/30 text-sm font-bold border-r border-inherit">
                          +62
                        </div>
                        <input 
                          type="tel" 
                          required={field.required}
                          maxLength={15}
                          value={responses[field.id] ? responses[field.id].replace(/^\+62/, '') : ""}
                          onChange={(e) => {
                             const val = e.target.value.replace(/\D/g, ""); // only digits
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

                    {field.type === 'textarea' && (
                      <textarea 
                        required={field.required}
                        maxLength={500}
                        value={responses[field.id] || ""}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        placeholder={field.placeholder || t("placeholderText")}
                        className={`w-full bg-background border rounded-xl px-4 py-3 text-sm outline-none min-h-[120px] transition-colors ${isInvalid ? 'border-red-400 focus:border-red-500' : 'border-outline-variant/50 focus:border-primary'}`}
                      />
                    )}

                    {field.type === 'file' && (
                      <FileUpload 
                        value={responses[field.id] || ""}
                        onChange={(url) => handleChange(field.id, url)}
                        className="w-full"
                      />
                    )}

                    {field.type === 'image' && (
                      <ImageUpload 
                        value={responses[field.id] || ""}
                        onChange={(url) => handleChange(field.id, url)}
                        className="w-full"
                      />
                    )}

                    {isInvalid && (
                      <div className="text-red-600 text-xs font-bold flex items-center gap-1.5 mt-2">
                        <FiAlertCircle size={14} />
                        {t("questionError")} {errorMsg}
                      </div>
                    )}
                  </div>
                )})
              )}

              <div className="pt-6 border-t border-outline-variant/20 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || fields.length === 0}
                  className="bg-primary text-white font-bold px-8 py-3.5 rounded-xl hover:bg-primary/90 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t("submitting")}</>
                  ) : t("submitBtn")}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
