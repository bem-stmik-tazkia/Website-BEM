"use client";

import { useTour } from "@/hooks/useTour";
import { FiHelpCircle } from "react-icons/fi";
import { motion } from "framer-motion";

export default function HomeTourClient() {
  const { startTour } = useTour({
    tourId: "beranda_tour_v1",
    steps: [
      {
        popover: {
          title: "Selamat Datang!",
          description: "Ini adalah portal resmi BEM STMIK Tazkia. Di sini kamu bisa melihat berbagai informasi terbaru seputar kampus dan karya inovasi mahasiswa.",
        }
      },
      {
        element: "#tour-karya-projek",
        popover: {
          title: "Karya Inovasi",
          description: "Di bagian ini, kamu bisa melihat pameran karya-karya terbaik dari mahasiswa STMIK Tazkia. Kamu juga bisa upload karyamu sendiri lho!",
          side: "top",
          align: "center"
        }
      },
      {
        element: "#tour-berita-sorotan",
        popover: {
          title: "Berita & Pengumuman",
          description: "Jangan sampai ketinggalan informasi! Semua berita terbaru, prestasi, dan pengumuman penting ada di sini.",
          side: "top",
          align: "center"
        }
      },
      {
        element: "#tour-event-live",
        popover: {
          title: "Event Berjalan (LIVE)",
          description: "Di sini kamu bisa melihat acara yang sedang berlangsung hari ini secara real-time. Jangan sampai ketinggalan!",
          side: "top",
          align: "center"
        }
      },
      {
        element: "#upcoming",
        popover: {
          title: "Upcoming Events",
          description: "Cek jadwal kegiatan BEM terdekat di masa mendatang agar kamu bisa mempersiapkan diri untuk ikut serta.",
          side: "top",
          align: "center"
        }
      },
      {
        element: "#volunteer",
        popover: {
          title: "Pendaftaran Volunteer",
          description: "BEM sering membuka open recruitment untuk kepanitiaan. Ini kesempatanmu untuk bergabung menjadi relawan!",
          side: "top",
          align: "center"
        }
      },
      {
        element: "#past-events",
        popover: {
          title: "Arsip Kegiatan",
          description: "Lihat galeri dan dokumentasi dari acara-acara seru yang sudah berhasil dilaksanakan sebelumnya.",
          side: "top",
          align: "center"
        }
      },
      {
        element: "#tour-saran-aduan",
        popover: {
          title: "Suara Mahasiswa",
          description: "Punya saran, keluhan, atau ide brilian? Sampaikan langsung secara anonim melalui kotak aspirasi ini.",
          side: "top",
          align: "center"
        }
      },
      {
        element: "#tour-login-btn",
        popover: {
          title: "Masuk ke Dashboard",
          description: "Login dengan email kampus untuk mulai upload karya, daftar event, dan melihat riwayat aktivitasmu. Yuk mulai perjalananmu sekarang!",
          side: "bottom",
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
