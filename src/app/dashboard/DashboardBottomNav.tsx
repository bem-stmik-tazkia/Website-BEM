"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiAward, FiUser, FiHome, FiLogOut } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";

export default function DashboardBottomNav() {
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
    { name: "Profil",  href: "/dashboard",        icon: <FiUser size={22} />, exact: true },
    { name: "Karya",   href: "/dashboard/karya",  icon: <FiAward size={22} />, exact: true },
    { name: "Beranda", href: "/",                 icon: <FiHome size={22} />, exact: true },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname?.startsWith(href);

  return (
    <>
      {/* ── Bottom Nav ── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <motion.nav
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="bg-white/80 dark:bg-surface/80 backdrop-blur-2xl border border-[var(--color-primary)]/30 shadow-[0_8px_30px_rgba(27,64,134,0.15)] px-3 py-2 rounded-full flex items-center gap-1 md:gap-2"
        >
          {navLinks.map((link) => (
            <Link key={link.name} href={link.href} className="relative group px-4 py-2.5 md:px-6 md:py-3 outline-none">
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className={`relative z-10 flex flex-row items-center justify-center gap-2 transition-colors duration-300 ${
                  isActive(link.href, link.exact) ? "text-white" : "text-on-surface-variant group-hover:text-primary"
                }`}
              >
                {link.icon}
                <span className="hidden md:inline text-sm font-bold">{link.name}</span>
              </motion.div>
              {isActive(link.href, link.exact) && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-secondary rounded-full -z-0 shadow-lg shadow-secondary/30"
                  initial={false}
                  transition={{ type: "spring", damping: 25, stiffness: 350 }}
                />
              )}
            </Link>
          ))}

          <div className="w-px h-8 bg-outline-variant/30 mx-1 md:mx-2" />

          {/* Keluar */}
          <button onClick={() => setShowLogoutConfirm(true)} className="relative group px-4 py-2.5 md:px-6 md:py-3 outline-none">
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="relative z-10 flex flex-row items-center justify-center gap-2 text-red-400 group-hover:text-red-500 transition-colors duration-300"
            >
              <FiLogOut size={22} />
              <span className="hidden md:inline text-sm font-bold">Keluar</span>
            </motion.div>
          </button>
        </motion.nav>
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
              <h3 className="text-xl font-bold text-on-surface mb-2">Konfirmasi Keluar</h3>
              <p className="text-on-surface-variant text-sm mb-8">Apakah kamu yakin ingin keluar dari akun ini?</p>
              <div className="flex w-full gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-on-surface bg-surface-variant hover:bg-outline-variant transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
                >
                  Ya, Keluar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
