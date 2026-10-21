"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";

// ─────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────
function WaIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

function IgIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FlipIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M21 21v-5h-5" />
    </svg>
  );
}

// ─────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────
export interface Member3DCardProps {
  name: string;
  role?: string;
  foto?: string;
  initials?: string;
  wa?: string;
  ig?: string;
  accentColor: string;
  bgColor?: string;
  isLead?: boolean;
  departmentName?: string;
  cabinetName?: string;
  className?: string;
}

export default function Member3DCard({
  name,
  role = "",
  foto,
  initials = "",
  wa,
  ig,
  accentColor,
  bgColor = "#1e293b",
  isLead = false,
  departmentName,
  cabinetName,
  className = "",
}: Member3DCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const flipTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
    };
  }, []);

  // Handle 3D Tilt on Mouse Move (berlaku baik saat posisi depan maupun belakang)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isFlipping) return;
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    // Maksimal kemiringan 10 derajat
    const rotX = -((y - centerY) / centerY) * 10;
    const rotY = ((x - centerX) / centerX) * 10;
    setTilt({ x: rotX, y: rotY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const handleFlip = () => {
    setIsFlipping(true);
    setIsFlipped((prev) => !prev);
    setTilt({ x: 0, y: 0 });

    if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
    flipTimerRef.current = setTimeout(() => {
      setIsFlipping(false);
    }, 700);
  };

  // Format WhatsApp Link
  const waHref = wa
    ? (() => {
        const sanitized = wa.replace(/\D/g, "");
        const waNumber = sanitized.startsWith("0") ? "62" + sanitized.slice(1) : sanitized;
        return wa.startsWith("http") ? wa : `https://wa.me/${waNumber}`;
      })()
    : null;

  // Format Instagram Link
  const igHref = ig
    ? ig.startsWith("http")
      ? ig
      : `https://instagram.com/${ig.replace("@", "")}`
    : null;

  return (
    <div
      ref={cardRef}
      onClick={handleFlip}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleFlip();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`${name} - Klik untuk membalik kartu`}
      className={`perspective-1000 w-full aspect-[3/4] cursor-pointer group select-none ${className}`}
    >
      {/* 3D Rotator Wrapper */}
      <div
        className="relative w-full h-full transform-style-3d will-change-transform"
        style={{
          transform: isFlipped
            ? `rotateX(${tilt.x}deg) rotateY(${180 - tilt.y}deg)`
            : `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transformStyle: "preserve-3d",
          transition: isFlipping
            ? "transform 0.7s cubic-bezier(0.4, 0.2, 0.2, 1)"
            : tilt.x === 0 && tilt.y === 0
            ? "transform 0.5s ease-out"
            : "transform 0.1s ease-out",
        }}
      >
        {/* ═══════════════════════════════════════════════
            FRONT SIDE (Foto / Inisial + Nama + Role)
            ═══════════════════════════════════════════════ */}
        <div
          className={`absolute inset-0 w-full h-full ${
            isLead ? "rounded-3xl" : "rounded-2xl"
          } overflow-hidden shadow-md group-hover:shadow-2xl transition-all duration-300 ring-1 ring-outline-variant/20 bg-surface backface-hidden`}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(0deg)",
            transformStyle: "preserve-3d",
          }}
        >
          {/* Cover photo / Fallback Initials */}
          {foto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={foto}
              alt={name}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center transition-transform duration-700 group-hover:scale-105"
              style={{
                background: `linear-gradient(145deg, ${bgColor} 0%, ${accentColor}55 100%)`,
              }}
            >
              <span
                className={`${
                  isLead ? "text-7xl md:text-8xl" : "text-4xl md:text-5xl"
                } font-black select-none opacity-80`}
                style={{ color: accentColor }}
              >
                {initials}
              </span>
            </div>
          )}

          {/* Dark gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent pointer-events-none" />

          {/* Flip Hint Icon Badge (Top Right) */}
          <div
            className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/90 transition-all duration-300 shadow-md group-hover:scale-110"
            title="Klik untuk membalik kartu"
            style={{ transform: "translateZ(20px)" }}
          >
            <FlipIcon className="w-3.5 h-3.5 text-white" />
          </div>

          {/* Bottom Accent Bar */}
          <div
            className="absolute inset-x-0 bottom-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ backgroundColor: accentColor }}
          />

          {/* Front Info Content */}
          <div
            className={`absolute inset-x-0 bottom-0 ${
              isLead ? "p-4 md:p-6" : "p-3 md:p-4"
            } flex flex-col gap-1.5 md:gap-2`}
            style={{ transform: "translateZ(25px)" }}
          >
            {role && (
              <span
                className="self-start max-w-full truncate text-[10px] md:text-[11px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full text-white shadow-sm"
                style={{ backgroundColor: accentColor }}
              >
                {role}
              </span>
            )}

            <h3
              className={`font-extrabold text-white ${
                isLead ? "text-lg md:text-2xl" : "text-sm md:text-base"
              } leading-tight line-clamp-2 drop-shadow`}
            >
              {name}
            </h3>

            {/* Social Buttons */}
            {(waHref || igHref) && (
              <div
                className="flex gap-2 pt-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                {waHref && (
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-white hover:bg-[#25D366] hover:border-[#25D366] transition-all duration-300 shadow-sm"
                    aria-label={`WhatsApp ${name}`}
                  >
                    <WaIcon />
                  </a>
                )}
                {igHref && (
                  <a
                    href={igHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-white hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#e6683c] hover:to-[#bc1888] hover:border-transparent transition-all duration-300 shadow-sm"
                    aria-label={`Instagram ${name}`}
                  >
                    <IgIcon />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════
            BACK SIDE (Official BEM 3D ID Badge + Logo)
            ═══════════════════════════════════════════════ */}
        <div
          className={`absolute inset-0 w-full h-full ${
            isLead ? "rounded-3xl" : "rounded-2xl"
          } overflow-hidden shadow-2xl ring-1 ring-white/20 flex flex-col justify-between p-4 md:p-5 text-white backface-hidden`}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            transformStyle: "preserve-3d",
            background: "linear-gradient(150deg, #070d1e 0%, #111a3b 50%, #080d21 100%)",
          }}
        >
          {/* Ambient Glowing Aura */}
          <div
            className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-40 pointer-events-none"
            style={{ backgroundColor: accentColor }}
          />
          <div
            className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-2xl opacity-35 pointer-events-none"
            style={{ backgroundColor: accentColor }}
          />

          {/* Decorative Subtle Grid Pattern */}
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
              backgroundSize: "14px 14px",
            }}
          />

          {/* Card Top Header */}
          <div
            className="relative z-10 flex items-center justify-between gap-2 border-b border-white/15 pb-2.5"
            style={{ transform: "translateZ(15px)" }}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className="w-2 h-2 rounded-full shrink-0 animate-ping"
                style={{ backgroundColor: accentColor }}
              />
              <span className="text-[10px] md:text-[11px] font-black uppercase tracking-wider text-white/85 truncate">
                {departmentName || cabinetName || "BEM STMIK TAZKIA"}
              </span>
            </div>
            <div
              className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/25 border border-white/20 flex items-center justify-center text-white transition-all shrink-0"
              title="Klik untuk membalik kembali"
            >
              <FlipIcon className="w-3 h-3" />
            </div>
          </div>

          {/* Center: Showcase Logo BEM */}
          <div
            className="relative z-10 flex-1 flex flex-col items-center justify-center my-auto py-2"
            style={{ transform: "translateZ(30px)" }}
          >
            {/* Glowing Logo Frame */}
            <div className="relative group/logo mb-2.5">
              <div
                className="absolute -inset-3 rounded-full blur-xl opacity-70 animate-pulse pointer-events-none"
                style={{ backgroundColor: accentColor }}
              />
              <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white/10 backdrop-blur-md p-3 ring-1 ring-white/25 flex items-center justify-center shadow-2xl">
                <Image
                  src="/images/logo2.webp"
                  alt="Logo BEM STMIK Tazkia"
                  width={84}
                  height={84}
                  className="w-full h-full object-contain drop-shadow-[0_4px_14px_rgba(0,0,0,0.6)]"
                />
              </div>
            </div>

            {/* BEM Brand Label */}
            <span className="text-[11px] md:text-xs font-black uppercase tracking-widest text-center text-white drop-shadow">
              BEM STMIK TAZKIA
            </span>
            {cabinetName && (
              <span className="text-[9px] md:text-[10px] font-bold text-white/75 tracking-wider uppercase text-center mt-0.5">
                Kabinet {cabinetName}
              </span>
            )}
          </div>

          {/* Card Bottom: Member Identity & Actions */}
          <div
            className="relative z-10 flex flex-col items-center gap-1.5 pt-2 border-t border-white/15"
            style={{ transform: "translateZ(25px)" }}
          >
            <h4
              className={`font-extrabold text-white ${
                isLead ? "text-sm md:text-base" : "text-xs md:text-sm"
              } text-center leading-snug line-clamp-1 drop-shadow`}
            >
              {name}
            </h4>

            {role && (
              <span
                className="text-[9px] md:text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full text-white shadow-sm"
                style={{ backgroundColor: accentColor }}
              >
                {role}
              </span>
            )}

            {/* Social Buttons (Also accessible on back face) */}
            {(waHref || igHref) && (
              <div
                className="flex gap-2 pt-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                {waHref && (
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-lg bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-white hover:bg-[#25D366] hover:border-[#25D366] transition-all duration-300 shadow-sm"
                    aria-label={`WhatsApp ${name}`}
                  >
                    <WaIcon />
                  </a>
                )}
                {igHref && (
                  <a
                    href={igHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-lg bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-white hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#e6683c] hover:to-[#bc1888] hover:border-transparent transition-all duration-300 shadow-sm"
                    aria-label={`Instagram ${name}`}
                  >
                    <IgIcon />
                  </a>
                )}
              </div>
            )}

            {/* Flip Hint */}
            <span className="text-[9px] text-white/50 font-semibold tracking-wider uppercase mt-0.5 flex items-center gap-1">
              <FlipIcon className="w-2.5 h-2.5" /> Klik untuk kembali
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
