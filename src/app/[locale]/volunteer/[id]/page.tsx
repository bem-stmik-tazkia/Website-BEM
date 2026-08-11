"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiBriefcase,
  FiClock,
  FiMapPin,
  FiInfo,
  FiCheckCircle,
  FiAward,
  FiUsers,
  FiStar,
  FiAlertCircle
} from "react-icons/fi";
import { useTranslations } from "next-intl";

// ─── MOCK DATA ─────────────────────────────────────────────────────────
const volunteersData: Record<number, any> = {
  1: {
    id: 1,
    title: "Sponsorship Liaison",
    department: "Departemen Kominfo",
    status: "Open Recruitment",
    shortDesc: "Berperan penting dalam menjalin kemitraan strategis dan mengelola pendanaan untuk berbagai inisiatif inovatif BEM STMIK Tazkia.",
    type: "Volunteer / Magang",
    period: "Okt - Des 2024",
    location: "Hybrid (Kampus & Remote)",
    imgUrl: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    about: "Sebagai Sponsorship Liaison di bawah naungan Departemen Komunikasi dan Informasi (Kominfo), Anda akan menjadi jembatan utama antara BEM STMIK Tazkia dengan pihak eksternal, baik korporasi maupun instansi.\n\nPeran ini membutuhkan kemampuan komunikasi persuasif dan pemahaman yang baik tentang nilai yang ditawarkan oleh program-program kemahasiswaan kami kepada calon mitra atau sponsor.",
    responsibilities: [
      "Menyusun daftar prospek (database) calon sponsor yang relevan dengan kegiatan BEM.",
      "Menginisiasi komunikasi dan melakukan presentasi proposal (pitching) kepada calon mitra.",
      "Melakukan negosiasi kerjasama dan memastikan kesepakatan tertulis (MoU) disusun dengan baik.",
      "Memelihara hubungan baik (relationship management) dengan sponsor yang sudah ada."
    ],
    qualifications: [
      "Mahasiswa aktif STMIK Tazkia minimal Semester 3.",
      "Memiliki kemampuan komunikasi verbal dan tulisan yang sangat baik.",
      "Percaya diri, proaktif, dan tidak mudah menyerah (resilien).",
      "Mampu bekerja secara mandiri maupun dalam tim."
    ],
    benefits: [
      {
        icon: <FiAward />,
        title: "E-Certificate Resmi",
        desc: "Sertifikat penghargaan dari BEM STMIK Tazkia."
      },
      {
        icon: <FiUsers />,
        title: "Networking Luas",
        desc: "Kesempatan berjejaring dengan profesional dan tokoh industri."
      },
      {
        icon: <FiStar />,
        title: "Pengalaman Praktis",
        desc: "Portofolio nyata dalam manajemen kemitraan B2B."
      }
    ],
    deadline: "15 Oktober 2024"
  },
  2: {
    id: 2,
    title: "Content Creator",
    department: "Departemen Medibrand",
    status: "Open Recruitment",
    shortDesc: "Merancang dan mengeksekusi ide konten kreatif untuk meningkatkan engagement sosial media BEM STMIK Tazkia.",
    type: "Volunteer",
    period: "Nov 2024 - Jan 2025",
    location: "Remote",
    imgUrl: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    about: "Sebagai Content Creator di Departemen Media dan Branding (Medibrand), Anda bertugas menciptakan konten-konten visual maupun tulisan yang menarik untuk audiens mahasiswa dan umum.\n\nPosisi ini sangat cocok bagi Anda yang memiliki kreativitas tinggi, up-to-date dengan tren sosial media, dan ingin membangun portofolio di bidang digital marketing dan pembuatan konten.",
    responsibilities: [
      "Brainstorming ide konten mingguan untuk Instagram dan TikTok BEM.",
      "Membuat desain grafis sederhana atau video pendek sesuai dengan panduan identitas visual BEM.",
      "Menulis caption yang menarik dan persuasif.",
      "Menganalisis performa konten dan memberikan saran perbaikan."
    ],
    qualifications: [
      "Mahasiswa aktif STMIK Tazkia dari jurusan apa saja.",
      "Familiar dengan tools desain (Canva, Figma, atau Adobe Creative Cloud) / editing video (CapCut, Premiere).",
      "Memiliki sense of art dan pemahaman tren media sosial yang baik.",
      "Mampu bekerja dengan deadline yang dinamis."
    ],
    benefits: [
      {
        icon: <FiAward />,
        title: "E-Certificate Resmi",
        desc: "Sertifikat penghargaan atas kontribusi Anda."
      },
      {
        icon: <FiStar />,
        title: "Portofolio Konten",
        desc: "Karya Anda akan dipublikasikan di akun resmi dengan ribuan followers."
      }
    ],
    deadline: "20 Oktober 2024",
    infoText: "Silakan lampirkan tautan ke portofolio desain/video Anda (misal: Google Drive atau Behance) saat mendaftar."
  }
};

function VolunteerDetailPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations("VolunteerDetail");
  
  const id = Number(params.id);
  const volunteer = volunteersData[id] || volunteersData[1]; // Fallback to id 1 if not found for demo
  const from = searchParams.get("from");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    whatsapp: "",
    department: "",
    motivation: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(t("success"));
    // Reset form
    setFormData({
      name: "",
      email: "",
      whatsapp: "",
      department: "",
      motivation: "",
    });
  };

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (from === "home") {
      router.push("/");
    } else if (from === "agenda-event") {
      router.push("/agenda?tab=event");
    } else if (from === "agenda-volunteer") {
      router.push("/agenda?tab=volunteer");
    } else {
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push("/agenda?tab=volunteer");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] pt-28 pb-32 md:pb-20">

      {/* ── HEADER SECTION ──────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-5 md:px-10 mb-10">
        <Link
          href="/agenda"
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors mb-6 font-medium text-sm"
        >
          <FiArrowLeft /> {t("backToProgram")}
        </Link>

        <div className="bg-surface rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start border border-outline-variant/20 shadow-sm">
          {/* Image */}
          <div className="w-full md:w-1/3 h-64 md:h-auto md:aspect-square rounded-2xl overflow-hidden shrink-0">
            <img
              src={volunteer.imgUrl}
              alt={volunteer.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Header Info */}
          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-[var(--color-primary)] text-white text-xs font-bold px-3 py-1.5 rounded-full">
                {volunteer.department}
              </span>
              <span className="bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] text-xs font-bold px-3 py-1.5 rounded-full border border-[var(--color-secondary)]/20">
                <FiCheckCircle className="inline mr-1" /> {volunteer.status}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-on-background mb-4">
              {volunteer.title}
            </h1>

            <p className="text-on-surface-variant text-base md:text-lg mb-6 leading-relaxed max-w-3xl">
              {volunteer.shortDesc}
            </p>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium text-on-surface-variant">
              <div className="flex items-center gap-2">
                <FiBriefcase className="text-primary" size={16} />
                <span>{volunteer.type}</span>
              </div>
              <div className="flex items-center gap-2">
                <FiClock className="text-primary" size={16} />
                <span>Periode: {volunteer.period}</span>
              </div>
              <div className="flex items-center gap-2">
                <FiMapPin className="text-primary" size={16} />
                <span>{volunteer.location}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTENT SECTION ─────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-5 md:px-10 mb-16 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-8">

          {/* Tentang Posisi */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="bg-surface rounded-3xl p-6 md:p-8 border border-outline-variant/20 shadow-sm"
          >
            <h2 className="text-xl font-bold text-on-background mb-4 flex items-center gap-2">
              <FiInfo className="text-primary" /> {t("aboutPosition")}
            </h2>
            <div className="text-on-surface-variant leading-relaxed space-y-4 text-sm md:text-base">
              {volunteer.about.split('\n\n').map((paragraph: string, idx: number) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </motion.div>

          {/* Tanggung Jawab */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-surface rounded-3xl p-6 md:p-8 border border-outline-variant/20 shadow-sm"
          >
            <h2 className="text-xl font-bold text-on-background mb-4 flex items-center gap-2">
              <FiCheckCircle className="text-secondary" /> {t("responsibilities")}
            </h2>
            <ul className="space-y-3">
              {volunteer.responsibilities.map((resp: string, idx: number) => (
                <li key={idx} className="flex items-start gap-3 text-on-surface-variant text-sm md:text-base">
                  <span className="text-secondary mt-1 shrink-0">›</span>
                  <span>{resp}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Kualifikasi */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-surface rounded-3xl p-6 md:p-8 border border-outline-variant/20 shadow-sm"
          >
            <h2 className="text-xl font-bold text-on-background mb-4 flex items-center gap-2">
              <FiBriefcase className="text-tertiary" /> {t("qualifications")}
            </h2>
            <ul className="space-y-3">
              {volunteer.qualifications.map((qual: string, idx: number) => (
                <li key={idx} className="flex items-start gap-3 text-on-surface-variant text-sm md:text-base">
                  <span className="text-tertiary mt-1 shrink-0">›</span>
                  <span>{qual}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="lg:col-span-1 space-y-6">

          {/* Benefit */}
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
            className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 border border-outline-variant/20 shadow-sm"
          >
            <h3 className="text-lg font-bold text-on-background mb-6">{t("benefits")}</h3>
            <div className="space-y-6">
              {volunteer.benefits.map((benefit: any, idx: number) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    {benefit.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-on-background mb-1">{benefit.title}</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Registration Info Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-[var(--color-primary)] rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-surface/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 relative z-10">
              <FiInfo /> {t("regInfo")}
            </h3>

            <p className="text-sm text-white/80 leading-relaxed mb-6 relative z-10">
              {volunteer.infoText}
            </p>

            <div className="bg-surface/10 border border-white/20 rounded-2xl p-4 relative z-10">
              <p className="text-xs text-white/70 mb-1">{t("deadline")}</p>
              <p className="text-lg font-extrabold">{volunteer.deadline}</p>
            </div>

            <p className="text-[10px] text-white/60 mt-4 leading-relaxed relative z-10">
              {t("formNote")}
            </p>
          </motion.div>

        </div>
      </section>

      {/* ── REGISTRATION FORM ───────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-5 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-surface rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-10 border border-outline-variant/20 shadow-xl"
        >
          <div className="text-center mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-on-background mb-1.5">{t("formTitle")}</h2>
            <p className="text-xs md:text-sm text-on-surface-variant">{t("formDesc", { title: volunteer.title })}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Nama Lengkap */}
              <div className="space-y-1.5 md:space-y-2">
                <label htmlFor="name" className="text-xs md:text-sm font-bold text-on-background">{t("fullName")}</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Contoh: Ahmad Fauzi"
                  required
                  className="w-full px-3.5 py-2.5 md:px-4 md:py-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5 md:space-y-2">
                <label htmlFor="email" className="text-xs md:text-sm font-bold text-on-background">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="nama@student.tazkia.ac.id"
                  required
                  className="w-full px-3.5 py-2.5 md:px-4 md:py-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                />
              </div>

              {/* No WhatsApp */}
              <div className="space-y-1.5 md:space-y-2">
                <label htmlFor="whatsapp" className="text-xs md:text-sm font-bold text-on-background">{t("whatsapp")}</label>
                <input
                  type="tel"
                  id="whatsapp"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleInputChange}
                  placeholder="0812..."
                  required
                  className="w-full px-3.5 py-2.5 md:px-4 md:py-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                />
              </div>
            </div>

            {/* Departemen / Prodi */}
            <div className="space-y-1.5 md:space-y-2">
              <label htmlFor="department" className="text-xs md:text-sm font-bold text-on-background">{t("department")}</label>
              <input
                type="text"
                id="department"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                placeholder="Contoh: Akuntansi Syariah"
                required
                className="w-full px-3.5 py-2.5 md:px-4 md:py-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
              />
            </div>

            {/* Motivasi */}
            <div className="space-y-1.5 md:space-y-2">
              <label htmlFor="motivation" className="text-xs md:text-sm font-bold text-on-background">{t("motivation")}</label>
              <textarea
                id="motivation"
                name="motivation"
                rows={4}
                value={formData.motivation}
                onChange={handleInputChange}
                placeholder="Ceritakan motivasi dan pengalaman relevan Anda..."
                required
                className="w-full px-3.5 py-2.5 md:px-4 md:py-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm resize-none"
              ></textarea>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-[var(--color-primary)] text-white font-bold py-3 md:py-4 rounded-xl hover:bg-[var(--color-primary)]/90 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex justify-center items-center gap-2 mt-4 text-sm md:text-base"
            >
              {t("submit")}
            </button>
          </form>
        </motion.div>
      </section>

    </div>
  );
}

export default function VolunteerDetailPage() {
  const t = useTranslations("VolunteerDetail");
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background text-primary font-bold">{t("loading")}</div>}>
      <VolunteerDetailPageContent />
    </Suspense>
  );
}
