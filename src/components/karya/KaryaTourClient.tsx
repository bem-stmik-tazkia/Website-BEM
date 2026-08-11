"use client";

import { useTour } from "@/hooks/useTour";
import { FiHelpCircle } from "react-icons/fi";
import { motion } from "framer-motion";

export default function KaryaTourClient() {
  const { startTour } = useTour({
    tourId: "karya_tour_v1",
    steps: [
      {
        element: "#tour-karya-header",
        popover: {
          title: "Galeri Karya Mahasiswa",
          description: "Halaman ini adalah etalase digital tempat berkumpulnya semua proyek, riset, dan inovasi terbaik dari mahasiswa STMIK Tazkia.",
          side: "bottom",
          align: "start"
        }
      },
      {
        element: "#tour-karya-cta",
        popover: {
          title: "Unggah Karyamu Sendiri!",
          description: "Punya proyek keren? Jangan disimpan sendiri! Klik tombol ini untuk mengunggah dan memamerkan karyamu ke seluruh kampus. (Membutuhkan login)",
          side: "top",
          align: "center"
        }
      },
      {
        element: "#tour-karya-categories",
        popover: {
          title: "Filter Kategori",
          description: "Gunakan tombol-tombol ini untuk memfilter karya berdasarkan bidang tertentu, seperti Aplikasi Web, Mobile, atau IoT.",
          side: "bottom",
          align: "start"
        }
      },
      {
        element: "#tour-karya-search",
        popover: {
          title: "Cari Proyek",
          description: "Atau gunakan kolom ini jika kamu ingin mencari judul proyek atau nama pembuat secara spesifik.",
          side: "bottom",
          align: "end"
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
