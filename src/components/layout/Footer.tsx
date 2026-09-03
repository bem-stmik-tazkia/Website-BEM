"use client";

import { useState, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { FiMapPin, FiMail } from "react-icons/fi";
import { SiInstagram, SiYoutube, SiDiscord, SiTiktok } from "react-icons/si";

export default function Footer() {
  const t = useTranslations("Footer");
  const nav = useTranslations("Navigation");
  const [showTooltip, setShowTooltip] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowTooltip((prev) => !prev);
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  return (
    <footer className="w-full pt-20 pb-8 bg-primary text-white overflow-hidden relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/20 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2"></div>

      <div className="px-5 md:px-10 max-w-7xl mx-auto flex flex-col gap-12 relative z-10">



        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-4 flex flex-col gap-6">
            <div className="bg-surface p-2 rounded-xl mb-6 shadow-sm inline-block w-fit">
              <Image
                alt="BEM STMIK Tazkia Logo"
                src="/images/logo.webp"
                width={80}
                height={80}
                className="h-12 w-auto object-contain bg-surface rounded-lg p-1.5 shadow-sm"
              />
            </div>
            <div className="flex flex-row items-center gap-1.5">
              <span className="font-bold leading-none text-xl text-white">BEM STMIK</span>
              <span className="font-bold leading-none text-xl text-secondary">Tazkia</span>
            </div>
            <p className="text-white/80 max-w-sm leading-relaxed text-sm">
              {t("description")}
            </p>
          </div>

          <div className="md:col-span-3 flex flex-col gap-6">
            <h4 className="text-lg text-white font-bold tracking-wide">{t("contact")}</h4>
            <div className="flex flex-col gap-4 text-white/80 text-sm">
              <a
                className="flex items-start gap-3 hover:text-white hover:-translate-y-0.5 hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all duration-300 leading-relaxed"
                href="https://maps.google.com/?q=Jalan+Raya+Dramaga+Km.7,+Kelurahan+Margajaya,+Kecamatan+Bogor+Barat,+Kota+Bogor,+Jawa+Barat+16680,+Indonesia"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FiMapPin className="text-xl shrink-0 mt-1 text-secondary" />
                <span>Jalan Raya Dramaga Km.7, Kelurahan Margajaya, Kecamatan Bogor Barat, Kota Bogor, Jawa Barat 16680, Indonesia</span>
              </a>
              <a className="flex items-center gap-3 hover:text-white hover:-translate-y-0.5 hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all duration-300" href="mailto:bem@stmik.tazkia.ac.id">
                <FiMail className="text-xl shrink-0 text-secondary" />
                bem@stmik.tazkia.ac.id
              </a>
            </div>
          </div>

          <div className="md:col-span-3 flex flex-col gap-6">
            <h4 className="text-lg text-white font-bold tracking-wide">{t("quickLinks")}</h4>
            <div className="flex flex-col gap-3 text-white/80 text-sm">
              <Link href="/kabinet" className="hover:text-white hover:-translate-y-0.5 transition-all duration-300">{nav("cabinet")}</Link>
              <Link href="/berita" className="hover:text-white hover:-translate-y-0.5 transition-all duration-300">{nav("news")}</Link>
              <Link href="/#saran" className="hover:text-white hover:-translate-y-0.5 transition-all duration-300">{t("feedbackBox")}</Link>
            </div>
          </div>

          <div className="md:col-span-2 flex flex-col gap-6">
            <h4 className="text-lg text-white font-bold tracking-wide">{t("social")}</h4>

            <div className="grid grid-cols-2 gap-4 text-white/80 mt-2 w-fit">
              <a
                className="hover:text-[#E1306C] hover:-translate-y-1 hover:scale-110 transition-all duration-300 p-2 bg-white/10 rounded-xl hover:bg-white"
                href="https://www.instagram.com/bem_stmiktazkia?igsh=amNsbWRqODVwemV4"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram BEM"
              >
                <SiInstagram size={22} />
              </a>
              <a
                className="hover:text-[#FF0000] hover:-translate-y-1 hover:scale-110 transition-all duration-300 p-2 bg-white/10 rounded-xl hover:bg-white"
                href="https://www.youtube.com/@ofcbemstmiktazkia"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube BEM"
              >
                <SiYoutube size={22} />
              </a>
              <a
                className="hover:text-[#5865F2] hover:-translate-y-1 hover:scale-110 transition-all duration-300 p-2 bg-white/10 rounded-xl hover:bg-white"
                href="https://discord.gg/dFVN24ZMXU"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Discord BEM"
              >
                <SiDiscord size={22} />
              </a>
              <a
                className="hover:text-black hover:-translate-y-1 hover:scale-110 transition-all duration-300 p-2 bg-white/10 rounded-xl hover:bg-white"
                href="https://www.tiktok.com/@bem.stmik.tazkia?_r=1&_t=ZS-98AM268GYS4"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok BEM"
              >
                <SiTiktok size={22} />
              </a>
            </div>
          </div>

          <div className="col-span-1 md:col-span-12 border-t border-white/10 mt-8 pt-8 text-center text-white/50 text-sm">
            © {new Date().getFullYear()} {t("copyright")}
          </div>
        </div>
      </div>
    </footer>
  );
}
