"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { SiDiscord } from "react-icons/si";
import { FiBell, FiCheckCircle, FiExternalLink } from "react-icons/fi";

const BEM_DISCORD_INVITE_URL = "https://discord.gg/dFVN24ZMXU";

export default function DiscordCommunityCard() {
  const t = useTranslations("DiscordCommunity");

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
          {/* Left Side: Info & Channels */}
          <div className="flex-1 text-center md:text-left w-full min-w-0 flex flex-col items-center md:items-start">
            <div className="flex items-center justify-center md:justify-start gap-2.5 md:gap-3 mb-2.5 md:mb-3">
              <div className="w-10 h-10 bg-[#5865F2]/10 text-[#5865F2] rounded-xl flex items-center justify-center shrink-0">
                <SiDiscord size={20} aria-hidden="true" />
              </div>
              <h2 className="font-display-md text-xl md:text-2xl text-on-background font-bold">
                {t("title")}
              </h2>
            </div>

            <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
              {t("desc")}
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#5865F2]/10 text-[#5865F2] border border-[#5865F2]/20">
                <FiBell size={13} aria-hidden="true" />
                {t("tagUpdates")}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/15">
                <FiCheckCircle size={13} aria-hidden="true" />
                {t("tagSystem")}
              </span>
            </div>
          </div>

          {/* Right Side: Discord Server Invite Card */}
          <div className="w-full md:max-w-sm shrink-0">
            <div className="bg-[#5865F2]/[0.06] dark:bg-[#5865F2]/15 border border-[#5865F2]/25 rounded-xl p-5 sm:p-6 text-center flex flex-col items-center justify-center gap-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#5865F2]/10 rounded-bl-full pointer-events-none" />

              <div className="w-12 h-12 rounded-2xl bg-[#5865F2] text-white flex items-center justify-center shadow-md shadow-[#5865F2]/25 z-10">
                <SiDiscord size={24} aria-hidden="true" />
              </div>

              <div className="z-10">
                <h3 className="font-bold text-on-background text-sm mb-1">
                  {t("cardTitle")}
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {t("cardDesc")}
                </p>
              </div>

              <a
                href={BEM_DISCORD_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 w-full bg-[#5865F2] hover:bg-[#4752C4] text-white px-5 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 z-10 shadow-md shadow-[#5865F2]/20 transition-all hover:-translate-y-0.5 active:scale-[0.99]"
              >
                <SiDiscord size={17} aria-hidden="true" />
                <span>{t("joinBtn")}</span>
                <FiExternalLink size={15} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
