"use client";

import { useTour } from "@/hooks/useTour";
import { FiHelpCircle } from "react-icons/fi";
import { motion } from "framer-motion";

export default function DokumentasiTourClient() {
  const { startTour } = useTour({
    tourId: "dokumentasi_tour_v1",
    steps: [
      {
        element: "#tour-dokumentasi-header",
        popover: {
          title: "Galeri & Dokumentasi",
          description: "Selamat datang di ruang memori! Semua foto dan dokumentasi kegiatan dari BEM STMIK Tazkia tersimpan rapi di halaman ini.",
          side: "bottom",
          align: "center"
        }
      },
      {
        element: "#tour-dokumentasi-search",
        popover: {
          title: "Filter & Pencarian",
          description: "Gunakan tombol kategori untuk menyaring jenis kegiatan, atau ketik nama event spesifik di kolom pencarian ini.",
          side: "bottom",
          align: "center"
        }
      },
      {
        element: "#tour-dokumentasi-grid",
        popover: {
          title: "Kumpulan Album",
          description: "Klik pada salah satu album (kartu) ini untuk melihat koleksi foto lengkap dari event tersebut. Jumlah foto tertera di pojok kanan atas kartu.",
          side: "top",
          align: "center"
        }
      }
    ],
    autoStart: true,
  });

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.5, x: 20 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ delay: 1, type: "spring", stiffness: 200 }}
      onClick={startTour}
      className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50 p-3 sm:p-4 rounded-full bg-surface shadow-xl border-2 border-[var(--color-secondary)] text-[var(--color-secondary)] hover:bg-[var(--color-secondary)] hover:border-transparent hover:text-white transition-all hover:scale-110 flex items-center justify-center group"
      aria-label="Mulai Tur Panduan"
    >
      <FiHelpCircle size={24} />
      <span className="absolute right-full mr-3 bg-surface text-on-surface-variant text-xs font-bold py-1.5 px-3 rounded-lg border border-outline-variant/30 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        Mulai Tur Panduan
      </span>
    </motion.button>
  );
}
