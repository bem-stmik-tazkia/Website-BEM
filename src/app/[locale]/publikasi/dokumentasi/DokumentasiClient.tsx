"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiCalendar, FiImage } from "react-icons/fi";
import { AgendaKegiatan } from "@/types/agenda";
import { formatDateToIndo } from "@/utils/dateFormatter";

export default function DokumentasiClient({ data }: { data: AgendaKegiatan[] }) {
  // Filter for finished events that have at least one gallery photo
  const dokumentasiList = useMemo(() => {
    return data.filter(item => {
      if (!item.is_published) return false;
      
      const isFinished = item.date && (new Date(item.date).setHours(0,0,0,0) < new Date().setHours(0,0,0,0));
      // Manual dokumentasi can just be marked as finished by setting past date
      if (!isFinished) return false;

      // Must have gallery photos to be published as documentation
      const hasGallery = Array.isArray(item.gallery) && item.gallery.length > 0;
      if (!hasGallery) return false;

      return true;
    });
  }, [data]);

  return (
    <div className="relative flex flex-col min-h-screen bg-background pt-24 pb-20 font-sans overflow-x-hidden w-full">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <main className="px-container-padding-mobile md:px-container-padding-desktop max-w-7xl mx-auto w-full pt-8">
        
        {/* Header */}
        <header className="mb-10 md:mb-14 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary-container text-secondary font-semibold text-[10px] md:text-xs uppercase tracking-wider mb-3 md:mb-4">
            Galeri & Arsip
          </div>
          <h1 className="font-display-lg text-3xl md:text-5xl text-primary mb-4 font-black tracking-tight leading-tight">
            Dokumentasi Kegiatan
          </h1>
          <p className="font-body-lg text-on-surface-variant text-sm md:text-lg font-light leading-relaxed">
            Menangkap momen-momen berharga dan keseruan dari berbagai acara yang telah sukses diselenggarakan oleh BEM STMIK Tazkia.
          </p>
        </header>

        {/* Gallery Grid */}
        {dokumentasiList.length > 0 ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
            {dokumentasiList.map((item, index) => {
              // Use the first gallery image as the cover, or fallback to main image
              const coverImage = (item.gallery && item.gallery.length > 0) ? item.gallery[0] : item.image_url;
              const photoCount = item.gallery ? item.gallery.length : 0;

              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  key={item.id}
                  className="break-inside-avoid"
                >
                  <Link 
                    href={`/agenda/${item.id}?from=dokumentasi`}
                    className="group block bg-surface rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:ring-2 hover:ring-primary/40 transition-all duration-300 relative"
                  >
                    {/* Image */}
                    <div className="relative overflow-hidden bg-surface-variant">
                      <img 
                        src={coverImage || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80"} 
                        alt={item.title} 
                        className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700" 
                        loading="lazy"
                      />
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />
                      
                      {/* Floating Badge (Photo Count) */}
                      <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1.5 rounded-full flex items-center gap-1.5 border border-white/20">
                        <FiImage size={12} /> {photoCount} Foto
                      </div>

                      {/* Content Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-primary text-white text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                            {item.category || "Event"}
                          </span>
                        </div>
                        <h3 className="font-bold text-lg md:text-xl text-white mb-2 line-clamp-2 leading-tight">
                          {item.title}
                        </h3>
                        <p className="text-white/80 text-xs flex items-center gap-1.5 font-medium">
                          <FiCalendar size={12} /> {formatDateToIndo(item.date)}
                        </p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-surface border border-outline-variant/30 rounded-3xl shadow-sm">
            <span className="material-symbols-outlined text-6xl text-primary/20 mb-4 block">photo_library</span>
            <h3 className="text-xl font-bold text-primary mb-2">Belum Ada Dokumentasi</h3>
            <p className="text-on-surface-variant text-sm max-w-sm mx-auto">
              Saat ini belum ada dokumentasi kegiatan yang dipublikasikan.
            </p>
          </div>
        )}

      </main>
    </div>
  );
}
