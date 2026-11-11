"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { SiWhatsapp } from "react-icons/si";
import { FiX, FiPlus, FiHelpCircle } from "react-icons/fi";

import { getAdminWhatsappContact } from "@/actions/public-settings";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";

export default function FloatingActionMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState<string>("");
  const [hasTour, setHasTour] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const router = useRouter();
  const pathname = usePathname();
  
  // WhatsApp logic
  useEffect(() => {
    async function fetchPhone() {
      try {
        const phoneValue = await getAdminWhatsappContact();
        if (phoneValue) setPhone(phoneValue);
      } catch (e) {}
    }
    fetchPhone();
  }, []);

  // Tour logic
  useEffect(() => {
    const checkTour = () => setHasTour(!!document.querySelector('[data-tour-btn="true"]'));
    checkTour();
    const observer = new MutationObserver(checkTour);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    return () => observer.disconnect();
  }, [pathname]);

  // Click outside logic
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const triggerTour = () => {
    const btn = document.querySelector('[data-tour-btn="true"]') as HTMLButtonElement;
    if (btn) btn.click();
    setIsOpen(false);
  };

  const formattedPhone = phone.startsWith("0") ? `62${phone.substring(1)}` : phone.replace(/[^0-9]/g, "");
  const waLink = `https://wa.me/${formattedPhone}`;

  const showToolsHub = pathname !== "/tools";

  // Jangan tampilkan Floating Action Menu / Tools di seluruh halaman dashboard (mahasiswa & admin)
  if (pathname?.includes("/dashboard") || pathname?.includes("/admin")) {
    return null;
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.8 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 10, scale: 0.8 }
  };

  return (
    <div data-floating-action-menu="true" className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-[60] flex flex-col items-end" ref={menuRef}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-3 mb-4 items-end"
          >
            {/* Tour Button Option */}
            {hasTour && (
              <motion.button
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={triggerTour}
                className="flex items-center gap-3 group"
              >
                <span className="bg-surface text-on-surface-variant font-bold text-sm px-3 py-1.5 rounded-lg shadow-md border border-outline-variant/30 opacity-0 group-hover:opacity-100 transition-opacity">
                  Mulai Tour
                </span>
                <div className="w-12 h-12 bg-surface text-secondary border-2 border-secondary rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                  <FiHelpCircle size={22} />
                </div>
              </motion.button>
            )}

            {/* WhatsApp Option */}
            {phone && (
              <motion.a
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 group"
              >
                <span className="bg-surface text-on-surface-variant font-bold text-sm px-3 py-1.5 rounded-lg shadow-md border border-outline-variant/30 opacity-0 group-hover:opacity-100 transition-opacity">
                  Kontak Admin
                </span>
                <div className="w-12 h-12 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                  <SiWhatsapp size={24} />
                </div>
              </motion.a>
            )}

            {/* Tools & Mini Games Hub Option */}
            {showToolsHub && (
              <motion.button
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={() => {
                  setIsOpen(false);
                  router.push("/tools");
                }}
                className="flex items-center gap-3 group"
              >
                <div className="flex items-center gap-1.5 bg-surface text-on-surface-variant font-bold text-sm px-3 py-1.5 rounded-lg shadow-md border border-outline-variant/30 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  <span>Tools & Mini Games</span>
                  <span className="text-[10px] bg-secondary/15 text-secondary px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                    Baru
                  </span>
                </div>
                <div className="w-12 h-12 rounded-full border-2 border-white dark:border-slate-700 shadow-lg flex items-center justify-center transition-transform">
                  <svg className="game-tools-logo" width="48" height="48" viewBox="-4 -4 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="fm2-gt-bg" x1="10" y1="10" x2="110" y2="110" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#1E3A8A"/>
                        <stop offset="100%" stopColor="#090D16"/>
                      </linearGradient>
                      <linearGradient id="fm2-gt-accent" x1="20" y1="20" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#38BDF8"/>
                        <stop offset="100%" stopColor="#2563EB"/>
                      </linearGradient>
                      <linearGradient id="fm2-gt-rim" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.7"/>
                        <stop offset="100%" stopColor="#1E293B" stopOpacity="0.3"/>
                      </linearGradient>
                      <linearGradient id="fm2-gt-gloss" x1="60" y1="6" x2="60" y2="58" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.14"/>
                        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0"/>
                      </linearGradient>
                      <filter id="fm2-gt-shadow" filterUnits="userSpaceOnUse" x="-20" y="-20" width="160" height="160">
                        <feDropShadow dx="0" dy="4" stdDeviation="3.5" floodColor="#000000" floodOpacity="0.45"/>
                      </filter>
                    </defs>
                    <rect x="6" y="6" width="108" height="108" rx="54" fill="url(#fm2-gt-bg)" stroke="#334155" strokeWidth="4"/>
                    <rect x="10" y="10" width="100" height="100" rx="50" stroke="url(#fm2-gt-rim)" strokeWidth="1.5"/>
                    <circle cx="60" cy="60" r="42" stroke="#FFFFFF" strokeOpacity="0.04" strokeWidth="1" strokeDasharray="4 4"/>
                    <g filter="url(#fm2-gt-shadow)">
                      <g className="gear-part">
                        <path d="M 56.5 26 L 63.5 26 L 65.2 31.7 L 70.1 33.7 L 74.5 29.6 L 79.4 34.5 L 75.3 38.9 L 77.3 43.8 L 83 45.5 L 83 52.5 L 77.3 54.2 L 75.3 59.1 L 79.4 63.5 L 74.5 68.4 L 70.1 64.3 L 65.2 66.3 L 63.5 72 L 56.5 72 L 54.8 66.3 L 49.9 64.3 L 45.5 68.4 L 40.6 63.5 L 44.7 59.1 L 42.7 54.2 L 37 52.5 L 37 45.5 L 42.7 43.8 L 44.7 38.9 L 40.6 34.5 L 45.5 29.6 L 49.9 33.7 L 54.8 31.7 Z" fill="url(#fm2-gt-accent)" stroke="#FFFFFF" strokeWidth="2" strokeLinejoin="round"/>
                        <circle cx="60" cy="49" r="11" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.3"/>
                      </g>
                      <g className="pad-part">
                        <path d="M40 50H80C86.6274 50 92 55.3726 92 62V71C92 78.732 85.732 85 78 85C74.4 85 71 83.4 68.7 80.7L65.2 76.6C64.1 75.3 62.5 74.5 60.8 74.5H59.2C57.5 74.5 55.9 75.3 54.8 76.6L51.3 80.7C49 83.4 45.6 85 42 85C34.268 85 28 78.732 28 71V62C28 55.3726 33.3726 50 40 50Z" fill="#FFFFFF" stroke="#0F172A" strokeWidth="3" strokeLinejoin="round"/>
                        <path d="M33 67C33 74 37 80 42 80" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round"/>
                        <path d="M87 67C87 74 83 80 78 80" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round"/>
                        <path d="M43 59V69M38 64H48" stroke="#0F172A" strokeWidth="3.8" strokeLinecap="round"/>
                        <circle cx="78" cy="61" r="2.8" fill="url(#fm2-gt-accent)"/>
                        <circle cx="71" cy="66" r="2.8" fill="#0F172A"/>
                        <circle cx="78" cy="71" r="2.5" fill="#94A3B8"/>
                        <circle cx="84" cy="66" r="2.5" fill="#94A3B8"/>
                        <polygon points="60,57 63.5,59 63.5,63 60,65 56.5,63 56.5,59" fill="url(#fm2-gt-accent)"/>
                      </g>
                    </g>
                    <path d="M60 8C88.7 8 112 31.3 112 60C112 62.5 111.8 65 111.4 67.4C96 54 78.8 46 60 46C41.2 46 24 54 8.6 67.4C8.2 65 8 62.5 8 60C8 31.3 31.3 8 60 8Z" fill="url(#fm2-gt-gloss)" pointerEvents="none"/>
                  </svg>
                </div>
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg text-on-surface rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:shadow-xl border border-white/50 dark:border-white/10 transition-all relative overflow-hidden"
        aria-label="Menu Aksi"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <FiX size={28} className="text-secondary" />
            </motion.div>
          ) : (
            <motion.div
              key="cluster"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative w-8 h-8 flex items-center justify-center"
            >
              {/* Tour Icon (Top Right) */}
              {hasTour && (
                <div className="absolute top-0 right-0 w-[18px] h-[18px] bg-white text-secondary rounded-full flex items-center justify-center shadow-sm z-10 border border-secondary/20">
                  <FiHelpCircle size={11} />
                </div>
              )}
              {/* Tools & Games Icon (Bottom Center) */}
              {showToolsHub && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[24px] h-[24px] rounded-full flex items-center justify-center shadow-sm z-20 border-[1.5px] border-white">
                  <svg className="game-tools-logo" width="24" height="24" viewBox="-4 -4 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="fm-gt-bg" x1="10" y1="10" x2="110" y2="110" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#1E3A8A"/>
                        <stop offset="100%" stopColor="#090D16"/>
                      </linearGradient>
                      <linearGradient id="fm-gt-accent" x1="20" y1="20" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#38BDF8"/>
                        <stop offset="100%" stopColor="#2563EB"/>
                      </linearGradient>
                      <linearGradient id="fm-gt-rim" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.7"/>
                        <stop offset="100%" stopColor="#1E293B" stopOpacity="0.3"/>
                      </linearGradient>
                      <linearGradient id="fm-gt-gloss" x1="60" y1="6" x2="60" y2="58" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.14"/>
                        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0"/>
                      </linearGradient>
                      <filter id="fm-gt-shadow" filterUnits="userSpaceOnUse" x="-20" y="-20" width="160" height="160">
                        <feDropShadow dx="0" dy="4" stdDeviation="3.5" floodColor="#000000" floodOpacity="0.45"/>
                      </filter>
                    </defs>
                    <rect x="6" y="6" width="108" height="108" rx="54" fill="url(#fm-gt-bg)" stroke="#334155" strokeWidth="4"/>
                    <rect x="10" y="10" width="100" height="100" rx="50" stroke="url(#fm-gt-rim)" strokeWidth="1.5"/>
                    <circle cx="60" cy="60" r="42" stroke="#FFFFFF" strokeOpacity="0.04" strokeWidth="1" strokeDasharray="4 4"/>
                    <g filter="url(#fm-gt-shadow)">
                      <g className="gear-part">
                        <path d="M 56.5 26 L 63.5 26 L 65.2 31.7 L 70.1 33.7 L 74.5 29.6 L 79.4 34.5 L 75.3 38.9 L 77.3 43.8 L 83 45.5 L 83 52.5 L 77.3 54.2 L 75.3 59.1 L 79.4 63.5 L 74.5 68.4 L 70.1 64.3 L 65.2 66.3 L 63.5 72 L 56.5 72 L 54.8 66.3 L 49.9 64.3 L 45.5 68.4 L 40.6 63.5 L 44.7 59.1 L 42.7 54.2 L 37 52.5 L 37 45.5 L 42.7 43.8 L 44.7 38.9 L 40.6 34.5 L 45.5 29.6 L 49.9 33.7 L 54.8 31.7 Z" fill="url(#fm-gt-accent)" stroke="#FFFFFF" strokeWidth="2" strokeLinejoin="round"/>
                        <circle cx="60" cy="49" r="11" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.3"/>
                      </g>
                      <g className="pad-part">
                        <path d="M40 50H80C86.6274 50 92 55.3726 92 62V71C92 78.732 85.732 85 78 85C74.4 85 71 83.4 68.7 80.7L65.2 76.6C64.1 75.3 62.5 74.5 60.8 74.5H59.2C57.5 74.5 55.9 75.3 54.8 76.6L51.3 80.7C49 83.4 45.6 85 42 85C34.268 85 28 78.732 28 71V62C28 55.3726 33.3726 50 40 50Z" fill="#FFFFFF" stroke="#0F172A" strokeWidth="3" strokeLinejoin="round"/>
                        <path d="M33 67C33 74 37 80 42 80" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round"/>
                        <path d="M87 67C87 74 83 80 78 80" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round"/>
                        <path d="M43 59V69M38 64H48" stroke="#0F172A" strokeWidth="3.8" strokeLinecap="round"/>
                        <circle cx="78" cy="61" r="2.8" fill="url(#fm-gt-accent)"/>
                        <circle cx="71" cy="66" r="2.8" fill="#0F172A"/>
                        <circle cx="78" cy="71" r="2.5" fill="#94A3B8"/>
                        <circle cx="84" cy="66" r="2.5" fill="#94A3B8"/>
                        <polygon points="60,57 63.5,59 63.5,63 60,65 56.5,63 56.5,59" fill="url(#fm-gt-accent)"/>
                      </g>
                    </g>
                    <path d="M60 8C88.7 8 112 31.3 112 60C112 62.5 111.8 65 111.4 67.4C96 54 78.8 46 60 46C41.2 46 24 54 8.6 67.4C8.2 65 8 62.5 8 60C8 31.3 31.3 8 60 8Z" fill="url(#fm-gt-gloss)" pointerEvents="none"/>
                  </svg>
                </div>
              )}
              {/* WhatsApp Icon (Top Left) */}
              {phone && (
                <div className="absolute top-0 left-0 w-[20px] h-[20px] bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-sm z-30 ring-[1.5px] ring-white">
                  <SiWhatsapp size={11} />
                </div>
              )}
              
              {/* Fallback */}
              {!hasTour && !showToolsHub && !phone && (
                <FiPlus size={24} className="text-secondary" />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {!isOpen && (
          <span className="absolute w-full h-full rounded-full border-2 border-secondary/20 opacity-30 animate-ping" style={{ animationDuration: '3s' }}></span>
        )}
      </motion.button>
    </div>
  );
}
