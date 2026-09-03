"use client";

import { motion } from "framer-motion";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

const highlightLinks = [
  { color: "primary", link: "/berita" },
  { color: "secondary", link: "/dokumentasi" },
  { color: "tertiary", link: "/agenda" },
];

export default function Highlight() {
  const t = useTranslations("Highlight");

  return (
    <section className="py-20 px-5 md:px-10 bg-surface-container-lowest" id="agenda">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6 animate-on-scroll animate-fade-up">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-2">{t("title")}</h2>
            <p className="text-on-surface-variant">{t("subtitle")}</p>
          </div>
          <Link href="/agenda" className="hidden md:flex items-center gap-2 text-primary font-semibold hover:text-secondary transition-colors group">
            {t("seeAll")}
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {highlightLinks.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className={`bg-surface rounded-3xl p-8 hover:shadow-xl transition-all duration-500 flex flex-col h-full group border border-outline-variant/30 hover:border-${item.color}/50 hover:-translate-y-3 relative overflow-hidden`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br from-${item.color}/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-${item.color}-container text-${item.color} text-xs font-semibold mb-6 w-fit group-hover:scale-105 group-hover:bg-${item.color} group-hover:text-white transition-all duration-300 relative z-10`}>
                <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                {t(`item${index}Date`)}
              </div>
              <h3 className={`text-xl font-bold text-on-background mb-4 group-hover:text-${item.color} transition-colors duration-300 line-clamp-3 relative z-10`}>
                {t(`item${index}Title`)}
              </h3>
              <p className="text-on-surface-variant mb-8 line-clamp-2 text-sm relative z-10">
                {t(`item${index}Desc`)}
              </p>
              <div className="mt-auto relative z-10">
                <Link
                  href={item.link}
                  className={`w-full bg-surface-container-high text-${item.color} px-6 py-3 rounded-full font-semibold group-hover:bg-${item.color} group-hover:text-white hover:shadow-lg hover:scale-[1.02] transition-all duration-300 flex justify-center`}
                >
                  {t(`item${index}Btn`)}
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        <Link href="/agenda" className="md:hidden w-full mt-8 flex justify-center items-center gap-2 text-primary bg-primary-container px-6 py-4 rounded-full font-semibold">
          {t("seeAllAgenda")} <span className="material-symbols-outlined">arrow_forward</span>
        </Link>
      </div>
    </section>
  );
}
