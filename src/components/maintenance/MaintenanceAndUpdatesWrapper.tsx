"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiTool, FiClock, FiRefreshCw, FiLock, FiCheckCircle,
  FiX, FiStar, FiArrowRight
} from "react-icons/fi";
import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";

interface ReleaseNotes {
  version: string;
  title: string;
  date: string;
  features: string[];
  published: boolean;
}

export default function MaintenanceAndUpdatesWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const locale = useLocale();
  const supabase = createClient();
  const t = useTranslations("Maintenance");

  const [isAdmin, setIsAdmin] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState("1-2 Jam");
  const [customMessage, setCustomMessage] = useState("");
  const [releaseNotes, setReleaseNotes] = useState<ReleaseNotes | null>(null);

  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  // Exclude admin dashboard from being blocked by maintenance
  const isAdminPath = pathname?.includes("/admin");
  const isLoginPath = pathname?.includes("/login");

  const checkStatusAndUser = async () => {
    setIsChecking(true);
    try {
      // 1. Check user role
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        if (profile?.role === "admin") {
          setIsAdmin(true);
        }
      }

      // 2. Check system_settings
      const { data: settings, error } = await supabase
        .from("system_settings")
        .select("key, value")
        .in("key", ["maintenance_mode", "maintenance_estimated_time", "maintenance_message", "release_notes"]);

      if (!error && settings) {
        const mMode = settings.find((s) => s.key === "maintenance_mode")?.value === "true";
        const mTime = settings.find((s) => s.key === "maintenance_estimated_time")?.value || "1-2 Jam";
        const mMsg = settings.find((s) => s.key === "maintenance_message")?.value || "";
        const rNotesStr = settings.find((s) => s.key === "release_notes")?.value;

        setMaintenanceMode(mMode);
        setEstimatedTime(mTime);
        setCustomMessage(mMsg);

        if (rNotesStr) {
          try {
            const parsedNotes: ReleaseNotes = JSON.parse(rNotesStr);
            setReleaseNotes(parsedNotes);

            // Check if user has already seen this version
            if (!mMode && parsedNotes.published && parsedNotes.version) {
              const seenKey = `seen_release_notes_${parsedNotes.version}`;
              const hasSeen = localStorage.getItem(seenKey);
              if (!hasSeen) {
                setShowWhatsNew(true);
              }
            }
          } catch (e) {
            console.error("Error parsing release notes:", e);
          }
        }
      }
    } catch (err) {
      console.error("Error checking maintenance status:", err);
    } finally {
      setLoading(false);
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkStatusAndUser();

    // Listen to realtime changes on system_settings
    const channel = supabase
      .channel(`maintenance_check_${Date.now()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "system_settings" }, () => {
        checkStatusAndUser();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, pathname]);

  const handleCloseWhatsNew = () => {
    if (releaseNotes?.version) {
      localStorage.setItem(`seen_release_notes_${releaseNotes.version}`, "true");
    }
    setShowWhatsNew(false);
  };

  // If maintenance mode is ON, user is NOT admin, and not on admin/login page:
  const shouldBlockVisitor = maintenanceMode && !isAdmin && !isAdminPath && !isLoginPath;

  return (
    <>
      {shouldBlockVisitor ? (
        <div className="fixed inset-0 z-[9999] bg-surface flex flex-col items-center justify-center p-4 overflow-y-auto">
          {/* Decorative Gradients */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[120px] pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="max-w-xl w-full bg-surface border border-outline-variant/30 rounded-3xl p-8 sm:p-12 text-center shadow-2xl relative z-10 flex flex-col items-center"
          >
            {/* Maintenance Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold mb-4 animate-pulse">
              <FiTool size={14} />
              {t("badgeMode")}
            </div>

            {/* Lottie Animation */}
            <div className="w-56 h-56 sm:w-64 sm:h-64 relative -my-4 mb-2 select-none pointer-events-none">
              <DotLottieReact
                src="/animations/Maintenance.lottie"
                loop
                autoplay
              />
            </div>

            {/* Main Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface mb-3 leading-tight">
              {t("title")}
            </h1>

            {/* Custom / Default Description */}
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-md leading-relaxed mb-6">
              {customMessage || t("defaultDesc")}
            </p>

            {/* Estimated Time Card */}
            <div className="bg-surface-variant/30 border border-outline-variant/30 rounded-2xl px-5 py-3 flex items-center justify-center gap-3 mb-8 w-full max-w-xs">
              <FiClock className="text-primary shrink-0" size={18} />
              <div className="text-left">
                <p className="text-[10px] uppercase font-extrabold tracking-wider text-on-surface-variant/70">
                  {t("estTimeLabel")}
                </p>
                <p className="text-sm font-bold text-primary">{estimatedTime}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={checkStatusAndUser}
                disabled={isChecking}
                className="px-6 py-3 rounded-xl font-bold text-xs sm:text-sm text-on-surface bg-surface-variant hover:bg-outline-variant/30 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                <FiRefreshCw size={15} className={isChecking ? "animate-spin" : ""} />
                {isChecking ? t("checkingStatus") : t("checkStatus")}
              </button>

              <Link
                href="/login"
                className="px-6 py-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-primary hover:bg-primary/90 transition-all shadow-md flex items-center justify-center gap-2"
              >
                <FiLock size={15} />
                {t("adminLogin")}
              </Link>
            </div>
          </motion.div>

          <p className="mt-8 text-xs text-on-surface-variant/60 font-medium">
            BEM STMIK Tazkia &copy; {new Date().getFullYear()} - {t("footerTagline")}
          </p>
        </div>
      ) : (
        <>
          {children}

          {/* Release Notes / What's New Modal */}
          <AnimatePresence>
            {showWhatsNew && releaseNotes && (
              <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/50 backdrop-blur-md"
                  onClick={handleCloseWhatsNew}
                />

                {/* Modal Container */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 30 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="relative bg-surface rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-outline-variant/30 flex flex-col z-10 overflow-hidden"
                >
                  {/* Decorative background blob */}
                  <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

                  {/* Close X */}
                  <button
                    onClick={handleCloseWhatsNew}
                    className="absolute top-5 right-5 p-2 rounded-full bg-surface-variant/50 text-on-surface-variant hover:text-primary transition-colors z-20"
                  >
                    <FiX size={18} />
                  </button>

                  {/* Header Badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-extrabold flex items-center gap-1.5 border border-secondary/20">
                      <FiStar size={13} /> {releaseNotes.version || "v1.2.0"}
                    </span>
                    <span className="text-xs text-on-surface-variant font-medium">
                      {releaseNotes.date}
                    </span>
                  </div>

                  {/* Lottie Animation (Car.lottie) */}
                  <div className="w-48 h-36 sm:w-56 sm:h-40 mx-auto relative -my-2 select-none pointer-events-none">
                    <DotLottieReact
                      src="/animations/car.lottie"
                      loop
                      autoplay
                    />
                  </div>

                  {/* Title */}
                  <h2 className="text-xl sm:text-2xl font-extrabold text-on-surface mb-2 text-center leading-tight">
                    {releaseNotes.title || t("whatsNewTitle")}
                  </h2>
                  <p className="text-xs text-on-surface-variant text-center mb-5">
                    {t("whatsNewDesc")}
                  </p>

                  {/* Features List */}
                  <div className="bg-surface-variant/20 border border-outline-variant/20 rounded-2xl p-4 mb-6 max-h-56 overflow-y-auto space-y-2.5">
                    {releaseNotes.features && releaseNotes.features.length > 0 ? (
                      releaseNotes.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2.5">
                          <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                            <FiCheckCircle size={13} />
                          </div>
                          <p className="text-xs sm:text-sm font-semibold text-on-surface leading-snug">
                            {feat}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-on-surface-variant text-center py-2">
                        {t("noFeatureList")}
                      </p>
                    )}
                  </div>

                  {/* Button */}
                  <button
                    onClick={handleCloseWhatsNew}
                    className="w-full py-3.5 px-6 rounded-2xl bg-primary text-white font-extrabold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    <span>{t("exploreBtn")}</span>
                    <FiArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </>
      )}
    </>
  );
}
