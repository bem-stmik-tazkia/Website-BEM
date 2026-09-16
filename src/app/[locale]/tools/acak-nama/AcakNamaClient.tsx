"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import SpinnerWheel from "@/components/tools/SpinnerWheel";
import GroupDivider from "@/components/tools/GroupDivider";
import { motion } from "framer-motion";

export default function AcakNamaClient() {
  const t = useTranslations("Spinner");
  const [mode, setMode] = useState<"wheel" | "group">("wheel");
  const [inputText, setInputText] = useState("");

  const names = inputText
    .split("\n")
    .map((n) => n.trim())
    .filter((n) => n.length > 0);

  const handleRemoveName = (nameToRemove: string) => {
    const updatedNames = names.filter((n) => n !== nameToRemove);
    setInputText(updatedNames.join("\n"));
  };

  return (
    <div className="min-h-screen py-24 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden flex flex-col items-center">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute top-40 -left-40 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-black mb-4 text-primary drop-shadow-sm">
            {t("title") || "Alat Acak"}
          </h1>
          <p className="text-outline text-lg max-w-2xl mx-auto">
            {t("desc")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="bg-surface rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-outline-variant/30 w-full"
        >
          {/* Left Panel: Inputs */}
          <div className="w-full md:w-1/3 bg-surface-container-low p-6 flex flex-col gap-6 border-b md:border-b-0 md:border-r border-outline-variant/30">
            <div className="flex bg-surface-container p-1.5 rounded-xl shadow-inner">
              <button
                onClick={() => setMode("wheel")}
                className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${
                  mode === "wheel"
                    ? "bg-primary shadow-md text-white"
                    : "text-outline hover:text-on-surface hover:bg-surface-container-high"
                }`}
              >
                {t("wheel")}
              </button>
              <button
                onClick={() => setMode("group")}
                className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${
                  mode === "group"
                    ? "bg-primary shadow-md text-white"
                    : "text-outline hover:text-on-surface hover:bg-surface-container-high"
                }`}
              >
                {t("group")}
              </button>
            </div>

            <div className="flex-1 flex flex-col min-h-[300px]">
              <textarea
                className="flex-1 w-full p-4 rounded-xl border border-outline-variant/50 bg-surface resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-outline-variant text-sm shadow-inner"
                placeholder={t("inputPlaceholder")}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              ></textarea>
              <div className="text-sm text-outline mt-3 font-semibold flex justify-between items-center px-1">
                <span>{t("participantList")}</span>
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full">{names.length}</span>
              </div>
            </div>
          </div>

          {/* Right Panel: Content */}
          <div className="w-full md:w-2/3 p-6 md:p-12 flex flex-col items-center justify-center relative bg-surface min-h-[500px]">
            <div className="w-full max-w-xl mx-auto flex items-center justify-center">
              {mode === "wheel" ? (
                <SpinnerWheel names={names} onRemoveWinner={handleRemoveName} />
              ) : (
                <GroupDivider names={names} />
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
