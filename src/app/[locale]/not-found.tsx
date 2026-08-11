"use client";

import React from "react";
import Link from "next/link";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { FiHome, FiArrowLeft } from "react-icons/fi";
import { useTranslations } from "next-intl";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function NotFound() {
  const t = useTranslations("NotFound");
  return (
    <>
      <Navbar />
      <main className="min-h-[80vh] bg-background flex items-center justify-center pt-24 pb-16 px-4 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-xl w-full bg-white border border-outline-variant/30 rounded-3xl p-8 sm:p-12 text-center shadow-xl relative z-10 flex flex-col items-center justify-center animate-fade-up">
          {/* Lottie Animation 404 */}
          <div className="w-64 h-64 sm:w-80 sm:h-80 relative -my-4">
            <DotLottieReact
              src="/animations/404 error.lottie"
              loop
              autoplay
            />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-background mb-2">
            {t("title")}
          </h1>
          
          <p className="text-xs sm:text-sm text-on-surface-variant mb-8 max-w-md leading-relaxed">
            {t("desc")}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={() => window.history.back()}
              className="px-6 py-3 rounded-full font-bold text-xs sm:text-sm text-on-surface bg-surface-variant/40 hover:bg-surface-variant transition-colors flex items-center justify-center gap-2"
            >
              <FiArrowLeft size={16} /> {t("back")}
            </button>

            <Link
              href="/"
              className="px-6 py-3 rounded-full font-bold text-xs sm:text-sm text-white bg-primary hover:bg-primary/90 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <FiHome size={16} /> {t("home")}
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
