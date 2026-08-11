import React from "react";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { FiArrowRight } from "react-icons/fi";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { createClient } from "@/utils/supabase/server";
import BeritaSorotanClient from "./BeritaSorotanClient";

export default async function BeritaSorotan() {
  const supabase = await createClient();
  const t = await getTranslations("News");
  
  // Fetch the latest news
  const { data: featuredNews, error } = await supabase
    .from('berita')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error("Error fetching sorotan:", error);
  }

  return (
    <section className="px-4 sm:px-6 md:px-10 max-w-7xl mx-auto py-12 md:py-20 bg-background overflow-hidden">
      {/* Header */}
      <div id="tour-berita-sorotan" className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-2 uppercase tracking-wide">
            {t("title")}
          </h2>
          <p className="text-on-surface-variant text-base md:text-lg max-w-2xl">
            {t("subtitle")}
          </p>
        </div>
        <Link
          href="/berita"
          className="group flex items-center gap-1.5 text-primary hover:text-secondary font-semibold text-sm transition-colors duration-300 whitespace-nowrap"
        >
          {t("seeAll")} <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {!featuredNews ? (
        <div className="bg-white border border-outline-variant/30 rounded-3xl p-6 sm:p-10 text-center shadow-sm max-w-3xl mx-auto flex flex-col items-center justify-center gap-2">
          <div className="w-48 h-48 sm:w-60 sm:h-60 relative -my-4">
            <DotLottieReact
              src="/animations/Social Media Marketing announcement.lottie"
              loop
              autoplay
            />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-on-background">{t("noNewsTitle")}</h3>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-md leading-relaxed">
            {t("noNewsDesc")}
          </p>
          <Link
            href="/berita"
            className="mt-3 inline-flex items-center gap-2 bg-primary text-white text-xs sm:text-sm font-bold px-6 py-3 rounded-full hover:bg-primary/90 hover:-translate-y-0.5 transition-all duration-300 shadow-md"
          >
            {t("exploreNews")} <FiArrowRight />
          </Link>
        </div>
      ) : (
        <BeritaSorotanClient news={featuredNews} />
      )}
    </section>
  );
}
