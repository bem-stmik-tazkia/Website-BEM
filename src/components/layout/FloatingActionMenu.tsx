"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { SiWhatsapp } from "react-icons/si";
import { FiX, FiPlus, FiHelpCircle } from "react-icons/fi";
import { Wrench, Gamepad2 } from "lucide-react";
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
                <div className="w-12 h-12 bg-gradient-to-br from-[#1b4086] to-[#f2791e] text-white rounded-full border-2 border-white dark:border-slate-800 shadow-lg flex items-center justify-center relative hover:scale-110 transition-transform gap-0.5">
                  <Wrench size={11} className="shrink-0 opacity-95" />
                  <Gamepad2 size={13} className="shrink-0" />
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-secondary border-2 border-white"></span>
                  </span>
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
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[22px] h-[22px] bg-gradient-to-br from-[#1b4086] to-[#f2791e] text-white rounded-full flex items-center justify-center shadow-sm z-20 border border-white gap-[1px]">
                  <Wrench size={7} className="shrink-0" />
                  <Gamepad2 size={8} className="shrink-0" />
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
