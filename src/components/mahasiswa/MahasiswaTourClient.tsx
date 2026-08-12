"use client";

import { useTour } from "@/hooks/useTour";
import { FiHelpCircle } from "react-icons/fi";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function MahasiswaTourInner() {
  const searchParams = useSearchParams();
  // Jangan tampilkan tour auto jika user datang dari share link (?id=)
  const isFromShareLink = !!searchParams.get("id");

  const { startTour } = useTour({
    tourId: "mahasiswa_tour_v1",
    steps: [
      {
        element: "#tour-mahasiswa-header",
        popover: {
          title: "Direktori Mahasiswa",
          description: "Selamat datang di halaman Direktori Mahasiswa! Di sini kamu bisa mencari profil teman-teman STMIK Tazkia beserta portofolio karya mereka.",
          side: "bottom",
          align: "center"
        }
      },
      {
        element: "#tour-mahasiswa-stats",
        popover: {
          title: "Statistik Direktori",
          description: "Ringkasan total mahasiswa yang terdaftar, jumlah proyek yang telah diunggah, dan jumlah angkatan yang ada di sistem saat ini.",
          side: "bottom",
          align: "center"
        }
      },
      {
        element: "#tour-mahasiswa-search",
        popover: {
          title: "Pencarian Cerdas",
          description: "Ketik nama, NIM, keahlian (skill), atau judul proyek untuk menemukan mahasiswa dengan cepat.",
          side: "bottom",
          align: "center"
        }
      },
      {
        element: "#tour-mahasiswa-filters",
        popover: {
          title: "Filter Angkatan & Prodi",
          description: "Gunakan tombol-tombol ini untuk menyaring daftar mahasiswa berdasarkan tahun angkatan atau program studi tertentu.",
          side: "top",
          align: "center"
        }
      }
    ],
    autoStart: !isFromShareLink, // Tidak auto-start jika masuk via share link
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

export default function MahasiswaTourClient() {
  return (
    <Suspense fallback={null}>
      <MahasiswaTourInner />
    </Suspense>
  );
}
