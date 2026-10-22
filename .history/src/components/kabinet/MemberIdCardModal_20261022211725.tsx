"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiRefreshCw, FiExternalLink } from "react-icons/fi";
import { SiWhatsapp, SiInstagram } from "react-icons/si";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { getLocalizedRole, getCabinetWord, getMottoQuote } from "./roleUtils";

export interface KabinetMemberModalData {
  name: string;
  role: string;
  foto?: string;
  wa?: string;
  ig?: string;
  initials: string;
  departmentName?: string;
  departmentSingkatan?: string;
  color?: string;
  bg?: string;
  periode?: string;
  namaKabinet?: string;
}

interface MemberIdCardModalProps {
  member: KabinetMemberModalData | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MemberIdCardModal({
  member,
  isOpen,
  onClose,
}: MemberIdCardModalProps) {
  const t = useTranslations("KabinetPage");
  const locale = useLocale();
  const [isFlipped, setIsFlipped] = useState(false);

  // Safe label getter with fallback
  const getLabel = (key: string, fallback: string) => {
    try {
      if (t && t.has(key)) return t(key);
    } catch {
      // fallback
    }
    return fallback;
  };

  const officialIdCardText = getLabel("officialIdCard", "KARTU IDENTITAS RESMI");
  const flipCardText = getLabel("flipCard", "Putar Kartu");
  const frontSideText = getLabel("frontSide", "Sisi Depan");
  const backSideText = getLabel("backSide", "Sisi Belakang");
  const activeMemberText = getLabel("activeMember", "Pengurus Aktif");
  const closeText = getLabel("close", "Tutup");
  const fullNameText = getLabel("fullName", "Nama Lengkap");
  const positionText = getLabel("position", "Jabatan");
  const divisionText = getLabel("division", "Divisi / Bagian");
  const contactChannelsText = getLabel("contactChannels", "Saluran Kontak");
  const flipHintText = getLabel("flipHint", "Klik kartu atau tekan Spasi untuk membalik");
  const cabinetWord = getLabel("cabinetWord", getCabinetWord(locale));
  const mottoQuoteText = getLabel("mottoQuote", getMottoQuote(locale));
  const localizedRole = member ? getLocalizedRole(member.role, locale) : "";

  // Reset flip state when modal opens or member changes
  useEffect(() => {
    if (isOpen) {
      setIsFlipped(false);
    }
  }, [isOpen, member?.name]);

  // Lock body scroll and listen for Escape / Space keys
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === " " || e.key === "f" || e.key === "F") {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !member) return null;

  const accentColor = member.color || "#1b4086";
  const bgTint = member.bg || "#e1e7ff";
  const cabinetName = member.namaKabinet || "Sinergi";
  const periode = member.periode || "2026/2027";
  const deptLabel = member.departmentName || member.departmentSingkatan || t("coreBoardTitle");

  // Format WhatsApp Link
  const formattedWa = member.wa ? member.wa.replace(/\D/g, "") : "";
  const waNumber = formattedWa.startsWith("0") ? "62" + formattedWa.slice(1) : formattedWa;
  const waUrl = member.wa?.startsWith("http") ? member.wa : waNumber ? `https://wa.me/${waNumber}` : "";

