"use client";

import React, { useState, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowRight, FiCheck } from "react-icons/fi";
import { buildCharacterSVG, Mood } from "./tic-tac-toe/characterSvg";

interface ToolItem {
  id: string;
  type: "tool" | "game";
  category: string;
  title: string;
  badge: string;
  badgeColor: string;
  desc: string;
  features: string[];
  path: string;
  btnText: string;
  accentColor: string;
  previewType: "wheel" | "scoreboard" | "tictactoe" | "blocknrun";
}

export default function ToolsClient() {
  const [activeTab, setActiveTab] = useState<"all" | "tool" | "game">("all");

  // 1. Wheel Preview — animation only (CSS spin, no click needed)

  // 2. Scoreboard Preview States
  const [scoreA, setScoreA] = useState(3);
  const [scoreB, setScoreB] = useState(2);
  const [clockSeconds, setClockSeconds] = useState(718); // 11:58
  const [scoreGlow, setScoreGlow] = useState<"A" | "B" | null>(null);

  // 3. Tic-Tac-Toe Preview States — demo-only, no user interaction
  const [tttBoard, setTttBoard] = useState<("P1" | "P2" | null)[]>(Array(9).fill(null));
  const [tttWin, setTttWin] = useState<{
    cells: number[];
    player: "P1" | "P2";
    coords: [number, number, number, number];
  } | null>(null);

  // Auto-play Scoreboard Clock & Scoring Loop
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setClockSeconds((prev) => (prev > 0 ? prev - 1 : 720));
    }, 1000);

    let cycle = 0;
    const scoreInterval = setInterval(() => {
      cycle = (cycle + 1) % 5;
      if (cycle === 1) {
        setScoreA((prev) => prev + 1);
        setScoreGlow("A");
        setTimeout(() => setScoreGlow((g) => (g === "A" ? null : g)), 900);
      } else if (cycle === 2) {
        setScoreB((prev) => prev + 1);
        setScoreGlow("B");
        setTimeout(() => setScoreGlow((g) => (g === "B" ? null : g)), 900);
      } else if (cycle === 3) {
        setScoreA((prev) => prev + 1);
        setScoreGlow("A");
        setTimeout(() => setScoreGlow((g) => (g === "A" ? null : g)), 900);
      } else if (cycle === 4) {
        setScoreB((prev) => prev + 1);
        setScoreGlow("B");
        setTimeout(() => setScoreGlow((g) => (g === "B" ? null : g)), 900);
      } else {
        setScoreA(3);
        setScoreB(2);
      }
    }, 3600);

    return () => {
      clearInterval(clockInterval);
      clearInterval(scoreInterval);
    };
  }, []);

  // Auto-play Tic-Tac-Toe Simulated Match Loop
  useEffect(() => {
    // P1 = navy/koding, P2 = orange/koding (matches real game default)
    const DEMO_ROUNDS: Array<{
      moves: { cell: number; player: "P1" | "P2" }[];
      winCells: [number, number, number];
      winner: "P1" | "P2";
      coords: [number, number, number, number];
    }> = [
      // Round 1: P1 (Navy Si Koding) wins row 0 [0, 1, 2] — Horizontal line
      {
        moves: [
          { cell: 0, player: "P1" },
          { cell: 4, player: "P2" },
          { cell: 1, player: "P1" },
          { cell: 7, player: "P2" },
          { cell: 2, player: "P1" },
        ],
        winCells: [0, 1, 2],
        winner: "P1",
        coords: [35, 52, 265, 52],
      },
      // Round 2: P2 (Orange Si Koding) wins diagonal [0, 4, 8] — Diagonal line
      {
        moves: [
          { cell: 1, player: "P1" },
          { cell: 4, player: "P2" },
          { cell: 5, player: "P1" },
          { cell: 0, player: "P2" },
          { cell: 6, player: "P1" },
          { cell: 8, player: "P2" },
        ],
        winCells: [0, 4, 8],
        winner: "P2",
        coords: [40, 40, 260, 260],
      },
      // Round 3: P1 (Navy Si Koding) wins column [1, 4, 7] — Vertical line
      {
        moves: [
          { cell: 1, player: "P1" },
          { cell: 0, player: "P2" },
          { cell: 4, player: "P1" },
          { cell: 8, player: "P2" },
          { cell: 7, player: "P1" },
        ],
        winCells: [1, 4, 7],
        winner: "P1",
        coords: [150, 35, 150, 265],
      },
    ];

    let roundIdx = 0;
    let moveIdx = 0;
    let board: ("P1" | "P2" | null)[] = Array(9).fill(null);
    let pauseCount = 0;

    const demoInterval = setInterval(() => {
      const currentRound = DEMO_ROUNDS[roundIdx];

      if (moveIdx < currentRound.moves.length) {
        const move = currentRound.moves[moveIdx];
        board[move.cell] = move.player;
        setTttBoard([...board]);
        moveIdx++;

        if (moveIdx === currentRound.moves.length) {
          setTttWin({
            cells: [...currentRound.winCells],
            player: currentRound.winner,
            coords: currentRound.coords,
          });
          pauseCount = 0;
        }
      } else {
        pauseCount++;
        // Keep win laser and happy/dizzy reactions visible for ~3.4s before next round
        if (pauseCount >= 4) {
          setTttWin(null);
          board = Array(9).fill(null);
          setTttBoard([...board]);
          moveIdx = 0;
          pauseCount = 0;
          roundIdx = (roundIdx + 1) % DEMO_ROUNDS.length;
        }
      }
    }, 850);

    return () => clearInterval(demoInterval);
  }, []);

  // 4. Block 'n Run Preview States — auto-animated match simulation
  const [bnrStep, setBnrStep] = useState(0);

  useEffect(() => {
    const bnrInterval = setInterval(() => {
      setBnrStep((prev) => (prev + 1) % BNR_DEMO_STEPS.length);
    }, 950);

    return () => clearInterval(bnrInterval);
  }, []);

  const clockMin = Math.floor(clockSeconds / 60);
  const clockSec = clockSeconds % 60;
  const formattedClock = `${String(clockMin).padStart(2, "0")}:${String(clockSec).padStart(2, "0")}`;

  const items: ToolItem[] = [
    {
      id: "acak-nama",
      type: "tool",
      category: "Pengundi & Kelompok",
      title: "Wheel & Acak Nama",
      badge: "Alat Aktif",
      badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
      desc: "Putar roda keberuntungan dan bagi kelompok otomatis untuk presentasi kelas, kepanitiaan, atau doorprize acara.",
      features: ["Mode Spin Wheel", "Bagi Kelompok Adil", "Input Cepat"],
      path: "/tools/acak-nama",
      btnText: "Buka Roda Acak",
      accentColor: "#1b4086",
      previewType: "wheel",
    },
    {
      id: "papan-skor",
      type: "tool",
      category: "Olahraga & Lomba",
      title: "Papan Skor Digital",
      badge: "Alat Aktif",
      badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
      desc: "Scoreboard interaktif untuk futsal, badminton, basket, dan kuis. Dilengkapi timer pertandingan dan mode proyektor layar penuh.",
      features: ["4 Preset Olahraga", "Klakson / Buzzer", "Layar Penuh TV"],
      path: "/tools/papan-skor",
      btnText: "Buka Papan Skor",
      accentColor: "#f2791e",
      previewType: "scoreboard",
    },
    {
      id: "tic-tac-toe",
      type: "game",
      category: "Mini Game Kampus",
      title: "Tic-Tac-Toe",
      badge: "Game Seru",
      badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25",
      desc: "Permainan asah taktik klasik X-O. Tantang bot AI pintar atau main tanding berdua bersama teman satu layar!",
      features: ["Lawan Bot AI", "Main Berdua 1 Layar", "Efek Suara Pop"],
      path: "/tools/tic-tac-toe",
      btnText: "Mainkan Sekarang",
      accentColor: "#8b5cf6",
      previewType: "tictactoe",
    },
    {
      id: "block-n-run",
      type: "game",
      category: "Mini Game Taktik",
      title: "Block 'n Run!",
      badge: "Game Baru",
      badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
      desc: "Game balap bidak & pasang tembok rintangan ala Quoridor. Adu taktik lawan Bot AI cerdas atau duel 2 pemain!",
      features: ["Board Game Taktik", "Bot AI Taktis (BFS)", "Duel 2 Pemain"],
      path: "/tools/block-n-run",
      btnText: "Mainkan Sekarang",
      accentColor: "#f59e0b",
      previewType: "blocknrun",
    },
  ];

  const filteredItems = items.filter((item) => {
    if (activeTab === "all") return true;
    return item.type === activeTab;
  });

  return (
    <main className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-10 left-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-20 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-semibold mb-3 border border-secondary/20 shadow-sm">
            <span>Koleksi Tools & Mini Games</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-on-surface tracking-tight mb-2">
            Tools & Mini Games
          </h1>
          <p className="text-outline text-sm leading-relaxed">
            Pilih utilitas perkuliahan atau game santai mahasiswa. Klik kartu untuk mencoba langsung!
          </p>
        </div>

        {/* 2 Tab Switcher Bersih Tanpa Icon Aneh */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1 bg-surface-container-low border border-outline-variant/30 rounded-2xl shadow-sm gap-1">
            <button
              onClick={() => setActiveTab("all")}
              className={`relative px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-colors ${
                activeTab === "all" ? "text-white" : "text-outline hover:text-on-surface"
              }`}
            >
              {activeTab === "all" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary rounded-xl shadow-md"
                  transition={{ type: "spring", stiffness: 380, damping: 28 }}
                />
              )}
              <span className="relative z-10">Semua ({items.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("tool")}
              className={`relative px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-colors ${
                activeTab === "tool" ? "text-white" : "text-outline hover:text-on-surface"
              }`}
            >
              {activeTab === "tool" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary rounded-xl shadow-md"
                  transition={{ type: "spring", stiffness: 380, damping: 28 }}
                />
              )}
              <span className="relative z-10">
                Tools & Alat ({items.filter((i) => i.type === "tool").length})
              </span>
            </button>

            <button
              onClick={() => setActiveTab("game")}
              className={`relative px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-colors ${
                activeTab === "game" ? "text-white" : "text-outline hover:text-on-surface"
              }`}
            >
              {activeTab === "game" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-secondary rounded-xl shadow-md"
                  transition={{ type: "spring", stiffness: 380, damping: 28 }}
                />
              )}
              <span className="relative z-10">
                Mini Games ({items.filter((i) => i.type === "game").length})
              </span>
            </button>
          </div>
        </div>

        {/* Interactive Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.25 }}
                className="bg-surface border border-outline-variant/30 hover:border-primary/50 dark:hover:border-primary/40 rounded-3xl shadow-sm hover:shadow-xl transition-all group overflow-hidden relative"
              >
                {/* Whole card is clickable */}
                <Link href={item.path} className="flex flex-col p-5">

                  {/* Glow Backdrop on hover */}
                  <div
                    className="absolute -top-16 -right-16 w-36 h-36 rounded-full blur-2xl opacity-10 group-hover:opacity-25 transition-opacity pointer-events-none"
                    style={{ backgroundColor: item.accentColor }}
                  />

                  {/* INTERACTIVE CARD COVER / PREVIEW STAGE */}
                  <div className="w-full h-36 bg-surface-container-low border border-outline-variant/20 rounded-2xl mb-4 p-3 flex flex-col items-center justify-center relative overflow-hidden">

                    {/* 1. Wheel Preview — animation only, no labels */}
                    {item.previewType === "wheel" && (
                      <div className="flex items-center justify-center">
                        <div className="relative w-20 h-20">
                          {/* Vibrating needle */}
                          <motion.div
                            animate={{ rotate: [-5, 5, -5] }}
                            transition={{ repeat: Infinity, duration: 0.7, ease: "easeInOut" }}
                            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[8px] border-l-transparent border-r-transparent border-t-secondary z-20 origin-bottom"
                          />
                          {/* Continuous ambient spin wheel */}
                          <div
                            className="w-full h-full rounded-full border-2 border-white dark:border-slate-800 shadow-md overflow-hidden relative"
                            style={{
                              background:
                                "conic-gradient(#1b4086 0deg 60deg, #f2791e 60deg 120deg, #1b4086 120deg 180deg, #f2791e 180deg 240deg, #1b4086 240deg 300deg, #f2791e 300deg 360deg)",
                              animation: "spin 8s linear infinite",
                            }}
                          >
                            <div className="absolute inset-0 m-auto w-4 h-4 rounded-full bg-white dark:bg-slate-900 border border-secondary shadow-xs" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 2. Scoreboard Preview — auto-animated, no labels */}
                    {item.previewType === "scoreboard" && (
                      <div className="flex items-center justify-center w-full">
                        <div className="w-full max-w-[220px] rounded-xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-800 grid grid-cols-2 relative select-none">
                          {/* Live Clock pill */}
                          <div className="absolute top-1 left-1/2 -translate-x-1/2 z-10 bg-slate-900/90 dark:bg-white text-white dark:text-slate-900 px-2 py-0.5 rounded-full shadow text-[8px] font-black font-mono tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping inline-block" />
                            <span>{formattedClock}</span>
                          </div>

                          {/* +1 pop for Team A */}
                          <AnimatePresence>
                            {scoreGlow === "A" && (
                              <motion.span
                                initial={{ opacity: 0, y: 8, scale: 0.8 }}
                                animate={{ opacity: [0, 1, 1, 0], y: [8, -8, -12], scale: [0.8, 1.2, 1] }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.8 }}
                                className="absolute top-2 left-6 z-20 text-[10px] font-black text-yellow-300 drop-shadow-md pointer-events-none"
                              >
                                +1 POIN
                              </motion.span>
                            )}
                          </AnimatePresence>

                          {/* +1 pop for Team B */}
                          <AnimatePresence>
                            {scoreGlow === "B" && (
                              <motion.span
                                initial={{ opacity: 0, y: 8, scale: 0.8 }}
                                animate={{ opacity: [0, 1, 1, 0], y: [8, -8, -12], scale: [0.8, 1.2, 1] }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.8 }}
                                className="absolute top-2 right-6 z-20 text-[10px] font-black text-yellow-300 drop-shadow-md pointer-events-none"
                              >
                                +1 POIN
                              </motion.span>
                            )}
                          </AnimatePresence>

                          {/* Blue Left */}
                          <div className="bg-[#1e88e5] text-white p-2 pt-4 text-center relative">
                            <span className="text-[9px] font-black block tracking-wider opacity-90">Player 1</span>
                            <motion.span
                              key={scoreA}
                              initial={{ scale: 1.35, color: "#fef08a" }}
                              animate={{ scale: 1, color: "#ffffff" }}
                              transition={{ duration: 0.35, ease: "easeOut" }}
                              className="font-mono text-2xl font-black block leading-none my-1"
                            >
                              {scoreA}
                            </motion.span>
                          </div>

                          {/* Red Right */}
                          <div className="bg-[#e53935] text-white p-2 pt-4 text-center relative">
                            <span className="text-[9px] font-black block tracking-wider opacity-90">Player 2</span>
                            <motion.span
                              key={scoreB}
                              initial={{ scale: 1.35, color: "#fef08a" }}
                              animate={{ scale: 1, color: "#ffffff" }}
                              transition={{ duration: 0.35, ease: "easeOut" }}
                              className="font-mono text-2xl font-black block leading-none my-1"
                            >
                              {scoreB}
                            </motion.span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3. Tic-Tac-Toe Preview — Authentic Mini Battle Board */}
                    {item.previewType === "tictactoe" && (
                      <div className="flex items-center justify-center">
                        {/* 3D Battle Board container identical to real game */}
                        <div className="relative w-[132px] h-[132px] rounded-[24px] bg-[#f8fafc] dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-2 shadow-sm flex items-center justify-center overflow-hidden">
                          
                          {/* SVG Laser Strike Line with Layered Glow (Guaranteed on all lines: horizontal, vertical, diagonal) */}
                          {tttWin && (
                            <motion.svg
                              key={`strike-svg-${tttWin.player}-${tttWin.coords.join("-")}`}
                              className="pointer-events-none absolute inset-0 w-full h-full z-20 overflow-visible"
                              viewBox="0 0 300 300"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.15 }}
                            >
                              {/* Layer 1: Wide Ambient Glow Halo */}
                              <motion.path
                                d={`M ${tttWin.coords[0]} ${tttWin.coords[1]} L ${tttWin.coords[2]} ${tttWin.coords[3]}`}
                                stroke={tttWin.player === "P1" ? "#3b82f6" : "#fb923c"}
                                strokeWidth="20"
                                strokeLinecap="round"
                                opacity={0.35}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.32, ease: "easeOut" }}
                              />
                              {/* Layer 2: Radiant Energy Beam */}
                              <motion.path
                                d={`M ${tttWin.coords[0]} ${tttWin.coords[1]} L ${tttWin.coords[2]} ${tttWin.coords[3]}`}
                                stroke={tttWin.player === "P1" ? "#60a5fa" : "#f97316"}
                                strokeWidth="11"
                                strokeLinecap="round"
                                opacity={0.8}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.32, ease: "easeOut" }}
                              />
                              {/* Layer 3: Solid Sharp Core Beam */}
                              <motion.path
                                d={`M ${tttWin.coords[0]} ${tttWin.coords[1]} L ${tttWin.coords[2]} ${tttWin.coords[3]}`}
                                stroke={tttWin.player === "P1" ? "#1b4086" : "#ea580c"}
                                strokeWidth="5.5"
                                strokeLinecap="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.32, ease: "easeOut" }}
                              />
                            </motion.svg>
                          )}

                          {/* 3x3 Tactile Grid */}
                          <div className="grid grid-cols-3 grid-rows-3 gap-1.5 w-full h-full relative z-10">
                            {tttBoard.map((owner, idx) => {
                              const isWinCell = tttWin?.cells.includes(idx) ?? false;
                              const tokenMood: Mood = tttWin
                                ? owner === tttWin.player
                                  ? "happy"
                                  : "dizzy"
                                : "normal";

                              if (owner === "P1") {
                                return (
                                  <div
                                    key={idx}
                                    className={`w-full h-full aspect-square rounded-[12px] flex flex-col items-center justify-center p-0.5 select-none overflow-hidden transition-all ${
                                      isWinCell
                                        ? "bg-[#1b4086]/15 border-2 border-[#1b4086] shadow-[0_3px_0_0_#1b4086]"
                                        : "bg-[#1b4086]/5 border border-[#1b4086]/30 shadow-[0_3px_0_0_#1b4086]"
                                    }`}
                                  >
                                    <div
                                      className="w-[22px] h-[22px] shrink-0"
                                      dangerouslySetInnerHTML={{
                                        __html: buildCharacterSVG("koding", "navy", tokenMood, false),
                                      }}
                                    />
                                    <span className="text-[6.5px] font-black mt-0.5 truncate max-w-full leading-none text-[#1b4086] dark:text-blue-300">
                                      Si Koding
                                    </span>
                                  </div>
                                );
                              }

                              if (owner === "P2") {
                                return (
                                  <div
                                    key={idx}
                                    className={`w-full h-full aspect-square rounded-[12px] flex flex-col items-center justify-center p-0.5 select-none overflow-hidden transition-all ${
                                      isWinCell
                                        ? "bg-[#f2791e]/15 border-2 border-[#f2791e] shadow-[0_3px_0_0_#ea580c]"
                                        : "bg-[#f2791e]/5 border border-[#f2791e]/30 shadow-[0_3px_0_0_#ea580c]"
                                    }`}
                                  >
                                    <div
                                      className="w-[22px] h-[22px] shrink-0"
                                      dangerouslySetInnerHTML={{
                                        __html: buildCharacterSVG("koding", "orange", tokenMood, false),
                                      }}
                                    />
                                    <span className="text-[6.5px] font-black mt-0.5 truncate max-w-full leading-none text-[#ea580c] dark:text-orange-300">
                                      Si Koding
                                    </span>
                                  </div>
                                );
                              }

                              // Empty 3D Tactile Tile
                              return (
                                <div
                                  key={idx}
                                  className="w-full h-full aspect-square rounded-[12px] bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 shadow-[0_3px_0_0_#cbd5e1] dark:shadow-[0_3px_0_0_#1e293b]"
                                />
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 4. Block 'n Run! Preview — 2D Flat Wooden Arena (7x7 Animated Simulation) */}
                    {item.previewType === "blocknrun" && (
                      <div className="flex items-center justify-center relative w-full h-full select-none overflow-hidden">
                        {/* Floor accent glow */}
                        <div className="absolute w-28 h-28 rounded-full bg-amber-500/10 blur-xl pointer-events-none" />

                        {/* Mini Flat 2D Wooden Board (Exact 7x7 proportion) */}
                        <div
                          className="relative rounded-2xl p-1.5 border-2 border-[#deb07c] shadow-md flex items-center justify-center"
                          style={{
                            background: "linear-gradient(135deg, #c88a51 0%, #a26535 50%, #824a21 100%)",
                            boxShadow: "0 6px 14px -3px rgba(130, 74, 33, 0.45), inset 0 1px 2px rgba(255, 255, 255, 0.5)",
                          }}
                        >
                          {/* Mini Finish Line Top (Target Blue) */}
                          <div className="absolute -top-1 left-2 right-2 h-0.5 rounded-full bg-sky-400 shadow-[0_0_6px_#38bdf8]" />
                          {/* Mini Finish Line Bottom (Target Red) */}
                          <div className="absolute -bottom-1 left-2 right-2 h-0.5 rounded-full bg-rose-500 shadow-[0_0_6px_#f43f5e]" />

                          {/* 7x7 Mini Wood Tiles */}
                          <div className="grid grid-cols-7 grid-rows-7 gap-[2px] w-[114px] h-[114px] relative">
                            {Array.from({ length: 49 }).map((_, i) => {
                              const r = Math.floor(i / 7);
                              const c = i % 7;
                              const current = BNR_DEMO_STEPS[bnrStep];
                              const isBlue = current.blue.r === r && current.blue.c === c;
                              const isRed = current.red.r === r && current.red.c === c;

                              return (
                                <div
                                  key={i}
                                  className="rounded-[3px] relative flex items-center justify-center bg-gradient-to-br from-[#f1c798] via-[#dea870] to-[#cb8c4e] shadow-[inset_0.5px_0.5px_1px_rgba(255,255,255,0.6)]"
                                >
                                  {/* Blue Pawn (Authentic Character) */}
                                  {isBlue && (
                                    <motion.div
                                      layoutId="mini-blue-pawn"
                                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                      className="relative z-10 flex items-center justify-center w-full h-full"
                                    >
                                      <MiniPawnSVG color="BLUE" isTurn={current.turn === "BLUE"} />
                                    </motion.div>
                                  )}

                                  {/* Red Pawn (Authentic Character) */}
                                  {isRed && (
                                    <motion.div
                                      layoutId="mini-red-pawn"
                                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                      className="relative z-10 flex items-center justify-center w-full h-full"
                                    >
                                      <MiniPawnSVG color="RED" isTurn={current.turn === "RED"} />
                                    </motion.div>
                                  )}
                                </div>
                              );
                            })}

                            {/* Orange Barrier Wall in Arena */}
                            {BNR_DEMO_STEPS[bnrStep].walls.map((w, wIdx) => (
                              <motion.div
                                key={`bnr-wall-${wIdx}-${w.r}-${w.c}`}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.25, ease: "easeOut" }}
                                className="absolute rounded-full z-20 pointer-events-none"
                                style={{
                                  top: `${((w.r + 1) / 7) * 100}%`,
                                  left: `${((w.c + 1) / 7) * 100}%`,
                                  width: "28.5%",
                                  height: "3.5px",
                                  background: "linear-gradient(180deg, #fb923c 0%, #ea580c 50%, #c2410c 100%)",
                                  border: "0.5px solid #ffedd5",
                                  boxShadow: "0 2px 4px rgba(0,0,0,0.45)",
                                  transform: "translate(-50%, -50%)",
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Header & Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">
                      {item.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  </div>

                  {/* Title & Desc */}
                  <h2 className="text-lg font-extrabold text-on-surface mb-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h2>
                  <p className="text-xs text-outline leading-relaxed mb-4 line-clamp-2">
                    {item.desc}
                  </p>

                  {/* Feature Pills */}
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {item.features.map((feat) => (
                      <span
                        key={feat}
                        className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-surface-container-low text-on-surface-variant border border-outline-variant/20"
                      >
                        <FiCheck className="w-2.5 h-2.5 text-emerald-500" />
                        <span>{feat}</span>
                      </span>
                    ))}
                  </div>

                  {/* CTA Bar */}
                  <div className="mt-auto pt-3 border-t border-outline-variant/20">
                    <div className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-primary group-hover:bg-primary-dark text-white text-xs font-bold rounded-xl shadow-sm group-hover:shadow-md transition-all">
                      <span>{item.btnText}</span>
                      <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

      </div>
    </main>
  );
}

// ==========================================
// DATA SIMULASI DEMO ANIMASI BLOCK 'N RUN
// ==========================================
interface BNRDemoStep {
  blue: { r: number; c: number };
  red: { r: number; c: number };
  walls: Array<{ r: number; c: number; orientation: "H" | "V" }>;
  turn: "BLUE" | "RED";
}

const BNR_DEMO_STEPS: BNRDemoStep[] = [
  // Step 0: Start - Bidak Biru di bawah (6, 3), Merah di atas (0, 3)
  {
    blue: { r: 6, c: 3 },
    red: { r: 0, c: 3 },
    walls: [],
    turn: "BLUE",
  },
  // Step 1: Biru maju ke (5, 3)
  {
    blue: { r: 5, c: 3 },
    red: { r: 0, c: 3 },
    walls: [],
    turn: "RED",
  },
  // Step 2: Merah maju dan bergeser ke (1, 4)
  {
    blue: { r: 5, c: 3 },
    red: { r: 1, c: 4 },
    walls: [],
    turn: "BLUE",
  },
  // Step 3: Biru memasang tembok rintangan oranye menghadang laju Merah
  {
    blue: { r: 5, c: 3 },
    red: { r: 1, c: 4 },
    walls: [{ r: 2, c: 3, orientation: "H" }],
    turn: "RED",
  },
  // Step 4: Merah terhalang tembok, terpaksa berbelok ke (1, 5)
  {
    blue: { r: 5, c: 3 },
    red: { r: 1, c: 5 },
    walls: [{ r: 2, c: 3, orientation: "H" }],
    turn: "BLUE",
  },
  // Step 5: Biru melaju ke (4, 3)
  {
    blue: { r: 4, c: 3 },
    red: { r: 1, c: 5 },
    walls: [{ r: 2, c: 3, orientation: "H" }],
    turn: "BLUE",
  },
  // Step 6: Biru melaju ke (3, 3)
  {
    blue: { r: 3, c: 3 },
    red: { r: 2, c: 5 },
    walls: [{ r: 2, c: 3, orientation: "H" }],
    turn: "BLUE",
  },
  // Step 7: Biru melaju ke (2, 3)
  {
    blue: { r: 2, c: 3 },
    red: { r: 2, c: 5 },
    walls: [{ r: 2, c: 3, orientation: "H" }],
    turn: "BLUE",
  },
  // Step 8: Biru melaju ke (1, 3) - 1 langkah lagi ke garis finish!
  {
    blue: { r: 1, c: 3 },
    red: { r: 3, c: 5 },
    walls: [{ r: 2, c: 3, orientation: "H" }],
    turn: "BLUE",
  },
  // Step 9: Biru SAMPAI DI UJUNG (0, 3) - Menyentuh garis finish biru paling atas!
  {
    blue: { r: 0, c: 3 },
    red: { r: 3, c: 5 },
    walls: [{ r: 2, c: 3, orientation: "H" }],
    turn: "BLUE",
  },
  // Step 10: Selebrasi kemenangan di ujung garis finish
  {
    blue: { r: 0, c: 3 },
    red: { r: 3, c: 5 },
    walls: [{ r: 2, c: 3, orientation: "H" }],
    turn: "BLUE",
  },
];

// ==========================================
// MINI SVG KARAKTER BIDAK (PERSIS SEPERTI DI GAME ASLI)
// ==========================================
function MiniPawnSVG({ color, isTurn }: { color: "BLUE" | "RED"; isTurn?: boolean }) {
  const isBlue = color === "BLUE";

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full select-none pointer-events-none">
      {isTurn && (
        <div
          className={`absolute -bottom-0.5 w-3 h-1 rounded-full blur-[1px] animate-pulse ${
            isBlue ? "bg-sky-400/90" : "bg-rose-500/90"
          }`}
        />
      )}
      <svg
        viewBox="0 0 80 100"
        className="w-3.5 h-4.5 overflow-visible drop-shadow-[0_2px_3px_rgba(0,0,0,0.45)]"
      >
        <defs>
          <linearGradient id="toolsMiniBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="50%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>

          <linearGradient id="toolsMiniRedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="50%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </linearGradient>

          <linearGradient id="toolsMiniWoodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f3c68f" />
            <stop offset="100%" stopColor="#c68b59" />
          </linearGradient>
        </defs>

        {/* Alas Kayu Bulat */}
        <ellipse cx="40" cy="86" rx="24" ry="9" fill="#7c4722" />
        <ellipse cx="40" cy="83" rx="23" ry="8" fill="#c88a51" />

        {/* Badan Kerucut */}
        <path
          d="M20 82 C22 52, 30 44, 40 44 C50 44, 58 52, 60 82 Z"
          fill={isBlue ? "url(#toolsMiniBlueGrad)" : "url(#toolsMiniRedGrad)"}
          stroke={isBlue ? "#93c5fd" : "#fca5a5"}
          strokeWidth="2"
        />

        {/* Kilau Highlight Badan */}
        <path
          d="M27 77 C29 56, 33 49, 37 48"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Kepala Bulat */}
        <circle
          cx="40"
          cy="30"
          r="16"
          fill="url(#toolsMiniWoodGrad)"
          stroke="#5c3217"
          strokeWidth="2"
        />

        {/* Topi/Helm */}
        <path
          d="M24 28 C24 15, 56 15, 56 28 C48 23, 32 23, 24 28 Z"
          fill={isBlue ? "url(#toolsMiniBlueGrad)" : "url(#toolsMiniRedGrad)"}
        />

        {/* Kilau di Helm */}
        <ellipse
          cx="34"
          cy="20"
          rx="5"
          ry="2.5"
          fill="rgba(255,255,255,0.7)"
          transform="rotate(-15 34 20)"
        />

        {/* Mata */}
        <circle cx="34" cy="33" r="2.8" fill="#1e293b" />
        <circle cx="46" cy="33" r="2.8" fill="#1e293b" />
      </svg>
    </div>
  );
}
