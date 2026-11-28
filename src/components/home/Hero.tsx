"use client";

import React from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { FiArrowRight } from "react-icons/fi";

export default function Hero() {
  const t = useTranslations("Hero");

  return (
    <section
      className="relative min-h-[90vh] flex items-center justify-center px-container-padding-mobile md:px-container-padding-desktop overflow-hidden pt-20 pb-24"
    >
      <div className="absolute inset-0 z-0 overflow-hidden [container-type:inline-size]">
        <div className="absolute inset-0 bg-black/40 z-10"></div>
        <Image
          src="/images/image.webp"
          alt="BEM STMIK Tazkia Hero"
          width={2560}
          height={1085}
          priority
          fetchPriority="high"
          quality={75}
          sizes="(max-width: 768px) 220vw, 135vw"
          className="h-full w-auto max-w-none min-w-[102%] object-cover object-center animate-hero-pan"
        />
      </div>

      {/* Decorative elements removed to match the clean background */}

      <div id="tour-hero-section" className="relative z-30 max-w-5xl mx-auto text-center mt-32">
        <h1 className="font-display-lg font-bold text-4xl sm:text-5xl md:text-[72px] md:leading-[1.1] mb-stack-gap-lg text-white drop-shadow-lg animate-init-fade-up hover:scale-[1.02] transition-transform duration-500 cursor-default">
          {t("titlePart1")} <br />
          <span className="text-secondary drop-shadow-glow hover:text-[#ff984d] transition-colors duration-300">{t("titlePart2")}</span>
        </h1>
        <p className="font-body-lg text-base sm:text-lg md:text-[20px] mb-10 text-white/90 max-w-2xl mx-auto font-light animate-init-fade-up anim-delay-100 hover:text-white transition-colors duration-300 cursor-default">
          {t("subtitle")}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-init-fade-up anim-delay-200">
          <Link href="/agenda" className="group relative overflow-hidden bg-secondary text-white px-8 py-4 rounded-button font-label-md transition-all duration-300 shadow-glow hover:shadow-[0_0_40px_rgba(242,121,30,0.6)] hover:-translate-y-1.5 hover:scale-105 inline-flex items-center gap-2 w-full sm:w-auto justify-center cursor-pointer z-10">
            <span className="relative z-10 flex items-center font-bold gap-2">
              {t("viewAgenda")}
              <FiArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" aria-hidden="true" />
            </span>
            <div className="absolute inset-0 bg-surface/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0"></div>
          </Link>
          <Link href="/kabinet" className="group relative overflow-hidden bg-surface/10 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-button font-label-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1.5 hover:scale-105 hover:border-primary w-full sm:w-auto justify-center cursor-pointer z-10 flex items-center">
            <span className="relative z-10 group-hover:text-white transition-colors duration-300">{t("aboutUs")}</span>
            <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0"></div>
          </Link>
        </div>
      </div>
    </section>
  );
}