  // Format Instagram Link
  const igHandle = member.ig ? member.ig.replace("@", "").trim() : "";
  const igUrl = member.ig?.startsWith("http") ? member.ig : igHandle ? `https://instagram.com/${igHandle}` : "";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative z-10 flex flex-col items-center my-auto w-full max-w-sm sm:max-w-md pointer-events-auto"
        >
          {/* Top Bar Controls */}
          <div className="w-full flex items-center justify-between gap-3 mb-3 px-1 sm:px-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white/90 text-xs font-black tracking-widest uppercase">
                {officialIdCardText}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Flip Button */}
              <button
                type="button"
                onClick={() => setIsFlipped((prev) => !prev)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-bold backdrop-blur-md border border-white/20 transition-all shadow-md active:scale-95"
                title={flipCardText}
              >
                <FiRefreshCw
                  size={13}
                  className={`transition-transform duration-500 ${isFlipped ? "rotate-180" : ""}`}
                />
                <span className="hidden sm:inline">
                  {isFlipped ? frontSideText : backSideText}
                </span>
                <span className="sm:hidden">{flipCardText}</span>
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-all shadow-md active:scale-95"
                aria-label={closeText}
              >
                <FiX size={18} />
              </button>
            </div>
          </div>

          {/* 3D Flip Card Container */}
          <div
            className="w-full flex justify-center py-1"
            style={{ perspective: 1200 }}
          >
            <motion.div
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              style={{ transformStyle: "preserve-3d" }}
              className="relative w-[min(320px,calc(100vw-2rem))] sm:w-[350px] md:w-[360px] h-[510px] sm:h-[550px] md:h-[560px] cursor-pointer select-none"
              onClick={() => setIsFlipped((prev) => !prev)}
            >
              {/* ══════════════════════════════════════════ */}
              {/* FRONT SIDE (SISI DEPAN)                   */}
              {/* ══════════════════════════════════════════ */}
              <div
                style={{ backfaceVisibility: "hidden" }}
                className="absolute inset-0 w-full h-full rounded-3xl overflow-hidden shadow-2xl border-2 border-white/30 flex flex-col justify-between text-white bg-slate-950"
              >
                {/* Full-bleed Photo or Initials Background */}
                {member.foto ? (
                  <img
                    src={member.foto}
                    alt={member.name}
                    className="absolute inset-0 w-full h-full object-cover object-top"
                  />
                ) : (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ background: `linear-gradient(145deg, ${bgTint} 0%, ${accentColor} 100%)` }}
                  >
                    <span className="text-7xl sm:text-8xl font-black select-none opacity-80" style={{ color: accentColor }}>
                      {member.initials}
                    </span>
                  </div>
                )}

                {/* Subtle Top & Bottom Gradient Overlays for readable text */}
                <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none" />

                {/* Top Section: Lanyard Slot Cutout & Badge */}
                <div className="relative z-10 p-4 sm:p-5 pb-0 flex flex-col items-center">
                  {/* Lanyard Slot Cutout */}
                  <div className="w-12 h-3 rounded-full bg-black/70 border border-white/30 shadow-inner flex items-center justify-center mb-3">
                    <div className="w-8 h-1 rounded-full bg-white/20" />
                  </div>

                  <div className="w-full flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-black/40 backdrop-blur-md p-1 border border-white/20 shadow-sm shrink-0">
                        <Image
                          src="/images/logo2.webp"
                          alt="Logo BEM"
                          width={24}
                          height={24}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="text-[10px] font-black tracking-widest text-white/90 uppercase drop-shadow">
                        BEM STMIK TAZKIA
                      </span>
                    </div>

                    <span className="text-[9px] font-extrabold px-2.5 py-0.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white/90">
                      {periode}
                    </span>
                  </div>
                </div>

                {/* Bottom Section: Role, Name, Social Buttons, Flip Prompt */}
                <div className="relative z-10 p-4 sm:p-5 flex flex-col gap-2">
                  {/* Role Pill */}
                  {localizedRole && (
                    <span
                      className="self-start text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg text-white border border-white/30 truncate max-w-full"
                      style={{ backgroundColor: accentColor }}
                    >
                      {localizedRole}
                    </span>
                  )}

                  {/* Name */}
                  <h3 className="text-xl sm:text-2xl font-black text-white leading-tight drop-shadow-lg line-clamp-2">
                    {member.name}
                  </h3>

                  {/* Department */}
                  <p className="text-xs font-semibold text-white/80 line-clamp-1 drop-shadow">
                    {deptLabel}
                  </p>

                  {/* Social Buttons & Flip Button */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      {waUrl && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 rounded-xl bg-white/20 hover:bg-[#25D366] text-white backdrop-blur-md border border-white/30 flex items-center justify-center transition-all shadow-md"
                          aria-label={`WhatsApp ${member.name}`}
                        >
                          <SiWhatsapp size={14} />
                        </a>
                      )}
                      {igUrl && (
                        <a
                          href={igUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 rounded-xl bg-white/20 hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#e6683c] hover:to-[#bc1888] text-white backdrop-blur-md border border-white/30 flex items-center justify-center transition-all shadow-md"
                          aria-label={`Instagram ${member.name}`}
                        >
                          <SiInstagram size={14} />
                        </a>
                      )}
                    </div>

                    {/* Flip Trigger */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white text-[11px] font-bold shadow-md transition-colors">
                      <FiRefreshCw size={12} />
                      <span>{flipCardText}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ══════════════════════════════════════════ */}
              {/* BACK SIDE (SISI BELAKANG)                  */}
              {/* ══════════════════════════════════════════ */}
              <div
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
                className="absolute inset-0 w-full h-full rounded-3xl overflow-hidden shadow-2xl border-2 border-white/30 flex flex-col justify-between p-4 sm:p-5 text-white bg-[#0b1528]"
              >
                {/* Background Watermark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                  <Image
                    src="/images/logo2.webp"
                    alt="Watermark"
                    width={220}
                    height={220}
                    className="w-52 h-52 object-contain"
                  />
                </div>

                {/* Subtle Accent Glow */}
                <div
                  className="absolute -top-16 -right-16 w-44 h-44 rounded-full blur-3xl opacity-30 pointer-events-none"
                  style={{ backgroundColor: accentColor }}
                />

                {/* Top Section: Lanyard Slot & Header */}
                <div>
                  {/* Lanyard Slot Cutout */}
                  <div className="w-12 h-3 mx-auto rounded-full bg-black/70 border border-white/30 shadow-inner flex items-center justify-center mb-3">
                    <div className="w-8 h-1 rounded-full bg-white/20" />
                  </div>

                  <div className="flex items-center justify-between border-b border-white/15 pb-2.5">
                    {/* Simulated Smart Chip Graphic */}
                    <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 p-0.5 shadow border border-amber-300/60 flex flex-col justify-between">
                      <div className="w-full h-[1px] bg-amber-700/40" />
                      <div className="w-full h-2 border-y border-amber-700/40" />
                      <div className="w-full h-[1px] bg-amber-700/40" />
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-black tracking-widest text-white/90 block uppercase">
                        {officialIdCardText}
                      </span>
                      <span className="text-[8px] text-white/60 block">
                        STMIK TAZKIA BOGOR
                      </span>
                    </div>
                  </div>
                </div>

                {/* Middle Section: Member Details & Contacts */}
                <div className="my-auto flex flex-col gap-2 py-1 text-left">
                  {/* Info: Name */}
                  <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                    <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-white/50 block font-bold">
                      {fullNameText}
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-white block truncate">
                      {member.name}
                    </span>
                  </div>

                  {/* Info: Role & Department */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                      <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-white/50 block font-bold">
                        {positionText}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-white block truncate">
                        {localizedRole || "-"}
                      </span>
                    </div>
                    <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                      <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-white/50 block font-bold">
                        {divisionText}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-white block truncate">
                        {deptLabel}
                      </span>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white/80">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-bold">{activeMemberText} • {cabinetWord} {cabinetName}</span>
                  </div>

                  {/* Direct Contact Buttons */}
                  <div className="flex flex-col gap-1 pt-1" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-white/50 font-bold px-1">
                      {contactChannelsText}
                    </span>
                    <div className="flex gap-2">
                      {waUrl ? (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366] text-[#25D366] hover:text-white border border-[#25D366]/40 text-xs font-bold transition-all shadow-sm active:scale-95"
                        >
                          <SiWhatsapp size={13} />
                          <span>WhatsApp</span>
                          <FiExternalLink size={10} className="opacity-70" />
                        </a>
                      ) : (
                        <div className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-white/5 text-white/30 border border-white/10 text-xs font-bold">
                          <SiWhatsapp size={13} />
                          <span>WhatsApp -</span>
                        </div>
                      )}

                      {igUrl ? (
                        <a
                          href={igUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-gradient-to-tr hover:from-[#f09433] hover:via-[#e6683c] hover:to-[#bc1888] bg-white/10 text-white border border-white/20 text-xs font-bold transition-all shadow-sm active:scale-95"
                        >
                          <SiInstagram size={13} />
                          <span>Instagram</span>
                          <FiExternalLink size={10} className="opacity-70" />
                        </a>
                      ) : (
                        <div className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-white/5 text-white/30 border border-white/10 text-xs font-bold">
                          <SiInstagram size={13} />
                          <span>Instagram -</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Motto Quote */}
                  <p className="text-[9px] sm:text-[10px] text-white/50 italic text-center font-medium leading-relaxed pt-1">
                    &quot;{mottoQuoteText}&quot;
                  </p>
                </div>

                {/* Bottom Section: Barcode & Flip Prompt */}
                <div className="border-t border-white/15 pt-2 flex items-center justify-between text-[10px] text-white/75">
                  {/* Decorative Barcode */}
                  <div className="flex items-center gap-[2px] h-4 opacity-60">
                    {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 2, 3].map((w, idx) => (
                      <div
                        key={idx}
                        className="bg-white h-full rounded-[0.5px]"
                        style={{ width: `${w}px` }}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition-colors">
                    <FiRefreshCw size={12} />
                    <span>{frontSideText}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Bottom helper text */}
          <p className="text-white/60 text-xs text-center mt-2.5 font-medium">
            💡 {flipHintText}
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
