"use client";

import { useState, useEffect, useRef } from "react";
import { Link } from "@/i18n/routing";
import NativeLink from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { FiHome, FiCalendar, FiBookOpen, FiUser, FiLogOut, FiChevronDown, FiGrid, FiEdit3, FiSettings } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import AdminNotificationBell from "@/app/(internal)/admin/AdminNotificationBell";
import StudentNotificationBell from "@/components/notifications/StudentNotificationBell";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import ProfileSettingsModal from "@/components/profile/ProfileSettingsModal";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UserProfile = Record<string, any>;

export default function Navbar({ isLoggedIn: _isLoggedIn }: { isLoggedIn?: boolean }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeBottomSheet, setActiveBottomSheet] = useState<'more' | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);



  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";
  const supabase = createClient();

  const currentPath = pendingPath || pathname;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        // Ignore stale/invalid refresh token errors — user is simply not logged in
        if (error && (error as { code?: string }).code === 'refresh_token_not_found') {
          await supabase.auth.signOut({ scope: 'local' });
          setUserProfile(null);
          return;
        }
        if (user) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
          let effectiveRole = profile?.role || 'mahasiswa';
          try {
            const { data: isRpcAdmin } = await supabase.rpc('is_admin');
            if (isRpcAdmin === true) {
              effectiveRole = 'admin';
            } else if (effectiveRole === 'admin') {
              effectiveRole = 'mahasiswa';
            }
          } catch {
            // Biarkan fallback ke profile?.role jika RPC offline
          }
          // Auto-sinkronisasi avatar akun ke public.profiles jika belum tersimpan

          const userAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

          if (userAvatar && profile && (!profile.avatar_url || profile.avatar_url !== userAvatar)) {

            await supabase.from('profiles').update({ avatar_url: userAvatar }).eq('id', user.id);

            profile.avatar_url = userAvatar;

          }



          setUserProfile({ ...user, ...profile, role: effectiveRole });
        } else {
          setUserProfile(null);
        }
      } catch {
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



  // Handle click outside for profile dropdown & nav dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
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

  // Reset pendingPath when route changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setPendingPath(null);
    setActiveBottomSheet(null);
  }, [pathname]);

  const t = useTranslations("Navigation");

  const navItems = [
    { type: "link", name: t("home"), path: "/" },
    { type: "link", name: t("menuCab"), path: "/kabinet" },
    {
      type: "dropdown",
      id: "activities",
      name: t("activities"),
      items: [
        { name: t("agenda"), path: "/agenda", desc: t("menuAgendaDesc") },
        { name: t("documentation"), path: "/dokumentasi", desc: t("menuDocDesc") },
      ],
    },
    {
      type: "dropdown",
      id: "publications",
      name: t("publications"),
      items: [
        { name: t("news"), path: "/berita", desc: t("menuNewsDesc") },
        { name: t("studentArticles"), path: "/artikel", desc: t("menuArticlesDesc") },
      ],
    },
    { type: "link", name: t("menuFeedback"), path: "/#saran" },
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
        <div className="flex justify-between items-center h-20 md:h-24 px-2.5 sm:px-4 md:px-6 lg:px-8 max-w-7xl mx-auto gap-1.5 sm:gap-4">
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2 md:gap-3 group shrink-0">
            <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 shrink-0">
              <Image
                alt="BEM STMIK Tazkia Logo 1"
                src="/images/logo.webp"
                width={64}
                height={64}
                priority
                className="h-7 sm:h-9 md:h-12 lg:h-14 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
              />
              <Image
                alt="BEM STMIK Tazkia Logo 2"
                src="/images/logo2.webp"
                width={64}
                height={64}
                priority
                className="h-7 sm:h-9 md:h-12 lg:h-14 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="flex flex-row items-center gap-1 sm:gap-1.5 shrink-0">
              <span
                className={`font-bold leading-none text-xs sm:text-base md:text-xl transition-colors duration-300 whitespace-nowrap ${isScrolled ? "text-primary" : isHome ? "text-white" : "text-primary"
                  }`}
              >
                BEM STMIK
              </span>
              <span
                className={`font-bold leading-none text-xs sm:text-base md:text-xl transition-colors duration-300 whitespace-nowrap ${isScrolled ? "text-secondary" : isHome ? "text-white" : "text-secondary"
                  }`}
              >
                Tazkia
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links dengan Dropdown Menu Rapi */}
          <div ref={dropdownRef} className="hidden lg:flex lg:gap-4 xl:gap-7 items-center font-semibold text-sm">
            {navItems.map((item) => {
              if (item.type === "dropdown") {
                const isAnyChildActive = item.items?.some((sub) => pathname.startsWith(sub.path));
                const isOpen = openDropdown === item.id;
                return (
                  <div
                    key={item.id}
                    className="relative"
                    onMouseEnter={() => setOpenDropdown(item.id || null)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenDropdown(isOpen ? null : (item.id || null))}
                      className={`relative py-2 transition-colors duration-300 flex items-center gap-1.5 cursor-pointer after:absolute after:bottom-[-4px] after:left-0 after:h-1 after:rounded-full after:transition-all after:duration-300 ${
                        isAnyChildActive
                          ? `font-bold after:w-full after:bg-secondary ${isScrolled ? "text-primary" : isHome ? "text-white" : "text-primary"}`
                          : isScrolled
                          ? "text-on-surface-variant after:w-0 hover:after:w-full after:bg-primary hover:text-primary"
                          : isHome
                          ? "text-white/80 after:w-0 hover:after:w-full after:bg-surface hover:text-white"
                          : "text-on-surface-variant after:w-0 hover:after:w-full after:bg-primary hover:text-primary"
                      }`}
                    >
                      <span>{item.name}</span>
                      <FiChevronDown className={`transition-transform duration-200 text-xs ${isOpen ? "rotate-180" : ""}`} />
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.96 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 mt-1 w-56 bg-surface rounded-2xl shadow-xl border border-outline-variant/30 overflow-hidden p-2 z-50"
                        >
                          {item.items?.map((sub) => {
                            const isSubActive = pathname.startsWith(sub.path);
                            return (
                              <Link
                                key={sub.path}
                                href={sub.path}
                                onClick={() => setOpenDropdown(null)}
                                className={`block px-3.5 py-2.5 rounded-xl transition-colors ${
                                  isSubActive
                                    ? "bg-primary/10 text-primary font-bold"
                                    : "hover:bg-surface-variant/40 text-on-surface"
                                }`}
                              >
                                <p className="text-xs font-bold leading-tight">{sub.name}</p>
                                <p className="text-[10px] text-on-surface-variant mt-0.5 line-clamp-1">{sub.desc}</p>
                              </Link>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.name}
                  href={item.path!}
                  className={`relative py-2 transition-colors duration-300 after:absolute after:bottom-[-4px] after:left-0 after:h-1 after:rounded-full after:transition-all after:duration-300 ${isActive
                    ? `font-bold after:w-full after:bg-secondary ${isScrolled ? "text-primary" : isHome ? "text-white" : "text-primary"}`
                    : isScrolled
                      ? "text-on-surface-variant after:w-0 hover:after:w-full after:bg-primary hover:text-primary"
                      : isHome
                        ? "text-white/80 after:w-0 hover:after:w-full after:bg-surface hover:text-white"
                        : "text-on-surface-variant after:w-0 hover:after:w-full after:bg-primary hover:text-primary"
                    }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Action Button (Mobile, Tablet, Desktop) */}
          <div id="tour-login-btn" className="flex items-center gap-1.5 sm:gap-2.5 md:gap-3 ml-auto lg:ml-0 shrink-0">
            {/* CTA Portal Karya (Mobile) Removed in favor of FloatingKaryaPrompt */}
            
            <LanguageSwitcher />
            {userProfile && userProfile.role === 'admin' && (
              <AdminNotificationBell isScrolled={isScrolled} isHome={isHome} />
            )}
            {userProfile && userProfile.role === 'mahasiswa' && (
              <StudentNotificationBell isScrolled={isScrolled} isHome={isHome} />
            )}
            {userProfile ? (
              <div className="relative shrink-0" ref={profileMenuRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className={`flex items-center gap-1 sm:gap-1.5 md:gap-3 p-0.5 sm:p-1.5 md:p-2 pr-1.5 sm:pr-2.5 md:pr-4 rounded-full border transition-all ${showProfileMenu
                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/30"
                    : isScrolled
                      ? "bg-surface border-outline-variant/30 hover:border-primary/50 hover:bg-primary/5 text-on-surface"
                      : isHome
                        ? "bg-surface/10 border-white/20 hover:bg-surface/20 hover:border-white/40 text-white"
                        : "bg-surface border-outline-variant/30 hover:border-primary/50 hover:bg-primary/5 text-on-surface"
                    }`}
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 overflow-hidden shadow-sm ring-1 ring-white/20">
                    {userProfile.user_metadata?.avatar_url || userProfile.user_metadata?.picture || userProfile.raw_user_meta_data?.avatar_url || userProfile.raw_user_meta_data?.picture ? (
                      <Image
                        src={userProfile.user_metadata?.avatar_url || userProfile.user_metadata?.picture || userProfile.raw_user_meta_data?.avatar_url || userProfile.raw_user_meta_data?.picture}
                        alt="Profile"
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      userProfile.full_name ? userProfile.full_name.charAt(0).toUpperCase() : 'U'
                    )}
                  </div>
                  <div className="hidden md:flex flex-col items-start max-w-[120px] lg:max-w-[160px] leading-tight">
                    <span className="text-xs font-bold truncate w-full block">{userProfile.full_name || 'User'}</span>
                    <span className={`text-[10px] uppercase font-bold tracking-wider transition-colors ${
                      showProfileMenu
                        ? "text-white/80"
                        : isScrolled
                          ? "text-primary"
                          : isHome
                            ? "text-white/70"
                            : "text-primary"
                    }`}>
                      {userProfile.role === 'mahasiswa' ? t("roleMahasiswa") : userProfile.role === 'admin' ? t("roleAdmin") : (userProfile.role || 'USER')}
                    </span>
                  </div>
                  <FiChevronDown className={`transition-transform ${showProfileMenu ? 'rotate-180' : ''} text-xs sm:text-sm md:text-base shrink-0`} />
                </button>

                {/* Mobile backdrop for profile menu */}
                <AnimatePresence>
                  {showProfileMenu && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-40 sm:hidden"
                      onClick={() => setShowProfileMenu(false)}
                    />
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {showProfileMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 sm:mt-3 w-56 max-w-[calc(100vw-24px)] bg-surface rounded-2xl shadow-xl border border-outline-variant/30 overflow-hidden py-2 z-50"
                    >
                      <div className="px-4 py-3 border-b border-outline-variant/20 mb-2 md:hidden">
                        <p className="text-sm font-bold text-on-surface truncate">{userProfile.full_name || 'User'}</p>
                        <p className="text-xs text-on-surface-variant truncate">{userProfile.email}</p>
                        <span className="inline-block mt-1 bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                          {userProfile.role === 'mahasiswa' ? t("roleMahasiswa") : userProfile.role === 'admin' ? t("roleAdmin") : (userProfile.role || 'USER')}
                        </span>
                      </div>
                      <div className="hidden md:block px-4 py-3 border-b border-outline-variant/20 mb-2">
                        <p className="text-sm font-bold text-on-surface truncate">{userProfile.full_name}</p>
                        <p className="text-xs text-on-surface-variant truncate">{userProfile.email}</p>
                      </div>

                      {userProfile.role === 'admin' ? (
                        <NativeLink
                          href="/admin"
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          <FiGrid size={16} />
                          {t("dashboardAdmin")}
                        </NativeLink>
                      ) : (
                        <Link
                          href="/dashboard/artikel"
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          <FiEdit3 size={16} />
                          {t("myArticles")}
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setShowProfileMenu(false);
                          setShowProfileSettings(true);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-primary/10 hover:text-primary transition-colors text-left cursor-pointer"
                      >
                        <FiSettings size={16} />
                        <span>{t("profileSettings")}</span>
                      </button>


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
            ) : (
              <NativeLink
                href="/masuk"
                className={`inline-flex items-center justify-center px-3.5 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-bold rounded-full border transition-all ${
                  isScrolled
                    ? "border-primary/30 text-primary hover:bg-primary/5"
                    : isHome
                      ? "border-white/40 text-white hover:bg-white/10"
                      : "border-primary/30 text-primary hover:bg-primary/5"
                }`}
              >
                {t("login")}
              </NativeLink>
            )}
          </div>
        </div>
      </nav>

      {/* Top Loading Progress Line for Instant Page Route Feedback */}
      {pendingPath !== null && (
        <div className="fixed top-0 left-0 right-0 z-[100] h-1.5 bg-secondary shadow-md" />
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
              href="/artikel"
              onClick={() => { setPendingPath("/artikel"); setActiveBottomSheet(null); }}
              className={`flex-1 flex flex-col items-center gap-0.5 transition-transform active:scale-95 ${currentPath.startsWith("/artikel") ? "text-secondary" : "text-on-surface-variant hover:text-primary"}`}
            >
              <FiEdit3 size={20} className={currentPath.startsWith("/artikel") ? "fill-secondary/20" : ""} />
              <span className="text-[9px] font-bold">{t("studentArticles")}</span>
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


            {/* Modal Pengaturan Profil Pengguna */}
      <ProfileSettingsModal
        isOpen={showProfileSettings}
        onClose={() => setShowProfileSettings(false)}
        userProfile={userProfile}
        onProfileUpdated={(updated) => {
          setUserProfile((prev: UserProfile | null) => ({ ...prev, ...updated }));
        }}
      />

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
