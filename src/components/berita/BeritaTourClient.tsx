"use client";

import { useTour } from "@/hooks/useTour";
import { FiHelpCircle } from "react-icons/fi";
import { motion } from "framer-motion";

export default function BeritaTourClient() {
  const { startTour } = useTour({
    tourId: "berita_tour_v1",
    steps: [
      {
        element: "#tour-berita-header",
        popover: {
          title: "Publikasi Berita",
          description: "Halaman ini adalah pusat informasi resmi BEM. Kamu bisa membaca berbagai artikel, rilis pers, dan kabar terbaru dari kampus di sini.",
          side: "bottom",
          align: "start"
        }
      },
      {
        element: "#tour-berita-search",
        popover: {
          title: "Cari & Filter Berita",
          description: "Gunakan kolom pencarian atau klik kategori yang tersedia untuk menemukan artikel yang paling relevan dengan minatmu.",
          side: "bottom",
          align: "center"
        }
      },
      {
        element: "#tour-berita-featured",
        popover: {
          title: "Berita Sorotan",
          description: "Ini adalah artikel atau pengumuman paling penting saat ini yang menjadi sorotan utama dari BEM.",
          side: "bottom",
          align: "center"
        }
      },
      {
        element: "#tour-berita-grid",
        popover: {
          title: "Kumpulan Berita",
          description: "Di sini kamu bisa menjelajahi semua publikasi terbaru. Klik pada kartu berita mana saja untuk membaca artikel selengkapnya.",
          side: "top",
          align: "center"
        }
      },
      {
        element: "#tour-berita-popular",
        popover: {
          title: "Berita Terpopuler",
          description: "Daftar artikel yang paling banyak dibaca dan disukai oleh mahasiswa lainnya akan muncul di kolom ini.",
          side: "left",
          align: "start"
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
