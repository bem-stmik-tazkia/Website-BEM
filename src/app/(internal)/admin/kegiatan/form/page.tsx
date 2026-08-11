"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiSave, FiArrowLeft, FiAlertCircle, FiUpload } from "react-icons/fi";
import Link from "next/link";
import { getKegiatanById, saveKegiatan } from "../actions";
import { motion, AnimatePresence } from "framer-motion";
import { AgendaKegiatan, DynamicFormField } from "@/types/agenda";
import ImageUpload from "@/components/ui/ImageUpload";
import { useToast } from "@/components/ui/Toast";
import FormBuilder from "./FormBuilder";
import { createClient } from "@/utils/supabase/client";
import { compressImage } from "@/lib/imageCompression";

export default function KegiatanFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const fromParam = searchParams.get("from");
  const { success, error: showError } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(!!id);
  const typeParam = searchParams.get("type");
  
  const initialFormState: Partial<AgendaKegiatan> = {
    title: "",
    type: (typeParam as any) || (fromParam === 'dokumentasi' ? 'dokumentasi' : 'event'),
    category: "",
    date: "",
    time_range: "",
    deadline: "",
    location: "",
    image_url: "",
    registration_link: "",
    online_link: "",
    description: "",
    is_urgent: false,
    is_published: false,
    form_schema: [],
    speakers: [{ name: "", role: "", photo: "" }],
    max_participants: null
  };

  const [formData, setFormData] = useState<Partial<AgendaKegiatan>>(initialFormState);
  const [requiresRegistration, setRequiresRegistration] = useState(false);
  const [initialData, setInitialData] = useState<Partial<AgendaKegiatan>>(initialFormState);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const toastShown = React.useRef(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const supabase = createClient();

  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  useEffect(() => {
    const draftKey = `kegiatan_draft_${id || 'new'}`;
    const saved = localStorage.getItem(draftKey);
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
        if (!toastShown.current) {
          toast("Draft tersimpan dimuat ulang.", "success");
          toastShown.current = true;
        }
      } catch(e) {}
    }

    if (id) {
      getKegiatanById(id).then((data) => {
        if (data) {
          if (data.date) data.date = data.date.split('T')[0];
          if (data.deadline) data.deadline = data.deadline.split('T')[0];
          setFormData(data);
          setInitialData(JSON.parse(JSON.stringify(data))); // Deep copy for accurate isDirty check
          if (data.type === 'event' && data.form_schema && data.form_schema.length > 0) {
            setRequiresRegistration(true);
          }
        }
        setIsFetching(false);
      });
    } else {
      setIsFetching(false);
    }
  }, [id, toast]);

  useEffect(() => {
    if (isFetching) return;
    const draftKey = `kegiatan_draft_${id || 'new'}`;
    localStorage.setItem(draftKey, JSON.stringify(formData));
  }, [formData, id, isFetching]);

  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialData);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const handleBackNavigation = (e: React.MouseEvent, url: string) => {
    if (isDirty) {
      e.preventDefault();
      setPendingUrl(url);
      setShowLeaveConfirm(true);
    } else {
      router.push(url);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'max_participants') {
      const numValue = value === "" ? null : parseInt(value, 10);
      setFormData(prev => ({ ...prev, [name]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErr = { ...prev };
        delete newErr[name];
        return newErr;
      });
    }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    e.target.value = "";

    toast(`Memulai proses upload ${files.length} foto...`, "success");

    let successCount = 0;
    const errors: string[] = [];
    
    const uploading = files.map(async (file) => {
      if (!file.type.startsWith("image/")) {
        errors.push(`${file.name} bukan gambar.`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        errors.push(`${file.name} melebihi 5MB.`);
        return;
      }

      try {
        const compressedFile = await compressImage(file, 1, 1920);
        const ext = compressedFile.name.split(".").pop();
        const fileName = `${Math.random().toString(36).slice(2)}_${Date.now()}.${ext}`;
        
        const { error } = await supabase.storage.from("public_images").upload(`kabinet/${fileName}`, compressedFile, { cacheControl: "3600" });
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage.from("public_images").getPublicUrl(`kabinet/${fileName}`);
        
        setFormData((prev) => ({
          ...prev,
          gallery: [...(prev.gallery || []).filter(Boolean), publicUrl],
        }));
        successCount++;
      } catch (err: any) {
        errors.push(`Gagal upload ${file.name}: ${err.message}`);
      }
    });

    await Promise.all(uploading);
    
    if (successCount > 0) {
      if (formErrors.gallery) setFormErrors((errs) => { const n = { ...errs }; delete n.gallery; return n; });
      toast(`${successCount} dari ${files.length} foto berhasil diunggah!`, "success");
    }
    
    if (errors.length > 0) {
      toast(`Gagal mengunggah ${errors.length} foto. Cek ukuran/tipe file.`, "error");
      console.error("Upload errors:", errors);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // --- VALIDASI FORM CUSTOM ---
    const newErrors: Record<string, string> = {};
    
    if (!formData.image_url?.trim()) newErrors.image_url = "Poster / Gambar Header wajib diisi";

    if (formData.type === 'event' || formData.type === 'dokumentasi') {
      if (!formData.title?.trim()) newErrors.title = "Judul kegiatan wajib diisi";
      if (!formData.category?.trim()) newErrors.category = "Kategori wajib diisi";
      if (!formData.date) newErrors.date = "Tanggal pelaksanaan wajib diisi";
      if (!formData.time_range?.trim()) newErrors.time_range = "Rentang waktu wajib diisi";
      if (!formData.location?.trim()) newErrors.location = "Lokasi wajib diisi";
      if (!formData.description?.trim()) newErrors.description = "Deskripsi wajib diisi";
      
      if (formData.type === 'event') {
        if (!formData.speakers || formData.speakers.length === 0) {
          newErrors.speakers = "Minimal wajib mengisi 1 pembicara";
        } else {
          formData.speakers.forEach((s, idx) => {
            if (!s.name?.trim()) newErrors[`speaker_${idx}_name`] = "Nama wajib diisi";
            if (!s.role?.trim()) newErrors[`speaker_${idx}_role`] = "Profesi wajib diisi";
          });
        }
      } else if (formData.type === 'dokumentasi') {
        if (formData.speakers && formData.speakers.length > 0) {
          formData.speakers.forEach((s, idx) => {
            if (s.name?.trim() || s.role?.trim() || s.photo?.trim()) {
              if (!s.name?.trim()) newErrors[`speaker_${idx}_name`] = "Nama wajib diisi";
              if (!s.role?.trim()) newErrors[`speaker_${idx}_role`] = "Profesi wajib diisi";
            }
          });
        }
      }

      if (formData.type === 'dokumentasi') {
        const validGallery = formData.gallery?.filter(Boolean) || [];
        if (validGallery.length === 0) {
          newErrors.gallery = "Minimal upload 1 foto dokumentasi";
        }
      }
    } else if (formData.type === 'volunteer') {
      if (!formData.title?.trim()) newErrors.title = "Judul/Posisi wajib diisi";
      if (!formData.category?.trim()) newErrors.category = "Kategori wajib diisi";
      if (!formData.deadline) newErrors.deadline = "Deadline pendaftaran wajib diisi";
      if (!formData.description?.trim()) newErrors.description = "Deskripsi wajib diisi";
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      showError("Harap lengkapi semua kolom yang ditandai merah.");
      
      // Auto focus & scroll ke elemen pertama yang error
      const firstErrorKey = Object.keys(newErrors)[0];
      
      // Coba cari field wrapper-nya terlebih dahulu
      let el = document.getElementById(`field-${firstErrorKey}`);
      
      // Khusus untuk error array speakers
      if (firstErrorKey.startsWith("speaker")) {
        el = document.getElementById("field-speakers");
      }
      
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Cari input di dalamnya untuk difokuskan
        const input = el.querySelector('input, textarea') as HTMLElement;
        if (input) input.focus();
      }
      return;
    }

    // Build clean copy of data to save (do not mutate state directly)
    let dataToSave = { ...formData };

    // Jika Wajib Pendaftaran dinonaktifkan pada Event, hapus form_schema
    if (dataToSave.type === 'event' && !requiresRegistration) {
      dataToSave = { ...dataToSave, form_schema: [], max_participants: null };
    }
    
    // Filter pembicara yang kosong
    if (dataToSave.speakers) {
      dataToSave = {
        ...dataToSave,
        speakers: dataToSave.speakers.filter(s => s.name?.trim() || s.role?.trim() || s.photo?.trim()),
      };
    }
    // ---------------------
    
    if (id && !isDirty) {
      showError("Tidak ada perubahan yang dilakukan.");
      return;
    }

    setIsLoading(true);
    
    try {
      await saveKegiatan(dataToSave);
      
      const draftKey = `kegiatan_draft_${id || 'new'}`;
      localStorage.removeItem(draftKey);

      success("Data kegiatan berhasil disimpan!");
      
      const dateStr = formData.date ? formData.date.split('T')[0] : "";
      const todayStr = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      const isFinished = dateStr && dateStr < todayStr;
      
      if ((formData.type === 'event' && isFinished) || formData.type === 'dokumentasi') {
        router.push("/admin/dokumentasi");
      } else {
        router.push("/admin/kegiatan");
      }
    } catch (err: any) {
      showError("Gagal menyimpan data: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return <div className="py-12 text-center text-on-surface-variant font-bold">Memuat data...</div>;
  }

  const formDateStr = formData.date ? formData.date.split('T')[0] : "";
  const currentTodayStr = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  const isFinishedForm = formDateStr && formDateStr < currentTodayStr;
  const backUrl = (formData.type === 'event' && isFinishedForm) || fromParam === 'dokumentasi' ? "/admin/dokumentasi" : "/admin/kegiatan";
  const isDokumentasi = fromParam === 'dokumentasi' || formData.type === 'dokumentasi';

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-4 mb-8">
        <button type="button" onClick={(e) => handleBackNavigation(e, backUrl)} className="p-2 text-on-surface-variant hover:bg-surface-variant/50 rounded-xl transition-colors">
          <FiArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-on-surface">
            {isDokumentasi ? (id ? "Edit Dokumentasi" : "Tambah Dokumentasi") : (id ? "Edit Kegiatan" : "Tambah Kegiatan")}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">Lengkapi form di bawah ini.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 md:p-8 space-y-8">
          
          {/* Tipe & Status */}
          <div className={`grid grid-cols-1 gap-6 ${!isDokumentasi ? 'md:grid-cols-2' : ''}`}>
            {!isDokumentasi && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface">Tipe Kegiatan</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="type" value="event" checked={formData.type === 'event'} onChange={handleChange} className="w-4 h-4 text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface">Agenda / Event</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="type" value="volunteer" checked={formData.type === 'volunteer'} onChange={handleChange} className="w-4 h-4 text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface">Open Recruitment</span>
                  </label>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-bold text-on-surface">Publikasi</label>
              <div className="flex items-center gap-2 mt-1">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="is_published" checked={formData.is_published || false} onChange={handleChange} className="sr-only peer" />
                  <div className="w-11 h-6 bg-surface-variant/50 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  <span className="ml-3 text-sm font-bold text-on-surface">{formData.is_published ? "Live (Ditampilkan)" : "Draft (Disembunyikan)"}</span>
                </label>
              </div>
            </div>
          </div>

          <hr className="border-outline-variant/20" />

          {/* Info Dasar */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-on-surface border-b border-outline-variant/30 pb-2">Informasi Dasar</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div id="field-image_url" className="md:col-span-4 space-y-2">
                <label className="text-sm font-bold text-on-surface">Poster / Gambar Header <span className="text-red-500">*</span></label>
                <ImageUpload 
                  value={formData.image_url || ""}
                  onChange={(url) => {
                    setFormData(prev => ({...prev, image_url: url}));
                    if (formErrors.image_url) {
                      setFormErrors(prev => { const newErr = { ...prev }; delete newErr.image_url; return newErr; });
                    }
                  }}
                  className="w-full"
                />
                <input type="text" name="image_url" value={formData.image_url || ""} onChange={handleChange} className={`w-full mt-2 bg-background border ${formErrors.image_url ? 'border-red-500 bg-red-50' : 'border-outline-variant/50'} rounded-xl px-3 py-2 text-xs focus:border-primary outline-none transition-colors`} placeholder="Atau paste link URL gambar" />
                {formErrors.image_url && <p className="text-xs text-red-500 mt-1">{formErrors.image_url}</p>}
              </div>

              <div className="md:col-span-8 space-y-6">
                <div id="field-title" className="space-y-2">
                  <label className="text-sm font-bold text-on-surface">Judul Kegiatan / Posisi <span className="text-red-500">*</span></label>
                  <input type="text" name="title" value={formData.title || ""} onChange={handleChange} className={`w-full bg-background border ${formErrors.title ? "border-red-500 bg-red-50" : "border-outline-variant/50"} rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-colors`} placeholder="Contoh: BEM Mengajar 2026 atau Web Developer" />
                  {formErrors.title && <p className="text-xs text-red-500 mt-1">{formErrors.title}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div id="field-category" className="space-y-2">
                    <label className="text-sm font-bold text-on-surface">Kategori <span className="text-red-500">*</span></label>
                    <select name="category" value={formData.category || ""} onChange={handleChange} className={`w-full bg-background border ${formErrors.category ? "border-red-500 bg-red-50" : "border-outline-variant/50"} rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-colors`}>
                      <option value="" disabled>Pilih Kategori</option>
                      {formData.type === 'volunteer' ? (
                        <>
                          <option value="Kepanitiaan">Kepanitiaan</option>
                          <option value="Pengurus BEM">Pengurus BEM</option>
                          <option value="Relawan / Volunteer">Relawan / Volunteer</option>
                          <option value="Magang / Internship">Magang / Internship</option>
                          <option value="Delegasi / Lomba">Delegasi / Lomba</option>
                          <option value="Lainnya">Lainnya</option>
                        </>
                      ) : (
                        <>
                          <option value="Kaderisasi">Kaderisasi</option>
                          <option value="Teknologi">Teknologi</option>
                          <option value="Sosial Masyarakat">Sosial Masyarakat</option>
                          <option value="Akademik & Pendidikan">Akademik & Pendidikan</option>
                          <option value="Olahraga">Olahraga</option>
                          <option value="Seni & Budaya">Seni & Budaya</option>
                          <option value="Keagamaan">Keagamaan</option>
                          <option value="Kewirausahaan">Kewirausahaan</option>
                          <option value="Lainnya">Lainnya</option>
                        </>
                      )}
                    </select>
                    {formErrors.category && <p className="text-xs text-red-500 mt-1">{formErrors.category}</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-outline-variant/20" />

          {/* Waktu & Lokasi */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-on-surface border-b border-outline-variant/30 pb-2">Waktu & Lokasi</h3>
            
            {formData.type === 'event' || formData.type === 'dokumentasi' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div id="field-date" className="space-y-2">
                  <label className="text-sm font-bold text-on-surface">Tanggal Pelaksanaan <span className="text-red-500">*</span></label>
                  <input type="date" name="date" value={formData.date || ""} onChange={handleChange} className={`w-full bg-background border ${formErrors.date ? "border-red-500 bg-red-50" : "border-outline-variant/50"} rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-colors`} />
                  {formErrors.date && <p className="text-xs text-red-500 mt-1">{formErrors.date}</p>}
                </div>
                <div id="field-time_range" className="space-y-2">
                  <label className="text-sm font-bold text-on-surface">Rentang Waktu <span className="text-red-500">*</span></label>
                  <input type="text" name="time_range" value={formData.time_range || ""} onChange={handleChange} className={`w-full bg-background border ${formErrors.time_range ? "border-red-500 bg-red-50" : "border-outline-variant/50"} rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-colors`} placeholder="Contoh: 08:00 - 15:00 WIB" />
                  {formErrors.time_range && <p className="text-xs text-red-500 mt-1">{formErrors.time_range}</p>}
                </div>
                <div id="field-speakers" className="space-y-4 md:col-span-2 border-t border-outline-variant/30 pt-4 mt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-on-surface">Detail Pembicara / Pemateri {formData.type === 'event' ? <><span className="text-red-500">*</span> <span className="font-normal text-on-surface-variant text-xs">(Min. 1)</span></> : <span className="font-normal text-on-surface-variant text-xs">(Opsional)</span>}</h4>
                      {formErrors.speakers && <p className="text-xs text-red-500 mt-1">{formErrors.speakers}</p>}
                    </div>
                    <button 
                      type="button" 
                      onClick={() => {
                        setFormData(prev => ({...prev, speakers: [...(prev.speakers || []), { name: "", role: "", photo: "" }]}));
                        if (formErrors.speakers) {
                          setFormErrors(prev => { const newErr = { ...prev }; delete newErr.speakers; return newErr; });
                        }
                      }}
                      className="text-xs font-bold bg-secondary-container text-secondary px-3 py-1.5 rounded-lg hover:bg-secondary/20 transition-colors"
                    >
                      + Tambah Pembicara
                    </button>
                  </div>
                  
                  {formData.speakers && formData.speakers.length > 0 && (
                    <div className="space-y-6">
                      {formData.speakers.map((speaker, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-6 relative border border-outline-variant/30 p-4 rounded-xl bg-surface-variant/10">
                          <button 
                            type="button" 
                            onClick={() => {
                              const newSpeakers = [...(formData.speakers || [])];
                              newSpeakers.splice(index, 1);
                              setFormData(prev => ({...prev, speakers: newSpeakers}));
                            }}
                            className="absolute -top-3 -right-3 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm z-10"
                            title="Hapus Pembicara"
                          >
                            &times;
                          </button>
                          
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-on-surface">Nama Pembicara {formData.type === 'event' && <span className="text-red-500">*</span>}</label>
                            <input 
                              type="text" 
                              name={`speaker_${index}_name`}
                              value={speaker.name || ""} 
                              onChange={(e) => {
                                const newSpeakers = [...(formData.speakers || [])];
                                newSpeakers[index].name = e.target.value;
                                setFormData(prev => ({...prev, speakers: newSpeakers}));
                                if (formErrors[`speaker_${index}_name`]) {
                                  setFormErrors(prev => { const newErr = { ...prev }; delete newErr[`speaker_${index}_name`]; return newErr; });
                                }
                              }} 
                              className={`w-full bg-background border ${formErrors[`speaker_${index}_name`] ? "border-red-500 bg-red-50" : "border-outline-variant/50"} rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-colors`} 
                              placeholder="Contoh: Nadiem Makarim" 
                            />
                            {formErrors[`speaker_${index}_name`] && <p className="text-xs text-red-500 mt-1">{formErrors[`speaker_${index}_name`]}</p>}
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-on-surface">Profesi / Jabatan {formData.type === 'event' && <span className="text-red-500">*</span>}</label>
                            <input 
                              type="text" 
                              name={`speaker_${index}_role`}
                              value={speaker.role || ""} 
                              onChange={(e) => {
                                const newSpeakers = [...(formData.speakers || [])];
                                newSpeakers[index].role = e.target.value;
                                setFormData(prev => ({...prev, speakers: newSpeakers}));
                                if (formErrors[`speaker_${index}_role`]) {
                                  setFormErrors(prev => { const newErr = { ...prev }; delete newErr[`speaker_${index}_role`]; return newErr; });
                                }
                              }} 
                              className={`w-full bg-background border ${formErrors[`speaker_${index}_role`] ? "border-red-500 bg-red-50" : "border-outline-variant/50"} rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-colors`} 
                              placeholder="Contoh: Menteri Pendidikan" 
                            />
                            {formErrors[`speaker_${index}_role`] && <p className="text-xs text-red-500 mt-1">{formErrors[`speaker_${index}_role`]}</p>}
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-bold text-on-surface">Foto Pembicara</label>
                            <ImageUpload 
                              value={speaker.photo || ""}
                              onChange={(url) => {
                                const newSpeakers = [...(formData.speakers || [])];
                                newSpeakers[index].photo = url;
                                setFormData(prev => ({...prev, speakers: newSpeakers}));
                              }}
                              className="w-32 h-32 rounded-full mx-auto md:mx-0"
                            />
                            <input 
                              type="text" 
                              value={speaker.photo || ""} 
                              onChange={(e) => {
                                const newSpeakers = [...(formData.speakers || [])];
                                newSpeakers[index].photo = e.target.value;
                                setFormData(prev => ({...prev, speakers: newSpeakers}));
                              }} 
                              className="w-full mt-2 bg-background border border-outline-variant/50 rounded-xl px-3 py-2 text-xs focus:border-primary outline-none" 
                              placeholder="Atau paste link URL gambar" 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                <div id="field-deadline" className="space-y-2">
                  <label className="text-sm font-bold text-on-surface">Deadline Pendaftaran <span className="text-red-500">*</span></label>
                  <input type="date" name="deadline" value={formData.deadline || ""} onChange={handleChange} className={`w-full bg-background border ${formErrors.deadline ? "border-red-500 bg-red-50" : "border-outline-variant/50"} rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-colors`} />
                  {formErrors.deadline && <p className="text-xs text-red-500 mt-1">{formErrors.deadline}</p>}
                </div>
                <div className="space-y-2 pb-2">
                  <label className="flex items-center gap-2 cursor-pointer bg-red-50 text-red-600 px-4 py-3 rounded-xl border border-red-200 hover:bg-red-100 transition-colors">
                    <input type="checkbox" name="is_urgent" checked={formData.is_urgent || false} onChange={handleChange} className="w-4 h-4 text-red-600 focus:ring-red-500 rounded" />
                    <span className="text-sm font-bold">Tandai sebagai URGENT (Segera)</span>
                  </label>
                </div>
              </div>
            )}

            {(formData.type === 'event' || formData.type === 'dokumentasi') && (
              <div id="field-location" className="space-y-2">
                <label className="text-sm font-bold text-on-surface">Lokasi <span className="text-red-500">*</span></label>
                <input type="text" name="location" value={formData.location || ""} onChange={handleChange} className={`w-full bg-background border ${formErrors.location ? "border-red-500 bg-red-50" : "border-outline-variant/50"} rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-colors`} placeholder="Contoh: Auditorium STMIK Tazkia (Isi 'Online' jika via Zoom)" />
                {formErrors.location && <p className="text-xs text-red-500 mt-1">{formErrors.location}</p>}
              </div>
            )}
          </div>

          <hr className="border-outline-variant/20" />

          {/* Media & Deskripsi */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-on-surface border-b border-outline-variant/30 pb-2">Detail Ekstra</h3>
            
            <div className="space-y-6">
                {formData.type === 'event' && (
                  <div className="space-y-4 pb-4 border-b border-outline-variant/20">
                    <label className="flex items-center gap-3 p-4 border border-outline-variant/50 rounded-xl cursor-pointer hover:bg-surface-variant/20 transition-colors bg-surface">
                      <div className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={requiresRegistration} 
                          onChange={(e) => setRequiresRegistration(e.target.checked)} 
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-surface-variant/50 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </div>
                      <div>
                        <span className="text-sm font-bold text-on-surface block">Wajibkan Pendaftaran (RSVP)</span>
                        <span className="text-xs text-on-surface-variant">Buka form pendaftaran kustom dan fitur kuota untuk event ini.</span>
                      </div>
                    </label>
                  </div>
                )}

                {(formData.type === 'volunteer' || (formData.type === 'event' && requiresRegistration)) && (
                  <>
                    <div className="space-y-2 pb-4 border-b border-outline-variant/20">
                      <FormBuilder 
                        fields={formData.form_schema || []} 
                        onChange={(newFields) => setFormData(prev => ({...prev, form_schema: newFields}))} 
                      />
                    </div>
                    <div id="field-max_participants" className="space-y-2 pb-4 border-b border-outline-variant/20">
                      <label className="text-sm font-bold text-on-surface">Kuota Pendaftar (Opsional)</label>
                      <input 
                        type="number" 
                        name="max_participants" 
                        value={formData.max_participants == null ? "" : formData.max_participants} 
                        onChange={handleChange} 
                        className={`w-full md:w-1/2 bg-background border border-outline-variant/50 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-colors`} 
                        placeholder="Kosongkan jika kuota tidak terbatas" 
                        min="1"
                      />
                      <p className="text-xs text-on-surface-variant mt-1">Sistem akan otomatis menutup pendaftaran jika jumlah pendaftar sudah mencapai angka ini.</p>
                    </div>
                  </>
                )}

                {formData.type === 'event' && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-on-surface">Link Event Online (Zoom/GMeet/dll)</label>
                    <input type="text" name="online_link" value={formData.online_link || ""} onChange={handleChange} className="w-full bg-background border border-outline-variant/50 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none" placeholder="Kosongkan jika event offline" />
                    <p className="text-xs text-on-surface-variant mt-1">Jika dikosongkan, halaman akan otomatis memberitahu pengunjung untuk datang ke lokasi.</p>
                  </div>
                )}

                <div id="field-description" className="space-y-2">
                  <label className="text-sm font-bold text-on-surface">Deskripsi Lengkap <span className="text-red-500">*</span></label>
                  <textarea name="description" value={formData.description || ""} onChange={handleChange} className={`w-full bg-background border ${formErrors.description ? "border-red-500 bg-red-50" : "border-outline-variant/50"} rounded-xl px-4 py-3 text-sm focus:border-primary outline-none min-h-[150px] transition-colors`} placeholder="Deskripsikan secara lengkap mengenai agenda atau kriteria rekrutmen ini..." />
                  {formErrors.description && <p className="text-xs text-red-500 mt-1">{formErrors.description}</p>}
                </div>
            </div>
            
            {/* Video & Gallery Section */}
            {(formData.type === 'event' || formData.type === 'dokumentasi') && (
              <div className="space-y-6 pt-4 border-t border-outline-variant/20">
                <div id="field-video_url" className="space-y-2">
                  <label className="text-sm font-bold text-on-surface">Link Video Dokumentasi <span className="font-normal text-on-surface-variant text-xs">(Opsional)</span></label>
                  <input type="text" name="video_url" value={formData.video_url || ""} onChange={handleChange} className="w-full bg-background border border-outline-variant/50 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none" placeholder="Contoh: Link YouTube, Instagram, TikTok, atau Google Drive" />
                  <p className="text-xs text-on-surface-variant mt-1">Masukkan link video dari platform eksternal (termasuk Google Drive) agar database tidak berat.</p>
                </div>
              </div>
            )}

            {(formData.type === 'event' || formData.type === 'dokumentasi') && (
              <div id="field-gallery" className="space-y-4 pt-4 border-t border-outline-variant/20">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-bold text-on-surface">
                      Dokumentasi Foto {formData.type === 'dokumentasi' ? <span className="text-red-500">*</span> : ""}
                    </label>
                    <p className="text-xs text-on-surface-variant font-normal">
                      {formData.type === 'dokumentasi' ? "(Wajib untuk Dokumentasi)" : "(Bisa diisi menyusul setelah event selesai)"}
                    </p>
                    {formErrors.gallery && <p className="text-xs text-red-500 mt-1">{formErrors.gallery}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleBulkUpload}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-all shadow-sm"
                    >
                      <FiUpload size={14} /> Upload Sekaligus
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        const newGallery = [...(formData.gallery || []), ""];
                        setFormData(prev => ({...prev, gallery: newGallery}));
                      }}
                      className="text-xs font-bold bg-secondary-container text-secondary px-3 py-1.5 rounded-lg hover:bg-secondary/20 transition-colors"
                    >
                      + Tambah Slot Foto
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {((formData.gallery && formData.gallery.length > 0) ? formData.gallery : [""]).map((url, i) => (
                    <div key={i} className={`space-y-2 relative border p-4 rounded-xl ${formErrors.gallery ? "border-red-500 bg-red-50" : "border-outline-variant/30 bg-surface-variant/10"}`}>
                      <ImageUpload 
                        value={url}
                        onChange={(newUrl) => {
                          const newGallery = [...(formData.gallery || [""])];
                          newGallery[i] = newUrl;
                          setFormData(prev => ({...prev, gallery: newGallery}));
                        }}
                        className="w-full"
                      />
                      <input 
                        type="text" 
                        value={url} 
                        onChange={(e) => {
                          const newGallery = [...(formData.gallery || [""])];
                          newGallery[i] = e.target.value;
                          setFormData(prev => ({...prev, gallery: newGallery}));
                        }} 
                        className="w-full mt-2 bg-background border border-outline-variant/50 rounded-xl px-3 py-2 text-xs focus:border-primary outline-none" 
                        placeholder={`URL Gambar ${i+1}`} 
                      />
                      {((formData.gallery?.length || 1) > 1) && (
                        <button 
                          type="button" 
                          onClick={() => {
                            const newGallery = [...(formData.gallery || [])];
                            newGallery.splice(i, 1);
                            setFormData(prev => ({...prev, gallery: newGallery}));
                          }}
                          className="absolute -top-3 -right-3 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

        <div className="bg-surface-container-lowest border-t border-outline-variant/30 p-6 flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all hover:shadow-md disabled:opacity-70"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <FiSave size={18} />
            )}
            {isLoading ? "Menyimpan..." : "Simpan Kegiatan"}
          </button>
        </div>
      </form>

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
              <h3 className="text-xl font-bold text-on-surface mb-2">Perubahan Belum Disimpan</h3>
              <p className="text-on-surface-variant text-sm mb-8">Apakah kamu yakin ingin keluar? Semua isian pada form ini akan hilang jika belum disimpan.</p>
              <div className="flex w-full gap-3">
                <button
                  type="button"
                  onClick={() => setShowLeaveConfirm(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-on-surface bg-surface-variant hover:bg-outline-variant transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (pendingUrl) router.push(pendingUrl);
                  }}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
                >
                  Ya, Keluar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
