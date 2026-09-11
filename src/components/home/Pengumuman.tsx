"use client";

import React from "react";
import Link from "next/link";

export default function Pengumuman() {
  return (
    <section className="py-section-gap px-container-padding-mobile md:px-container-padding-desktop bg-surface-container-lowest" id="agenda">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6 animate-on-scroll animate-fade-up">
          <div>
            <h2 className="font-headline-lg text-3xl md:text-4xl text-primary mb-2">Pengumuman Terbaru</h2>
            <p className="text-on-surface-variant">Informasi terkini kegiatan dan agenda BEM STMIK Tazkia</p>
          </div>
          <Link href="/agenda" className="hidden md:flex items-center gap-2 text-primary font-label-md hover:text-secondary transition-colors group cursor-pointer">
            Lihat Semua <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <Link href="/agenda/3" className="bg-surface rounded-card p-8 hover:shadow-xl transition-all duration-500 flex flex-col h-full group border border-outline-variant/30 hover:border-primary/50 hover:-translate-y-3 animate-on-scroll animate-fade-up delay-100 relative overflow-hidden block">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container text-primary font-caption text-xs mb-6 w-fit group-hover:scale-105 group-hover:bg-primary group-hover:text-white transition-all duration-300 relative z-10">
              <span className="material-symbols-outlined text-[14px]">calendar_month</span>
              24 Okt 2024
            </div>
            <h3 className="font-headline-md text-xl md:text-2xl text-on-background mb-4 group-hover:text-primary transition-colors duration-300 line-clamp-3 relative z-10">Pendaftaran Kepanitiaan Seminar Nasional Statistik 2024</h3>
            <p className="text-on-surface-variant mb-8 line-clamp-2 text-sm relative z-10">Informasi terkini kegiatan dan agenda BEM STMIK Tazkia</p>
            <div className="mt-auto relative z-10">
              <span className="w-full text-center bg-surface-container-high text-primary px-6 py-3 rounded-button font-label-md group-hover:bg-primary group-hover:text-white hover:shadow-lg hover:scale-[1.02] transition-all duration-300 block">Detail Informasi</span>
            </div>
          </Link>
          
          {/* Card 2 */}
          <Link href="/agenda" className="bg-surface rounded-card p-8 hover:shadow-xl transition-all duration-500 flex flex-col h-full group border border-outline-variant/30 hover:border-secondary/50 hover:-translate-y-3 animate-on-scroll animate-fade-up delay-200 relative overflow-hidden block">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container text-secondary font-caption text-xs mb-6 w-fit group-hover:scale-105 group-hover:bg-secondary group-hover:text-white transition-all duration-300 relative z-10">
              <span className="material-symbols-outlined text-[14px]">calendar_month</span>
              20 Okt 2024
            </div>
            <h3 className="font-headline-md text-xl md:text-2xl text-on-background mb-4 group-hover:text-secondary transition-colors duration-300 line-clamp-3 relative z-10">Hasil Audiensi Fasilitas Kampus Semester Ganjil</h3>
            <p className="text-on-surface-variant mb-8 line-clamp-2 text-sm relative z-10">Informasi terkini kegiatan dan agenda BEM STMIK Tazkia</p>
            <div className="mt-auto relative z-10">
              <span className="w-full text-center bg-surface-container-high text-secondary px-6 py-3 rounded-button font-label-md group-hover:bg-secondary group-hover:text-white hover:shadow-lg hover:scale-[1.02] transition-all duration-300 block">Baca Dokumen</span>
            </div>
          </Link>
          
          {/* Card 3 */}
          <Link href="/agenda" className="bg-surface rounded-card p-8 hover:shadow-xl transition-all duration-500 flex flex-col h-full group border border-outline-variant/30 hover:border-tertiary/50 hover:-translate-y-3 animate-on-scroll animate-fade-up delay-300 relative overflow-hidden block">
            <div className="absolute inset-0 bg-gradient-to-br from-tertiary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tertiary-container text-tertiary font-caption text-xs mb-6 w-fit group-hover:scale-105 group-hover:bg-tertiary group-hover:text-white transition-all duration-300 relative z-10">
              <span className="material-symbols-outlined text-[14px]">calendar_month</span>
              15 Okt 2024
            </div>
            <h3 className="font-headline-md text-xl md:text-2xl text-on-background mb-4 group-hover:text-tertiary transition-colors duration-300 line-clamp-3 relative z-10">Open Donasi Bencana Alam: STIS Peduli Sesama</h3>
            <p className="text-on-surface-variant mb-8 line-clamp-2 text-sm relative z-10">Informasi terkini kegiatan dan agenda BEM STMIK Tazkia</p>
            <div className="mt-auto relative z-10">
              <span className="w-full text-center bg-surface-container-high text-tertiary px-6 py-3 rounded-button font-label-md group-hover:bg-tertiary group-hover:text-white hover:shadow-lg hover:scale-[1.02] transition-all duration-300 block">Salurkan Bantuan</span>
            </div>
          </Link>
        </div>
        
        <Link href="/agenda" className="md:hidden w-full mt-8 flex justify-center items-center gap-2 text-primary bg-primary-container px-6 py-4 rounded-button font-label-md cursor-pointer">
          Lihat Semua Agenda <span className="material-symbols-outlined">arrow_forward</span>
        </Link>
      </div>
    </section>
  );
}
