"use client";

import React, { useState, useEffect } from "react";
import { Link, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { FiAward, FiUser, FiHome, FiLogOut } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";

export default function DashboardBottomNav() {
  const t = useTranslations("Dashboard");
  const pathname = usePathname();
  const supabase = createClient();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Scroll lock for logout modal
  useEffect(() => {
    if (showLogoutConfirm) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      document.documentElement.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      document.documentElement.style.overflow = "unset";
    };
  }, [showLogoutConfirm]);

  const navLinks = [
    { name: t("navProfile"),  href: "/dashboard",        icon: <FiUser className="w-5 h-5 md:w-[22px] md:h-[22px]" />, exact: true },
    { name: t("navKarya"),   href: "/dashboard/karya",  icon: <FiAward className="w-5 h-5 md:w-[22px] md:h-[22px]" />, exact: true },
    { name: t("navHome"), href: "/",                 icon: <FiHome className="w-5 h-5 md:w-[22px] md:h-[22px]" />, exact: true },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname?.startsWith(href);

  // Sembunyikan navigasi bawah saat berada di alur upload karya
  if (pathname?.startsWith("/dashboard/upload")) return null;

  return (
    <>
      {/* ── Bottom Nav & Language Switcher Container ── */}
      <div className="fixed bottom-8 md:bottom-10 left-1/2 -translate-x-1/2 z-40 flex flex-row items-center gap-2 md:gap-4 pointer-events-none">
        
        {/* Main Nav Pill */}
        <motion.nav
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="pointer-events-auto bg-white/80 dark:bg-surface/80 backdrop-blur-2xl border border-[var(--color-primary)]/30 shadow-[0_8px_30px_rgba(27,64,134,0.15)] px-3 py-2 rounded-full flex items-center gap-1 md:gap-2"
        >
          {navLinks.map((link) => (
            <Link key={link.name} href={link.href} className="relative group min-w-[60px] md:min-w-0 px-2 py-2 md:px-6 md:py-3 outline-none flex items-center justify-center">
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className={`relative z-10 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 transition-colors duration-300 ${
                  isActive(link.href, link.exact) ? "text-primary md:text-white" : "text-on-surface-variant group-hover:text-primary"
                }`}
              >
                {link.icon}
                <span className="text-[10px] md:text-sm font-bold">{link.name}</span>
              </motion.div>
              {isActive(link.href, link.exact) && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary/15 md:bg-primary rounded-xl md:rounded-full -z-0 md:shadow-lg md:shadow-primary/30"
                  initial={false}
                  transition={{ type: "spring", damping: 25, stiffness: 350 }}
                />
              )}
            </Link>
          ))}

          <div className="w-px h-8 bg-outline-variant/30 mx-0.5 md:mx-2" />

          {/* Keluar */}
          <button onClick={() => setShowLogoutConfirm(true)} className="relative group min-w-[60px] md:min-w-0 px-2 py-2 md:px-6 md:py-3 outline-none flex items-center justify-center">
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 text-red-400 group-hover:text-red-500 transition-colors duration-300"
            >
              <FiLogOut className="w-5 h-5 md:w-[22px] md:h-[22px]" />
              <span className="text-[10px] md:text-sm font-bold">{t("navLogout")}</span>
            </motion.div>
          </button>
        </motion.nav>

        {/* Language Switcher Pill - Desktop (Bottom Right next to nav) */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", damping: 20, stiffness: 300, delay: 0.1 }}
          className="pointer-events-auto hidden md:block"
        >
          <LanguageSwitcher bottomNavMode={true} />
        </motion.div>
      </div>

      {/* Language Switcher - Mobile (Top Left) */}
      <div className="fixed top-5 left-4 z-[60] md:hidden">
        <LanguageSwitcher bottomNavMode={true} />
      </div>

      {/* ── Logout Confirm Modal ── */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="relative bg-surface rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center border border-outline-variant/20 z-10"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
                <FiLogOut size={28} />
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2">{t("navLogoutConfirmTitle")}</h3>
              <p className="text-on-surface-variant text-sm mb-8">{t("navLogoutConfirmDesc")}</p>
              <div className="flex w-full gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-on-surface bg-surface-variant hover:bg-outline-variant transition-colors"
                >
                  {t("navCancel")}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
                >
                  {t("navYesLogout")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
