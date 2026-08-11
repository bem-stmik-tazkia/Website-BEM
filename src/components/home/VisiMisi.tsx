"use client";

import { motion } from "framer-motion";
import LottieIcon from "@/components/ui/LottieIcon";
import { useTranslations } from "next-intl";

export default function VisiMisi() {
  const t = useTranslations("VisiMisi");

  return (
    <section className="py-12 md:py-20 px-4 sm:px-6 md:px-10 bg-mesh relative overflow-hidden" id="tentang">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16 animate-on-scroll animate-fade-up">
          <h2 className="text-3xl md:text-4xl font-bold gradient-text mb-4">{t("title")}</h2>
          <p className="text-on-surface-variant max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
          {/* Visi */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="md:col-span-5 glass-panel p-6 sm:p-8 md:p-10 rounded-2xl md:rounded-3xl shadow-soft relative overflow-hidden group hover:-translate-y-2 md:hover:-translate-y-4 hover:shadow-xl transition-all duration-500 cursor-default"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-secondary/30 group-hover:scale-150 transition-all duration-700"></div>
            <div className="w-16 h-16 bg-primary-container rounded-2xl flex items-center justify-center mb-8 rotate-3 group-hover:rotate-0 group-hover:scale-110 transition-all duration-300">
              <LottieIcon src="/animations/lamp.lottie" className="w-12 h-12" />
            </div>
            <h3 className="text-2xl md:text-3xl text-primary font-bold mb-4 md:mb-6 group-hover:translate-x-1 transition-transform duration-300">{t("visiLabel")}</h3>
            <p className="text-lg text-on-surface-variant leading-relaxed">
              {t("visiText")}
            </p>
          </motion.div>

          {/* Misi */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="md:col-span-7 glass-panel p-6 sm:p-8 md:p-10 rounded-2xl md:rounded-3xl shadow-soft relative overflow-hidden group hover:-translate-y-2 md:hover:-translate-y-4 hover:shadow-xl transition-all duration-500 cursor-default"
          >
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 group-hover:bg-primary/20 group-hover:scale-150 transition-all duration-700"></div>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-secondary-container rounded-2xl flex items-center justify-center -rotate-3 group-hover:rotate-0 group-hover:scale-110 transition-all duration-300">
                <LottieIcon src="/animations/Target.lottie" className="w-10 h-10" />
              </div>
              <h3 className="text-3xl text-primary font-bold">{t("misiLabel")}</h3>
            </div>
            <div className="space-y-5">
              {([t("misi0"), t("misi1"), t("misi2")] as string[]).map((misi, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-surface-container-lowest/50 hover:bg-surface-container-lowest transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <span className="material-symbols-outlined text-primary text-sm font-bold">check</span>
                  </div>
                  <p className="text-on-surface-variant leading-relaxed">{misi}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
