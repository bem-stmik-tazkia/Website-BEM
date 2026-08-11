"use client";

import { useTour } from "@/hooks/useTour";
import { FiHelpCircle } from "react-icons/fi";
import { motion } from "framer-motion";

export default function KabinetTourClient() {
  const { startTour } = useTour({
    tourId: "kabinet_tour_v1",
    steps: [
      {
        element: "#tour-kabinet-header",
        popover: {
          title: "Profil BEM",
          description: "Selamat datang di halaman Profil BEM! Kenali lebih dekat nama kabinet dan para penggerak BEM STMIK Tazkia periode ini.",
          side: "bottom",
          align: "center"
        }
      },
      {
        element: "#tour-kabinet-visi",
        popover: {
          title: "Arah Gerak Kami",
          description: "Di sini kamu bisa membaca Visi dan Misi yang menjadi fondasi perjuangan kabinet kami selama satu periode kepengurusan.",
          side: "bottom",
          align: "center"
        }
      },
      {
        element: "#tour-kabinet-pengurus",
        popover: {
          title: "Pengurus Inti",
          description: "Kenali wajah-wajah Pengurus Inti (Presiden, Wakil, Sekretaris, dan Bendahara). Kamu juga bisa langsung menghubungi mereka lewat tombol sosial media yang tersedia lho!",
          side: "bottom",
          align: "start"
        }
      },
      {
        element: "#tour-kabinet-proker",
        popover: {
          title: "Program Kerja Utama",
          description: "Ini adalah daftar program kerja unggulan skala besar yang diadakan langsung di bawah arahan Pengurus Inti BEM.",
          side: "top",
          align: "start"
        }
      },
      {
        element: "#tour-kabinet-departemen",
        popover: {
          title: "Departemen-Departemen",
          description: "Jelajahi setiap departemen yang ada. Kamu bisa mengklik tab 'Anggota' atau 'Program Kerja' pada masing-masing kartu untuk melihat detail selengkapnya.",
          side: "top",
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
