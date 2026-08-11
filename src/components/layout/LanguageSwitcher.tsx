"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { useState, useRef, useEffect, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown } from "react-icons/fi";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "id", label: "Indonesia", flag: "🇮🇩" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
];

export default function LanguageSwitcher({ bottomNavMode = false, floatingMode = false }: { bottomNavMode?: boolean; floatingMode?: boolean }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [hasTour, setHasTour] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check for the Tour Guide button to adjust position dynamically
  useEffect(() => {
    const checkTourBtn = () => {
      const btn = document.querySelector('button[aria-label="Mulai Tur Panduan"]');
      setHasTour(!!btn);
    };

    checkTourBtn();
    const observer = new MutationObserver(checkTourBtn);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [pathname]);

  // Close dropdown when clicking outside
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

    // Use URL navigation but disable scrolling to top
    startTransition(() => {
      router.replace(
        { pathname },
        { locale: newLocale, scroll: false }
      );
    });
  };

  const currentLanguage = LANGUAGES.find((l) => l.code === locale) || LANGUAGES[0];

  const containerClasses = floatingMode
    ? "relative z-[100]"
    : bottomNavMode
    ? "relative z-[100]"
    : `relative md:fixed md:bottom-6 md:z-50 transition-all duration-500 ease-in-out ${hasTour ? "md:right-[5.5rem]" : "md:right-6"}`;

  return (
    <div className={containerClasses} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className={`flex items-center gap-2 px-3 py-2 md:px-4 md:py-3 rounded-full bg-surface shadow-md md:shadow-xl md:border-2 md:border-primary border border-outline-variant/30 text-sm font-medium transition-colors ${isPending ? 'opacity-80 cursor-wait' : 'hover:bg-surface-variant md:hover:scale-105'}`}
      >
        {isPending ? (
          <div className="w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        ) : (
          <span className="text-base md:text-xl">{currentLanguage.flag}</span>
        )}
        <span className="hidden md:inline-block font-bold">{currentLanguage.label}</span>
        <span className="md:hidden uppercase">{currentLanguage.code}</span>
        <FiChevronDown className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`absolute ${bottomNavMode ? "left-0 md:left-auto md:right-0" : "right-0"} ${floatingMode ? "bottom-full mb-2" : "md:bottom-full md:top-auto md:mb-2 top-full mt-2"} w-40 bg-surface border border-outline-variant/30 rounded-xl shadow-xl overflow-hidden z-50`}
          >
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-primary/10 transition-colors ${locale === lang.code ? "text-primary font-bold bg-primary/5" : "text-on-surface"
                  }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
