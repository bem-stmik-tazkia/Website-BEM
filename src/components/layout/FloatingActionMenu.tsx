"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { SiWhatsapp } from "react-icons/si";
import { FiX, FiPlus, FiHelpCircle } from "react-icons/fi";
import { createClient } from "@/utils/supabase/client";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";

export default function FloatingActionMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState<string>("");
  const [hasTour, setHasTour] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const router = useRouter();
  const pathname = usePathname();
  
  // Translation hooks
  const tSpinner = useTranslations("Spinner");
  
  // WhatsApp logic
  useEffect(() => {
    async function fetchPhone() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("system_settings")
          .select("value")
          .eq("key", "admin_whatsapp")
          .maybeSingle();
        if (!error && data?.value) setPhone(data.value);
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

  const showSpinner = !pathname.includes("/tools/acak-nama");

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.8 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 10, scale: 0.8 }
  };

  return (
    <div className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-[60] flex flex-col items-end" ref={menuRef}>
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

            {/* Spinner Option */}
            {showSpinner && (
              <motion.button
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={() => {
                  setIsOpen(false);
                  router.push("/tools/acak-nama");
                }}
                className="flex items-center gap-3 group"
              >
                <span className="bg-surface text-on-surface-variant font-bold text-sm px-3 py-1.5 rounded-lg shadow-md border border-outline-variant/30 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {tSpinner("title") || "Alat Acak"}
                </span>
                <div className="w-12 h-12 bg-white dark:bg-inverse-surface backdrop-blur-md rounded-full border-2 border-secondary shadow-glow flex items-center justify-center overflow-hidden relative hover:scale-110 transition-transform">
                  <motion.div
                    className="w-8 h-8 rounded-full shadow-inner"
                    style={{
                      background:
                        "conic-gradient(#1b4086 0deg 60deg, #f2791e 60deg 120deg, #1b4086 120deg 180deg, #f2791e 180deg 240deg, #1b4086 240deg 300deg, #f2791e 300deg 360deg)",
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 3.5, ease: "linear" }}
                  />
                  <div className="absolute w-2 h-2 bg-white dark:bg-inverse-surface rounded-full shadow-sm z-10 border-2 border-secondary" />
                  <div className="absolute top-1.5 w-0 h-0 border-l-[3px] border-r-[3px] border-t-[5px] border-l-transparent border-r-transparent border-t-white drop-shadow-sm z-20" />
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
        className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all relative"
        aria-label="Menu Aksi"
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <FiPlus size={28} />
        </motion.div>
        {!isOpen && (
          <span className="absolute w-full h-full rounded-full bg-primary opacity-30 animate-ping" style={{ animationDuration: '3s' }}></span>
        )}
      </motion.button>
    </div>
  );
}
