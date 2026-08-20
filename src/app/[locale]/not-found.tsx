"use client";

import React from "react";
import Link from "next/link";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { FiHome, FiArrowLeft } from "react-icons/fi";
import { useTranslations } from "next-intl";

export default function NotFound() {
  const t = useTranslations("NotFound");
  return (
    <>
      <main className="fixed inset-0 z-[9999] bg-white dark:bg-surface flex flex-col items-center justify-center px-4 py-8 overflow-y-auto overflow-x-hidden">
        {/* Spinning border wrapper */}
        <div className="relative w-full max-w-xl mx-auto rounded-3xl p-[3px] overflow-hidden shadow-2xl">
          {/* Spinning conic gradient border */}
          <div
            className="animate-spin-border absolute"
            style={{
              background: "conic-gradient(from 0deg, #f2791e 0% 50%, #1b4086 50% 100%)",
              width: "300%",
              height: "300%",
              top: "-100%",
              left: "-100%",
            }}
          />

          {/* Card content */}
          <div className="relative z-10 w-full bg-surface rounded-[calc(1.5rem-3px)] p-8 sm:p-12 text-center flex flex-col items-center">
            {/* Lottie Animation 404 */}
            <div className="w-72 h-72 sm:w-80 sm:h-80 relative -my-4">
              <DotLottieReact
                src="/animations/404 error.lottie"
                loop
                autoplay
                renderConfig={{ devicePixelRatio: 2 }}
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
                className="px-6 py-3 rounded-full font-bold text-xs sm:text-sm text-on-surface bg-surface-variant/40 hover:bg-surface-variant active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <FiArrowLeft size={16} /> {t("back")}
              </button>

              <Link
                href="/"
                className="px-6 py-3 rounded-full font-bold text-xs sm:text-sm text-white bg-primary hover:bg-primary/85 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
              >
                <FiHome size={16} /> {t("home")}
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
