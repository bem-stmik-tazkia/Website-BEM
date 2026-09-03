"use client";

import { useState, useEffect, useRef } from "react";
import { Link } from "@/i18n/routing";
import NativeLink from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { FiHome, FiCalendar, FiBookOpen, FiUser, FiLogOut, FiChevronDown } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import AdminNotificationBell from "@/app/(internal)/admin/AdminNotificationBell";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";

export default function Navbar({ isLoggedIn: initialIsLoggedIn }: { isLoggedIn?: boolean }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeBottomSheet, setActiveBottomSheet] = useState<'more' | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [hideProfileTooltip, setHideProfileTooltip] = useState(true);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";
  const supabase = createClient();

  const currentPath = pendingPath || pathname;

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
        setUserProfile({ ...user, ...profile });
      } else {
        setUserProfile(null);
      }
    };
    fetchUser();
  }, [supabase]);

  // Pre-fetch main routes for instant navigation response on mobile
  useEffect(() => {
    router.prefetch("/");
    router.prefetch("/agenda");
    router.prefetch("/berita");
    router.prefetch("/kabinet");
    router.prefetch("/dokumentasi");
  }, [router]);



  // Handle click outside for profile dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserProfile(null);
    setShowProfileMenu(false);
    setShowLogoutConfirm(false);
    window.location.href = '/';
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setPendingPath(null);
    setActiveBottomSheet(null);
  }, [pathname]);

  const t = useTranslations("Navigation");

  const navLinks = [
    { name: t("home"), path: "/" },
    { name: t("agenda"), path: "/agenda" },
    { name: t("news"), path: "/berita" },
    { name: t("documentation"), path: "/dokumentasi" },
    { name: t("menuCab"), path: "/kabinet" },
    { name: t("menuFeedback"), path: "/#saran" },
  ];

  return (
    <>
      <nav
        id="navbar"
        className={`fixed top-0 w-full z-50 transition-all duration-300 ease-in-out border-b ${isScrolled
          ? "bg-surface border-outline-variant/50 shadow-md"
          : "bg-transparent border-transparent"
          }`}
      >
        <div className="flex justify-between items-center h-20 md:h-24 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto gap-4">
          <Link href="/" className="flex items-center gap-2 md:gap-3 group shrink-0">
            <div className="flex items-center gap-1.5 md:gap-2">
              <Image
                alt="BEM STMIK Tazkia Logo 1"
                src="/images/logo.webp"
                width={64}
                height={64}
                priority
                className="h-10 w-auto md:h-12 lg:h-14 object-contain group-hover:scale-105 transition-transform duration-300"
              />
              <Image
                alt="BEM STMIK Tazkia Logo 2"
                src="/images/logo2.webp"
                width={64}
                height={64}
                priority
                className="h-10 w-auto md:h-12 lg:h-14 object-contain group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="flex flex-row items-center gap-1.5">
              <span
                className={`font-bold leading-none text-lg md:text-xl transition-colors duration-300 ${isScrolled ? "text-primary" : isHome ? "text-white" : "text-primary"
                  }`}
              >
                BEM STMIK
              </span>
              <span
                className={`font-bold leading-none text-lg md:text-xl transition-colors duration-300 ${isScrolled ? "text-secondary" : isHome ? "text-white" : "text-secondary"
                  }`}
              >
                Tazkia
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex lg:gap-4 xl:gap-8 items-center font-semibold text-sm">
            {navLinks.map((link) => {
              const isActive = pathname === link.path;
              return (
                <Link
                  key={link.name}
                  href={link.path!}
                  className={`relative py-2 transition-colors duration-300 after:absolute after:bottom-[-4px] after:left-0 after:h-1 after:rounded-full after:transition-all after:duration-300 ${isActive
                    ? `font-bold after:w-full after:bg-secondary ${isScrolled ? "text-primary" : isHome ? "text-white" : "text-primary"}`
                    : isScrolled
                      ? "text-on-surface-variant after:w-0 hover:after:w-full after:bg-primary hover:text-primary"
                      : isHome
                        ? "text-white/80 after:w-0 hover:after:w-full after:bg-surface hover:text-white"
                        : "text-on-surface-variant after:w-0 hover:after:w-full after:bg-primary hover:text-primary"
                    }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Action Button (Mobile, Tablet, Desktop) */}
          <div id="tour-login-btn" className="flex items-center gap-2 md:gap-3 ml-auto lg:ml-0">
            <LanguageSwitcher />
            {userProfile && userProfile.role === 'admin' && (
              <AdminNotificationBell isScrolled={isScrolled} isHome={isHome} />
            )}
            {userProfile && (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className={`flex items-center gap-3 ml-1 md:ml-2 p-1.5 md:p-2 pr-3 md:pr-4 rounded-full border transition-all ${showProfileMenu
                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/30"
                    : isScrolled
                      ? "bg-surface border-outline-variant/30 hover:border-primary/50 hover:bg-primary/5 text-on-surface"
                      : isHome
                        ? "bg-surface/10 border-white/20 hover:bg-surface/20 hover:border-white/40 text-white"
                        : "bg-surface border-outline-variant/30 hover:border-primary/50 hover:bg-primary/5 text-on-surface"
                    }`}
                >
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-sm">
                    {userProfile.user_metadata?.avatar_url || userProfile.user_metadata?.picture || userProfile.raw_user_meta_data?.avatar_url || userProfile.raw_user_meta_data?.picture ? (
                      <img src={userProfile.user_metadata?.avatar_url || userProfile.user_metadata?.picture || userProfile.raw_user_meta_data?.avatar_url || userProfile.raw_user_meta_data?.picture} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      userProfile.full_name ? userProfile.full_name.charAt(0).toUpperCase() : 'U'
                    )}
                  </div>
                  <div className="hidden md:flex flex-col items-start max-w-[120px]">
                    <span className="text-xs font-bold truncate w-full block">{userProfile.full_name || 'User'}</span>
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${isScrolled ? "text-primary" : isHome ? "text-white/70" : "text-primary"}`}>
                      {userProfile.role || 'USER'}
                    </span>
                  </div>
                  <FiChevronDown className={`transition-transform ${showProfileMenu ? 'rotate-180' : ''} text-sm md:text-base`} />
                </button>



                <AnimatePresence>
                  {showProfileMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-3 w-56 bg-surface rounded-2xl shadow-xl border border-outline-variant/30 overflow-hidden py-2 z-50"
                    >
                      <div className="px-4 py-3 border-b border-outline-variant/20 mb-2 md:hidden">
                        <p className="text-sm font-bold text-on-surface truncate">{userProfile.full_name || 'User'}</p>
                        <p className="text-xs text-on-surface-variant truncate">{userProfile.email}</p>
                        <span className="inline-block mt-1 bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">{userProfile.role || 'USER'}</span>
                      </div>
                      <div className="hidden md:block px-4 py-3 border-b border-outline-variant/20 mb-2">
                        <p className="text-sm font-bold text-on-surface truncate">{userProfile.full_name}</p>
                        <p className="text-xs text-on-surface-variant truncate">{userProfile.email}</p>
                      </div>

                      {userProfile.role === 'admin' && (
                        <NativeLink
                          href="/admin"
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          <FiGrid size={16} />
                          {t("dashboardAdmin")}
                        </NativeLink>
                      )}


                      <div className="h-px bg-outline-variant/20 my-1 mx-4"></div>

                      <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-500/10 transition-colors text-left"
                      >
                        <FiLogOut size={16} />
                        {t("logout")}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Top Loading Progress Line for Instant Page Route Feedback */}
      {pendingPath !== null && (
        <div className="fixed top-0 left-0 right-0 z-[100] h-1.5 bg-gradient-to-r from-primary via-secondary to-primary animate-pulse shadow-md" />
      )}

      {/* Mobile & Tablet Bottom Navigation Bar */}
      <>
        <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50 bg-surface/95 backdrop-blur-lg border-t border-outline-variant/30 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] pb-5 pt-2 px-1 flex justify-between items-center rounded-t-3xl touch-manipulation">
            <Link
              href="/"
              onClick={() => { setPendingPath("/"); setActiveBottomSheet(null); }}
              className={`flex-1 flex flex-col items-center gap-0.5 transition-transform active:scale-95 ${currentPath === "/" ? "text-secondary" : "text-on-surface-variant hover:text-primary"}`}
            >
              <FiHome size={20} className={currentPath === "/" ? "fill-secondary/20" : ""} />
              <span className="text-[9px] font-bold">{t("home")}</span>
            </Link>

            <Link
              href="/agenda"
              onClick={() => { setPendingPath("/agenda"); setActiveBottomSheet(null); }}
              className={`flex-1 flex flex-col items-center gap-0.5 transition-transform active:scale-95 ${currentPath.startsWith("/agenda") ? "text-secondary" : "text-on-surface-variant hover:text-primary"}`}
            >
              <FiCalendar size={20} className={currentPath.startsWith("/agenda") ? "fill-secondary/20" : ""} />
              <span className="text-[9px] font-bold">{t("agenda")}</span>
            </Link>



            <Link
              href="/berita"
              onClick={() => { setPendingPath("/berita"); setActiveBottomSheet(null); }}
              className={`flex-1 flex flex-col items-center gap-0.5 transition-transform active:scale-95 ${currentPath.startsWith("/berita") ? "text-secondary" : "text-on-surface-variant hover:text-primary"}`}
            >
              <FiBookOpen size={20} className={currentPath.startsWith("/berita") ? "fill-secondary/20" : ""} />
              <span className="text-[9px] font-bold">{t("menuNews")}</span>
            </Link>

            <Link
              href="/dokumentasi"
              onClick={() => { setPendingPath("/dokumentasi"); setActiveBottomSheet(null); }}
              className={`flex-1 flex flex-col items-center gap-0.5 transition-transform active:scale-95 ${currentPath.startsWith("/dokumentasi") ? "text-secondary" : "text-on-surface-variant hover:text-primary"}`}
            >
              <span className={`material-symbols-outlined text-[20px] ${currentPath.startsWith("/dokumentasi") ? "text-secondary" : ""}`}>photo_library</span>
              <span className="text-[9px] font-bold">{t("menuDoc")}</span>
            </Link>

            <Link
              href="/kabinet"
              onClick={() => { setPendingPath("/kabinet"); setActiveBottomSheet(null); }}
              className={`flex-1 flex flex-col items-center gap-0.5 transition-transform active:scale-95 ${currentPath.startsWith("/kabinet") ? "text-secondary" : "text-on-surface-variant hover:text-primary"}`}
            >
              <FiUser size={20} className={currentPath.startsWith("/kabinet") ? "fill-secondary/20" : ""} />
              <span className="text-[9px] font-bold">{t("menuCab")}</span>
            </Link>
          </nav>
        </>


      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-surface rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center border border-outline-variant/20"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
                <FiLogOut size={28} />
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2">{t("logoutConfirmTitle")}</h3>
              <p className="text-on-surface-variant text-sm mb-8">{t("logoutConfirmDesc")}</p>
              <div className="flex w-full gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-on-surface bg-surface-variant hover:bg-outline-variant transition-colors"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
                >
                  {t("yesLogout")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
