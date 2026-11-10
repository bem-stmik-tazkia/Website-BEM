"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link } from "@/i18n/routing";
import confetti from "canvas-confetti";
import {
  FiArrowLeft,
  FiRotateCcw,
  FiCopy,
  FiSearch,
  FiTrash2,
  FiCheck,
  FiUsers,
  FiFilter,
} from "react-icons/fi";
import { IoGameController } from "react-icons/io5";

const SLICE_PALETTE = [
  "#1b4086", // Navy
  "#f2791e", // Campus Orange
  "#255299", // Slate Blue
  "#fb923c", // Warm Orange
];

export default function AcakNamaClient() {
  const [mode, setMode] = useState<"wheel" | "groups">("wheel");
  const [inputText, setInputText] = useState("");
  const [autoRemoveWinner, setAutoRemoveWinner] = useState(false);
  const [excludedCount, setExcludedCount] = useState(0);

  // Wheel State
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
  const [needleTicker, setNeedleTicker] = useState("Siap diputar");
  const [spinHistory, setSpinHistory] = useState<string[]>([]);

  // Group Generator State
  const [splitMethod, setSplitMethod] = useState<"byCount" | "bySize">("byCount");
  const [groupNumber, setGroupNumber] = useState<number>(2);
  const [assignLeader, setAssignLeader] = useState<boolean>(false);
  const [searchMember, setSearchMember] = useState("");
  const [groups, setGroups] = useState<string[][]>([]);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const angleRef = useRef<number>(0);

  // Memoized parsed names from textarea to prevent re-render cascading
  const participants = useMemo(() => {
    return inputText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }, [inputText]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  }, []);

  const copyToClipboard = useCallback(
    (text: string, successMsg = "Berhasil disalin ke clipboard!") => {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard
          .writeText(text)
          .then(() => showToast(successMsg))
          .catch(() => showToast("Gagal menyalin teks."));
      } else {
        const temp = document.createElement("textarea");
        temp.value = text;
        document.body.appendChild(temp);
        temp.select();
        try {
          document.execCommand("copy");
          showToast(successMsg);
        } catch {
          showToast("Gagal menyalin teks.");
        }
        document.body.removeChild(temp);
      }
    },
    [showToast]
  );

  // Audio Tick Sound (Procedural Web Audio API)
  const playTickSound = useCallback((freq = 580) => {
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        if (AudioContextClass) audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === "suspended") ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.035);
    } catch {
      // Audio fallback
    }
  }, []);

  // Mathematical Index Calculation based on Angle
  const getWinnerIndexAtAngle = (angleRad: number, totalItems: number) => {
    if (totalItems === 0) return -1;
    const twoPi = Math.PI * 2;
    // Pointer is at Top (1.5 * PI)
    const pointerAngle = (1.5 * Math.PI - (angleRad % twoPi) + twoPi) % twoPi;
    const sliceAngle = twoPi / totalItems;
    return Math.floor(pointerAngle / sliceAngle) % totalItems;
  };

  // Canvas Wheel Drawing
  const drawWheel = useCallback(
    (angle: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
      const cssSize = 360;

      if (canvas.width !== cssSize * dpr) {
        canvas.width = cssSize * dpr;
        canvas.height = cssSize * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      const cx = cssSize / 2;
      const cy = cssSize / 2;
      const radius = cssSize / 2 - 8;

      ctx.clearRect(0, 0, cssSize, cssSize);

      const totalReal = participants.length;

      if (totalReal === 0) {
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = "#f8fafc";
        ctx.fill();
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "#64748b";
        ctx.font = "bold 15px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Roda Belum Siap", cx, cy - 10);
        ctx.font = "500 12px Inter, sans-serif";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText("Isi nama peserta di sebelah kiri", cx, cy + 12);
        ctx.restore();
        return;
      }

      if (totalReal === 1) {
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = "#1b4086";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 15px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(participants[0], cx, cy - 10);
        ctx.font = "500 11px Inter, sans-serif";
        ctx.fillStyle = "#fdba74";
        ctx.fillText("Tambahkan 1 nama lagi untuk memutar", cx, cy + 14);
        ctx.restore();
        return;
      }

      // Smart Visual Slices: Cap visual wedges at 16 when > 24 items
      const isHighCapacity = totalReal > 24;
      const visualSliceCount = isHighCapacity ? 16 : totalReal;
      const sliceArc = (Math.PI * 2) / visualSliceCount;

      for (let i = 0; i < visualSliceCount; i++) {
        const startAngle = angle + i * sliceArc;
        const endAngle = startAngle + sliceArc;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, startAngle, endAngle);
        ctx.closePath();

        let colorIdx = i % SLICE_PALETTE.length;
        if (i === visualSliceCount - 1 && colorIdx === 0) colorIdx = 2;
        ctx.fillStyle = SLICE_PALETTE[colorIdx];
        ctx.fill();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Label Rendering inside Slice
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(startAngle + sliceArc / 2);
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#ffffff";

        if (!isHighCapacity) {
          const rawLabel = participants[i];
          const label =
            rawLabel.length > 18 ? rawLabel.slice(0, 17) + "…" : rawLabel;
          const fontSize =
            totalReal > 16 ? 11 : totalReal > 10 ? 12.5 : 14;
          ctx.font = `600 ${fontSize}px Inter, sans-serif`;
          ctx.fillText(label, radius - 18, 0);
        } else {
          // Range label for High-Capacity Mode
          const rangeStart =
            Math.floor((i * totalReal) / visualSliceCount) + 1;
          const rangeEnd = Math.floor(
            ((i + 1) * totalReal) / visualSliceCount
          );
          const sampleIdx = Math.floor(
            ((i + 0.5) * totalReal) / visualSliceCount
          );
          const sampleName = participants[sampleIdx]
            ? participants[sampleIdx].split(" ")[0]
            : "";
          ctx.font = "700 11px Inter, sans-serif";
          ctx.fillText(
            `#${rangeStart}–${rangeEnd} · ${sampleName}`,
            radius - 16,
            0
          );
        }
        ctx.restore();
      }

      // Center Hub Cap (White ring)
      ctx.beginPath();
      ctx.arc(cx, cy, 28, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#1b4086";
      ctx.stroke();

      // Inner Orange Center Dot
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.fillStyle = "#f2791e";
      ctx.fill();

      ctx.restore();
    },
    [participants]
  );

  // Redraw wheel whenever participants change
  useEffect(() => {
    drawWheel(angleRef.current);
    if (participants.length > 0) {
      const idx = getWinnerIndexAtAngle(angleRef.current, participants.length);
      const nextTicker = `#${idx + 1} · ${participants[idx]}`;
      setNeedleTicker((prev) => (prev !== nextTicker ? nextTicker : prev));
    } else {
      const nextTicker = "Isi nama peserta di kolom kiri";
      setNeedleTicker((prev) => (prev !== nextTicker ? nextTicker : prev));
    }
  }, [participants, drawWheel]);

  // Remove winner from participant list
  const removeWinnerFromList = useCallback(() => {
    if (winnerIndex === null || winnerIndex < 0 || winnerIndex >= participants.length)
      return;
    const removedName = participants[winnerIndex];
    const updated = participants.filter((_, i) => i !== winnerIndex);
    setInputText(updated.join("\n"));
    setExcludedCount((prev) => prev + 1);
    setWinner(null);
    setWinnerIndex(null);
    showToast(`"${removedName}" dikeluarkan dari daftar putaran.`);
  }, [winnerIndex, participants, showToast]);

  // Spin Wheel Action
  const spinWheel = useCallback(() => {
    if (isSpinning) return;
    if (participants.length === 0) {
      showToast("Daftar peserta masih kosong! Masukkan minimal 2 nama di sebelah kiri.");
      return;
    }
    if (participants.length === 1) {
      showToast("Tambahkan minimal 1 nama lagi (minimal 2 peserta) untuk memutar roda.");
      return;
    }

    setIsSpinning(true);
    setWinner(null);
    setWinnerIndex(null);

    const startAngle = angleRef.current;
    // 6 to 9 full rotations plus random delta
    const randomRotations = 6 + Math.random() * 3;
    const totalDelta = randomRotations * Math.PI * 2 + Math.random() * Math.PI * 2;
    const duration = 3800; // ms
    const startTime = performance.now();
    let lastTickIdx = -1;

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Cubic ease-out
      const eased = 1 - Math.pow(1 - progress, 3.6);

      const newAngle = startAngle + totalDelta * eased;
      angleRef.current = newAngle;
      setCurrentAngle(newAngle);
      drawWheel(newAngle);

      const currentIdx = getWinnerIndexAtAngle(newAngle, participants.length);
      if (currentIdx !== lastTickIdx) {
        lastTickIdx = currentIdx;
        setNeedleTicker(`#${currentIdx + 1} · ${participants[currentIdx]}`);
        if (progress > 0.15) playTickSound(520 + progress * 180);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        const finalIdx = getWinnerIndexAtAngle(newAngle, participants.length);
        if (finalIdx >= 0) {
          const finalWinner = participants[finalIdx];
          setWinner(finalWinner);
          setWinnerIndex(finalIdx);
          setSpinHistory((prev) => [finalWinner, ...prev.slice(0, 5)]);

          confetti({
            particleCount: 75,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#1b4086", "#f2791e", "#3b82f6", "#facc15"],
          });

          if (autoRemoveWinner) {
            setTimeout(() => {
              removeWinnerFromList();
            }, 900);
          }
        }
      }
    }

    requestAnimationFrame(animate);
  }, [
    isSpinning,
    participants,
    drawWheel,
    playTickSound,
    autoRemoveWinner,
    removeWinnerFromList,
  ]);

  // Group Generator: Balanced Fisher-Yates shuffle
  const generateBalancedGroups = useCallback(() => {
    const list = [...participants];
    if (list.length === 0) {
      setGroups([]);
      return;
    }

    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }

    const rawVal = Math.max(1, groupNumber || 2);
    let numGroups = rawVal;
    if (splitMethod === "bySize") {
      numGroups = Math.ceil(list.length / rawVal);
    }
    numGroups = Math.min(Math.max(1, numGroups), list.length);

    const buckets: string[][] = Array.from({ length: numGroups }, () => []);
    list.forEach((person, idx) => {
      buckets[idx % numGroups].push(person);
    });

    setGroups(buckets);
  }, [participants, groupNumber, splitMethod]);

  // Initial group generation when switching to group tab
  useEffect(() => {
    if (mode === "groups") {
      generateBalancedGroups();
    }
  }, [mode, generateBalancedGroups]);

  // Copy all groups formatted for WhatsApp
  const handleCopyAllGroupsWA = () => {
    if (groups.length === 0 || participants.length === 0) {
      showToast("Belum ada kelompok untuk disalin. Masukkan peserta dan klik Acak Kelompok dahulu.");
      return;
    }
    const formatted = groups
      .map((grp, idx) => {
        const header = `*KELOMPOK ${idx + 1} (${grp.length} Orang)*`;
        const rows = grp
          .map(
            (m, i) => `${i + 1}. ${m}${assignLeader && i === 0 ? " (Ketua)" : ""}`
          )
          .join("\n");
        return `${header}\n${rows}`;
      })
      .join("\n\n");
    copyToClipboard(
      formatted,
      "Seluruh daftar kelompok disalin (format WhatsApp siap tempel)!"
    );
  };

  // Deduplicate names
  const handleDedupe = () => {
    const unique = Array.from(new Set(participants));
    const removed = participants.length - unique.length;
    setInputText(unique.join("\n"));
    showToast(
      removed > 0
        ? `${removed} nama duplikat dihapus.`
        : "Tidak ada nama duplikat."
    );
  };

  // Clear all
  const handleClear = () => {
    setInputText("");
    setExcludedCount(0);
    setWinner(null);
    setWinnerIndex(null);
    setGroups([]);
  };

  const isHighCapacity = participants.length > 24;

  return (
    <div className="bg-background text-on-background min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Sleek Floating Toast Notification */}
      <div
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none transition-all duration-300 ease-out ${
          toastMessage
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 -translate-y-4 scale-95 pointer-events-none"
        }`}
      >
        <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-slate-900/95 dark:bg-slate-800/95 text-white border border-white/15 shadow-2xl backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-secondary shrink-0 animate-ping" />
          <span className="text-xs sm:text-sm font-semibold tracking-wide whitespace-nowrap">
            {toastMessage}
          </span>
        </div>
      </div>

      {/* Subtle Ambient Brand Glows (Zero dot pattern) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-36 -left-32 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <style jsx global>{`
        /* Clean Subtle Scrollbar */
        .clean-scroll::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .clean-scroll::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 6px;
        }
        .clean-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 6px;
        }
        .clean-scroll::-webkit-scrollbar-thumb:hover {
          background: #1b4086;
        }
        .wheel-needle {
          filter: drop-shadow(0 3px 4px rgba(15, 23, 42, 0.22));
        }
        .search-match {
          background-color: #fef3eb !important;
          border-color: #fdba74 !important;
          color: #9a3412 !important;
          font-weight: 700 !important;
        }
      `}</style>

      <div className="max-w-[1160px] mx-auto relative z-10">
        
        {/* 1. TOP NAVIGATION */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/tools"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-outline-variant/30 text-outline hover:text-on-surface text-xs sm:text-sm font-semibold shadow-sm hover:shadow transition-all"
          >
            <FiArrowLeft className="w-4 h-4 text-outline" />
            <span>Kembali ke Tools Hub</span>
          </Link>
        </div>

        {/* 2. PAGE HEADER */}
        <header className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-black text-on-surface tracking-tight">
            Wheel & Acak Nama
          </h1>
          <p className="text-sm sm:text-base text-outline mt-1.5">
            Undi nama peserta atau bagi kelompok secara adil, rapi, dan transparan.
          </p>
        </header>

        {/* 3. MAIN TWO-COLUMN WORKSPACE CARD */}
        <main className="bg-surface rounded-3xl border border-outline-variant/30 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
          
          {/* LEFT SIDEBAR: PARTICIPANT INPUT & CONTROLS (4 Cols on LG) */}
          <aside className="lg:col-span-4 bg-surface-container-low border-b lg:border-b-0 lg:border-r border-outline-variant/30 p-5 sm:p-6 flex flex-col justify-between">
            <div className="flex flex-col flex-1">
              
              {/* Segmented Mode Switcher */}
              <div className="bg-surface-container p-1.5 rounded-2xl grid grid-cols-2 gap-1 mb-4">
                <button
                  type="button"
                  onClick={() => setMode("wheel")}
                  className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    mode === "wheel"
                      ? "bg-primary text-white shadow-sm"
                      : "text-outline hover:text-on-surface"
                  }`}
                >
                  Spin Wheel
                </button>
                <button
                  type="button"
                  onClick={() => setMode("groups")}
                  className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    mode === "groups"
                      ? "bg-primary text-white shadow-sm"
                      : "text-outline hover:text-on-surface"
                  }`}
                >
                  Group Generator
                </button>
              </div>

              {/* Participant Input Controls & Cleanup */}
              <div className="flex items-center justify-between gap-1.5 mb-2.5">
                <span className="text-xs font-bold text-on-surface">
                  Daftar Nama Peserta
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleDedupe}
                    disabled={participants.length === 0}
                    title="Hapus nama ganda"
                    className="px-2 py-1 rounded-lg text-[11px] font-medium text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Hapus Duplikat
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={inputText.length === 0}
                    title="Kosongkan daftar"
                    className="px-2 py-1 rounded-lg text-[11px] font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Bersihkan
                  </button>
                </div>
              </div>

              {/* Participant Textarea */}
              <div className="relative flex-1 flex flex-col min-h-[260px] lg:min-h-[340px]">
                <textarea
                  className="clean-scroll w-full flex-1 rounded-2xl bg-surface border border-outline-variant/40 p-3.5 text-sm text-on-surface leading-relaxed placeholder:text-outline-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 resize-none shadow-inner"
                  placeholder="Ketik atau tempel daftar nama peserta di sini (satu nama per baris)..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
              </div>

            </div>

            {/* Sidebar Footer: Counter & Auto-Exclude Option */}
            <div className="mt-4 pt-3 border-t border-outline-variant/30 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-outline">Daftar Peserta</span>
                <div className="flex items-center gap-1.5">
                  {excludedCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 text-[11px] font-bold">
                      {excludedCount} selesai
                    </span>
                  )}
                  <span className="px-3 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-black">
                    {participants.length}
                  </span>
                </div>
              </div>

              {mode === "wheel" && (
                <label className="flex items-center gap-2 text-xs text-outline hover:text-on-surface cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoRemoveWinner}
                    onChange={(e) => setAutoRemoveWinner(e.target.checked)}
                    className="rounded border-outline-variant/50 text-primary focus:ring-primary w-3.5 h-3.5"
                  />
                  <span>Otomatis keluarkan pemenang setelah putaran</span>
                </label>
              )}
            </div>
          </aside>

          {/* RIGHT WORKSPACE (8 Cols on LG) */}
          <section className="lg:col-span-8 p-5 sm:p-7 flex flex-col justify-between bg-surface">
            
            {/* ========================================================= */}
            {/* VIEW 1: SPIN WHEEL MODE                                   */}
            {/* ========================================================= */}
            {mode === "wheel" && (
              <div className="flex-1 flex flex-col justify-between items-center w-full">
                
                {/* Top Notification Bar: High Capacity + Winner Result Card */}
                <div className="w-full flex flex-col gap-2.5 mb-2">
                  {/* High Capacity Mode Notice */}
                  {isHighCapacity && (
                    <div className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-secondary shrink-0" />
                        <span>
                          <strong>Mode Kapasitas Tinggi ({participants.length} Peserta):</strong>{" "}
                          Segmen roda diringkas menjadi 16 sektor visual agar tidak buram. Nama pemenang akurat tampil di layar jarum atas.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Inline Winner Card */}
                  {winner && (
                    <div className="w-full rounded-2xl bg-secondary/10 border border-secondary/30 px-4 py-3 flex flex-wrap items-center justify-between gap-3 animate-fade-in">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-secondary text-white flex items-center justify-center font-black text-sm shrink-0">
                          <FiCheck className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] font-black uppercase tracking-wider text-secondary">
                            Terpilih pada Putaran Ini
                          </div>
                          <div className="text-base sm:text-lg font-black text-on-surface truncate">
                            {winner}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={removeWinnerFromList}
                          className="px-3 py-1.5 rounded-xl bg-surface border border-outline-variant/30 text-xs font-bold text-outline hover:border-rose-400 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          Keluarkan dari Daftar
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Center Wheel Stage + Live Digital Needle Ticker */}
                <div className="my-auto flex flex-col items-center justify-center py-2 w-full">
                  
                  {/* Live Needle Ticker */}
                  <div className="mb-2 flex flex-col items-center">
                    <div className="px-4 py-1.5 rounded-full bg-surface-container border border-outline-variant/30 text-xs font-semibold text-outline flex items-center gap-2 shadow-sm">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-outline">
                        Posisi Jarum:
                      </span>
                      <span className="font-black text-primary max-w-[220px] sm:max-w-[280px] truncate">
                        {needleTicker}
                      </span>
                    </div>
                  </div>

                  {/* Wheel Container */}
                  <div className="relative flex items-center justify-center">
                    {/* Top Orange Pointer Needle */}
                    <div className="absolute -top-3.5 z-20 wheel-needle pointer-events-none">
                      <svg width="34" height="32" viewBox="0 0 34 32" fill="none">
                        <path
                          d="M17 31L3 4C2.2 2.5 3.3 0.75 5 0.75H29C30.7 0.75 31.8 2.5 31 4L17 31Z"
                          fill="#f2791e"
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>

                    {/* Canvas Wheel */}
                    <div className="p-2.5 rounded-full bg-surface shadow-xl border border-outline-variant/30">
                      <canvas
                        ref={canvasRef}
                        width={360}
                        height={360}
                        onClick={spinWheel}
                        className={`w-[280px] h-[280px] sm:w-[350px] sm:h-[350px] rounded-full block ${
                          participants.length < 2 ? "cursor-not-allowed opacity-90" : "cursor-pointer"
                        }`}
                        title={
                          participants.length < 2
                            ? "Isi minimal 2 peserta di sebelah kiri untuk memutar"
                            : "Klik untuk memutar roda"
                        }
                      />
                    </div>
                  </div>

                  {/* Spin Action Button */}
                  <div className="mt-6 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={spinWheel}
                      disabled={isSpinning}
                      className={`px-8 py-3.5 rounded-full text-white font-black text-sm sm:text-base shadow-md transition-all active:translate-y-0.5 ${
                        isSpinning
                          ? "bg-outline/50 cursor-not-allowed opacity-50"
                          : participants.length < 2
                          ? "bg-secondary/80 hover:bg-secondary cursor-pointer"
                          : "bg-secondary hover:bg-[#d15b13] hover:shadow-lg cursor-pointer"
                      }`}
                    >
                      Putar Roda Sekarang
                    </button>
                  </div>
                </div>

                {/* Bottom History Strip */}
                <div className="w-full pt-4 border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-outline">Riwayat Putaran:</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {spinHistory.length === 0 ? (
                        <span className="text-outline italic">Belum ada riwayat</span>
                      ) : (
                        spinHistory.map((name, i) => (
                          <span
                            key={i}
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              i === 0
                                ? "bg-secondary/15 text-secondary border border-secondary/30"
                                : "bg-surface-container text-outline"
                            }`}
                          >
                            <span className="opacity-60">#{spinHistory.length - i}</span>
                            <span>{name}</span>
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {spinHistory.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSpinHistory([])}
                      className="text-outline hover:text-on-surface font-semibold cursor-pointer"
                    >
                      Reset Riwayat
                    </button>
                  )}
                </div>

              </div>
            )}

            {/* ========================================================= */}
            {/* VIEW 2: GROUP GENERATOR MODE                              */}
            {/* ========================================================= */}
            {mode === "groups" && (
              <div className="flex-1 flex flex-col justify-between w-full">
                
                <div>
                  {/* Control Toolbar */}
                  <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-3.5 sm:p-4 mb-4 flex flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      
                      {/* Split Method & Number Input */}
                      <div className="flex flex-wrap items-center gap-2.5">
                        <select
                          value={splitMethod}
                          onChange={(e) =>
                            setSplitMethod(e.target.value as "byCount" | "bySize")
                          }
                          className="rounded-xl bg-surface border border-outline-variant/40 px-3 py-2 text-xs sm:text-sm font-semibold text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                        >
                          <option value="byCount">Jumlah Kelompok:</option>
                          <option value="bySize">Maks. Anggota / Kelompok:</option>
                        </select>

                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={groupNumber}
                          onChange={(e) =>
                            setGroupNumber(Math.max(1, parseInt(e.target.value, 10) || 1))
                          }
                          className="w-20 rounded-xl bg-surface border border-outline-variant/40 px-3 py-2 text-center text-sm font-bold text-on-surface focus:outline-none focus:border-primary"
                        />

                        <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-outline hover:text-on-surface cursor-pointer select-none ml-1">
                          <input
                            type="checkbox"
                            checked={assignLeader}
                            onChange={(e) => setAssignLeader(e.target.checked)}
                            className="rounded border-outline-variant/40 text-primary focus:ring-primary w-3.5 h-3.5"
                          />
                          <span>Tandai Ketua Kelompok</span>
                        </label>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (participants.length === 0) {
                              showToast("Daftar peserta masih kosong! Masukkan minimal 2 nama di sebelah kiri.");
                              return;
                            }
                            if (participants.length < 2) {
                              showToast("Minimal butuh 2 peserta untuk membagi ke dalam kelompok.");
                              return;
                            }
                            generateBalancedGroups();
                            showToast("Kelompok berhasil diacak secara proporsional.");
                          }}
                          className="px-5 py-2.5 rounded-xl bg-primary hover:bg-[#102c56] active:translate-y-0.5 text-white text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
                        >
                          Acak Kelompok
                        </button>

                        <button
                          type="button"
                          onClick={handleCopyAllGroupsWA}
                          title="Salin seluruh pembagian kelompok siap tempel di WhatsApp"
                          className="px-3.5 py-2.5 rounded-xl bg-surface border border-outline-variant/40 hover:border-primary text-primary text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                        >
                          Salin Format WA
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setGroupNumber(2);
                            setSearchMember("");
                            setAssignLeader(false);
                            generateBalancedGroups();
                            showToast("Pengaturan kelompok di-reset.");
                          }}
                          className="px-4 py-2.5 rounded-xl bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                        >
                          Reset
                        </button>
                      </div>

                    </div>

                    {/* Summary & Live Search */}
                    <div className="pt-2.5 border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-2 text-xs text-outline">
                      <span className="font-medium">
                        {groups.length > 0
                          ? `Total ${participants.length} peserta dibagi menjadi ${groups.length} kelompok.`
                          : "Menampilkan pembagian kelompok yang seimbang."}
                      </span>

                      <div className="relative w-full sm:w-56">
                        <input
                          type="text"
                          placeholder="Cari nama di kelompok..."
                          value={searchMember}
                          onChange={(e) => setSearchMember(e.target.value)}
                          className="w-full rounded-lg bg-surface border border-outline-variant/40 pl-7 pr-2.5 py-1 text-xs text-on-surface placeholder:text-outline-variant focus:outline-none focus:border-primary"
                        />
                        <FiSearch className="w-3.5 h-3.5 text-outline absolute left-2.5 top-1.5" />
                      </div>
                    </div>
                  </div>

                  {/* Responsive Group Cards Container */}
                  <div className="clean-scroll grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[440px] overflow-y-auto pr-1">
                    {groups.length === 0 ? (
                      <div className="col-span-full py-12 text-center text-outline text-sm">
                        Masukkan daftar nama peserta di sebelah kiri lalu klik{" "}
                        <strong>Acak Kelompok</strong>.
                      </div>
                    ) : (
                      groups.map((members, gIdx) => {
                        const useTwoCols = members.length > 10;
                        const query = searchMember.trim().toLowerCase();

                        return (
                          <div
                            key={gIdx}
                            className="rounded-2xl border border-outline-variant/30 bg-surface p-4 shadow-sm flex flex-col justify-between"
                          >
                            <div>
                              {/* Group Header Pill */}
                              <div className="flex items-center justify-between gap-2 bg-primary/10 px-3.5 py-2 rounded-xl mb-3">
                                <span className="text-xs sm:text-sm font-black text-primary tracking-wide">
                                  KELOMPOK {gIdx + 1}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded-full bg-surface text-primary text-[11px] font-bold shadow-xs">
                                    {members.length} orang
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const text =
                                        `*KELOMPOK ${gIdx + 1} (${members.length} Orang)*\n` +
                                        members
                                          .map(
                                            (m, i) =>
                                              `${i + 1}. ${m}${
                                                assignLeader && i === 0 ? " (Ketua)" : ""
                                              }`
                                          )
                                          .join("\n");
                                      copyToClipboard(
                                        text,
                                        `Kelompok ${gIdx + 1} disalin ke clipboard!`
                                      );
                                    }}
                                    title={`Salin anggota Kelompok ${gIdx + 1}`}
                                    className="text-outline hover:text-primary text-xs font-semibold px-1.5 py-0.5 rounded hover:bg-surface transition-colors cursor-pointer"
                                  >
                                    Salin
                                  </button>
                                </div>
                              </div>

                              {/* Members List */}
                              <ul
                                className={`clean-scroll ${
                                  useTwoCols
                                    ? "grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1 max-h-[260px] overflow-y-auto pr-1"
                                    : "space-y-1 max-h-[260px] overflow-y-auto pr-1"
                                }`}
                              >
                                {members.map((member, mIdx) => {
                                  const isLeader = assignLeader && mIdx === 0;
                                  const isMatch =
                                    query.length > 0 &&
                                    member.toLowerCase().includes(query);

                                  return (
                                    <li
                                      key={mIdx}
                                      className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg border text-xs sm:text-sm text-on-surface transition-colors ${
                                        isMatch
                                          ? "search-match"
                                          : "border-transparent hover:bg-surface-container-low"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <span className="w-6 h-6 rounded-full bg-surface-container text-outline font-bold text-[11px] flex items-center justify-center shrink-0">
                                          {mIdx + 1}
                                        </span>
                                        <span className="truncate" title={member}>
                                          {member}
                                        </span>
                                      </div>
                                      {isLeader && (
                                        <span className="px-2 py-0.5 rounded-md bg-secondary/15 text-secondary text-[10px] font-black shrink-0">
                                          Ketua
                                        </span>
                                      )}
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Footer Hint */}
                <div className="pt-3 mt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs text-outline">
                  <span>
                    Algoritma pengacakan Fisher-Yates memastikan selisih anggota antar kelompok maksimal 1 orang.
                  </span>
                </div>

              </div>
            )}

          </section>
        </main>

      </div>
    </div>
  );
}
