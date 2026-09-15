"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { useState } from "react";
import { FiX } from "react-icons/fi";
import SafeLottie from "@/components/ui/SafeLottie";

export default function FloatingKaryaPrompt() {
  const t = useTranslations("Footer");
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 left-4 md:bottom-8 md:left-8 z-[60] flex flex-col items-start pointer-events-none">
      <motion.div
        initial={{ y: 80, opacity: 0, scale: 0.8 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 1
        }}
        className="pointer-events-auto relative group"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ 
            repeat: Infinity, 
            duration: 2.5, 
            ease: "easeInOut" 
          }}
        >
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsVisible(false);
            }}
            className="absolute -top-3 -right-3 bg-surface text-on-surface-variant hover:text-red-500 rounded-full p-1.5 shadow-md border border-outline-variant/30 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            aria-label="Close"
          >
            <FiX size={16} />
          </button>

          <motion.a
            href="https://karya.stmik.tazkia.ac.id"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05, rotate: -1 }}
            whileTap={{ scale: 0.95, rotate: 1, y: 4 }}
            className="block bg-[#F2791E] border-2 border-b-[6px] border-[#c25c11] text-white rounded-2xl p-4 pr-5 shadow-2xl relative overflow-hidden"
          >
            {/* Glossy reflection effect */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/20 to-transparent opacity-50 pointer-events-none rounded-t-xl" />

            <div className="flex items-center gap-3 relative z-10">
              <div className="shrink-0 w-[76px] h-[76px] md:w-[86px] md:h-[86px] flex items-center justify-center -ml-4 -my-1 relative z-10">
                <div className="w-[125%] h-[125%] hover:scale-110 transition-transform duration-300">
                  <SafeLottie src="/animations/man_scope.lottie" loop autoplay className="w-full h-full" />
                </div>
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 border border-white/10 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
                  Platform Baru
                </div>
                <h4 className="font-extrabold text-sm md:text-base leading-tight mb-0.5 text-white">
                  {t("ctaTitle") || "Punya Karya Terbaik?"}
                </h4>
                <p className="text-xs md:text-sm text-white/90 font-medium flex items-center gap-1 mt-1">
                  {t("ctaBtn") || "Unggah Karya"} 
                  <motion.span 
                    animate={{ x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    className="material-symbols-outlined text-[14px]"
                  >
                    arrow_forward
                  </motion.span>
                </p>
              </div>
            </div>
          </motion.a>
        </motion.div>
      </motion.div>
    </div>
  );
}
