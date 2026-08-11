"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "@/i18n/routing";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import { createClient } from "@/utils/supabase/client";
import { FiPlus, FiTrash2, FiSend, FiArrowLeft, FiLoader, FiAlertCircle } from "react-icons/fi";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import ImageUpload from "@/components/ui/ImageUpload";
import { motion, AnimatePresence } from "framer-motion";
import TechStackSelect from "@/components/upload/TechStackSelect";
import KTIToolsSelect from "@/components/upload/KTIToolsSelect";
import IoTComponentSelect from "@/components/upload/IoTComponentSelect";

const CATEGORY_MAP: Record<string, string> = {
  "Technology": "Aplikasi Web & Sistem",
  "Programming": "Aplikasi Mobile",
  "Research": "Karya Tulis & Jurnal",
  "IoT": "Proyek IoT",
  "Multimedia": "Desain & Lainnya"
};

const getCategoryLabel = (id: string) => CATEGORY_MAP[id] || id;

export default function EditKaryaPage() {
  const t = useTranslations("EditForm");
  const router = useRouter();
  const params = useParams();
  const karyaId = params.id as string;
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [invalidField, setInvalidField] = useState<string | null>(null);
  const [originalStatus, setOriginalStatus] = useState<string>("");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    image_url: "",
    tech_stack: "",
    github_url: "",
    live_url: "",
    features: [{ title: "", desc: "" }],
    team: [{ name: "", role: "", avatar: "" }],
    gallery: [] as { url: string; caption: string }[],
  });
  
  const [isFetching, setIsFetching] = useState(true);
  const [initialData, setInitialData] = useState<any>(null);
  const toastShown = useRef(false);

  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!karyaId) return;

    const DRAFT_KEY = `karya_edit_draft_${karyaId}`;

    const fetchKarya = async () => {
      try {
        const { data, error } = await supabase
          .from('karya')
          .select('*')
          .eq('id', karyaId)
          .single();

        if (error) throw error;
        if (data) {
          setOriginalStatus(data.status);
          
          const sourceData = data.pending_edits ? { ...data, ...data.pending_edits } : data;

          const dbData = {
            title: sourceData.title || "",
            category: sourceData.category || "",
            description: sourceData.description || "",
            image_url: sourceData.image_url || "",
            tech_stack: Array.isArray(sourceData.tech_stack) ? sourceData.tech_stack.join(", ") : (sourceData.tech_stack || ""),
            github_url: sourceData.github_url || "",
            live_url: sourceData.live_url || "",
            features: sourceData.features && sourceData.features.length > 0 ? sourceData.features : [{ title: "", desc: "" }],
            team: sourceData.team && sourceData.team.length > 0 ? sourceData.team.map((t: any) => {
              if (typeof t === 'object' && t !== null) return { name: t.name || "", role: t.role || "", avatar: t.avatar || "" };
              let name = t;
              let role = "";
              if (typeof t === 'string' && t.endsWith(")")) {
                const lastOpen = t.lastIndexOf("(");
                if (lastOpen !== -1) {
                  name = t.substring(0, lastOpen).trim();
                  role = t.substring(lastOpen + 1, t.length - 1).trim();
                }
              }
              return { name, role, avatar: "" };
            }) : [{ name: "", role: "", avatar: "" }],
            gallery: (Array.isArray(data.gallery) && data.gallery.length > 0) ? data.gallery.map((g: any) => {
              if (typeof g === 'string') return { url: g, caption: "" };
              return { url: g.url || "", caption: g.caption || "" };
            }) : [{ url: "", caption: "" }],
          };

          const savedDraft = localStorage.getItem(DRAFT_KEY);
          if (savedDraft) {
            try {
              const parsed = JSON.parse(savedDraft);
              setFormData(prev => ({
                ...dbData,
                ...parsed,
                gallery: Array.isArray(parsed.gallery) ? parsed.gallery : dbData.gallery,
                features: Array.isArray(parsed.features) && parsed.features.length > 0 ? parsed.features : dbData.features,
                team: Array.isArray(parsed.team) && parsed.team.length > 0 ? parsed.team.map((t: any) => ({
                  name: t.name || '',
                  role: t.role || '',
                  avatar: t.avatar || '',
                })) : dbData.team,
              }));
              if (!toastShown.current) {
                toast(t("toastDraftLoaded"), "success");
                toastShown.current = true;
              }
            } catch {
              setFormData(dbData);
            }
          } else {
            setFormData(dbData);
          }
          setInitialData(dbData);
        }
      } catch (err: any) {
        toast(t("toastLoadError"), "error");
      } finally {
        setIsFetching(false);
      }
    };

    fetchKarya();
  }, [karyaId, supabase]);

  useEffect(() => {
    if (!karyaId || isFetching) return;
    const DRAFT_KEY = `karya_edit_draft_${karyaId}`;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
  }, [formData, karyaId, isFetching]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        window.location.href = '/login';
      }
    });
    return () => { subscription.unsubscribe(); };
  }, [supabase]);

  const isDirty = initialData ? JSON.stringify(formData) !== JSON.stringify(initialData) : false;

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !isLoading) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, isLoading]);

  const handleBackNavigation = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isDirty) {
      setPendingUrl('back');
      setShowLeaveConfirm(true);
    } else {
      doGoBack();
    }
  };

  const doGoBack = () => {
    if (window.history.length > 2) {
      router.back();
    } else {
      router.push('/dashboard');
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (invalidField === `input-${name}`) setInvalidField(null);
  };

  const handleFitur = (index: number, field: "title" | "desc", value: string) => {
    const updated = [...formData.features];
    updated[index][field] = value;
    setFormData(prev => ({ ...prev, features: updated }));
    if (invalidField === `input-feature-${index}-${field}`) setInvalidField(null);
  };

  const handleTim = (index: number, field: "name" | "role" | "avatar", value: string) => {
    const updated = [...formData.team];
    updated[index][field] = value;
    setFormData(prev => ({ ...prev, team: updated }));
    if (invalidField === `input-team-${index}-${field}`) setInvalidField(null);
  };

  const addFitur = () => setFormData(prev => ({ ...prev, features: [...prev.features, { title: "", desc: "" }] }));
  const removeFitur = (index: number) => setFormData(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== index) }));
  const addAnggota = () => setFormData(prev => ({ ...prev, team: [...prev.team, { name: "", role: "", avatar: "" }] }));
  const removeAnggota = (index: number) => setFormData(prev => ({ ...prev, team: prev.team.filter((_, i) => i !== index) }));

  const addGallery = () => setFormData(prev => ({ ...prev, gallery: [...prev.gallery, { url: "", caption: "" }] }));
  const removeGallery = (index: number) => setFormData(prev => ({ ...prev, gallery: prev.gallery.filter((_, i) => i !== index) }));
  const handleGallery = (index: number, field: "url" | "caption", value: string) => {
    const updated = [...formData.gallery];
    updated[index][field] = value;
    setFormData(prev => ({ ...prev, gallery: updated }));
    if (invalidField === `input-gallery-${index}-${field}`) setInvalidField(null);
  };

  const isValidUrl = (urlString: string) => {
    try { new URL(urlString); return true; } catch { return false; }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isDirty) {
      toast(t("toastNoChanges"), "error");
      return;
    }

    setErrorMsg("");
    setInvalidField(null);

    const scrollToAndSetInvalid = (id: string, msg: string) => {
      setInvalidField(id);
      toast(msg, "error");
      const el = document.getElementById(id);
      el?.focus();
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    if (!formData.image_url) return scrollToAndSetInvalid("section-image", t("toastErrorFields"));
    if (!formData.title.trim()) return scrollToAndSetInvalid("input-title", t("toastErrorFields"));
    if (!formData.category) return scrollToAndSetInvalid("input-category", t("toastErrorFields"));
    if (!formData.description.trim()) return scrollToAndSetInvalid("input-description", t("toastErrorFields"));
    if (!formData.tech_stack.trim()) return scrollToAndSetInvalid("input-tech-stack", t("toastErrorFields"));
    
    if (formData.github_url.trim() && !isValidUrl(formData.github_url.trim())) return scrollToAndSetInvalid("input-github-url", t("toastErrorFields"));
    
    if (!formData.live_url.trim()) return scrollToAndSetInvalid("input-live-url", `${formData.category === "Research" ? t("urlKTI") : formData.category === "Programming" ? t("urlProg") : formData.category === "IoT" ? t("urlIoT") : formData.category === "Multimedia" ? t("urlLainnya") : t("urlDefault")} wajib diisi!`);
    else if (!isValidUrl(formData.live_url.trim())) return scrollToAndSetInvalid("input-live-url", t("toastErrorFields"));
    
    if (formData.category !== "Multimedia") {
      const validFeatures = formData.features.filter(f => f.title.trim() !== "" && f.desc.trim() !== "");
      if (validFeatures.length === 0) return scrollToAndSetInvalid("input-feature-0-title", `Minimal 1 ${formData.category === "Research" ? t("featKTI") : formData.category === "Multimedia" ? t("featLainnya") : formData.category === "IoT" ? t("featIoT") : t("featDefault")} harus diisi (Judul & Deskripsi)!`);
    }

    const validTeam = formData.team.filter(t => t.name.trim() !== "" && t.role.trim() !== "");
    if (validTeam.length === 0) return scrollToAndSetInvalid("input-team-0-name", `Minimal 1 ${t("team")} harus diisi (Nama & Peran)!`);

    const validGallery = formData.gallery.filter(g => g.url.trim() !== "");
    if (validGallery.length === 0) return scrollToAndSetInvalid("input-gallery-0-url", t("toastErrorFields"));

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t("toastLogin"));

      const techStackArray = formData.tech_stack.split(',').map(item => item.trim()).filter(Boolean);
      const teamObjects = formData.team
        .filter(t => t.name.trim() !== "")
        .map(t => ({ name: t.name, role: t.role, avatar: t.avatar || "" }));

      const updatePayload: any = {
        title: formData.title,
        category: formData.category,
        description: formData.description,
        image_url: formData.image_url,
        tech_stack: techStackArray,
        github_url: formData.github_url || null,
        live_url: formData.live_url || null,
        team: teamObjects,
        features: formData.features.filter(f => f.title.trim() !== ""),
        gallery: formData.gallery.filter(g => g.url.trim() !== ""),
      };

      if (originalStatus === 'approved') {
        const { error } = await supabase.from('karya').update({
          pending_edits: updatePayload,
          edit_reject_reason: null
        }).eq('id', karyaId);
        if (error) throw error;
      } else {
        updatePayload.status = 'pending';
        updatePayload.reject_reason = null;
        updatePayload.pending_edits = null; // Also clear pending_edits if any just in case
        const { error } = await supabase.from('karya').update(updatePayload).eq('id', karyaId);
        if (error) throw error;
      }

      localStorage.removeItem(`karya_edit_draft_${karyaId}`);
      toast(t("toastSuccess"), "success");
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || t("toastError"));
      setIsLoading(false);
    }
  };

  const getInputClass = (id: string) => `w-full px-4 py-3 bg-surface-variant/20 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
    invalidField === id 
      ? "border-red-500 focus:ring-red-500/40 focus:border-red-500 bg-red-50/50" 
      : "border-outline-variant/30 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)]"
  }`;
  const labelClass = "block text-sm font-semibold text-on-surface mb-1.5";

  return (
    <div className="w-full">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8">
          <button onClick={(e) => handleBackNavigation(e)} className="inline-flex items-center gap-2 text-on-surface-variant hover:text-[var(--color-primary)] transition-colors text-sm font-medium mb-4">
            <FiArrowLeft size={16} /> {t("back")}
          </button>
          <h1 className="text-3xl font-extrabold text-[var(--color-primary)] mb-2">{t("title")}</h1>
          <p className="text-on-surface-variant">
            {t("subtitle")}
          </p>
        </div>

        {isFetching ? (
          <div className="bg-surface p-6 md:p-8 rounded-3xl shadow-sm border border-outline-variant/20 space-y-8 animate-pulse">
            <div className="space-y-4">
              <div className="h-6 bg-surface-variant/50 rounded w-1/4 mb-4" />
              <div className="h-48 bg-surface-variant/40 rounded-[1.25rem] w-full" />
            </div>
            <div className="space-y-4">
              <div className="h-6 bg-surface-variant/50 rounded w-1/4 mb-4" />
              <div className="space-y-2"><div className="h-4 bg-surface-variant/50 rounded w-1/6" /><div className="h-12 bg-surface-variant/40 rounded-xl w-full" /></div>
              <div className="space-y-2"><div className="h-4 bg-surface-variant/50 rounded w-1/6" /><div className="h-12 bg-surface-variant/40 rounded-xl w-full" /></div>
              <div className="space-y-2"><div className="h-4 bg-surface-variant/50 rounded w-1/6" /><div className="h-24 bg-surface-variant/40 rounded-xl w-full" /></div>
            </div>
            <div className="space-y-4">
              <div className="h-6 bg-surface-variant/50 rounded w-1/4 mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><div className="h-4 bg-surface-variant/50 rounded w-1/3" /><div className="h-12 bg-surface-variant/40 rounded-xl w-full" /></div>
                <div className="space-y-2"><div className="h-4 bg-surface-variant/50 rounded w-1/3" /><div className="h-12 bg-surface-variant/40 rounded-xl w-full" /></div>
              </div>
            </div>
          </div>
        ) : (
        <form noValidate onSubmit={handleSubmit} className="bg-surface p-6 md:p-8 rounded-3xl shadow-sm border border-outline-variant/20 space-y-8">
          
          {errorMsg && (
            <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-medium">
              {errorMsg}
            </div>
          )}

          <div id="section-image">
            <h3 className="text-sm font-bold text-[var(--color-primary)] uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-[var(--color-secondary)] rounded-full block" /> {t("mainPhoto")} <span className="text-red-400 normal-case">*</span>
            </h3>
            <div className={`mb-2 p-1 rounded-[1.25rem] transition-all ${invalidField === 'section-image' ? 'border-2 border-red-500 bg-red-50/50 shadow-[0_0_0_4px_rgba(239,68,68,0.15)]' : 'border-2 border-transparent'}`}>
              <ImageUpload
                value={formData.image_url}
                onChange={(url) => { setFormData(prev => ({ ...prev, image_url: url })); if(invalidField === 'section-image') setInvalidField(null); }}
              />
            </div>
            <p className="text-xs text-on-surface-variant mt-1 px-1">{t("photoFormat")}</p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-[var(--color-primary)] uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-[var(--color-secondary)] rounded-full block" /> {t("mainInfo")}
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-semibold text-on-surface">{t("workTitle")} <span className="text-red-400">*</span></label>
                  <span className={`text-xs font-medium ${formData.title.length >= 100 ? 'text-red-500' : 'text-on-surface-variant'}`}>{formData.title.length}/100</span>
                </div>
                <input id="input-title" name="title" type="text" maxLength={100} value={formData.title} onChange={handleInput} placeholder="Contoh: Smart Campus Navigation System" className={getInputClass("input-title")} />
              </div>
              <div>
                <label className={labelClass}>{t("category")}</label>
                <div className="w-full px-4 py-3 bg-surface-variant/40 border border-outline-variant/30 rounded-xl text-sm text-on-surface-variant font-medium cursor-not-allowed">
                  {formData.category ? getCategoryLabel(formData.category) : "Memuat..."}
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-semibold text-on-surface">{t("description")} <span className="text-red-400">*</span></label>
                  <span className={`text-xs font-medium ${formData.description.length >= 500 ? 'text-red-500' : 'text-on-surface-variant'}`}>{formData.description.length}/500</span>
                </div>
                <textarea id="input-description" name="description" rows={4} maxLength={500} value={formData.description} onChange={handleInput} placeholder="..." className={`${getInputClass("input-description")} resize-none`} />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-[var(--color-primary)] uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-[var(--color-secondary)] rounded-full block" /> {formData.category === "Research" ? t("sectionTechKTI") : formData.category === "IoT" ? t("sectionTechIoT") : formData.category === "Multimedia" ? t("sectionTechLainnya") : t("sectionTechDefault")}
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="input-tech-stack" className={labelClass}>
                  {formData.category === "Research" ? t("techKTI") : formData.category === "IoT" ? t("techIoT") : formData.category === "Multimedia" ? t("techLainnya") : t("techDefault")} <span className="text-red-400">*</span>
                </label>
                {formData.category === "Research" ? (
                  <KTIToolsSelect
                    value={formData.tech_stack}
                    onChange={(val) => {
                      setFormData(prev => ({ ...prev, tech_stack: val }));
                      if (invalidField === "input-tech-stack") setInvalidField(null);
                    }}
                    error={invalidField === "input-tech-stack"}
                  />
                ) : formData.category === "IoT" ? (
                  <IoTComponentSelect
                    value={formData.tech_stack}
                    onChange={(val) => {
                      setFormData(prev => ({ ...prev, tech_stack: val }));
                      if (invalidField === "input-tech-stack") setInvalidField(null);
                    }}
                    error={invalidField === "input-tech-stack"}
                  />
                ) : formData.category === "Multimedia" ? (
                  <input id="input-tech-stack" name="tech_stack" type="text" value={formData.tech_stack} onChange={handleInput} placeholder="Contoh: Premiere Pro, Photoshop, Canva..." className={getInputClass("input-tech-stack")} />
                ) : (
                  <TechStackSelect 
                    value={formData.tech_stack} 
                    onChange={(val) => {
                      setFormData(prev => ({ ...prev, tech_stack: val }));
                      if (invalidField === "input-tech-stack") setInvalidField(null);
                    }}
                    error={invalidField === "input-tech-stack"}
                  />
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{t("githubUrl")}</label>
                  <input id="input-github-url" name="github_url" type="url" value={formData.github_url} onChange={handleInput} placeholder="https://github.com/..." className={getInputClass("input-github-url")} />
                </div>
                <div>
                  <label className={labelClass}>{formData.category === "Research" ? t("urlKTI") : formData.category === "Programming" ? t("urlProg") : formData.category === "IoT" ? t("urlIoT") : formData.category === "Multimedia" ? t("urlLainnya") : t("urlDefault")} <span className="text-red-400">*</span></label>
                  <input id="input-live-url" name="live_url" type="url" value={formData.live_url} onChange={handleInput} placeholder="https://..." className={getInputClass("input-live-url")} />
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[var(--color-primary)] uppercase tracking-wider flex items-center gap-2">
                <span className="w-1 h-4 bg-[var(--color-secondary)] rounded-full block" /> {formData.category === "Research" ? t("featKTI") : formData.category === "Multimedia" ? t("featLainnya") : formData.category === "IoT" ? t("featIoT") : t("featDefault")} {formData.category !== "Multimedia" && <span className="text-red-400 normal-case">*</span>}
              </h3>
              <button type="button" onClick={addFitur} className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-primary)] hover:text-[var(--color-secondary)] transition-colors">
                <FiPlus size={14} /> {formData.category === "Research" ? t("addPoint") : formData.category === "Multimedia" ? t("addDetail") : t("addFeature")}
              </button>
            </div>
            <div className="space-y-3">
              {formData.features.map((fitur, i) => (
                <div key={i} className="bg-surface-variant/20 rounded-2xl p-4 border border-outline-variant/20">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-on-surface-variant/70 uppercase tracking-wide">{formData.category === "Research" ? t("point") : formData.category === "Multimedia" ? t("detail") : t("feature")} {i + 1}</p>
                    {i > 0 && (
                      <button type="button" onClick={() => removeFitur(i)} className="text-gray-300 hover:text-red-400 transition-colors">
                        <FiTrash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <input id={`input-feature-${i}-title`} type="text" value={fitur.title} onChange={(e) => handleFitur(i, "title", e.target.value)} placeholder={`Nama fitur ${i + 1}...`} className={getInputClass(`input-feature-${i}-title`)} />
                    <textarea id={`input-feature-${i}-desc`} rows={2} value={fitur.desc} onChange={(e) => handleFitur(i, "desc", e.target.value)} placeholder="Deskripsi singkat fitur ini..." className={`${getInputClass(`input-feature-${i}-desc`)} resize-none`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[var(--color-primary)] uppercase tracking-wider flex items-center gap-2">
                <span className="w-1 h-4 bg-[var(--color-secondary)] rounded-full block" /> {t("team")} <span className="text-red-400 normal-case">*</span>
              </h3>
              {formData.team.length < 5 && (
                <button type="button" onClick={addAnggota} className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-primary)] hover:text-[var(--color-secondary)] transition-colors">
                  <FiPlus size={14} /> {t("addMember")}
                </button>
              )}
            </div>
            <div className="space-y-3">
              {formData.team.map((anggota, i) => (
                <div key={i} className="bg-surface-variant/20 rounded-2xl p-4 border border-outline-variant/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-on-surface-variant/70 uppercase tracking-wide">{i === 0 ? t("projectLead") : `${t("member")} ${i + 1}`}</p>
                    {i > 0 && (
                      <button type="button" onClick={() => removeAnggota(i)} className="text-gray-300 hover:text-red-400 transition-colors">
                        <FiTrash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 flex flex-col items-center gap-1">
                      <ImageUpload
                        value={anggota.avatar || ""}
                        onChange={(url) => handleTim(i, "avatar", url)}
                      />
                    </div>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input id={`input-team-${i}-name`} type="text" value={anggota.name} onChange={e => handleTim(i, "name", e.target.value)} placeholder={t("namePlaceholder")} className={getInputClass(`input-team-${i}-name`)} />
                      <input id={`input-team-${i}-role`} type="text" value={anggota.role} onChange={e => handleTim(i, "role", e.target.value)} placeholder={t("rolePlaceholder")} className={getInputClass(`input-team-${i}-role`)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[var(--color-primary)] uppercase tracking-wider flex items-center gap-2">
                <span className="w-1 h-4 bg-[var(--color-secondary)] rounded-full block" /> {t("gallery")} <span className="text-red-400 normal-case">*</span>
              </h3>
              {formData.gallery.length < 10 && (
                <button type="button" onClick={addGallery} className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-primary)] hover:text-[var(--color-secondary)] transition-colors">
                  <FiPlus size={14} /> {t("addPhoto")}
                </button>
              )}
            </div>
            <p className="text-xs text-on-surface-variant mb-4">{t("galleryDesc")}</p>
            <div className="space-y-3">
              {formData.gallery.map((gal, i) => (
                <div 
                  key={i} 
                  id={`input-gallery-${i}-url`}
                  className={`rounded-2xl p-4 border flex flex-col sm:flex-row gap-4 items-start transition-all ${
                    invalidField === `input-gallery-${i}-url` 
                      ? 'border-red-500 bg-red-50/50 shadow-[0_0_0_4px_rgba(239,68,68,0.15)]' 
                      : 'border-outline-variant/20 bg-surface-variant/20'
                  }`}
                >
                  <div className="shrink-0">
                    <ImageUpload
                      value={gal.url}
                      onChange={(url) => { handleGallery(i, "url", url); if(invalidField === `input-gallery-${i}-url`) setInvalidField(null); }}
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-3 justify-center">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-on-surface-variant/70 uppercase tracking-wide">{t("photo")} {i + 1}</p>
                      <button type="button" onClick={() => removeGallery(i)} className="text-gray-300 hover:text-red-400 transition-colors">
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                    <input id={`input-gallery-${i}-caption`} type="text" value={gal.caption} onChange={e => handleGallery(i, "caption", e.target.value)} placeholder={t("caption")} className={getInputClass(`input-gallery-${i}-caption`)} />
                  </div>
                </div>
              ))}
              {formData.gallery.length === 0 && (
                <div id="section-gallery" className={`text-center py-6 rounded-2xl transition-all ${invalidField === 'section-gallery' ? 'border-2 border-red-500 bg-red-50/50 shadow-[0_0_0_4px_rgba(239,68,68,0.15)]' : 'border-2 border-dashed border-outline-variant/30'}`}>
                  <p className="text-sm text-on-surface-variant/70 mb-3">{t("emptyGallery")}</p>
                  <button type="button" onClick={() => { addGallery(); if(invalidField === 'section-gallery') setInvalidField(null); }} className="inline-flex items-center gap-1.5 text-sm font-bold bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-4 py-2 rounded-lg hover:bg-[var(--color-primary)]/20 transition-colors">
                    <FiPlus size={16} /> {t("addPhoto")}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant/20">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2.5 py-4 bg-[var(--color-primary)] text-white font-extrabold rounded-2xl hover:bg-[var(--color-primary)]/90 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 text-sm disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              {isLoading ? <FiLoader className="animate-spin" size={18} /> : <FiSend size={18} />}
              {isLoading ? t("saving") : t("submit")}
            </button>
          </div>

        </form>
        )}

      {/* Leave Confirmation Modal */}
      <AnimatePresence>
        {showLeaveConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-surface rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center border border-outline-variant/20"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
                <FiAlertCircle size={28} />
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2">{t("unsavedTitle")}</h3>
              <p className="text-on-surface-variant text-sm mb-8">{t("unsavedDesc")}</p>
              <div className="flex w-full gap-3">
                <button
                  type="button"
                  onClick={() => setShowLeaveConfirm(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-on-surface bg-surface-variant hover:bg-outline-variant transition-colors"
                >
                  {t("cancel")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (pendingUrl === 'back') {
                      doGoBack();
                    } else if (pendingUrl) {
                      router.push(pendingUrl);
                    }
                  }}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
                >
                  {t("leave")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
