"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "@/i18n/routing";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  FiPlay,
  FiPause,
  FiRotateCcw,
  FiMaximize,
  FiMinimize,
  FiVolume2,
  FiArrowLeft,
  FiRepeat,
  FiSettings,
  FiMinus,
  FiEdit2,
  FiAward,
} from "react-icons/fi";

type SportPreset = "general" | "futsal" | "badminton" | "basketball";

interface TeamState {
  name: string;
  score: number;
  fouls: number;
  sets: number;
  color: string;
}

const COLOR_OPTIONS = [
  { name: "Biru Terang", value: "#1e88e5" },
  { name: "Merah Terang", value: "#e53935" },
  { name: "Navy BEM", value: "#1b4086" },
  { name: "Orange BEM", value: "#f2791e" },
  { name: "Hijau Emerald", value: "#16a34a" },
  { name: "Ungu", value: "#8b5cf6" },
];

export default function PapanSkorClient() {
  const [preset, setPreset] = useState<SportPreset>("futsal");

  // Teams default colors (Blue vs Red)
  const [teamA, setTeamA] = useState<TeamState>({
    name: "Player 1",
    score: 10,
    fouls: 0,
    sets: 3,
    color: "#1e88e5",
  });

  const [teamB, setTeamB] = useState<TeamState>({
    name: "Player 2",
    score: 6,
    fouls: 0,
    sets: 1,
    color: "#e53935",
  });

  // Period / Babak
  const [period, setPeriod] = useState(1);
  const [periodName, setPeriodName] = useState("Babak");

  // Timer
  const [initialSeconds, setInitialSeconds] = useState(1200); // 20 min default futsal
  const [secondsLeft, setSecondsLeft] = useState(1200);
  const [isRunning, setIsRunning] = useState(false);
  const [isCountDown, setIsCountDown] = useState(true);

  // UI States
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [dismissMobilePrompt, setDismissMobilePrompt] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [winnerMessage, setWinnerMessage] = useState<string | null>(null);
  const [isPortrait, setIsPortrait] = useState(false);
  const [popsA, setPopsA] = useState<
    { id: number; text: string; x: number; y: number }[]
  >([]);
  const [popsB, setPopsB] = useState<
    { id: number; text: string; x: number; y: number }[]
  >([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRefA = useRef<HTMLInputElement>(null);
  const inputRefB = useRef<HTMLInputElement>(null);

  // Deteksi perangkat mobile & orientasi layar
  useEffect(() => {
    const checkScreen = () => {
      const isNarrow = window.innerWidth < 768;
      const isMobileUA =
        typeof navigator !== "undefined" &&
        /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );
      setIsMobile(isNarrow || isMobileUA);
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  // Sync fullscreen state with browser events (e.g. pressing ESC or system gestures)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (!isFull) {
        try {
          if (typeof window !== "undefined" && window.screen?.orientation && "unlock" in window.screen.orientation) {
            window.screen.orientation.unlock();
          }
        } catch {}
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Sport Icon
  const getSportIcon = () => {
    switch (preset) {
      case "futsal":
        return "⚽";
      case "badminton":
        return "🏸";
      case "basketball":
        return "🏀";
      default:
        return "🏆";
    }
  };

  // Web Audio Buzzer
  const playBuzzer = useCallback(() => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      osc.frequency.setValueAtTime(440, ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch {
      // Audio fallback
    }
  }, []);

  // Web Audio Score Pop Synthesizer
  const playScorePop = useCallback((isHigherPitch = false) => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      const baseFreq = isHigherPitch ? 540 : 440;
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {}
  }, []);

  // Timer Interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (isCountDown) {
            if (prev <= 1) {
              setIsRunning(false);
              playBuzzer();
              confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
              return 0;
            }
            return prev - 1;
          } else {
            return prev + 1;
          }
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isCountDown, playBuzzer]);

  // Apply Presets
  const applyPreset = (newPreset: SportPreset) => {
    setPreset(newPreset);
    setIsRunning(false);
    if (newPreset === "futsal") {
      setInitialSeconds(1200);
      setSecondsLeft(1200);
      setIsCountDown(true);
      setPeriodName("Babak");
    } else if (newPreset === "badminton") {
      setInitialSeconds(0);
      setSecondsLeft(0);
      setIsCountDown(false);
      setPeriodName("Set");
    } else if (newPreset === "basketball") {
      setInitialSeconds(600);
      setSecondsLeft(600);
      setIsCountDown(true);
      setPeriodName("Quarter");
    } else {
      setInitialSeconds(600);
      setSecondsLeft(600);
      setIsCountDown(true);
      setPeriodName("Babak");
    }
  };

  // Score Handlers
  const changeScore = (
    team: "A" | "B",
    delta: number,
    e?: React.MouseEvent
  ) => {
    playScorePop(team === "B");

    let x = 50;
    let y = 60;

    if (e) {
      const halfEl =
        ((e.currentTarget as HTMLElement).closest(".team-half") as HTMLElement) ||
        (e.currentTarget as HTMLElement);
      const rect = halfEl.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const rawX = ((e.clientX - rect.left) / rect.width) * 100;
        const rawY = ((e.clientY - rect.top) / rect.height) * 100;
        const jitterX = (Math.random() - 0.5) * 6;
        const jitterY = (Math.random() - 0.5) * 4;
        x = Math.max(12, Math.min(88, rawX + jitterX));
        y = Math.max(15, Math.min(85, rawY + jitterY));
      }
    }

    const popId = Date.now() + Math.random();
    const text = delta > 0 ? `+${delta} POIN` : `${delta} POIN`;

    if (team === "A") {
      setPopsA((prev) => [...prev.slice(-3), { id: popId, text, x, y }]);
      setTimeout(() => {
        setPopsA((prev) => prev.filter((p) => p.id !== popId));
      }, 850);
      setTeamA((prev) => {
        const next = Math.max(0, prev.score + delta);
        checkWinner(next, teamB.score, prev.name, teamB.name);
        return { ...prev, score: next };
      });
    } else {
      setPopsB((prev) => [...prev.slice(-3), { id: popId, text, x, y }]);
      setTimeout(() => {
        setPopsB((prev) => prev.filter((p) => p.id !== popId));
      }, 850);
      setTeamB((prev) => {
        const next = Math.max(0, prev.score + delta);
        checkWinner(teamA.score, next, teamA.name, prev.name);
        return { ...prev, score: next };
      });
    }
  };

  const changeFouls = (team: "A" | "B", delta: number) => {
    if (team === "A") {
      setTeamA((prev) => ({ ...prev, fouls: Math.max(0, prev.fouls + delta) }));
    } else {
      setTeamB((prev) => ({ ...prev, fouls: Math.max(0, prev.fouls + delta) }));
    }
  };

  const changeSets = (team: "A" | "B", delta: number) => {
    if (team === "A") {
      setTeamA((prev) => ({ ...prev, sets: Math.max(0, prev.sets + delta) }));
    } else {
      setTeamB((prev) => ({ ...prev, sets: Math.max(0, prev.sets + delta) }));
    }
  };

  const checkWinner = (
    scoreA: number,
    scoreB: number,
    nameA: string,
    nameB: string
  ) => {
    if (preset === "badminton" && (scoreA >= 21 || scoreB >= 21)) {
      if (Math.abs(scoreA - scoreB) >= 2 || scoreA === 30 || scoreB === 30) {
        const winner = scoreA > scoreB ? nameA : nameB;
        setWinnerMessage(`${winner} Memenangkan Game! 🎉`);
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
      }
    }
  };

  const handleSwapSides = () => {
    const temp = { ...teamA };
    setTeamA({ ...teamB });
    setTeamB(temp);
  };

  const handleResetMatch = () => {
    setIsRunning(false);
    setTeamA((prev) => ({ ...prev, score: 0, fouls: 0, sets: 0 }));
    setTeamB((prev) => ({ ...prev, score: 0, fouls: 0, sets: 0 }));
    setSecondsLeft(initialSeconds);
    setPeriod(1);
    setWinnerMessage(null);
    setShowResetConfirm(false);
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any)?.webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        }
        setIsFullscreen(true);

        // Kunci orientasi lanskap otomatis jika didukung browser (misal Chrome Android)
        if (
          typeof window !== "undefined" &&
          window.screen?.orientation &&
          "lock" in window.screen.orientation
        ) {
          await (window.screen.orientation as any).lock("landscape").catch(() => {});
        }
      } catch (err) {
        console.log(err);
      }
    } else {
      try {
        if (
          typeof window !== "undefined" &&
          window.screen?.orientation &&
          "unlock" in window.screen.orientation
        ) {
          window.screen.orientation.unlock();
        }
      } catch {}

      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  };

  // Khusus perangkat HP: Tampilkan layar masuk mode penuh jika belum fullscreen
  if (isMobile && !isFullscreen && !dismissMobilePrompt) {
    return (
      <div
        ref={containerRef}
        className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center select-none relative overflow-hidden"
      >
        {/* Stadium Ambient Glow */}
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-sm w-full flex flex-col items-center">
          {/* Sports Badge */}
          <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl flex items-center justify-center text-4xl mb-5 relative">
            <span className="animate-pulse">{getSportIcon()}</span>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center text-[10px]">
              ✓
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-slate-300 text-[11px] font-semibold mb-3 border border-white/15">
            <span>Tools Kampus BEM STMIK Tazkia</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
            Papan Skor Digital
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
            Khusus di perangkat HP, papan skor dioptimalkan dalam <strong>Mode Layar Penuh (Lanskap)</strong> agar angka skor raksasa terlihat jelas dan tombol leluasa ditekan saat pertandingan.
          </p>

          {/* Primary CTA: Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="w-full py-4 px-6 bg-gradient-to-r from-primary via-blue-600 to-secondary text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-xl shadow-primary/30 hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2.5 mb-3"
          >
            <FiMaximize className="w-5 h-5 shrink-0" />
            <span>Masuk ke Mode Layar Penuh</span>
          </button>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-6 font-medium">
            <span className="text-sm">🔄</span>
            <span>Otomatis memutar ke posisi mendatar (lanskap)</span>
          </div>

          {/* Secondary Actions */}
          <div className="flex flex-col gap-2.5 w-full pt-4 border-t border-white/10 text-xs">
            <Link
              href="/tools"
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <FiArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Tools Hub</span>
            </Link>

            <button
              onClick={() => setDismissMobilePrompt(true)}
              className="text-[11px] text-slate-500 hover:text-slate-300 py-1 transition-colors"
            >
              Lanjutkan dalam tampilan biasa
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`text-on-surface selection:bg-primary selection:text-white ${
        isFullscreen
          ? "fixed inset-0 z-[100] w-screen h-screen bg-slate-950 flex flex-col justify-between overflow-hidden p-0 m-0"
          : "min-h-screen bg-background pt-24 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-8 flex flex-col justify-between"
      }`}
    >
      <div
        className={
          isFullscreen
            ? "w-full h-full flex-1 flex flex-col justify-between overflow-hidden"
            : "max-w-5xl w-full mx-auto flex-1 flex flex-col justify-start"
        }
      >
        {/* Top Control Bar */}
        <div
          className={
            isFullscreen
              ? "w-full bg-slate-950/90 backdrop-blur-md px-3 sm:px-6 py-1.5 sm:py-2 border-b border-white/10 flex items-center justify-between shrink-0 z-30"
              : "flex flex-wrap items-center justify-between gap-3 mb-5"
          }
        >
          {/* Back button (only when not fullscreen) */}
          {!isFullscreen ? (
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-outline hover:text-on-surface bg-surface border border-outline-variant/30 px-3.5 py-2 rounded-xl shadow-sm hover:shadow transition-all"
            >
              <FiArrowLeft />
              <span>Kembali ke Tools Hub</span>
            </Link>
          ) : (
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="hidden md:inline text-[11px]">Papan Skor</span>
            </div>
          )}

          {/* Preset Sports */}
          <div className="flex items-center gap-0.5 sm:gap-1 bg-surface-container-low dark:bg-white/10 border border-outline-variant/30 dark:border-white/15 rounded-xl p-0.5 sm:p-1 text-[11px] sm:text-xs">
            {(["futsal", "badminton", "basketball", "general"] as SportPreset[]).map(
              (p) => (
                <button
                  key={p}
                  onClick={() => applyPreset(p)}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg font-bold capitalize transition-all ${
                    preset === p
                      ? "bg-primary text-white shadow-sm"
                      : "text-outline dark:text-slate-300 hover:text-on-surface dark:hover:text-white"
                  }`}
                >
                  {p === "general" ? "Umum" : p}
                </button>
              )
            )}
          </div>

          {/* Quick Utility Icons */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              onClick={handleSwapSides}
              title="Tukar Sisi Lapangan"
              className={
                isFullscreen
                  ? "p-1.5 sm:p-2 bg-white/10 hover:bg-white/20 rounded-lg sm:rounded-xl text-white transition-colors"
                  : "p-2 bg-surface hover:bg-surface-container border border-outline-variant/30 rounded-xl text-on-surface transition-colors shadow-sm"
              }
            >
              <FiRepeat className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <button
              onClick={playBuzzer}
              title="Bunyikan Klakson / Buzzer"
              className={
                isFullscreen
                  ? "p-1.5 sm:p-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 rounded-lg sm:rounded-xl transition-colors shadow-sm"
                  : "p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded-xl transition-colors shadow-sm"
              }
            >
              <FiVolume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              title="Pengaturan Warna & Waktu"
              className={
                isFullscreen
                  ? "p-1.5 sm:p-2 bg-white/10 hover:bg-white/20 rounded-lg sm:rounded-xl text-white transition-colors"
                  : "p-2 bg-surface hover:bg-surface-container border border-outline-variant/30 rounded-xl text-on-surface transition-colors shadow-sm"
              }
            >
              <FiSettings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? "Keluar Layar Penuh" : "Mode Layar Penuh (Proyektor)"}
              className="p-1.5 sm:p-2 bg-secondary text-white hover:bg-secondary-dark rounded-lg sm:rounded-xl transition-colors font-bold shadow-sm"
            >
              {isFullscreen ? <FiMinimize className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <FiMaximize className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>
          </div>
        </div>

        {/* Winner Alert Banner */}
        <AnimatePresence>
          {winnerMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-white text-slate-900 px-6 py-2.5 rounded-2xl shadow-2xl flex items-center justify-center gap-3 border-2 border-amber-400"
            >
              <FiAward className="w-6 h-6 text-amber-500 animate-bounce" />
              <span className="font-black text-sm sm:text-base">{winnerMessage}</span>
              <button
                onClick={() => setWinnerMessage(null)}
                className="ml-3 text-xs bg-slate-200 hover:bg-slate-300 px-2 py-0.5 rounded-lg font-bold"
              >
                Tutup
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================= STADIUM SCOREBOARD ARENA ================= */}
        <div
          className={
            isFullscreen
              ? "w-full h-full flex-1 relative select-none grid grid-cols-2 overflow-hidden"
              : "w-full rounded-3xl overflow-hidden shadow-2xl border-2 border-outline-variant/30 relative select-none grid grid-cols-2 min-h-[480px] sm:min-h-[540px]"
          }
        >
          {/* ================= LEFT HALF (BLUE / TEAM A) ================= */}
          <div
            className={`team-half relative flex flex-col justify-between cursor-pointer transition-colors group overflow-hidden ${
              isFullscreen ? "p-3 sm:p-6 md:p-8" : "p-4 sm:p-8 md:p-10"
            }`}
            style={{ backgroundColor: teamA.color }}
            onClick={(e) => changeScore("A", 1, e)}
            title="Klik area untuk +1 poin"
          >
            {/* Dynamic Tap-Positioned Floating +POIN (Never blocks player name / not in 1 fixed spot) */}
            <AnimatePresence>
              {popsA.map((pop) => (
                <motion.span
                  key={pop.id}
                  initial={{ opacity: 0, scale: 0.65, y: 10 }}
                  animate={{
                    opacity: [0, 1, 1, 0],
                    scale: [0.65, 1.25, 1.1, 0.95],
                    y: [10, -25, -50],
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  style={{
                    left: `${pop.x}%`,
                    top: `${pop.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  className="absolute z-30 pointer-events-none select-none text-2xl sm:text-3xl md:text-4xl font-mono font-black text-yellow-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] tracking-wider whitespace-nowrap"
                >
                  {pop.text}
                </motion.span>
              ))}
            </AnimatePresence>

            {/* Top Row: Edit & Ball */}
            <div className="flex items-start justify-between relative z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  inputRefA.current?.focus();
                }}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white flex items-center justify-center transition-all shadow-sm"
                title="Edit Nama"
              >
                <FiEdit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              <div className="flex flex-col items-center">
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-white/20 backdrop-blur-md shadow-md flex items-center justify-center text-xl sm:text-3xl border border-white/40">
                  {getSportIcon()}
                </div>
                {teamA.score > teamB.score && (
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full mt-1 shadow-sm">
                    Memimpin
                  </span>
                )}
              </div>

              {/* Spacer for center alignment */}
              <div className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>

            {/* Team A Name */}
            <div className="text-center mt-1 sm:mt-2 relative z-10" onClick={(e) => e.stopPropagation()}>
              <input
                ref={inputRefA}
                type="text"
                value={teamA.name}
                onChange={(e) => setTeamA({ ...teamA, name: e.target.value })}
                className="bg-transparent text-center text-base sm:text-2xl md:text-3xl font-black text-white focus:outline-none focus:bg-black/20 rounded-xl px-2 py-0.5 w-full max-w-[180px] sm:max-w-[260px] transition-colors tracking-wide drop-shadow"
              />
            </div>

            {/* Team A Giant Score */}
            <div className="flex-1 flex items-center justify-center py-1 sm:py-2 relative z-10">
              <motion.span
                key={teamA.score}
                initial={{ scale: 1.28, color: "#fef08a" }}
                animate={{ scale: 1, color: "#ffffff" }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className={`font-mono font-black text-white leading-none tracking-tight drop-shadow-2xl select-none ${
                  isFullscreen
                    ? "text-[18vw] sm:text-[16vw] md:text-[22vh]"
                    : "text-8xl sm:text-9xl md:text-[140px]"
                }`}
              >
                {teamA.score}
              </motion.span>
            </div>

            {/* Team A Bottom Controls */}
            <div
              className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 relative z-10 pt-1 sm:pt-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-1 sm:gap-1.5 bg-black/25 backdrop-blur-md p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-white/20">
                <button
                  onClick={(e) => changeScore("A", -1, e)}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center font-bold text-sm sm:text-base transition-transform active:scale-95"
                  title="Kurangi 1 Poin"
                >
                  <FiMinus />
                </button>
                {preset === "basketball" && (
                  <>
                    <button
                      onClick={(e) => changeScore("A", 2, e)}
                      className="px-2.5 sm:px-3 h-8 sm:h-10 rounded-lg sm:rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm"
                    >
                      +2
                    </button>
                    <button
                      onClick={(e) => changeScore("A", 3, e)}
                      className="px-2.5 sm:px-3 h-8 sm:h-10 rounded-lg sm:rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm"
                    >
                      +3
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1 sm:gap-1.5 bg-black/25 backdrop-blur-md px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-2xl border border-white/20 text-[11px] sm:text-xs text-white">
                <span className="font-semibold text-[9px] sm:text-[10px] uppercase">Fouls:</span>
                <span className="font-mono font-bold text-amber-300 text-xs sm:text-sm">{teamA.fouls}</span>
                <button
                  onClick={() => changeFouls("A", 1)}
                  className="w-4 h-4 sm:w-5 sm:h-5 bg-white/20 hover:bg-white/30 rounded flex items-center justify-center text-xs font-bold"
                >
                  +
                </button>
                <button
                  onClick={() => changeFouls("A", -1)}
                  className="w-4 h-4 sm:w-5 sm:h-5 bg-white/20 hover:bg-white/30 rounded flex items-center justify-center text-xs font-bold"
                >
                  -
                </button>
              </div>
            </div>
          </div>

          {/* ================= RIGHT HALF (RED / TEAM B) ================= */}
          <div
            className={`team-half relative flex flex-col justify-between cursor-pointer transition-colors group overflow-hidden ${
              isFullscreen ? "p-3 sm:p-6 md:p-8" : "p-4 sm:p-8 md:p-10"
            }`}
            style={{ backgroundColor: teamB.color }}
            onClick={(e) => changeScore("B", 1, e)}
            title="Klik area untuk +1 poin"
          >
            {/* Dynamic Tap-Positioned Floating +POIN (Never blocks player name / not in 1 fixed spot) */}
            <AnimatePresence>
              {popsB.map((pop) => (
                <motion.span
                  key={pop.id}
                  initial={{ opacity: 0, scale: 0.65, y: 10 }}
                  animate={{
                    opacity: [0, 1, 1, 0],
                    scale: [0.65, 1.25, 1.1, 0.95],
                    y: [10, -25, -45],
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  style={{
                    left: `${pop.x}%`,
                    top: `${pop.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  className="absolute z-30 pointer-events-none select-none text-2xl sm:text-3xl md:text-4xl font-mono font-black text-yellow-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] tracking-wider whitespace-nowrap"
                >
                  {pop.text}
                </motion.span>
              ))}
            </AnimatePresence>

            {/* Top Row: Ball & Edit */}
            <div className="flex items-start justify-between relative z-10">
              {/* Spacer for center alignment */}
              <div className="w-8 h-8 sm:w-10 sm:h-10" />

              <div className="flex flex-col items-center">
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-white/20 backdrop-blur-md shadow-md flex items-center justify-center text-xl sm:text-3xl border border-white/40">
                  {getSportIcon()}
                </div>
                {teamB.score > teamA.score && (
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full mt-1 shadow-sm">
                    Memimpin
                  </span>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  inputRefB.current?.focus();
                }}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white flex items-center justify-center transition-all shadow-sm"
                title="Edit Nama"
              >
                <FiEdit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>

            {/* Team B Name */}
            <div className="text-center mt-1 sm:mt-2 relative z-10" onClick={(e) => e.stopPropagation()}>
              <input
                ref={inputRefB}
                type="text"
                value={teamB.name}
                onChange={(e) => setTeamB({ ...teamB, name: e.target.value })}
                className="bg-transparent text-center text-base sm:text-2xl md:text-3xl font-black text-white focus:outline-none focus:bg-black/20 rounded-xl px-2 py-0.5 w-full max-w-[180px] sm:max-w-[260px] transition-colors tracking-wide drop-shadow"
              />
            </div>

            {/* Team B Giant Score */}
            <div className="flex-1 flex items-center justify-center py-1 sm:py-2 relative z-10">
              <motion.span
                key={teamB.score}
                initial={{ scale: 1.28, color: "#fef08a" }}
                animate={{ scale: 1, color: "#ffffff" }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className={`font-mono font-black text-white leading-none tracking-tight drop-shadow-2xl select-none ${
                  isFullscreen
                    ? "text-[18vw] sm:text-[16vw] md:text-[22vh]"
                    : "text-8xl sm:text-9xl md:text-[140px]"
                }`}
              >
                {teamB.score}
              </motion.span>
            </div>

            {/* Team B Bottom Controls */}
            <div
              className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 relative z-10 pt-1 sm:pt-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-1 sm:gap-1.5 bg-black/25 backdrop-blur-md px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-2xl border border-white/20 text-[11px] sm:text-xs text-white">
                <span className="font-semibold text-[9px] sm:text-[10px] uppercase">Fouls:</span>
                <span className="font-mono font-bold text-amber-300 text-xs sm:text-sm">{teamB.fouls}</span>
                <button
                  onClick={() => changeFouls("B", 1)}
                  className="w-4 h-4 sm:w-5 sm:h-5 bg-white/20 hover:bg-white/30 rounded flex items-center justify-center text-xs font-bold"
                >
                  +
                </button>
                <button
                  onClick={() => changeFouls("B", -1)}
                  className="w-4 h-4 sm:w-5 sm:h-5 bg-white/20 hover:bg-white/30 rounded flex items-center justify-center text-xs font-bold"
                >
                  -
                </button>
              </div>

              <div className="flex items-center gap-1 sm:gap-1.5 bg-black/25 backdrop-blur-md p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-white/20">
                <button
                  onClick={(e) => changeScore("B", -1, e)}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center font-bold text-sm sm:text-base transition-transform active:scale-95"
                  title="Kurangi 1 Poin"
                >
                  <FiMinus />
                </button>
                {preset === "basketball" && (
                  <>
                    <button
                      onClick={(e) => changeScore("B", 2, e)}
                      className="px-2.5 sm:px-3 h-8 sm:h-10 rounded-lg sm:rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm"
                    >
                      +2
                    </button>
                    <button
                      onClick={(e) => changeScore("B", 3, e)}
                      className="px-2.5 sm:px-3 h-8 sm:h-10 rounded-lg sm:rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm"
                    >
                      +3
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ================= FLOATING CENTER ISLAND (STREAMLINED & COMPACT) ================= */}
          <div className="absolute top-2 sm:top-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-auto">
            {/* Unified Compact Glass Capsule */}
            <div className="bg-slate-950/85 backdrop-blur-md text-white rounded-2xl px-3 sm:px-4 py-1.5 sm:py-2 shadow-2xl border border-white/20 flex flex-col items-center gap-1">
              {/* Row 1: Timer */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setIsRunning(!isRunning)}
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white text-slate-900 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow"
                  title={isRunning ? "Jeda" : "Mulai"}
                >
                  {isRunning ? <FiPause size={10} className="text-slate-900" /> : <FiPlay size={10} className="ml-0.5 text-slate-900" />}
                </button>

                <span
                  onClick={() => setIsRunning(!isRunning)}
                  className="font-mono text-sm sm:text-base md:text-lg font-black tracking-widest text-white cursor-pointer select-none"
                >
                  {formatTime(secondsLeft)}
                </span>

                <button
                  onClick={() => {
                    setIsRunning(false);
                    setSecondsLeft(initialSeconds);
                  }}
                  className="text-slate-400 hover:text-white transition-colors p-0.5"
                  title="Reset Waktu"
                >
                  <FiRotateCcw size={12} />
                </button>
              </div>

              {/* Row 2: Sets & Babak in One Slim Sub-Row */}
              <div className="flex items-center gap-2.5 pt-1 border-t border-white/10 text-[10px] sm:text-xs">
                {/* Team A Set */}
                <div className="flex items-center gap-0.5 font-mono">
                  <button
                    onClick={() => changeSets("A", -1)}
                    className="w-3.5 h-3.5 rounded bg-white/10 hover:bg-white/20 text-white/70 flex items-center justify-center text-[9px] font-bold"
                  >
                    -
                  </button>
                  <span className="font-bold text-sky-400 px-1">{teamA.sets}</span>
                  <button
                    onClick={() => changeSets("A", 1)}
                    className="w-3.5 h-3.5 rounded bg-white/10 hover:bg-white/20 text-white/70 flex items-center justify-center text-[9px] font-bold"
                  >
                    +
                  </button>
                </div>

                <span className="text-white/20 font-bold">:</span>

                {/* Period / Babak */}
                <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-slate-300 font-bold uppercase tracking-wider">
                  <span>{periodName}</span>
                  <button
                    onClick={() => setPeriod((p) => Math.max(1, p - 1))}
                    className="w-3.5 h-3.5 rounded bg-white/10 hover:bg-white/20 text-white/70 flex items-center justify-center text-[9px] font-bold"
                  >
                    -
                  </button>
                  <span className="font-mono font-black text-amber-300">{period}</span>
                  <button
                    onClick={() => setPeriod((p) => p + 1)}
                    className="w-3.5 h-3.5 rounded bg-white/10 hover:bg-white/20 text-white/70 flex items-center justify-center text-[9px] font-bold"
                  >
                    +
                  </button>
                </div>

                <span className="text-white/20 font-bold">:</span>

                {/* Team B Set */}
                <div className="flex items-center gap-0.5 font-mono">
                  <button
                    onClick={() => changeSets("B", -1)}
                    className="w-3.5 h-3.5 rounded bg-white/10 hover:bg-white/20 text-white/70 flex items-center justify-center text-[9px] font-bold"
                  >
                    -
                  </button>
                  <span className="font-bold text-rose-400 px-1">{teamB.sets}</span>
                  <button
                    onClick={() => changeSets("B", 1)}
                    className="w-3.5 h-3.5 rounded bg-white/10 hover:bg-white/20 text-white/70 flex items-center justify-center text-[9px] font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Floating Rotation Hint on Mobile Portrait */}
        {isFullscreen && isPortrait && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-black/85 backdrop-blur-md text-white text-[11px] sm:text-xs font-semibold px-4 py-2 rounded-full border border-white/20 shadow-2xl pointer-events-none flex items-center gap-2 animate-bounce">
            <span className="text-sm">🔄</span>
            <span>Putar HP ke lanskap untuk tampilan proyektor optimal</span>
          </div>
        )}

        {/* Clean Bottom Bar (Only when NOT fullscreen) */}
        {!isFullscreen && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-outline">
            <span>💡 Klik area layar berwarna untuk menambah poin secara instan.</span>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="text-rose-500 hover:text-rose-600 font-semibold transition-colors"
            >
              Reset Pertandingan
            </button>
          </div>
        )}

      </div>

      {/* SETTINGS MODAL */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border border-outline-variant/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-lg font-bold text-on-surface mb-4">Pengaturan Papan Skor</h3>

              {/* Duration */}
              <div className="mb-5">
                <label className="block text-xs font-semibold text-outline uppercase tracking-wider mb-2">
                  Durasi Waktu Pertandingan (Menit)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={Math.floor(initialSeconds / 60)}
                    onChange={(e) => {
                      const val = Math.max(1, Number(e.target.value));
                      setInitialSeconds(val * 60);
                      setSecondsLeft(val * 60);
                    }}
                    className="w-20 px-3 py-1.5 bg-surface-container border border-outline-variant/30 rounded-xl text-on-surface font-mono text-center font-bold"
                  />
                  <span className="text-xs text-outline">Menit per babak</span>
                </div>
              </div>

              {/* Color Picks */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-outline uppercase tracking-wider mb-2">
                    Warna {teamA.name}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => setTeamA({ ...teamA, color: c.value })}
                        style={{ backgroundColor: c.value }}
                        className={`w-7 h-7 rounded-full transition-transform ${
                          teamA.color === c.value ? "ring-2 ring-primary scale-110" : ""
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-outline uppercase tracking-wider mb-2">
                    Warna {teamB.name}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => setTeamB({ ...teamB, color: c.value })}
                        style={{ backgroundColor: c.value }}
                        className={`w-7 h-7 rounded-full transition-transform ${
                          teamB.color === c.value ? "ring-2 ring-primary scale-110" : ""
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Reset button inside settings */}
              <div className="pt-3 mb-4 border-t border-outline-variant/20 flex justify-between items-center">
                <span className="text-xs text-outline">Reset skor & waktu</span>
                <button
                  onClick={() => {
                    setShowSettings(false);
                    setShowResetConfirm(true);
                  }}
                  className="text-xs text-rose-500 hover:text-rose-600 font-bold"
                >
                  Reset Pertandingan
                </button>
              </div>

              <div className="flex justify-end pt-3 border-t border-outline-variant/20">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Selesai
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RESET CONFIRMATION MODAL */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border border-outline-variant/30 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl"
            >
              <h4 className="text-base font-bold text-on-surface mb-2">Mulai Pertandingan Baru?</h4>
              <p className="text-xs text-outline mb-5">
                Skor, jumlah set, foul, dan waktu akan direset kembali ke 0.
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-3.5 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  onClick={handleResetMatch}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Ya, Reset
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
