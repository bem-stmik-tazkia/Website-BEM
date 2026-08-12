"use client";

import React, { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { KabinetProfile, KabinetPengurusInti, KabinetProkerUtama } from "@/types/kabinet";
import LottieIcon from "@/components/ui/LottieIcon";
import DepartemenCard from "@/components/kabinet/DepartemenCard";
import ProkerIcon from "@/components/kabinet/ProkerIcon";
import KabinetTourClient from "@/components/kabinet/KabinetTourClient";
import { translateContentBatch } from "@/utils/translate";

// ─────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────
function WaIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

function IgIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

const TAG_COLORS: Record<string, string> = {
  Rutin: "bg-emerald-100 text-emerald-700",
  Bulanan: "bg-blue-100 text-blue-700",
  Triwulan: "bg-violet-100 text-violet-700",
  Semester: "bg-amber-100 text-amber-700",
  Semesteran: "bg-amber-100 text-amber-700",
  Tahunan: "bg-rose-100 text-rose-700",
};

function ProkerTag({ tag }: { tag: string }) {
  const tTags = useTranslations("Tags");
  const getTag = (t: string) => {
    if (!tTags) return t;
    const key = t.replace(/[\s\(\)-]/g, '');
    try {
      const tr = tTags(key);
      if (tr && !tr.includes("Tags.")) return tr;
    } catch {
      // ignore
    }
    return t;
  };

  return (
    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${TAG_COLORS[tag] ?? "bg-surface-variant/30 text-on-surface-variant"}`}>
      {getTag(tag)}
    </span>
  );
}

// ─────────────────────────────────────────────
// PENGURUS CARD
// ─────────────────────────────────────────────
function PengurusCard({ person }: { person: KabinetPengurusInti }) {
  const tRoles = useTranslations("Roles");
  // Try to safely get translated role
  const getRole = (role: string) => {
    if (!role) return role;
    const key = role.replace(/[\s\(\)-]/g, '');
    if (!key) return role;
    try {
      if (tRoles(key)) {
        const tr = tRoles(key);
        if (tr && !tr.includes("Roles.")) return tr;
      }
    } catch {
      // ignore
    }
    return role;
  };

  return (
    <div className="group bg-surface rounded-2xl border border-outline-variant/20 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex items-center gap-4 p-4">
      {/* Avatar */}
      <div
        className="w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center text-lg font-black select-none overflow-hidden"
        style={{ backgroundColor: person.bg, color: person.color }}
      >
        {person.foto ? (
          <img src={person.foto} alt={person.name} className="w-full h-full object-cover" />
        ) : (
          person.initials
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-extrabold uppercase tracking-widest mb-0.5" style={{ color: person.color }}>
          {getRole(person.role)}
        </p>
        <h3 className="font-bold text-on-background text-base leading-tight truncate">{person.name}</h3>
      </div>

      {/* Social buttons */}
      <div className="flex gap-2 shrink-0">
        {person.wa && (() => {
          const sanitizedWa = person.wa.replace(/\D/g, '');
          const waNumber = sanitizedWa.startsWith('0') ? '62' + sanitizedWa.slice(1) : sanitizedWa;
          return (
            <a
              href={person.wa.startsWith('http') ? person.wa : `https://wa.me/${waNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-xl border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:bg-[#25D366] hover:text-white hover:border-[#25D366] transition-all duration-300"
              aria-label={`WhatsApp ${person.name}`}
            >
              <WaIcon />
            </a>
          );
        })()}
        {person.ig && (
          <a
            href={person.ig.startsWith('http') ? person.ig : `https://instagram.com/${person.ig.replace("@", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-xl border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#e6683c] hover:to-[#bc1888] hover:text-white hover:border-transparent transition-all duration-200"
            aria-label={`Instagram ${person.name}`}
          >
            <IgIcon />
          </a>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────
export default function KabinetContentClient({ profile: rawProfile }: { profile: KabinetProfile }) {
  const t = useTranslations("KabinetPage");
  const locale = useLocale();
  const [profile, setProfile] = useState<KabinetProfile>(rawProfile);

  useEffect(() => {
    if (locale === "id") {
      setProfile(rawProfile);
      return;
    }

    const fieldsToTranslate: Record<string, string> = {
      nama_kabinet: rawProfile.nama_kabinet,
      visi: rawProfile.visi,
    };

    rawProfile.misi.forEach((m, idx) => {
      fieldsToTranslate[`misi_${idx}`] = m;
    });

    rawProfile.proker_utama.forEach((p, idx) => {
      fieldsToTranslate[`proker_nama_${idx}`] = p.nama;
      fieldsToTranslate[`proker_deskripsi_${idx}`] = p.deskripsi;
    });

    rawProfile.departemen.forEach((d, dIdx) => {
      fieldsToTranslate[`dept_nama_${dIdx}`] = d.nama;
      fieldsToTranslate[`dept_deskripsi_${dIdx}`] = d.deskripsi;
      d.proker.forEach((p, pIdx) => {
        fieldsToTranslate[`dept_${dIdx}_proker_nama_${pIdx}`] = p.nama;
        fieldsToTranslate[`dept_${dIdx}_proker_deskripsi_${pIdx}`] = p.deskripsi;
      });
    });

    translateContentBatch(rawProfile.id, "kabinet_profiles", fieldsToTranslate, locale)
      .then((translatedFields) => {
        const newMisi = rawProfile.misi.map((_, idx) => translatedFields[`misi_${idx}`] || rawProfile.misi[idx]);
        const newProkerUtama = rawProfile.proker_utama.map((p, idx) => ({
          ...p,
          nama: translatedFields[`proker_nama_${idx}`] || p.nama,
          deskripsi: translatedFields[`proker_deskripsi_${idx}`] || p.deskripsi,
        }));
        const newDepartemen = rawProfile.departemen.map((d, dIdx) => ({
          ...d,
          nama: translatedFields[`dept_nama_${dIdx}`] || d.nama,
          deskripsi: translatedFields[`dept_deskripsi_${dIdx}`] || d.deskripsi,
          proker: d.proker.map((p, pIdx) => ({
            ...p,
            nama: translatedFields[`dept_${dIdx}_proker_nama_${pIdx}`] || p.nama,
            deskripsi: translatedFields[`dept_${dIdx}_proker_deskripsi_${pIdx}`] || p.deskripsi,
          }))
        }));

        setProfile({
          ...rawProfile,
          nama_kabinet: translatedFields.nama_kabinet || rawProfile.nama_kabinet,
          visi: translatedFields.visi || rawProfile.visi,
          misi: newMisi,
          proker_utama: newProkerUtama,
          departemen: newDepartemen
        });
      })
      .catch(() => setProfile(rawProfile));
  }, [rawProfile, locale]);

  return (
    <div className="pt-24 pb-24 min-h-screen bg-background overflow-hidden">
      {/* ── HERO ── */}
      <section id="tour-kabinet-header" className="px-5 md:px-10 max-w-5xl mx-auto pt-12 pb-14 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[500px] h-[280px] bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="absolute top-10 right-0 md:right-1/4 w-32 md:w-40 h-32 md:h-40 bg-secondary/8 rounded-full blur-3xl -z-10" />

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-container text-primary font-bold text-sm mb-6 animate-init-fade-up">
          <UsersIcon />
          {t("cabinetBadge")} {profile.periode}
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold text-on-background mb-4 animate-init-fade-up anim-delay-100 leading-tight">
          {t("heroTitle")} <span className="text-primary">{t("heroTitleCabinet")}</span>{" "}
          <span className="text-secondary">{profile.nama_kabinet}</span>
        </h1>
        <p className="text-on-surface-variant max-w-xl mx-auto text-base leading-relaxed animate-init-fade-up anim-delay-200">
          {t("heroSubtitle")}
        </p>
      </section>

      {/* ── VISI MISI & LOGO ── */}
      <section className="px-5 md:px-10 max-w-5xl mx-auto mb-20">
        <div id="tour-kabinet-visi" className="flex flex-col items-center text-center mb-16 animate-init-fade-up anim-delay-300">
          <img src="/images/logo2.webp" alt="Logo BEM" className="w-32 h-32 object-contain mb-8 drop-shadow-md hover:scale-105 transition-transform duration-300" />
          <h2 className="text-3xl md:text-4xl font-extrabold text-on-background mb-4">{t("directionTitle")}</h2>
          <p className="text-on-surface-variant max-w-2xl mx-auto">
            {t("directionSubtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-init-fade-up anim-delay-400">
          <div className="bg-surface rounded-3xl p-8 border border-outline-variant/30 shadow-sm hover:border-primary/50 hover:shadow-xl transition-all duration-300 group">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <LottieIcon src="/animations/lamp.lottie" className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-bold text-on-background mb-4 group-hover:text-primary transition-colors">{t("visionLabel")}</h3>
            <p className="text-on-surface-variant leading-relaxed text-sm">
              {profile.visi}
            </p>
          </div>

          <div className="bg-surface rounded-3xl p-8 border border-outline-variant/30 shadow-sm hover:border-secondary/50 hover:shadow-xl transition-all duration-300 group">
            <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <LottieIcon src="/animations/Target.lottie" className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-bold text-on-background mb-4 group-hover:text-secondary transition-colors">{t("missionLabel")}</h3>
            <ul className="space-y-3 text-sm text-on-surface-variant">
              {profile.misi.map((m, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <svg className="text-secondary shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div className="px-5 md:px-10 max-w-5xl mx-auto space-y-14">
        {/* ── PENGURUS INTI ── */}
        <section id="tour-kabinet-pengurus">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-primary rounded-full shrink-0" />
            <h2 className="text-lg font-extrabold text-on-background whitespace-nowrap">{t("coreBoardTitle")}</h2>
            <div className="flex-1 h-px bg-outline-variant/30" />
          </div>

          <div className="flex flex-row overflow-x-auto gap-4 pb-3 scrollbar-hide sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 flex-nowrap sm:flex-wrap">
            {profile.pengurus_inti.map((p, i) => (
              <div key={i} className="w-[80vw] sm:w-auto shrink-0 sm:shrink">
                <PengurusCard person={p} />
              </div>
            ))}
          </div>
        </section>

        {/* ── PROKER UTAMA BEM ── */}
        <section id="tour-kabinet-proker">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-secondary rounded-full shrink-0" />
            <h2 className="text-lg font-extrabold text-on-background whitespace-nowrap">{t("mainProgramTitle")}</h2>
            <div className="flex-1 h-px bg-outline-variant/30" />
          </div>

          <div className="flex flex-row overflow-x-auto gap-4 pb-3 scrollbar-hide sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 flex-nowrap sm:flex-wrap">
            {profile.proker_utama.map((p, i) => (
              <div
                key={i}
                className="group w-[80vw] sm:w-auto shrink-0 sm:shrink bg-surface rounded-2xl border border-outline-variant/20 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-5 flex gap-4 items-start"
              >
                <div className="shrink-0 pt-0.5 flex items-center justify-center">
                  <ProkerIcon icon={p.icon} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-bold text-on-background text-sm group-hover:text-primary transition-colors duration-200">
                      {p.nama}
                    </h3>
                    <ProkerTag tag={p.tag} />
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{p.deskripsi}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── DIVIDER ── */}
        <div className="h-px bg-gradient-to-r from-transparent via-outline-variant/40 to-transparent" />

        {/* ── DEPARTEMEN ── */}
        <section>
          <div id="tour-kabinet-departemen">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-6 bg-tertiary rounded-full shrink-0" />
              <h2 className="text-lg font-extrabold text-on-background whitespace-nowrap">{t("departmentTitle")}</h2>
              <div className="flex-1 h-px bg-outline-variant/30" />
            </div>
            <p className="text-sm text-on-surface-variant mb-8 pl-4">
              {t("departmentHint")} <strong>{t("departmentHintMember")}</strong> {t("departmentHintOr")} <strong>{t("departmentHintProker")}</strong> {t("departmentHintSuffix")}
            </p>
          </div>

          <div className="flex flex-col gap-5">
            {profile.departemen.map((dept) => (
              <DepartemenCard key={dept.id} dept={dept} />
            ))}
          </div>
        </section>
      </div>

      <KabinetTourClient />
    </div>
  );
}
