"use client";

import React, { useState, useRef, useEffect } from "react";
import { TECH_STACKS, TechStackItem } from "@/lib/techStack";
import { FiX, FiChevronDown, FiCheck, FiSearch } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

interface TechStackSelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Language":     "#3B82F6",
  "Frontend":     "#F59E0B",
  "Backend":      "#10B981",
  "Mobile":       "#8B5CF6",
  "Database":     "#EC4899",
  "DevOps":       "#F97316",
  "UI Framework": "#06B6D4",
  "Other":        "#6B7280",
};

const MAX_TOOLS = 10;

export default function TechStackSelect({ value, onChange, error }: TechStackSelectProps) {
  const [isOpen, setIsOpen]   = useState(false);
  const [search, setSearch]   = useState("");
  const [activeTab, setActiveTab] = useState<string>("Semua");
  const containerRef          = useRef<HTMLDivElement>(null);
  const inputRef              = useRef<HTMLInputElement>(null);

  const selectedLabels = value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const openDropdown = () => {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const toggleTool = (label: string) => {
    let next: string[];
    if (selectedLabels.includes(label)) {
      next = selectedLabels.filter((l) => l !== label);
    } else {
      if (selectedLabels.length >= MAX_TOOLS) return;
      next = [...selectedLabels, label];
    }
    onChange(next.join(", "));
    setSearch("");
  };

  const removeTool = (label: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedLabels.filter((l) => l !== label).join(", "));
  };

  const categories = ["Semua", ...Array.from(new Set(TECH_STACKS.map((t) => t.category)))];

  const filtered = TECH_STACKS.filter((t) => {
    const matchSearch =
      t.label.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase());
    const matchTab = activeTab === "Semua" || t.category === activeTab;
    return matchSearch && matchTab;
  });

  const grouped = filtered.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, TechStackItem[]>);

  const baseClass =
    "w-full pl-4 pr-14 py-3 bg-surface-variant/20 border rounded-xl text-sm transition-all relative cursor-pointer min-h-[48px]";
  const stateClass = error
    ? "border-red-500 ring-2 ring-red-500/20 bg-red-50/50"
    : isOpen
    ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20"
    : "border-outline-variant/30 hover:border-[var(--color-primary)]/50";

  return (
    <div id="input-tech-stack" className="relative" ref={containerRef}>
      {/* Trigger */}
      <div className={`${baseClass} ${stateClass}`} onClick={openDropdown}>
        <div className="flex flex-wrap gap-2 items-center min-h-[24px]">
          {selectedLabels.length === 0 && (
            <span className="text-on-surface-variant/50 select-none">
              Pilih tools...
            </span>
          )}

          {selectedLabels.map((label) => {
            const def = TECH_STACKS.find((t) => t.label === label);
            const bg   = def ? `${def.color}18` : "var(--color-surface-variant)";
            const fg   = def ? def.color : "var(--color-on-surface)";
            const Icon = def?.icon;

            return (
              <span
                key={label}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border border-black/10"
                style={{ backgroundColor: bg, color: fg }}
                onClick={(e) => e.stopPropagation()}
              >
                {Icon && <Icon size={12} />}
                {label}
                <button
                  type="button"
                  onClick={(e) => removeTool(label, e)}
                  className="ml-1 opacity-60 hover:opacity-100 hover:text-red-500 transition-colors"
                >
                  <FiX size={11} />
                </button>
              </span>
            );
          })}
        </div>

        {/* Counter + chevron */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-on-surface-variant/50 pointer-events-none">
          <span className={`text-xs font-bold ${selectedLabels.length >= MAX_TOOLS ? "text-red-400" : ""}`}>
            {selectedLabels.length}/{MAX_TOOLS}
          </span>
          <FiChevronDown className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 w-full mt-2 bg-surface border border-outline-variant/30 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Search bar */}
            <div className="p-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-2 px-3 py-2 bg-surface-variant/30 rounded-xl border border-outline-variant/20 focus-within:border-[var(--color-primary)]/50 transition-colors">
                <FiSearch size={14} className="text-on-surface-variant/50 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari teknologi..."
                  className="flex-1 bg-transparent outline-none text-sm text-on-surface placeholder:text-on-surface-variant/50"
                />
                {search && (
                  <button type="button" onClick={() => setSearch("")} className="text-on-surface-variant/50 hover:text-on-surface transition-colors">
                    <FiX size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Category tabs — only show when not searching */}
            {!search && (
              <div className="px-3 py-2 border-b border-outline-variant/10 flex gap-1.5 overflow-x-auto scrollbar-hide">
                {categories.map((cat) => {
                  const catColor = CATEGORY_COLORS[cat] ?? "var(--color-primary)";
                  const isActive = activeTab === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveTab(cat)}
                      className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-full transition-all"
                      style={
                        isActive
                          ? { backgroundColor: catColor, color: "#fff" }
                          : { backgroundColor: `${catColor}15`, color: catColor }
                      }
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Content list */}
            <div className="max-h-[280px] overflow-y-auto p-2 space-y-3">
              {Object.keys(grouped).length === 0 ? (
                <div className="p-6 text-center flex flex-col items-center gap-3">
                  <span className="text-sm text-on-surface-variant">Tidak ada yang cocok dengan "{search}"</span>
                  {search.trim() && (
                    <button
                      type="button"
                      onClick={() => toggleTool(search.trim())}
                      className="text-sm px-4 py-2 bg-[var(--color-primary)] text-white font-bold rounded-lg hover:bg-[var(--color-primary)]/90 transition-colors"
                    >
                      Tambah "{search.trim()}"
                    </button>
                  )}
                </div>
              ) : (
                Object.entries(grouped).map(([category, items]) => {
                  const catColor = CATEGORY_COLORS[category] ?? "#6B7280";
                  return (
                    <div key={category}>
                      {/* Category header */}
                      <div
                        className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg mb-1 flex items-center gap-1.5"
                        style={{ backgroundColor: `${catColor}12`, color: catColor }}
                      >
                        <span
                          className="w-2 h-2 rounded-full inline-block"
                          style={{ backgroundColor: catColor }}
                        />
                        {category}
                      </div>

                      {/* Items grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {items.map((item) => {
                          const isSelected = selectedLabels.includes(item.label);
                          const Icon = item.icon;
                          const isDisabled = !isSelected && selectedLabels.length >= MAX_TOOLS;

                          return (
                            <button
                              key={item.id}
                              type="button"
                              disabled={isDisabled}
                              onClick={() => toggleTool(item.label)}
                              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-all ${
                                isSelected
                                  ? "font-bold"
                                  : isDisabled
                                  ? "opacity-40 cursor-not-allowed"
                                  : "hover:bg-surface-variant/30 text-on-surface"
                              }`}
                              style={
                                isSelected
                                  ? { backgroundColor: `${item.color}15`, color: item.color }
                                  : {}
                              }
                            >
                              {/* Icon box */}
                              <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
                                style={{ backgroundColor: `${item.color}20`, color: item.color }}
                              >
                                <Icon size={15} />
                              </div>

                              <span className="flex-1 text-sm leading-tight">{item.label}</span>

                              {isSelected && (
                                <div
                                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                                  style={{ backgroundColor: item.color }}
                                >
                                  <FiCheck size={11} color="#fff" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Add custom button if searching */}
              {search.trim() && !TECH_STACKS.some(t => t.label.toLowerCase() === search.trim().toLowerCase()) && Object.keys(grouped).length > 0 && (
                <div className="pt-2 mt-2 border-t border-outline-variant/20">
                  <button
                    type="button"
                    onClick={() => toggleTool(search.trim())}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-[var(--color-primary)] font-bold bg-[var(--color-primary)]/5 hover:bg-[var(--color-primary)]/10 rounded-xl transition-colors"
                  >
                    <FiCheck size={16} /> Tambah "{search.trim()}"
                  </button>
                </div>
              )}
            </div>

            {/* Footer info */}
            <div className="px-4 py-2.5 border-t border-outline-variant/10 flex items-center justify-between">
              <span className="text-xs text-on-surface-variant/60">
                Pilih hingga {MAX_TOOLS} tech stack / tools
              </span>
              {selectedLabels.length > 0 && (
                <button
                  type="button"
                  onClick={() => onChange("")}
                  className="text-xs text-red-400 hover:text-red-600 font-semibold transition-colors"
                >
                  Hapus semua
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
