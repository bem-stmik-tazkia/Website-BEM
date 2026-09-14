"use client";

import React, { useState, useRef } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

export default function SubscribeForm() {
  const t = useTranslations("Subscribe");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<any>();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!email) {
      setMessage({ type: "error", text: t("errorEmpty") });
      return;
    }

    if (!email.endsWith("@student.stmik.tazkia.ac.id") && !email.endsWith("@stmik.tazkia.ac.id")) {
      setMessage({ type: "error", text: t("errorDomain") });
      return;
    }

    // Jika siteKey tidak ada (sedang mode development/belum disetup), izinkan bypass untuk sementara, atau wajibkan.
    if (siteKey && !turnstileToken) {
      setMessage({ type: "error", text: t("errorCaptcha") });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, turnstileToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Terjadi kesalahan sistem");
      }

      setMessage({ type: "success", text: t("successMsg") });
      setEmail("");
      turnstileRef.current?.reset();
      setTurnstileToken("");
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-8 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="bg-surface rounded-2xl p-6 md:p-8 shadow-xl border border-outline-variant/10"
      >
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
          
          {/* Left Side: Text */}
          <div className="flex-1 text-center md:text-left w-full flex flex-col items-center md:items-start">
            <div className="flex items-center justify-center md:justify-start gap-2 md:gap-3 mb-2 md:mb-3">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">mail</span>
              </div>
              <h2 className="font-display-md text-xl md:text-2xl text-on-background font-bold">
                {t("title")}
              </h2>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-3">
              {t("desc")}
            </p>
            <div className="flex items-center justify-center md:justify-start gap-1.5 text-xs text-on-surface-variant/70">
              <span className="material-symbols-outlined text-[14px]">lock</span>
              {t("privacy")}
            </div>
          </div>

          {/* Right Side: Form (LOCKED FOR NOW) */}
          <div className="w-full max-w-sm shrink-0">
            <div className="bg-surface-variant/30 border border-outline-variant/40 rounded-xl p-6 text-center flex flex-col items-center justify-center gap-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full -z-0"></div>
              
              <span className="material-symbols-outlined text-[36px] text-primary/70 z-10">
                hourglass_empty
              </span>
              
              <div className="z-10">
                <h3 className="font-bold text-on-background text-sm mb-1">Fitur Sedang Dalam Tahap Pengembangan</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Fitur berlangganan belum tersedia untuk saat ini. Nantikan pembaruan selanjutnya!
                </p>
              </div>

              <button disabled className="mt-2 w-full bg-surface-variant/50 text-on-surface-variant/70 border border-outline-variant/30 px-5 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-not-allowed z-10 shadow-sm">
                <span className="material-symbols-outlined text-[16px]">lock</span>
                Coming Soon
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
