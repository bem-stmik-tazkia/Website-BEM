"use client";

import { useTour } from "@/hooks/useTour";
import { FiHelpCircle } from "react-icons/fi";
import { motion } from "framer-motion";

export default function AgendaTourClient() {
  const { startTour } = useTour({
    tourId: "agenda_tour_v1",
    steps: [
      {
        element: "#tour-agenda-header",
        popover: {
          title: "Agenda Kegiatan",
          description: "Selamat datang di pusat informasi acara BEM STMIK Tazkia! Temukan berbagai kegiatan seru dan bermanfaat di sini.",
          side: "bottom",
          align: "start"
        }
      },
      {
        element: "#tour-agenda-tabs",
        popover: {
          title: "Navigasi Menu",
          description: "Gunakan menu ini untuk berpindah antara daftar Agenda/Event reguler dan informasi Open Recruitment atau lowongan Volunteer.",
          side: "bottom",
          align: "start"
        }
      },
      {
        element: "#tour-agenda-search",
        popover: {
          title: "Pencarian Event",
          description: "Ketik nama atau kata kunci event di sini untuk menemukan kegiatan yang kamu cari dengan cepat.",
          side: "bottom",
          align: "center"
        }
      },
      {
        element: "#tour-agenda-filters",
        popover: {
          title: "Filter Kategori",
          description: "Klik kategori ini untuk menyaring jenis kegiatan, misalnya khusus Teknologi, Olahraga, atau Seni & Budaya.",
          side: "bottom",
          align: "start"
        }
      },
      {
        element: "#tour-agenda-calendar",
        popover: {
          title: "Kalender Interaktif",
          description: "Lihat jadwal kegiatan secara visual dalam sebulan. Kamu juga bisa mengklik tanggal yang ditandai untuk melihat detail acaranya langsung!",
          side: "left",
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
