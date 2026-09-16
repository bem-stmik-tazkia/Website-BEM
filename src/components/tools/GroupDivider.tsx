"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

interface GroupDividerProps {
  names: string[];
}

export default function GroupDivider({ names }: GroupDividerProps) {
  const t = useTranslations("Spinner");
  const [groupCount, setGroupCount] = useState<string>("2");
  const [groups, setGroups] = useState<string[][]>([]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const divideGroups = () => {
    if (names.length === 0) return;
    
    let count = parseInt(groupCount, 10) || 2;
    count = Math.max(2, Math.min(names.length, count));
    // Update input to reflect clamped value
    setGroupCount(count.toString());

    setIsShuffling(true);
    setGroups([]);

    // Shuffle animation
    setTimeout(() => {
      const shuffledNames = [...names].sort(() => Math.random() - 0.5);
      const newGroups: string[][] = Array.from({ length: count }, () => []);
      
      shuffledNames.forEach((name, index) => {
        newGroups[index % count].push(name);
      });

      setGroups(newGroups);
      setCurrentPage(1);
      setIsShuffling(false);
    }, 1500); // 1.5s visual shuffling delay
  };

  if (names.length === 0) {
    return <div className="text-center p-8 opacity-50">{t("emptyError")}</div>;
  }

  const handleBlur = () => {
    let count = parseInt(groupCount, 10);
    if (isNaN(count) || count < 2) count = 2;
    if (count > names.length) count = names.length;
    setGroupCount(count.toString());
  };

  return (
    <div className="flex flex-col w-full gap-6">
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-surface-container p-4 rounded-2xl border border-outline-variant/30">
        <label className="text-sm font-semibold whitespace-nowrap">{t("groupCount")}:</label>
        <input
          type="number"
          min={2}
          max={names.length}
          value={groupCount}
          onChange={(e) => setGroupCount(e.target.value)}
          onBlur={handleBlur}
          className="w-full sm:w-24 px-4 py-2 rounded-xl border border-outline-variant bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-center font-bold"
        />
        <div className="flex w-full sm:w-auto gap-2">
          <button
            onClick={divideGroups}
            disabled={isShuffling || names.length < 2}
            className="flex-1 sm:flex-none px-6 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
          >
            {isShuffling ? "..." : t("divideButton")}
          </button>
          
          {groups.length > 0 && !isShuffling && (
            <button
              onClick={() => setGroups([])}
              className="px-4 py-2 bg-red-100 text-red-600 font-bold rounded-xl hover:bg-red-600 hover:text-white transition-all transform hover:scale-105 active:scale-95"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {isShuffling && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(parseInt(groupCount as string, 10) || 2)].map((_, i) => (
            <motion.div
              key={`skeleton-${i}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface-container p-6 rounded-2xl border border-outline-variant/20 h-40 animate-pulse flex items-center justify-center"
            >
              <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            </motion.div>
          ))}
        </div>
      )}

      {!isShuffling && groups.length > 0 && (
        <div className="flex flex-col gap-6 w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {groups.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((group, i) => {
                const actualIndex = (currentPage - 1) * itemsPerPage + i;
                return (
                  <motion.div
                    key={actualIndex}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-surface p-6 rounded-2xl border-2 border-primary-container shadow-soft flex flex-col"
                  >
                    <div className="w-full bg-primary-container text-primary font-black text-center py-2 -mt-6 rounded-b-xl mb-4 text-sm tracking-wider uppercase">
                      {t("groupPrefix")} {actualIndex + 1}
                    </div>
                    <ul className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-outline-variant scrollbar-track-transparent">
                      {group.map((member, j) => (
                        <motion.li
                          key={j}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 + j * 0.1 }}
                          className="flex items-center gap-3 text-sm font-medium"
                        >
                          <span className="w-6 h-6 rounded-full bg-surface-variant flex items-center justify-center text-xs text-outline font-bold shrink-0">
                            {j + 1}
                          </span>
                          <span className="truncate">{member}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {Math.ceil(groups.length / itemsPerPage) > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-outline-variant hover:bg-surface-container disabled:opacity-50 transition-all"
              >
                &larr;
              </button>
              
              <div className="flex items-center gap-2">
                {[...Array(Math.ceil(groups.length / itemsPerPage))].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-10 h-10 rounded-xl font-bold transition-all ${
                      currentPage === i + 1
                        ? "bg-primary text-white shadow-md"
                        : "bg-surface border border-outline-variant hover:bg-surface-container text-outline"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(Math.ceil(groups.length / itemsPerPage), p + 1))}
                disabled={currentPage === Math.ceil(groups.length / itemsPerPage)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-outline-variant hover:bg-surface-container disabled:opacity-50 transition-all"
              >
                &rarr;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
