"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiInfo,
  FiVideo,
  FiExternalLink,
  FiImage,
  FiMic,
  FiDownload,
  FiCheckSquare,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiClipboard
} from "react-icons/fi";
import { AgendaKegiatan } from "@/types/agenda";
import { formatDateToIndo } from "@/utils/dateFormatter";

function AgendaDetailClientContent({ agenda, participantCount }: { agenda: AgendaKegiatan, participantCount: number }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const from = searchParams.get("from");

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (from === "home") {
      router.push("/");
    } else if (from === "agenda-event") {
      router.push("/agenda?tab=event");
    } else if (from === "agenda-volunteer") {
      router.push("/agenda?tab=volunteer");
    } else if (from === "dokumentasi") {
      router.push("/dokumentasi");
    } else {
      router.push("/agenda");
    }
  };

  const getEventStatus = (dateStr?: string | null) => {
    if (!dateStr) return "Akan Datang";
    const eventDate = new Date(dateStr);
    const today = new Date();
    eventDate.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    
    if (eventDate < today) return "Selesai";
    if (eventDate.getTime() === today.getTime()) return "Live";
    return "Akan Datang";
  };

  const eventStatus = getEventStatus(agenda.date);
  const isLive = eventStatus === "Live";
  const isFinished = eventStatus === "Selesai";
  const isManualDokumentasi = agenda.type === 'dokumentasi';
  
  const hasRegistration = agenda.form_schema && agenda.form_schema.length > 0;
  const maxQuota = agenda.max_participants;
  const isQuotaFull = maxQuota !== null && maxQuota !== undefined && participantCount >= maxQuota;
  const remainingQuota = maxQuota !== null && maxQuota !== undefined ? maxQuota - participantCount : null;

  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);
  const [flipDirection, setFlipDirection] = React.useState<number>(1);
  const [isSelectionMode, setIsSelectionMode] = React.useState(false);
  const [selectedPhotos, setSelectedPhotos] = React.useState<Set<number>>(new Set());
  const [isDownloading, setIsDownloading] = React.useState(false);

  const downloadImage = async (url: string, index: number) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `Dokumentasi-${agenda.title.replace(/\s+/g, '-')}-${index + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  const handleDownloadSelected = async () => {
    setIsDownloading(true);
    const urlsToDownload = Array.from(selectedPhotos).map(idx => agenda.gallery!.filter(Boolean)[idx]);
    
    for (let i = 0; i < urlsToDownload.length; i++) {
      const url = urlsToDownload[i];
      const originalIndex = Array.from(selectedPhotos)[i];
      await downloadImage(url, originalIndex);
      if (i < urlsToDownload.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    setIsDownloading(false);
    setIsSelectionMode(false);
    setSelectedPhotos(new Set());
  };

  const handleDownloadAll = async () => {
    setIsDownloading(true);
    const gallery = agenda.gallery!.filter(Boolean);
    
    for (let i = 0; i < gallery.length; i++) {
      await downloadImage(gallery[i], i);
      if (i < gallery.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    setIsDownloading(false);
  };

  const toggleSelection = (idx: number) => {
    const newSet = new Set(selectedPhotos);
    if (newSet.has(idx)) newSet.delete(idx);
    else newSet.add(idx);
    setSelectedPhotos(newSet);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFlipDirection(-1);
    setLightboxIndex(prev => prev! > 0 ? prev! - 1 : agenda.gallery!.filter(Boolean).length - 1);
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFlipDirection(1);
    setLightboxIndex(prev => prev! < agenda.gallery!.filter(Boolean).length - 1 ? prev! + 1 : 0);
  };

  return (
    <div className="bg-[#f8f9fc] min-h-screen pt-32 pb-20 font-sans">
      
      {/* ── BACK BUTTON ────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-5 md:px-8 mb-4 md:mb-6">
        <Link 
          href="/agenda" 
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-medium text-sm"
        >
          <FiArrowLeft /> Kembali
        </Link>
      </section>

      {/* ── HERO SECTION ───────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-5 md:px-8 mb-6 md:mb-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="relative w-full aspect-[4/3] sm:aspect-[16/9] md:aspect-[21/8] min-h-[260px] sm:min-h-0 rounded-2xl md:rounded-3xl overflow-hidden shadow-lg border border-outline-variant/20 flex flex-col justify-end bg-surface-variant"
        >
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${agenda.image_url || (agenda.gallery && agenda.gallery.length > 0 ? agenda.gallery[0] : "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80")}')` }}
          ></div>
          
          {/* Gradient Overlay for Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/60 to-transparent pointer-events-none"></div>

          {/* Hero Content */}
          <div className="relative z-10 p-4 md:p-8 text-white w-full">
            <span className="inline-block bg-surface/20 backdrop-blur-sm border border-white/30 text-white text-[10px] md:text-xs font-bold px-3 py-1 md:px-4 md:py-1.5 rounded-full uppercase tracking-wider mb-2 md:mb-4 shadow-sm">
              {agenda.category}
            </span>
            {(isFinished || isManualDokumentasi) && (
              <span className="inline-block ml-2 bg-gray-500 text-white text-[10px] md:text-xs font-bold px-3 py-1 md:px-4 md:py-1.5 rounded-full uppercase tracking-wider mb-2 md:mb-4 shadow-sm">
                Selesai
              </span>
            )}
            
            <h1 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-extrabold mb-2 md:mb-4 leading-tight">
              {agenda.title}
            </h1>
            
            <div className="flex flex-col md:flex-row md:items-center gap-x-6 gap-y-1.5 md:gap-y-3 text-xs md:text-base text-white/90 font-medium">
              <span className="flex items-center gap-2">
                <FiCalendar className="text-[var(--color-secondary)] shrink-0" size={16} /> {formatDateToIndo(agenda.date || agenda.deadline)}
              </span>
              {agenda.time_range && agenda.time_range !== "-" && (
                <span className="flex items-center gap-2">
                  <FiClock className="text-[var(--color-secondary)] shrink-0" size={16} /> {agenda.time_range}
                </span>
              )}
              {agenda.location && agenda.location !== "-" && (
                <span className="flex items-center gap-2">
                  <FiMapPin className="text-[var(--color-secondary)] shrink-0" size={16} /> {agenda.location}
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── LIVE BUTTON & ONLINE LINK (For Events) ───────────────────── */}
        {agenda.type === 'event' && !isFinished && !isManualDokumentasi && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
            className={`mt-4 md:mt-6 p-4 md:p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border ${isLive ? 'bg-gradient-to-r from-red-500 to-red-600 border-red-400' : 'bg-surface border-outline-variant/30'}`}
          >
            <div className={`flex items-center gap-3 md:gap-4 w-full sm:w-auto ${isLive ? 'text-white' : 'text-on-surface'}`}>
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0 ${isLive ? 'bg-surface/20 animate-pulse' : 'bg-primary/10 text-primary'}`}>
                {isLive || (!hasRegistration && agenda.online_link) ? <FiVideo size={20} /> : <FiClipboard size={20} />}
              </div>
              <div>
                <h3 className="font-bold text-base md:text-lg">
                  {isLive ? 'Event Sedang Berlangsung!' : hasRegistration ? 'Tiket & Pendaftaran' : 'Informasi Kehadiran'}
                </h3>
                <p className={`text-xs md:text-sm ${isLive ? 'text-red-100' : 'text-on-surface-variant'}`}>
                  {hasRegistration 
                    ? "Acara ini sangat ditunggu-tunggu lho! Ayo amankan kursimu sekarang sebelum kehabisan kuota."
                    : agenda.online_link 
                      ? "Event ini diselenggarakan secara online melalui link yang tersedia." 
                      : "Acara ini terbuka untuk umum, silakan datang langsung ke lokasi event!"}
                </p>
                {hasRegistration && (
                   <p className={`text-xs mt-1 font-bold ${isQuotaFull ? 'text-red-500' : isLive ? 'text-white' : 'text-primary'}`}>
                     {maxQuota !== null && maxQuota !== undefined 
                       ? (isQuotaFull ? "Kuota Penuh" : `Sisa Kuota: ${remainingQuota} dari ${maxQuota}`)
                       : "Kuota Tidak Terbatas"}
                     {` (Total pendaftar saat ini: ${participantCount})`}
                   </p>
                )}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
              {agenda.online_link && (
                <a 
                  href={agenda.online_link} 
                  target="_blank" 
                  rel="noreferrer"
                  className={`w-full sm:w-auto px-6 py-3 font-extrabold rounded-xl shadow-md transition-all text-center flex items-center justify-center gap-2 text-sm ${isLive ? 'bg-surface text-red-600 hover:bg-red-50 hover:scale-105' : 'bg-secondary text-white hover:bg-secondary/90'}`}
                >
                  {isLive ? 'Masuk ke Live' : 'Link Online'} <FiExternalLink size={16} />
                </a>
              )}
              {hasRegistration && (
                <Link 
                  href={isQuotaFull ? '#' : `/agenda/${agenda.id}/apply`}
                  className={`w-full sm:w-auto px-6 py-3 font-extrabold rounded-xl shadow-md transition-all text-center flex items-center justify-center gap-2 text-sm ${isQuotaFull ? 'bg-surface-variant text-on-surface-variant cursor-not-allowed' : 'bg-primary text-white hover:bg-primary/90 hover:scale-105'}`}
                  onClick={(e) => isQuotaFull && e.preventDefault()}
                >
                  {isQuotaFull ? 'Kuota Penuh' : 'Daftar Sekarang'}
                </Link>
              )}
            </div>
          </motion.div>
        )}

        {/* ── APPLY BUTTON (For Volunteers) ───────────────────── */}
        {agenda.type === 'volunteer' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
            className={`mt-4 md:mt-6 p-4 md:p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border bg-gradient-to-r from-emerald-500 to-emerald-600 border-emerald-400 text-white`}
          >
            <div className={`flex items-center gap-3 md:gap-4 w-full sm:w-auto`}>
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0 bg-surface/20 animate-pulse`}>
                <FiExternalLink size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base md:text-lg">
                  Open Recruitment Masih Dibuka!
                </h3>
                <p className={`text-xs md:text-sm text-emerald-100`}>
                  Segera daftarkan dirimu sebelum batas waktu pendaftaran berakhir.
                </p>
                <p className="text-xs mt-1 font-bold text-emerald-100">
                  {maxQuota !== null && maxQuota !== undefined 
                    ? (isQuotaFull ? "Kuota Penuh" : `Sisa Kuota: ${remainingQuota} dari ${maxQuota}`)
                    : "Kuota Tidak Terbatas"}
                  {` (Total pendaftar saat ini: ${participantCount})`}
                </p>
              </div>
            </div>
            
            <Link 
              href={isQuotaFull ? '#' : `/agenda/${agenda.id}/apply`}
              className={`w-full sm:w-auto px-6 py-3 font-extrabold rounded-xl shadow-md transition-all text-center flex items-center justify-center gap-2 text-sm ${isQuotaFull ? 'bg-white/30 text-white cursor-not-allowed' : 'bg-surface text-emerald-700 hover:bg-emerald-50 hover:scale-105'}`}
              onClick={(e) => isQuotaFull && e.preventDefault()}
            >
              {isQuotaFull ? 'Kuota Penuh' : 'Daftar Sekarang'}
            </Link>
          </motion.div>
        )}
      </section>

      {/* ── MAIN CONTENT ────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-5 md:px-8 grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
        
        {/* Deskripsi & Dokumentasi */}
        <div className="flex flex-col gap-6 md:gap-8 lg:col-span-2">
          
          {agenda.speakers && agenda.speakers.length > 0 && (
            <div className="lg:hidden flex flex-col gap-4 mb-2">
              <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block bg-secondary/10 w-fit px-3 py-1.5 rounded-full">Menghadirkan Pembicara</span>
              {agenda.speakers.map((speaker, idx) => (
                <div key={idx} className="bg-surface rounded-2xl md:rounded-3xl p-5 md:p-6 border border-outline-variant/30 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-6">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0 border-2 border-primary/20">
                    {speaker.photo ? (
                      <img src={speaker.photo} alt={speaker.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl md:text-3xl font-black text-primary">
                        {speaker.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="text-center sm:text-left flex-grow flex flex-col justify-center">
                    <h3 className="text-lg md:text-xl font-bold text-on-background mb-1">{speaker.name}</h3>
                    {speaker.role && (
                      <p className="text-sm text-on-surface-variant font-medium">{speaker.role}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Only show description box if it has meaningful content */}
          {agenda.description && agenda.description !== "-" && agenda.description !== "" && !agenda.description?.startsWith("Dokumentasi ") && (
            <div className="bg-surface rounded-2xl md:rounded-3xl p-5 md:p-8 border border-outline-variant/30 shadow-sm">
              <h3 className="text-lg md:text-xl font-bold text-on-background mb-4 md:mb-6 flex items-center gap-2">
                <FiInfo className="text-primary" size={20} /> Detail Informasi
              </h3>
              
              <div className="text-on-surface-variant text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                {agenda.description}
              </div>
            </div>
          )}

          {/* Galeri / Dokumentasi */}
          {agenda.gallery && agenda.gallery.length > 0 && (
            <div className="bg-surface rounded-2xl md:rounded-3xl p-5 md:p-8 border border-outline-variant/30 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 md:mb-6">
                <h3 className="text-lg md:text-xl font-bold text-on-background flex items-center gap-2">
                  <FiImage className="text-primary" size={20} /> Dokumentasi Kegiatan
                  <span className="text-sm font-normal text-on-surface-variant ml-2">{agenda.gallery.filter(Boolean).length} Foto</span>
                </h3>

                <div className="flex items-center gap-2">
                  {isSelectionMode ? (
                    <>
                      <button onClick={() => { setIsSelectionMode(false); setSelectedPhotos(new Set()); }} className="text-xs md:text-sm font-semibold px-3 py-1.5 rounded-lg border border-outline-variant/50 hover:bg-surface-variant transition-colors">
                        Batal
                      </button>
                      <button 
                        onClick={handleDownloadSelected}
                        disabled={selectedPhotos.size === 0 || isDownloading}
                        className="text-xs md:text-sm font-bold bg-primary text-white px-4 py-1.5 rounded-lg disabled:opacity-50 hover:bg-primary/90 transition-colors flex items-center gap-1.5"
                      >
                        {isDownloading ? (
                          <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div> Unduh...</>
                        ) : (
                          <><FiDownload size={14} /> Unduh ({selectedPhotos.size})</>
                        )}
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={handleDownloadAll} disabled={isDownloading} className="text-xs md:text-sm font-semibold px-3 py-1.5 rounded-lg border border-outline-variant/50 hover:bg-surface-variant transition-colors flex items-center gap-1.5 disabled:opacity-50">
                        {isDownloading ? <div className="w-3 h-3 border-2 border-primary/40 border-t-primary rounded-full animate-spin"></div> : <FiDownload size={14} />} Semua
                      </button>
                      <button onClick={() => setIsSelectionMode(true)} disabled={isDownloading} className="text-xs md:text-sm font-bold bg-secondary-container text-secondary px-3 py-1.5 rounded-lg hover:bg-secondary/20 transition-colors flex items-center gap-1.5 disabled:opacity-50">
                        <FiCheckSquare size={14} /> Pilih
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {agenda.gallery.filter(Boolean).map((imgUrl, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => {
                      if (isSelectionMode) toggleSelection(idx);
                      else setLightboxIndex(idx);
                    }}
                    className={`relative rounded-xl overflow-hidden shadow-sm border aspect-square bg-surface-variant cursor-pointer group transition-all duration-200 ${isSelectionMode && selectedPhotos.has(idx) ? 'border-primary ring-2 ring-primary ring-offset-1 scale-[0.96]' : 'border-outline-variant/20 hover:scale-[1.02]'}`}
                  >
                    <img src={imgUrl} alt={`Dokumentasi ${idx + 1}`} className="w-full h-full object-cover" />
                    
                    {/* Selection overlay */}
                    {isSelectionMode && (
                      <div className="absolute inset-0 bg-black/10 flex items-start justify-end p-2">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedPhotos.has(idx) ? 'bg-primary border-primary text-white' : 'bg-white/70 border-white text-transparent'}`}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                      </div>
                    )}
                    
                    {/* Hover overlay for preview (only if not selecting) */}
                    {!isSelectionMode && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity transform scale-75 group-hover:scale-100">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Sidebar / Speaker Card (Desktop) */}
        <div className="hidden lg:flex flex-col gap-6 lg:col-span-1">
          {agenda.speakers && agenda.speakers.length > 0 && (
            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-bold text-secondary uppercase tracking-wider bg-secondary/10 px-3 py-1.5 rounded-full w-fit">Menghadirkan Pembicara</span>
              {agenda.speakers.map((speaker, idx) => (
                <div key={idx} className="bg-surface rounded-3xl p-8 border border-outline-variant/30 shadow-sm flex flex-col items-center text-center">
                  <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden mb-4 border-4 border-white shadow-md">
                    {speaker.photo ? (
                      <img src={speaker.photo} alt={speaker.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl font-black text-primary">
                        {speaker.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-on-background mb-1">{speaker.name}</h3>
                  {speaker.role && (
                    <p className="text-sm text-on-surface-variant font-medium leading-relaxed">{speaker.role}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── LIGHTBOX MODAL ────────────────────────────────────────── */}
      {lightboxIndex !== null && agenda.gallery && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm">
          <button 
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 md:top-6 md:right-8 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <FiX size={32} />
          </button>
          
          <button 
            onClick={() => downloadImage(agenda.gallery!.filter(Boolean)[lightboxIndex], lightboxIndex)}
            className="absolute top-4 right-16 md:top-6 md:right-24 flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-colors font-semibold shadow-sm"
          >
            <FiDownload size={18} /> <span className="hidden sm:inline">Unduh Foto</span>
          </button>
          
          <div className="absolute bottom-6 left-0 right-0 text-center text-white/80 font-bold tracking-widest text-sm bg-black/50 w-fit mx-auto px-4 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
            {lightboxIndex + 1} / {agenda.gallery.filter(Boolean).length}
          </div>

          <button 
            onClick={handlePrev}
            className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-4 hover:bg-white/10 rounded-full transition-colors hidden sm:block z-10"
          >
            <FiChevronLeft size={40} />
          </button>
          
          <button 
            onClick={handleNext}
            className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-4 hover:bg-white/10 rounded-full transition-colors hidden sm:block z-10"
          >
            <FiChevronRight size={40} />
          </button>
          
          <div 
            className="relative w-full max-w-6xl h-[85vh] px-4 md:px-24 flex items-center justify-center cursor-pointer"
            onClick={handleNext}
            style={{ perspective: "1200px" }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={lightboxIndex}
                initial={{ rotateY: 90 * flipDirection, opacity: 0, scale: 0.8 }}
                animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                exit={{ rotateY: -90 * flipDirection, opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={1}
                onDragEnd={(e, { offset, velocity }) => {
                  e.stopPropagation();
                  const swipe = offset.x;
                  
                  if (swipe < -50) {
                    // Swiped left -> show next
                    handleNext();
                  } else if (swipe > 50) {
                    // Swiped right -> show prev
                    handlePrev();
                  }
                }}
                className="bg-white p-3 md:p-5 pb-12 md:pb-16 rounded-xl shadow-2xl flex flex-col items-center border border-white/20 cursor-grab active:cursor-grabbing"
                style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
                onClick={(e) => e.stopPropagation()} // Prevent triggering the wrapper's onClick
              >
                <img 
                  src={agenda.gallery.filter(Boolean)[lightboxIndex]} 
                  alt={`Preview ${lightboxIndex + 1}`} 
                  className="w-auto h-auto max-w-[100%] max-h-[70vh] object-contain shadow-inner rounded-sm pointer-events-none" 
                  draggable={false}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AgendaDetailClient({ agenda, participantCount = 0 }: { agenda: AgendaKegiatan, participantCount?: number }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background text-primary font-bold">Memuat...</div>}>
      <AgendaDetailClientContent agenda={agenda} participantCount={participantCount} />
    </Suspense>
  );
}
