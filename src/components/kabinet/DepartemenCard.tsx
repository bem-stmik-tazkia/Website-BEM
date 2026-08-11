"use client";

import React, { useState } from "react";
import { KabinetDepartemen } from "@/types/kabinet";
import LottieIcon from "@/components/ui/LottieIcon";
import { useTranslations } from "next-intl";

// Icons
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

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

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

const TAG_COLORS: Record<string, string> = {
  Rutin: "bg-emerald-100 text-emerald-700",
  Bulanan: "bg-blue-100 text-blue-700",
  Triwulan: "bg-violet-100 text-violet-700",
  Semester: "bg-amber-100 text-amber-700",
  Semesteran: "bg-amber-100 text-amber-700",
  Tahunan: "bg-rose-100 text-rose-700",
};

function ProkerTag({ tag, tTags }: { tag: string, tTags?: any }) {
  const getTag = (t: string) => {
    if (!tTags || !t) return t;
    const key = t.replace(/[\s\(\)-]/g, '');
    if (!key) return t;
    try {
      if (tTags.has(key)) {
        const tr = tTags(key);
        if (tr && !tr.includes("Tags.")) return tr;
      }
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

function AnggotaCard({
  member,
  warna,
  warnaBg,
  tRoles,
}: {
  member: KabinetDepartemen["anggota"][0];
  warna: string;
  warnaBg: string;
  tRoles?: any;
}) {
  const getRole = (role: string) => {
    if (!tRoles || !role) return role;
    const key = role.replace(/[\s\(\)-]/g, '');
    if (!key) return role;
    try {
      if (tRoles.has(key)) {
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
      <div
        className="w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center text-lg font-black select-none overflow-hidden"
        style={{ backgroundColor: warnaBg, color: warna }}
      >
        {member.foto ? (
          <img src={member.foto} alt={member.name} className="w-full h-full object-cover" />
        ) : (
          member.initials
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-extrabold uppercase tracking-widest mb-0.5" style={{ color: warna }}>
          {getRole(member.role)}
        </p>
        <h3 className="font-bold text-on-background text-base leading-tight truncate">{member.name}</h3>
      </div>
      <div className="flex gap-2 shrink-0">
        {member.wa && (() => {
          const sanitizedWa = member.wa.replace(/\D/g, '');
          const waNumber = sanitizedWa.startsWith('0') ? '62' + sanitizedWa.slice(1) : sanitizedWa;
          return (
            <a
              href={member.wa.startsWith('http') ? member.wa : `https://wa.me/${waNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-xl border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:bg-[#25D366] hover:text-white hover:border-[#25D366] transition-all duration-300"
              aria-label={`WhatsApp ${member.name}`}
            >
              <WaIcon />
            </a>
          );
        })()}
        {member.ig && (
          <a
            href={member.ig.startsWith('http') ? member.ig : `https://instagram.com/${member.ig.replace("@", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-xl border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#e6683c] hover:to-[#bc1888] hover:text-white hover:border-transparent transition-all duration-300"
            aria-label={`Instagram ${member.name}`}
          >
            <IgIcon />
          </a>
        )}
      </div>
    </div>
  );
}

import ProkerIcon from "@/components/kabinet/ProkerIcon";

function ProkerRow({ proker, tTags }: { proker: { nama: string; deskripsi: string; tag: string; icon?: string }, tTags?: any }) {
  return (
    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-container-low/60 border border-outline-variant/10 hover:border-outline-variant/30 hover:bg-surface transition-all duration-200">
      {proker.icon ? (
        <div className="shrink-0 pt-0.5">
          <ProkerIcon icon={proker.icon} />
        </div>
      ) : (
        <div className="w-5 h-5 shrink-0 rounded-full bg-primary/10 flex items-center justify-center mt-0.5 text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="font-bold text-sm text-on-background">{proker.nama}</span>
          <ProkerTag tag={proker.tag} tTags={tTags} />
        </div>
        <p className="text-xs text-on-surface-variant leading-relaxed">{proker.deskripsi}</p>
      </div>
    </div>
  );
}

// Check if icon is a Lottie URL, Image URL, or Emoji
function DeptIcon({ icon }: { icon: string }) {
  if (icon.endsWith('.json') || icon.endsWith('.lottie') || icon.includes('lottiefiles.com')) {
    return <LottieIcon src={icon} className="w-10 h-10" />;
  } else if (icon.startsWith('http') || icon.startsWith('/')) {
    return <img src={icon} alt="Icon" className="w-8 h-8 object-contain" />;
  }
  return <span className="text-2xl">{icon}</span>;
}

export default function DepartemenCard({ dept }: { dept: KabinetDepartemen }) {
  const t = useTranslations("KabinetPage");
  const tRoles = useTranslations("Roles");
  const tTags = useTranslations("Tags");
  const [tab, setTab] = useState<"anggota" | "proker">("anggota");
  const [currentPage, setCurrentPage] = useState(1);

  // Pagination for Anggota
  const ITEMS_PER_PAGE = 4;
  const totalPages = Math.ceil(dept.anggota.length / ITEMS_PER_PAGE) || 1;
  const paginatedAnggota = dept.anggota.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="bg-surface rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center gap-4 p-5" style={{ borderLeft: `4px solid ${dept.warna}` }}>
        <div
          className="w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: dept.warnaBg }}
        >
          <DeptIcon icon={dept.icon} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-extrabold text-lg text-on-background leading-tight">{dept.nama}</h3>
            <span
              className="text-[11px] font-black px-2.5 py-0.5 rounded-full tracking-wide"
              style={{ backgroundColor: dept.warnaBg, color: dept.warna }}
            >
              {dept.singkatan}
            </span>
          </div>
        </div>
      </div>

      {/* ── Tab switcher ── */}
      <div className="flex border-t border-outline-variant/20 bg-surface-container-lowest">
      {(["anggota", "proker"] as const).map((tabKey) => {
          const isActive = tab === tabKey;
          const count = tabKey === "anggota" ? dept.anggota.length : dept.proker.length;
          const label = tabKey === "anggota" ? t("tabMember") : t("tabProker");
          return (
            <button
              key={tabKey}
              id={`tab-${dept.id}-${tabKey}`}
              onClick={() => {
                setTab(tabKey);
                setCurrentPage(1);
              }}
              className={`flex-1 py-3 text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer border-b-2 ${isActive
                ? "text-on-background"
                : "text-on-surface-variant hover:text-on-background border-transparent"
                }`}
              style={isActive ? { borderBottomColor: dept.warna } : {}}
            >
              <span className="opacity-80">
                {tabKey === "anggota" ? <UsersIcon /> : <CheckIcon />}
              </span>
              {label}
              <span
                className="text-xs font-black w-5 h-5 rounded-full flex items-center justify-center"
                style={
                  isActive
                    ? { backgroundColor: dept.warnaBg, color: dept.warna }
                    : { backgroundColor: "#ededf4", color: "#44474f" }
                }
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Tab content ── */}
      <div className="p-5">
        {tab === "anggota" ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {paginatedAnggota.map((member, i) => (
                <AnggotaCard key={i} member={member} warna={dept.warna} warnaBg={dept.warnaBg} tRoles={tRoles} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs text-on-surface-variant hover:text-primary disabled:opacity-50 disabled:hover:text-on-surface-variant transition-colors"
                >
                  {t("prev")}
                </button>
                {getPageNumbers().map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 flex items-center justify-center rounded-md text-xs font-bold transition-colors ${currentPage === page
                      ? "text-white shadow-sm"
                      : "bg-surface text-on-surface-variant border border-outline-variant/30 hover:border-primary hover:text-primary"
                      }`}
                    style={currentPage === page ? { backgroundColor: dept.warna } : {}}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-xs text-on-surface-variant hover:text-primary disabled:opacity-50 disabled:hover:text-on-surface-variant transition-colors"
                >
                  {t("next")}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col gap-2">
            {dept.proker.map((p, i) => (
              <ProkerRow key={i} proker={p} tTags={tTags} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
