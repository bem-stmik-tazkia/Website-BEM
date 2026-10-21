"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { useState, useRef, useEffect, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown } from "react-icons/fi";

// ─────────────────────────────────────────────
// CRISP SVG FLAGS (Tampil sempurna di Windows, Mac, iOS, Android)
// ─────────────────────────────────────────────
function FlagGB({ className = "w-5 h-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 30" className={`${className} rounded-[3px] overflow-hidden shadow-xs shrink-0 inline-block`} aria-hidden="true">
      <clipPath id="flag-gb-s">
        <path d="M0,0 v30 h60 v-30 z" />
      </clipPath>
      <clipPath id="flag-gb-t">
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <g clipPath="url(#flag-gb-s)">
        <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
        <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#flag-gb-t)" stroke="#C8102E" strokeWidth="4" />
        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  );
}

function FlagID({ className = "w-5 h-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 3 2" className={`${className} rounded-[3px] overflow-hidden shadow-xs border border-black/10 shrink-0 inline-block`} aria-hidden="true">
      <rect width="3" height="1" fill="#e70011" />
      <rect y="1" width="3" height="1" fill="#ffffff" />
    </svg>
  );
}

function FlagSA({ className = "w-5 h-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 3 2" className={`${className} rounded-[3px] overflow-hidden shadow-xs shrink-0 inline-block`} aria-hidden="true">
      <rect width="3" height="2" fill="#006c35" />
      <text x="1.5" y="0.95" fill="#ffffff" fontSize="0.5" textAnchor="middle" fontFamily="sans-serif" fontWeight="bold">لا إله إلا الله</text>
      <path d="M0.75,1.35 L2.25,1.35 M0.95,1.25 L0.95,1.45" stroke="#ffffff" strokeWidth="0.08" strokeLinecap="round" />
    </svg>
  );
}

function FlagJP({ className = "w-5 h-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 3 2" className={`${className} rounded-[3px] overflow-hidden shadow-xs border border-black/10 shrink-0 inline-block`} aria-hidden="true">
      <rect width="3" height="2" fill="#ffffff" />
      <circle cx="1.5" cy="1" r="0.6" fill="#bc002d" />
    </svg>
  );
}

function FlagFR({ className = "w-5 h-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 3 2" className={`${className} rounded-[3px] overflow-hidden shadow-xs border border-black/10 shrink-0 inline-block`} aria-hidden="true">
      <rect width="1" height="2" fill="#002654" />
      <rect x="1" width="1" height="2" fill="#ffffff" />
      <rect x="2" width="1" height="2" fill="#ce1126" />
    </svg>
  );
}

const LANGUAGES = [
  { code: "en", label: "English", Flag: FlagGB },
  { code: "id", label: "Indonesia", Flag: FlagID },
  { code: "ar", label: "العربية", Flag: FlagSA },
  { code: "ja", label: "日本語", Flag: FlagJP },
  { code: "fr", label: "Français", Flag: FlagFR },
];

export default function LanguageSwitcher({
  bottomNavMode = false,
  floatingMode = false,
}: {
  bottomNavMode?: boolean;
  floatingMode?: boolean;
}) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [hasFloatingMenu, setHasFloatingMenu] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Deteksi keberadaan menu lingkaran (FloatingActionMenu) di halaman
  useEffect(() => {
    const checkFloatingMenu = () => {
      const menu = document.querySelector('[data-floating-action-menu="true"]');
      setHasFloatingMenu(!!menu);
    };

    checkFloatingMenu();
    const interval = setInterval(checkFloatingMenu, 500);
    const observer = new MutationObserver(checkFloatingMenu);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, [pathname]);

  // Close dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [isPending, startTransition] = useTransition();

  const handleLanguageChange = (newLocale: string) => {
    setIsOpen(false);
    if (newLocale === locale) return;

    startTransition(() => {
      router.replace(
        { pathname },
        { locale: newLocale, scroll: false }
      );
    });
  };

  const currentLanguage = LANGUAGES.find((l) => l.code === locale) || LANGUAGES[0];
  const CurrentFlag = currentLanguage.Flag;

  // Jika ada menu lingkaran: geser ke kiri (md:right-[5.75rem]), jika tidak ada: di pojok (md:right-6)
  const containerClasses = floatingMode
    ? "relative z-[100]"
    : bottomNavMode
    ? "relative z-[100]"
    : `relative lg:fixed lg:bottom-6 lg:z-50 transition-all duration-300 ease-in-out ${
        hasFloatingMenu ? "lg:right-[5.75rem]" : "lg:right-6"
      }`;

  return (
    <div className={containerClasses} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className={`flex items-center gap-2 px-3 py-2 lg:px-4 lg:py-2.5 rounded-full bg-surface shadow-md lg:shadow-xl lg:border-2 lg:border-primary border border-outline-variant/30 text-sm font-medium transition-all duration-300 ${
          isPending ? "opacity-80 cursor-wait" : "hover:bg-surface-variant lg:hover:scale-105"
        }`}
        aria-label="Pilih Bahasa"
      >
        {isPending ? (
          <div className="w-5 h-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        ) : (
          <CurrentFlag className="w-5 h-3.5" />
        )}
        <span className="hidden lg:inline-block font-bold text-on-surface whitespace-nowrap">
          {currentLanguage.label}
        </span>
        <span className="lg:hidden uppercase text-xs font-bold text-on-surface">
          {currentLanguage.code}
        </span>
        <FiChevronDown
          className={`transition-transform duration-200 text-on-surface-variant shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
          size={16}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute ${
              bottomNavMode ? "left-0 lg:left-auto lg:right-0" : "right-0"
            } ${
              floatingMode ? "bottom-full mb-2" : "lg:bottom-full lg:top-auto lg:mb-2 top-full mt-2"
            } w-44 bg-surface border border-outline-variant/30 rounded-2xl shadow-2xl overflow-hidden z-50 py-1`}
          >
            {LANGUAGES.map((lang) => {
              const Flag = lang.Flag;
              const isActive = locale === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-primary/10 transition-colors ${
                    isActive ? "text-primary font-bold bg-primary/5" : "text-on-surface"
                  }`}
                >
                  <Flag className="w-5 h-3.5" />
                  <span className="font-medium whitespace-nowrap">{lang.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
