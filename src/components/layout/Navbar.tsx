"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { FiHome, FiAward, FiCalendar, FiBookOpen, FiUser, FiUsers, FiLogOut, FiChevronDown, FiGrid, FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import UserNotificationBell from "@/components/layout/UserNotificationBell";
import AdminNotificationBell from "@/app/admin/AdminNotificationBell";

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
  const isDashboard = pathname?.startsWith("/dashboard");
  const supabase = createClient();

  const currentPath = pendingPath || pathname;

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
        const { data: mhsProfile } = await supabase.from('mahasiswa_profiles').select('angkatan').eq('user_id', user.id).maybeSingle();
        setUserProfile({ ...user, ...profile, has_completed_profile: !!mhsProfile?.angkatan });
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
    router.prefetch("/karya");
    router.prefetch("/mahasiswa");
    router.prefetch("/berita");
    router.prefetch("/kabinet");
    router.prefetch("/dokumentasi");
  }, [router]);

  useEffect(() => {
    if (userProfile && userProfile.has_completed_profile === false) {
      const hasSeen = localStorage.getItem("hasSeenProfileTooltip");
      if (!hasSeen) {
        setHideProfileTooltip(false);
        const timer = setTimeout(() => {
          setHideProfileTooltip(true);
          localStorage.setItem("hasSeenProfileTooltip", "true");
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [userProfile]);

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

  const navLinks = [
    { name: "Beranda", path: "/" },
    { name: "Karya", path: "/karya" },
    { name: "Mahasiswa", path: "/mahasiswa" },
    { name: "Agenda", path: "/agenda" },
    {
      name: "Publikasi",
      dropdown: true,
      children: [
        { name: "Berita", path: "/berita" },
        { name: "Dokumentasi", path: "/dokumentasi" }
      ]
    },
    {
      name: "Profil BEM",
      dropdown: true,
      children: [
        { name: "Kabinet", path: "/kabinet" },
        { name: "Kotak Saran/Aduan", path: "/#saran" }
      ]
    },
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
                src="/images/logo.png"
                width={64}
                height={64}
                priority
                className="h-10 w-auto md:h-12 lg:h-14 object-contain group-hover:scale-105 transition-transform duration-300"
              />
              <Image
                alt="BEM STMIK Tazkia Logo 2"
                src="/images/logo2.png"
                width={64}
                height={64}
                priority
                className="h-10 w-auto md:h-12 lg:h-14 object-contain group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="hidden sm:flex flex-row items-center gap-1.5">
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
              if (link.dropdown) {
                const isActive = link.children?.some(child => pathname === child.path);
                return (
                  <div key={link.name} className="relative group">
                    <button
                      className={`flex items-center gap-1 py-2 transition-colors duration-300 after:absolute after:bottom-[-4px] after:left-0 after:h-1 after:rounded-full after:transition-all after:duration-300 ${isActive
                          ? `font-bold after:w-full after:bg-secondary ${isScrolled ? "text-primary" : isHome ? "text-white" : "text-primary"}`
                          : isScrolled
                            ? "text-on-surface-variant after:w-0 hover:after:w-full after:bg-primary hover:text-primary"
                            : isHome
                              ? "text-white/80 after:w-0 hover:after:w-full after:bg-surface hover:text-white"
                              : "text-on-surface-variant after:w-0 hover:after:w-full after:bg-primary hover:text-primary"
                        }`}
                    >
                      {link.name}
                      <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {/* Dropdown Menu */}
                    <div className="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 min-w-[200px]">
                      <div className="bg-surface rounded-xl shadow-lg border border-outline-variant/30 py-2 overflow-hidden flex flex-col">
                        {link.children?.map((child) => (
                          <Link
                            key={child.name}
                            href={child.path}
                            className="px-4 py-2.5 text-on-surface-variant hover:bg-primary-container hover:text-primary transition-colors text-sm font-semibold"
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

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
          <div className="flex items-center ml-auto lg:ml-0 gap-2 md:gap-3">
            {userProfile && (
              userProfile.role === 'admin' ? (
                <AdminNotificationBell isScrolled={isScrolled} isHome={isHome} />
              ) : (
                <UserNotificationBell isScrolled={isScrolled} isHome={isHome} />
              )
            )}
            {userProfile ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className={`flex items-center md:gap-2 md:pl-2 md:pr-4 md:py-1.5 rounded-full md:border transition-all md:hover:shadow-soft ${
                    isScrolled
                      ? "md:bg-surface md:border-outline-variant/50 text-on-surface hover:text-primary md:hover:border-primary"
                      : isHome
                        ? "md:bg-surface/10 md:backdrop-blur-md md:border-white/20 text-white hover:text-white/80 md:hover:bg-surface/20"
                        : "md:bg-surface/80 md:backdrop-blur-md md:border-outline-variant/30 text-on-surface hover:text-primary md:hover:border-primary"
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

                {!hideProfileTooltip && userProfile?.has_completed_profile === false && (
                  <div className="absolute top-full right-0 mt-4 mr-2 md:mr-0 z-50 animate-bounce cursor-pointer" onClick={() => { setHideProfileTooltip(true); localStorage.setItem("hasSeenProfileTooltip", "true"); }}>
                    <div className="bg-[var(--color-secondary)] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-secondary/30 relative whitespace-nowrap flex items-center gap-2">
                      <span>Tempat profilmu ada di sini, ayo sesuaikan!</span>
                      <button className="text-white/80 hover:text-white" onClick={(e) => { e.stopPropagation(); setHideProfileTooltip(true); localStorage.setItem("hasSeenProfileTooltip", "true"); }}>
                        <FiX size={14} />
                      </button>
                      {/* Triangle Pointer */}
                      <div className="absolute -top-1.5 right-6 w-3 h-3 bg-[var(--color-secondary)] rotate-45 rounded-sm"></div>
                    </div>
                  </div>
                )}

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

                      <Link
                        href={userProfile.role === 'admin' ? '/admin' : '/dashboard'}
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        <FiGrid size={16} />
                        Dashboard {userProfile.role === 'admin' ? 'Admin' : 'Karya'}
                      </Link>

                      <div className="h-px bg-outline-variant/20 my-1 mx-4"></div>

                      <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-500/10 transition-colors text-left"
                      >
                        <FiLogOut size={16} />
                        Keluar
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                href="/login"
                className={`ml-2 md:ml-4 px-5 py-2 md:px-8 md:py-3 rounded-full font-semibold text-sm md:text-base transition-all hover:-translate-y-0.5 shadow-soft ${isScrolled
                    ? "bg-secondary text-on-primary hover:bg-secondary/90 shadow-secondary/30"
                    : isHome
                      ? "bg-surface/15 backdrop-blur-md border border-white/40 text-white hover:bg-secondary hover:border-secondary"
                      : "bg-secondary text-on-primary hover:bg-secondary/90 shadow-secondary/30"
                  }`}
              >
                Masuk
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Top Loading Progress Line for Instant Page Route Feedback */}
      {pendingPath !== null && (
        <div className="fixed top-0 left-0 right-0 z-[100] h-1.5 bg-gradient-to-r from-primary via-secondary to-primary animate-pulse shadow-md" />
      )}

      {/* Mobile & Tablet Bottom Navigation Bar */}
      {!isDashboard && (
        <>
          <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50 bg-surface/95 backdrop-blur-lg border-t border-outline-variant/30 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] pb-5 pt-2 px-1 flex justify-between items-center rounded-t-3xl touch-manipulation">
        <Link 
          href="/" 
          onClick={() => { setPendingPath("/"); setActiveBottomSheet(null); }} 
          className={`flex-1 flex flex-col items-center gap-0.5 transition-transform active:scale-95 ${currentPath === "/" ? "text-secondary" : "text-on-surface-variant hover:text-primary"}`}
        >
          <FiHome size={20} className={currentPath === "/" ? "fill-secondary/20" : ""} />
          <span className="text-[9px] font-bold">Beranda</span>
        </Link>

        <Link 
          href="/agenda" 
          onClick={() => { setPendingPath("/agenda"); setActiveBottomSheet(null); }} 
          className={`flex-1 flex flex-col items-center gap-0.5 transition-transform active:scale-95 ${currentPath.startsWith("/agenda") ? "text-secondary" : "text-on-surface-variant hover:text-primary"}`}
        >
          <FiCalendar size={20} className={currentPath.startsWith("/agenda") ? "fill-secondary/20" : ""} />
          <span className="text-[9px] font-bold">Agenda</span>
        </Link>

        <Link 
          href="/karya" 
          onClick={() => { setPendingPath("/karya"); setActiveBottomSheet(null); }} 
          className={`flex-1 flex flex-col items-center gap-0.5 transition-transform active:scale-95 ${currentPath.startsWith("/karya") ? "text-secondary" : "text-on-surface-variant hover:text-primary"}`}
        >
          <div className="bg-primary text-white p-2.5 rounded-full -mt-5 shadow-glow border-4 border-white flex items-center justify-center">
            <FiAward size={20} />
          </div>
          <span className="text-[9px] font-bold">Karya</span>
        </Link>

        <Link 
          href="/mahasiswa" 
          onClick={() => { setPendingPath("/mahasiswa"); setActiveBottomSheet(null); }} 
          className={`flex-1 flex flex-col items-center gap-0.5 transition-transform active:scale-95 ${currentPath.startsWith("/mahasiswa") ? "text-secondary" : "text-on-surface-variant hover:text-primary"}`}
        >
          <FiUsers size={20} className={currentPath.startsWith("/mahasiswa") ? "fill-secondary/20" : ""} />
          <span className="text-[9px] font-bold">Mahasiswa</span>
        </Link>

        <button 
          onClick={() => setActiveBottomSheet(activeBottomSheet === 'more' ? null : 'more')} 
          className={`flex-1 flex flex-col items-center gap-0.5 transition-transform active:scale-95 ${
            activeBottomSheet === 'more' ||
            currentPath.startsWith("/berita") ||
            currentPath.startsWith("/dokumentasi") ||
            currentPath.startsWith("/kabinet")
              ? "text-secondary" 
              : "text-on-surface-variant hover:text-primary"
          }`}
        >
          <FiGrid size={20} className={activeBottomSheet === 'more' || currentPath.startsWith("/berita") || currentPath.startsWith("/dokumentasi") || currentPath.startsWith("/kabinet") ? "fill-secondary/20" : ""} />
          <span className="text-[9px] font-bold">Lainnya</span>
        </button>
      </nav>
      </>
      )}

      {/* Overlay for Bottom Sheet */}
      <AnimatePresence>
        {activeBottomSheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setActiveBottomSheet(null)}
          />
        )}
      </AnimatePresence>

      {/* Bottom Sheets */}
      <AnimatePresence>
        {activeBottomSheet === 'more' && (
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="lg:hidden fixed bottom-20 left-3 right-3 z-50 bg-surface rounded-3xl shadow-2xl overflow-hidden border border-outline-variant/30"
          >
            {/* Header */}
            <div className="px-5 pt-4 pb-3 border-b border-outline-variant/20 flex items-center justify-between">
              <p className="text-sm font-extrabold text-on-surface">Menu Lainnya</p>
              <button onClick={() => setActiveBottomSheet(null)} className="p-1.5 rounded-full hover:bg-surface-variant transition-colors">
                <FiX size={16} className="text-on-surface-variant" />
              </button>
            </div>
            {/* 2x2 Grid Menu */}
            <div className="grid grid-cols-2 gap-px bg-outline-variant/10 p-2">
              <Link 
                href="/berita" 
                onClick={() => { setPendingPath("/berita"); setActiveBottomSheet(null); }} 
                className="flex items-center gap-3 px-4 py-4 bg-surface rounded-2xl hover:bg-primary/5 active:bg-primary/10 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <FiBookOpen size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">Berita</p>
                  <p className="text-[10px] text-on-surface-variant">Info & Pengumuman</p>
                </div>
              </Link>
              <Link 
                href="/dokumentasi" 
                onClick={() => { setPendingPath("/dokumentasi"); setActiveBottomSheet(null); }} 
                className="flex items-center gap-3 px-4 py-4 bg-surface rounded-2xl hover:bg-primary/5 active:bg-primary/10 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-secondary text-[18px]">photo_library</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">Dokumentasi</p>
                  <p className="text-[10px] text-on-surface-variant">Foto & Galeri</p>
                </div>
              </Link>
              <Link 
                href="/kabinet" 
                onClick={() => { setPendingPath("/kabinet"); setActiveBottomSheet(null); }} 
                className="flex items-center gap-3 px-4 py-4 bg-surface rounded-2xl hover:bg-primary/5 active:bg-primary/10 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <FiUser size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">Kabinet BEM</p>
                  <p className="text-[10px] text-on-surface-variant">Profil & Struktur</p>
                </div>
              </Link>
              <Link 
                href="/#saran" 
                onClick={() => { setPendingPath("/#saran"); setActiveBottomSheet(null); }} 
                className="flex items-center gap-3 px-4 py-4 bg-surface rounded-2xl hover:bg-primary/5 active:bg-primary/10 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-secondary text-[18px]">chat_bubble</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">Kotak Saran</p>
                  <p className="text-[10px] text-on-surface-variant">Aspirasi & Aduan</p>
                </div>
              </Link>
            </div>
          </motion.div>
        )}

      </AnimatePresence>


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
              <h3 className="text-xl font-bold text-on-surface mb-2">Konfirmasi Keluar</h3>
              <p className="text-on-surface-variant text-sm mb-8">Apakah kamu yakin ingin keluar dari akun ini? Kamu harus login kembali untuk mengakses dashboard.</p>
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
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
