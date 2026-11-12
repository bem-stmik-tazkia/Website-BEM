"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "@/i18n/routing";
import confetti from "canvas-confetti";
import {
  FiArrowLeft,
  FiRotateCcw,
  FiVolume2,
  FiVolumeX,
  FiUser,
  FiUsers,
  FiZap,
  FiShuffle,
  FiInfo,
  FiGlobe,
  FiCopy,
  FiCheck,
  FiLogOut,
  FiRadio,
  FiSliders,
  FiX,
} from "react-icons/fi";
import { IoGameController, IoInfinite } from "react-icons/io5";
import { FaWhatsapp } from "react-icons/fa";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

import {
  CharacterId,
  Mood,
  WinLine,
  WIN_LINES,
  buildCharacterSVG,
} from "./characterSvg";

type Player = "P1" | "P2";
type CellValue = Player | null;
type GameMode = "bot" | "pvp" | "online";
type RuleMode = "classic" | "infinity";
type OnlineState = "idle" | "waiting" | "joining" | "connected" | "opponent_left";

const CHARACTER_LIST: CharacterId[] = ["koding", "ambis", "aktivis", "asdos"];

interface CharacterData {
  id: CharacterId;
  name: string;
  role: string;
}

const CAMPUS_CHARACTERS: Record<CharacterId, CharacterData> = {
  koding: {
    id: "koding",
    name: "Si Koding",
    role: "Mahasiswa IT",
  },
  ambis: {
    id: "ambis",
    name: "Si Ambis",
    role: "Juara Kelas",
  },
  aktivis: {
    id: "aktivis",
    name: "Si Aktivis",
    role: "Anak Organisasi",
  },
  asdos: {
    id: "asdos",
    name: "Kak Asdos",
    role: "Asisten Dosen",
  },
};

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let random = "";
  for (let i = 0; i < 4; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TAZ-${random}`;
}

function detectThreatCells(currentBoard: CellValue[]) {
  const threats: { P1: number[]; P2: number[] } = { P1: [], P2: [] };
  for (const line of WIN_LINES) {
    const [a, b, c] = line.cells;
    const vals = [currentBoard[a], currentBoard[b], currentBoard[c]];
    const p1Count = vals.filter((v) => v === "P1").length;
    const p2Count = vals.filter((v) => v === "P2").length;
    const emptyIdx = line.cells.find((i) => currentBoard[i] === null);

    if (emptyIdx !== undefined) {
      if (p1Count === 2 && p2Count === 0) threats.P1.push(emptyIdx);
      if (p2Count === 2 && p1Count === 0) threats.P2.push(emptyIdx);
    }
  }
  return threats;
}

function checkWinner(b: CellValue[]): { winner: Player | "draw"; line: WinLine | null } | null {
  for (const line of WIN_LINES) {
    const [a, bIdx, c] = line.cells;
    if (b[a] && b[a] === b[bIdx] && b[a] === b[c]) {
      return { winner: b[a] as Player, line };
    }
  }
  if (b.every((cell) => cell !== null)) {
    return { winner: "draw", line: null };
  }
  return null;
}

function getSmartBotMove(board: CellValue[]): number | null {
  const empty = board
    .map((v, i) => (v === null ? i : null))
    .filter((i): i is number => i !== null);
  if (empty.length === 0) return null;

  for (const idx of empty) {
    const copy = [...board];
    copy[idx] = "P2";
    if (checkWinner(copy)?.winner === "P2") return idx;
  }

  for (const idx of empty) {
    const copy = [...board];
    copy[idx] = "P1";
    if (checkWinner(copy)?.winner === "P1") return idx;
  }

  if (board[4] === null) return 4;

  const corners = [0, 2, 6, 8].filter((i) => board[i] === null);
  if (corners.length > 0 && Math.random() < 0.7) {
    return corners[Math.floor(Math.random() * corners.length)];
  }

  return empty[Math.floor(Math.random() * empty.length)];
}

export default function TicTacToeClient() {
  const [board, setBoard] = useState<CellValue[]>(Array(9).fill(null));
  const [moveHistory, setMoveHistory] = useState<{ P1: number[]; P2: number[] }>({
    P1: [],
    P2: [],
  });
  const [lastPlacedIdx, setLastPlacedIdx] = useState<number | null>(null);
  const [currentTurn, setCurrentTurn] = useState<Player>("P1");
  const [startingPlayer, setStartingPlayer] = useState<Player>("P1");
  const [mode, setMode] = useState<GameMode>("bot");
  const [ruleMode, setRuleMode] = useState<RuleMode>("classic");
  const [p1Char, setP1Char] = useState<CharacterId>("koding");
  const [p2Char, setP2Char] = useState<CharacterId>("koding");
  const [scores, setScores] = useState({ P1: 0, draw: 0, P2: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<Player | "draw" | null>(null);
  const [winningLine, setWinningLine] = useState<WinLine | null>(null);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Online Multiplayer State
  const [onlineRole, setOnlineRole] = useState<Player | null>(null);
  const [onlineState, setOnlineState] = useState<OnlineState>("idle");
  const [roomCode, setRoomCode] = useState<string>("");
  const [joinRoomInput, setJoinRoomInput] = useState<string>("");
  const [onlineTab, setOnlineTab] = useState<"create" | "join">("create");
  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const [isCopiedCode, setIsCopiedCode] = useState(false);

  // Toast System
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const channelRef = useRef<any>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3200);
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

  // Web Audio Synthesizer
  const playPop = useCallback(
    (freq = 420, type: OscillatorType = "sine", duration = 0.09) => {
      if (!soundEnabled) return;
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
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(
          freq * 1.45,
          ctx.currentTime + duration
        );
        gain.gain.setValueAtTime(0.14, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch {}
    },
    [soundEnabled]
  );

  const playWinFanfare = useCallback(() => {
    if (!soundEnabled) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      setTimeout(() => playPop(n, "triangle", 0.16), idx * 85);
    });
  }, [playPop, soundEnabled]);

  const playDrawSound = useCallback(() => {
    if (!soundEnabled) return;
    playPop(340, "sawtooth", 0.12);
    setTimeout(() => playPop(270, "sawtooth", 0.18), 110);
  }, [playPop, soundEnabled]);

  // Eye-tracking Cursor Follow
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const pupils = document.querySelectorAll<HTMLElement>(".eye-track-group");
      pupils.forEach((group) => {
        const rect = group.getBoundingClientRect();
        if (!rect.width) return;
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const angle = Math.atan2(dy, dx);
        const dist = Math.min(2.4, Math.hypot(dx, dy) / 45);
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist;
        group.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px)`;
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Close Settings Sheet on Escape Key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSettingsOpen) {
        setIsSettingsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSettingsOpen]);

  const handleEndGame = useCallback(
    (winResult: Player | "draw", lineResult: WinLine | null) => {
      setGameOver(true);
      setWinner(winResult);
      setWinningLine(lineResult);
      setIsBotThinking(false);

      if (winResult === "P1") {
        setScores((prev) => ({ ...prev, P1: prev.P1 + 1 }));
        playWinFanfare();
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#1b4086", "#3b82f6", "#facc15", "#4ade80"],
        });
      } else if (winResult === "P2") {
        setScores((prev) => ({ ...prev, P2: prev.P2 + 1 }));
        playWinFanfare();
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#f2791e", "#fb923c", "#facc15", "#ef4444"],
        });
      } else {
        setScores((prev) => ({ ...prev, draw: prev.draw + 1 }));
        playDrawSound();
      }
    },
    [playWinFanfare, playDrawSound]
  );

  // Execute Bot Turn
  const executeBotMove = useCallback(
    (currentBoard: CellValue[], currentHistory: { P1: number[]; P2: number[] }) => {
      setIsBotThinking(true);
      setTimeout(() => {
        const botIdx = getSmartBotMove(currentBoard);
        if (botIdx !== null) {
          const botBoard = [...currentBoard];
          const botHistory = {
            P1: [...currentHistory.P1],
            P2: [...currentHistory.P2],
          };

          if (ruleMode === "infinity") {
            const bQueue = botHistory.P2;
            if (bQueue.length >= 3) {
              const bOldest = bQueue.shift()!;
              botBoard[bOldest] = null;
            }
            bQueue.push(botIdx);
          }

          botBoard[botIdx] = "P2";
          setBoard(botBoard);
          setMoveHistory(botHistory);
          setLastPlacedIdx(botIdx);
          playPop(360, "sine", 0.09);

          const botRes = checkWinner(botBoard);
          if (botRes) {
            handleEndGame(botRes.winner, botRes.line);
          } else {
            setCurrentTurn("P1");
          }
        }
        setIsBotThinking(false);
      }, 350);
    },
    [ruleMode, playPop, handleEndGame]
  );

  // Reset round (with alternating starting player support)
  const resetRound = useCallback(
    (starter: Player = "P1") => {
      const emptyBoard = Array(9).fill(null);
      const emptyHistory = { P1: [], P2: [] };
      setBoard(emptyBoard);
      setMoveHistory(emptyHistory);
      setLastPlacedIdx(null);
      setStartingPlayer(starter);
      setCurrentTurn(starter);
      setGameOver(false);
      setWinner(null);
      setWinningLine(null);
      setIsBotThinking(false);
      playPop(500, "triangle", 0.08);

      if (mode === "bot" && starter === "P2") {
        executeBotMove(emptyBoard, emptyHistory);
      }
    },
    [mode, playPop, executeBotMove]
  );

  // Leave Online Room & Cleanup Channel
  const leaveOnlineRoom = useCallback(() => {
    if (channelRef.current) {
      try {
        channelRef.current.send({
          type: "broadcast",
          event: "game_event",
          payload: { type: "player_left" },
        });
        const supabase = createClient();
        supabase.removeChannel(channelRef.current);
      } catch {}
      channelRef.current = null;
    }
    setOnlineRole(null);
    setOnlineState("idle");
    setRoomCode("");
    resetRound();
    showToast("Keluar dari room online.");
  }, [resetRound, showToast]);

  // Handle remote broadcast events
  const handleRemoteGameEvent = useCallback(
    (payload: any, myRole: "P1" | "P2") => {
      if (!payload || !payload.type) return;

      // 1. Guest joined room (received by Host)
      if (payload.type === "guest_joined" && myRole === "P1") {
        if (payload.character) setP2Char(payload.character);
        setOnlineState("connected");
        playWinFanfare();
        showToast("Lawan bergabung! Pertandingan dimulai.");

        // Host sends sync back to Guest
        channelRef.current?.send({
          type: "broadcast",
          event: "game_event",
          payload: {
            type: "host_sync",
            character: p1Char,
            ruleMode: ruleMode,
            scores: scores,
          },
        });
      }

      // 2. Host sync back (received by Guest)
      if (payload.type === "host_sync" && myRole === "P2") {
        if (payload.character) setP1Char(payload.character);
        if (payload.ruleMode) setRuleMode(payload.ruleMode);
        if (payload.scores) setScores(payload.scores);
        setOnlineState("connected");
        playWinFanfare();
        showToast("Terhubung ke Host! Pertandingan dimulai.");
      }

      // 3. Move made by remote player
      if (payload.type === "move") {
        const { cellIdx, player, newBoard, newHistory } = payload;
        setBoard(newBoard);
        setMoveHistory(newHistory);
        setLastPlacedIdx(cellIdx);
        setCurrentTurn(player === "P1" ? "P2" : "P1");
        playPop(player === "P1" ? 440 : 360, "sine", 0.09);

        const res = checkWinner(newBoard);
        if (res) {
          handleEndGame(res.winner, res.line);
        }
      }

      // 4. Rematch request
      if (payload.type === "rematch") {
        const nextStarter: Player =
          payload.startingPlayer || (startingPlayer === "P1" ? "P2" : "P1");
        resetRound(nextStarter);
        showToast(
          `Lawan mengajak main lagi! Giliran ${
            nextStarter === myRole
              ? `Kamu (Bidak ${myRole === "P1" ? "X" : "O"})`
              : `Lawan (Bidak ${myRole === "P1" ? "O" : "X"})`
          } jalan duluan.`
        );
      }

      // 5. Character changed by remote player
      if (payload.type === "character_change") {
        if (payload.player === "P1") setP1Char(payload.character);
        if (payload.player === "P2") setP2Char(payload.character);
        playPop(520, "triangle", 0.08);
      }

      // 6. Player left
      if (payload.type === "player_left") {
        setOnlineState("opponent_left");
        showToast("Lawan telah meninggalkan room.");
      }
    },
    [
      p1Char,
      ruleMode,
      scores,
      playWinFanfare,
      showToast,
      playPop,
      handleEndGame,
      resetRound,
      startingPlayer,
    ]
  );

  // Host: Create New Room
  const handleCreateRoom = useCallback(() => {
    const code = generateRoomCode();
    setRoomCode(code);
    setOnlineRole("P1");
    setOnlineState("waiting");
    resetRound();

    try {
      const supabase = createClient();
      const channel = supabase.channel(`tictactoe_${code}`, {
        config: { broadcast: { self: false } },
      });

      channel
        .on("broadcast", { event: "game_event" }, ({ payload }) => {
          handleRemoteGameEvent(payload, "P1");
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            playPop(620, "triangle", 0.1);
            showToast(`Room ${code} siap! Bagikan kode atau link ke teman.`);
          }
        });

      channelRef.current = channel;
    } catch {
      showToast("Gagal membuat room. Periksa koneksi internet.");
    }
  }, [resetRound, handleRemoteGameEvent, playPop, showToast]);

  // Guest: Join Existing Room
  const handleJoinRoom = useCallback(
    (targetCode?: string) => {
      const raw = (targetCode || joinRoomInput).trim().toUpperCase();
      if (!raw) {
        showToast("Masukkan kode room terlebih dahulu!");
        return;
      }
      const cleanCode = raw.startsWith("TAZ-") ? raw : `TAZ-${raw}`;
      setRoomCode(cleanCode);
      setOnlineRole("P2");
      setOnlineState("joining");
      resetRound();

      try {
        const supabase = createClient();
        const channel = supabase.channel(`tictactoe_${cleanCode}`, {
          config: { broadcast: { self: false } },
        });

        channel
          .on("broadcast", { event: "game_event" }, ({ payload }) => {
            handleRemoteGameEvent(payload, "P2");
          })
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              setTimeout(() => {
                channel.send({
                  type: "broadcast",
                  event: "game_event",
                  payload: {
                    type: "guest_joined",
                    character: p2Char,
                  },
                });
              }, 450);
            }
          });

        channelRef.current = channel;
      } catch {
        showToast("Gagal bergabung ke room. Periksa kode room.");
      }
    },
    [joinRoomInput, p2Char, resetRound, handleRemoteGameEvent, showToast]
  );

  // Auto-detect room parameter in URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get("room");
      if (roomParam) {
        setMode("online");
        setJoinRoomInput(roomParam.trim().toUpperCase());
        setOnlineTab("join");
      }
    }
  }, []);

  // Mode switcher handler
  const handleSwitchMode = (newMode: GameMode) => {
    if (mode === "online" && newMode !== "online") {
      leaveOnlineRoom();
    }
    setMode(newMode);
    resetRound();
  };

  // Change character with online broadcast
  const changeCharacter = (targetPlayer: Player, newChar: CharacterId) => {
    if (targetPlayer === "P1") setP1Char(newChar);
    if (targetPlayer === "P2") setP2Char(newChar);
    playPop(520, "triangle", 0.09);

    if (mode === "online" && channelRef.current && onlineState === "connected") {
      channelRef.current.send({
        type: "broadcast",
        event: "game_event",
        payload: {
          type: "character_change",
          player: targetPlayer,
          character: newChar,
        },
      });
    }
  };

  // Randomize character matchup
  const handleRandomMatchup = () => {
    const r1 = CHARACTER_LIST[Math.floor(Math.random() * CHARACTER_LIST.length)];
    const r2 = CHARACTER_LIST[Math.floor(Math.random() * CHARACTER_LIST.length)];
    if (mode === "online") {
      if (onlineRole === "P1") changeCharacter("P1", r1);
      if (onlineRole === "P2") changeCharacter("P2", r2);
    } else {
      setP1Char(r1);
      setP2Char(r2);
      playPop(580, "triangle", 0.1);
    }
  };

  // Rematch button click (alternates who goes first)
  const handleRematchClick = () => {
    const nextStarter: Player = startingPlayer === "P1" ? "P2" : "P1";
    resetRound(nextStarter);
    if (mode === "online" && channelRef.current && onlineState === "connected") {
      channelRef.current.send({
        type: "broadcast",
        event: "game_event",
        payload: { type: "rematch", startingPlayer: nextStarter },
      });
      showToast(
        `Ronde baru dimulai! Giliran ${
          nextStarter === onlineRole
            ? `Kamu (Bidak ${onlineRole === "P1" ? "X" : "O"})`
            : `Lawan (Bidak ${onlineRole === "P1" ? "O" : "X"})`
        } jalan duluan.`
      );
    } else if (mode === "bot") {
      showToast(
        nextStarter === "P1"
          ? "Ronde baru: Giliran Kamu (Bidak X) jalan duluan!"
          : "Ronde baru: Giliran Komputer (Bidak O) jalan duluan!"
      );
    } else {
      showToast(
        `Ronde baru: Giliran Pemain ${
          nextStarter === "P1" ? "1 (Bidak X)" : "2 (Bidak O)"
        } jalan duluan!`
      );
    }
  };

  // Board Cell Click Handler
  const handleCellClick = (idx: number) => {
    if (gameOver || board[idx] !== null) return;
    if (mode === "bot" && (currentTurn === "P2" || isBotThinking)) return;

    if (mode === "online") {
      if (onlineState !== "connected") {
        showToast("Menunggu lawan terhubung ke room...");
        return;
      }
      if (currentTurn !== onlineRole) {
        showToast("Bukan giliranmu! Menunggu langkah lawan.");
        return;
      }
    }

    const player = currentTurn;
    const nextBoard = [...board];
    const nextHistory = {
      P1: [...moveHistory.P1],
      P2: [...moveHistory.P2],
    };

    if (ruleMode === "infinity") {
      const queue = nextHistory[player];
      if (queue.length >= 3) {
        const oldest = queue.shift()!;
        nextBoard[oldest] = null;
      }
      queue.push(idx);
    }

    nextBoard[idx] = player;
    setBoard(nextBoard);
    setMoveHistory(nextHistory);
    setLastPlacedIdx(idx);
    playPop(player === "P1" ? 440 : 360, "sine", 0.09);

    if (mode === "online" && channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "game_event",
        payload: {
          type: "move",
          cellIdx: idx,
          player,
          character: player === "P1" ? p1Char : p2Char,
          newBoard: nextBoard,
          newHistory: nextHistory,
        },
      });
    }

    const res = checkWinner(nextBoard);
    if (res) {
      handleEndGame(res.winner, res.line);
      return;
    }

    const nextPlayer: Player = player === "P1" ? "P2" : "P1";
    setCurrentTurn(nextPlayer);

    // Bot Response
    if (mode === "bot" && nextPlayer === "P2") {
      executeBotMove(nextBoard, nextHistory);
    }
  };

  const threats = detectThreatCells(board);
  const p1InDanger = threats.P2.length > 0;
  const p2InDanger = threats.P1.length > 0;

  let p1Mood: Mood = "normal";
  let p2Mood: Mood = "normal";

  if (gameOver) {
    if (winner === "P1") {
      p1Mood = "happy";
      p2Mood = "dizzy";
    } else if (winner === "P2") {
      p1Mood = "dizzy";
      p2Mood = "happy";
    } else {
      p1Mood = "nervous";
      p2Mood = "nervous";
    }
  } else {
    p1Mood = p1InDanger ? "nervous" : "normal";
    p2Mood = p2InDanger ? "nervous" : "normal";
  }

  const c1 = CAMPUS_CHARACTERS[p1Char];
  const c2 = CAMPUS_CHARACTERS[p2Char];

  const currentQueue = moveHistory[currentTurn];
  const vanishingIdx =
    ruleMode === "infinity" && currentQueue.length >= 3 ? currentQueue[0] : null;

  const activeChar = currentTurn === "P1" ? p1Char : p2Char;
  const activeTheme = currentTurn === "P1" ? "navy" : "orange";
  const allDangerCells = Array.from(new Set([...threats.P1, ...threats.P2]));

  const isP1Turn = !gameOver && currentTurn === "P1";
  const isP2Turn = !gameOver && currentTurn === "P2";

  // Dynamic Turn / Winner Status Text
  let statusText = "GILIRAN KAMU";
  let statusPillClass = "bg-[#1b4086] text-white";

  if (gameOver) {
    if (winner === "P1") {
      statusText = mode === "online" && onlineRole === "P2" ? "LAWAN MENANG!" : "KAMU MENANG!";
      statusPillClass = "bg-[#1b4086] text-white";
    } else if (winner === "P2") {
      statusText =
        mode === "bot"
          ? "KOMPUTER MENANG"
          : mode === "online"
          ? onlineRole === "P2"
            ? "KAMU MENANG!"
            : "LAWAN MENANG!"
          : "PEMAIN 2 MENANG!";
      statusPillClass = "bg-[#f2791e] text-white";
    } else {
      statusText = "SERI!";
      statusPillClass = "bg-slate-700 text-white";
    }
  } else if (mode === "online") {
    if (onlineState === "waiting") {
      statusText = "MENUNGGU LAWAN...";
      statusPillClass = "bg-[#f2791e] text-white animate-pulse";
    } else if (onlineState === "joining") {
      statusText = "MENGHUBUNGKAN...";
      statusPillClass = "bg-[#1b4086] text-white animate-pulse";
    } else if (onlineState === "opponent_left") {
      statusText = "LAWAN KELUAR";
      statusPillClass = "bg-rose-600 text-white";
    } else if (currentTurn === onlineRole) {
      statusText = `GILIRAN KAMU (${onlineRole === "P1" ? "X" : "O"})`;
      statusPillClass = onlineRole === "P1" ? "bg-[#1b4086] text-white" : "bg-[#f2791e] text-white";
    } else {
      statusText = "GILIRAN LAWAN...";
      statusPillClass = "bg-slate-600 text-white";
    }
  } else if (isBotThinking) {
    statusText = "KOMPUTER BERPIKIR...";
    statusPillClass = "bg-[#f2791e] text-white animate-pulse";
  } else if (currentTurn === "P1") {
    statusText = "GILIRAN KAMU";
    statusPillClass = "bg-[#1b4086] text-white";
  } else {
    statusText = mode === "bot" ? "GILIRAN KOMPUTER" : "GILIRAN PEMAIN 2";
    statusPillClass = "bg-[#f2791e] text-white";
  }

  const shareableUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}?room=${roomCode}`
      : "";

  const showArena = mode !== "online" || onlineState === "connected";

  return (
    <div className="bg-background text-on-background min-h-screen pt-16 sm:pt-20 pb-24 sm:pb-8 px-3 sm:px-6 relative overflow-hidden flex flex-col justify-between">
      {/* Floating Modern Toast Notification */}
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

      {/* Brand Ambient Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-36 -left-32 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <style jsx global>{`
        /* 3D Tactile Squircle Tiles */
        .tactile-cell {
          position: relative;
          border-radius: 20px;
          transition: transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1),
            box-shadow 0.16s ease,
            background-color 0.2s ease,
            border-color 0.2s ease;
          box-shadow: 0 5px 0 0 #cbd5e1, 0 8px 16px -4px rgba(15, 23, 42, 0.08);
        }
        .dark .tactile-cell {
          box-shadow: 0 5px 0 0 #1e293b, 0 8px 16px -4px rgba(0, 0, 0, 0.45);
        }
        .tactile-cell:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 7px 0 0 #94a3b8, 0 12px 18px -4px rgba(15, 23, 42, 0.12);
        }
        .dark .tactile-cell:not(:disabled):hover {
          box-shadow: 0 7px 0 0 #334155, 0 12px 18px -4px rgba(0, 0, 0, 0.55);
        }
        .tactile-cell:not(:disabled):active {
          transform: translateY(3px) scale(0.98);
          box-shadow: 0 2px 0 0 #94a3b8 !important;
        }

        .tactile-cell.cell-p1 {
          box-shadow: 0 5px 0 0 #1b4086, 0 8px 16px -4px rgba(27, 64, 134, 0.25);
        }
        .dark .tactile-cell.cell-p1 {
          box-shadow: 0 5px 0 0 #2563eb, 0 8px 16px -4px rgba(37, 99, 235, 0.3);
        }
        .tactile-cell.cell-p2 {
          box-shadow: 0 5px 0 0 #ea580c, 0 8px 16px -4px rgba(234, 88, 12, 0.25);
        }
        .dark .tactile-cell.cell-p2 {
          box-shadow: 0 5px 0 0 #f97316, 0 8px 16px -4px rgba(249, 115, 22, 0.3);
        }

        /* 3D Action Buttons - Always High Contrast */
        .btn-3d-navy {
          background-color: #1b4086 !important;
          color: #ffffff !important;
          box-shadow: 0 4px 0 0 #0f244e, 0 6px 14px -3px rgba(27, 64, 134, 0.45);
          transition: transform 0.12s cubic-bezier(0.34, 1.56, 0.64, 1),
            box-shadow 0.12s ease;
        }
        .btn-3d-navy:hover {
          background-color: #15326c !important;
          color: #ffffff !important;
          transform: translateY(-2px);
          box-shadow: 0 6px 0 0 #0f244e, 0 10px 18px -3px rgba(27, 64, 134, 0.55);
        }
        .btn-3d-navy:active {
          transform: translateY(2px);
          box-shadow: 0 2px 0 0 #0f244e;
        }

        @keyframes tokenDropBounce {
          0% {
            opacity: 0;
            transform: translateY(-20px) scale(0.65, 1.25);
          }
          50% {
            opacity: 1;
            transform: translateY(4px) scale(1.12, 0.88);
          }
          75% {
            transform: translateY(-2px) scale(0.96, 1.04);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1, 1);
          }
        }
        .animate-token-drop {
          animation: tokenDropBounce 0.38s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes winnerCheer {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-4px) scale(1.08); }
        }
        .animate-winner-cheer {
          animation: winnerCheer 0.75s ease-in-out infinite;
        }

        @keyframes dangerPulse {
          0%, 100% {
            border-color: rgba(239, 68, 68, 0.4);
            box-shadow: 0 5px 0 0 #fca5a5, 0 0 0 0 rgba(239, 68, 68, 0.3);
          }
          50% {
            border-color: rgba(239, 68, 68, 0.9);
            box-shadow: 0 5px 0 0 #ef4444, 0 0 0 5px rgba(239, 68, 68, 0);
          }
        }
        .cell-danger-threat {
          animation: dangerPulse 1.35s infinite;
        }

        @keyframes vanishingPulse {
          0%, 100% { opacity: 0.95; transform: scale(0.98); }
          50% { opacity: 0.45; transform: scale(0.92); }
        }
        .token-vanishing {
          animation: vanishingPulse 1.1s ease-in-out infinite;
        }

        .ghost-peek {
          opacity: 0;
          transform: translateY(4px) scale(0.85);
          transition: opacity 0.16s ease, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .tactile-cell:not(:disabled):hover .ghost-peek {
          opacity: 0.45;
          transform: translateY(0px) scale(1);
        }

        @keyframes drawStrike {
          from { stroke-dashoffset: 400; }
          to { stroke-dashoffset: 0; }
        }
        .strike-beam {
          stroke-dasharray: 400;
          stroke-dashoffset: 400;
          animation: drawStrike 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
      `}</style>

      <div className="w-full max-w-[540px] md:max-w-4xl lg:max-w-5xl mx-auto flex flex-col z-10">
        
        {/* 1. TOP NAVIGATION BAR */}
        <header className="flex items-center justify-between gap-2 mb-2 sm:mb-3.5">
          <Link
            href="/tools"
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-surface border border-outline-variant/30 text-outline hover:text-on-surface text-xs sm:text-sm font-bold shadow-xs hover:shadow transition-all shrink-0"
          >
            <FiArrowLeft className="w-4 h-4 text-outline" />
            <span className="hidden sm:inline">Semua Tools & Games</span>
            <span className="inline sm:hidden">Tools</span>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-secondary/10 border border-secondary/25 text-secondary text-[11px] sm:text-xs font-bold shadow-xs">
              <IoGameController className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Mini Game</span>
            </div>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              type="button"
              title={soundEnabled ? "Matikan Suara" : "Aktifkan Suara"}
              className="p-1.5 sm:p-2 rounded-xl bg-surface border border-outline-variant/30 text-outline hover:text-on-surface shadow-xs hover:bg-surface-container-low active:scale-95 transition-all cursor-pointer"
            >
              {soundEnabled ? (
                <FiVolume2 className="w-4 h-4 text-primary" />
              ) : (
                <FiVolumeX className="w-4 h-4 text-outline" />
              )}
            </button>

            {/* Quick Game Settings Trigger */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              type="button"
              title="Pengaturan Mode & Karakter"
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-surface border border-outline-variant/30 text-outline hover:text-on-surface shadow-xs hover:bg-surface-container-low active:scale-95 transition-all cursor-pointer text-xs font-bold"
            >
              <FiSliders className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              <span className="hidden xs:inline">Opsi</span>
            </button>
          </div>
        </header>

        {/* 2. HERO TITLE */}
        <div className="text-center mb-1.5 sm:mb-2">
          <h1 className="text-xl sm:text-2xl font-black text-on-surface tracking-tight">
            Tic-Tac-Toe Kampus
          </h1>
        </div>

        {/* 3. UNIFIED COMPACT MODE CHIP (Click opens Settings Modal on all screens) */}
        <div className="flex items-center justify-center mb-2 sm:mb-2.5">
          <button
            onClick={() => setIsSettingsOpen(true)}
            type="button"
            className="inline-flex items-center gap-2 sm:gap-2.5 px-3.5 py-1.5 rounded-full bg-surface-container-low hover:bg-surface-container border border-outline-variant/40 shadow-xs hover:border-primary/50 active:scale-95 transition-all text-xs cursor-pointer group"
          >
            <span className="inline-flex items-center gap-1.5 font-bold text-on-surface">
              {mode === "bot" && <FiUser className="w-3.5 h-3.5 text-primary shrink-0" />}
              {mode === "pvp" && <FiUsers className="w-3.5 h-3.5 text-primary shrink-0" />}
              {mode === "online" && <FiGlobe className="w-3.5 h-3.5 text-[#f2791e] shrink-0" />}
              <span>{mode === "bot" ? "Lawan Komputer" : mode === "pvp" ? "1 Layar (Duel)" : "Mabar Online"}</span>
            </span>
            <span className="w-1 h-1 rounded-full bg-outline-variant shrink-0" />
            <span className="inline-flex items-center gap-1.5 font-bold text-on-surface">
              {ruleMode === "classic" ? (
                <FiZap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              ) : (
                <IoInfinite className="w-3.5 h-3.5 text-secondary shrink-0" />
              )}
              <span>{ruleMode === "classic" ? "Mode Klasik" : "Mode Infinity"}</span>
            </span>
            <span className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] sm:text-[11px] font-black group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
              <FiSliders className="w-2.5 h-2.5" />
              <span>Ganti Mode</span>
            </span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* ONLINE ROOM SETUP MODAL / LOBBY (When not connected yet) */}
        {/* ========================================================= */}
        {mode === "online" && onlineState !== "connected" && (
          <div className="bg-surface border-2 border-[#f2791e]/40 rounded-3xl p-4 sm:p-5 mb-4 shadow-xl animate-fade-in">
            
            {/* Online State: Opponent Left */}
            {onlineState === "opponent_left" ? (
              <div className="text-center py-5 flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center font-bold text-xl mb-3 shadow-inner">
                  <FiLogOut className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-on-surface">Lawan Telah Keluar</h3>
                <p className="text-xs text-outline mt-1 mb-4 max-w-xs">
                  Teman bermainmu telah meninggalkan room ini. Kamu bisa membuat room baru atau bermain lawan komputer.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setOnlineState("idle");
                      handleCreateRoom();
                    }}
                    type="button"
                    className="btn-3d-navy px-5 py-2.5 rounded-xl text-xs font-black cursor-pointer"
                  >
                    Buat Room Baru
                  </button>
                  <button
                    onClick={leaveOnlineRoom}
                    type="button"
                    className="px-4 py-2.5 rounded-xl border border-outline-variant/30 text-xs font-bold text-outline hover:text-on-surface hover:bg-surface-container cursor-pointer transition-colors"
                  >
                    Kembali ke Lobby
                  </button>
                </div>
              </div>
            ) : onlineState === "waiting" ? (
              <div className="flex flex-col items-center text-center py-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f2791e]/15 text-[#f2791e] text-xs font-black mb-3">
                  <FiRadio className="w-4 h-4 animate-pulse" />
                  <span>Room Berhasil Dibuat</span>
                </div>

                <h3 className="text-sm font-semibold text-outline">Bagikan Kode Room ini ke Teman:</h3>
                <div className="mt-1.5 flex items-center gap-2 bg-surface-container px-4 py-2 rounded-2xl border border-outline-variant/40">
                  <span className="text-2xl sm:text-3xl font-black font-mono tracking-widest text-[#1b4086]">
                    {roomCode}
                  </span>
                  <button
                    onClick={() => {
                      copyToClipboard(roomCode, "Kode room disalin!");
                      setIsCopiedCode(true);
                      setTimeout(() => setIsCopiedCode(false), 2000);
                    }}
                    type="button"
                    className="p-2 rounded-xl bg-surface border border-outline-variant/30 text-outline hover:text-primary transition-all cursor-pointer"
                    title="Salin Kode"
                  >
                    {isCopiedCode ? <FiCheck className="w-4 h-4 text-emerald-600" /> : <FiCopy className="w-4 h-4" />}
                  </button>
                </div>

                {/* Link Share Box */}
                <div className="w-full mt-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareableUrl}
                      className="flex-1 bg-surface-container-low border border-outline-variant/40 rounded-xl px-3 py-2 text-xs text-outline font-mono select-all truncate"
                    />
                    <button
                      onClick={() => {
                        copyToClipboard(shareableUrl, "Link mabar berhasil disalin!");
                        setIsCopiedLink(true);
                        setTimeout(() => setIsCopiedLink(false), 2000);
                      }}
                      type="button"
                      className="px-3 py-2 rounded-xl bg-[#1b4086] text-white text-xs font-bold hover:bg-[#15326c] transition-all cursor-pointer shrink-0"
                    >
                      {isCopiedLink ? "Disalin!" : "Salin Link"}
                    </button>
                  </div>

                  {/* Share to WhatsApp */}
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                      `Yuk mabar Tic-Tac-Toe Kampus bareng aku!\nMasuk ke room: *${roomCode}*\nAtau klik link langsung:\n${shareableUrl}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    <FaWhatsapp className="w-4 h-4" />
                    <span>Kirim Undangan ke WhatsApp</span>
                  </a>
                </div>

                {/* Pulsing Wait Indicator */}
                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-outline">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f2791e] animate-ping shrink-0" />
                  <span>Menunggu lawan bergabung ke room...</span>
                </div>

                <button
                  onClick={leaveOnlineRoom}
                  type="button"
                  className="mt-3 text-xs text-rose-500 hover:underline font-bold cursor-pointer"
                >
                  Batal & Keluar
                </button>
              </div>
            ) : onlineState === "joining" ? (
              <div className="text-center py-6 flex flex-col items-center">
                <span className="w-8 h-8 rounded-full border-3 border-[#f2791e] border-t-transparent animate-spin mb-3" />
                <h3 className="text-base font-bold text-on-surface">Menghubungkan ke Room {roomCode}...</h3>
                <p className="text-xs text-outline mt-1">Sinkronisasi status papan dengan Host.</p>
                <button
                  onClick={leaveOnlineRoom}
                  type="button"
                  className="mt-4 text-xs text-rose-500 hover:underline font-bold cursor-pointer"
                >
                  Batal
                </button>
              </div>
            ) : (
              /* Lobby Tabs: Buat Room vs Gabung Room */
              <div>
                <div className="grid grid-cols-2 gap-1 p-1 bg-surface-container rounded-2xl mb-4">
                  <button
                    onClick={() => setOnlineTab("create")}
                    type="button"
                    className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                      onlineTab === "create"
                        ? "bg-[#1b4086] text-white shadow-sm"
                        : "text-outline hover:text-on-surface"
                    }`}
                  >
                    Buat Room Baru
                  </button>
                  <button
                    onClick={() => setOnlineTab("join")}
                    type="button"
                    className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                      onlineTab === "join"
                        ? "bg-[#1b4086] text-white shadow-sm"
                        : "text-outline hover:text-on-surface"
                    }`}
                  >
                    Gabung Room
                  </button>
                </div>

                {onlineTab === "create" ? (
                  <div className="flex flex-col gap-3.5">
                    <div>
                      <span className="text-xs font-bold text-outline block mb-1.5">
                        Pilih Karaktermu (Host · Bidak X):
                      </span>
                      <div className="grid grid-cols-4 gap-2">
                        {CHARACTER_LIST.map((id) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setP1Char(id)}
                            className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                              p1Char === id
                                ? "border-primary bg-primary/10 shadow-sm scale-102"
                                : "border-outline-variant/30 hover:bg-surface-container"
                            }`}
                          >
                            <div
                              className="w-8 h-8"
                              dangerouslySetInnerHTML={{
                                __html: buildCharacterSVG(id, "navy", "normal", false),
                              }}
                            />
                            <span className="text-[10px] font-black truncate max-w-full">
                              {CAMPUS_CHARACTERS[id].name.replace("Si ", "").replace("Kak ", "")}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleCreateRoom}
                      type="button"
                      className="btn-3d-navy w-full py-3 rounded-xl font-black text-sm tracking-wide cursor-pointer shadow-md"
                    >
                      Buat Room & Dapatkan Kode
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3.5">
                    <div>
                      <span className="text-xs font-bold text-outline block mb-1">
                        Masukkan Kode Room dari Teman:
                      </span>
                      <input
                        type="text"
                        placeholder="Contoh: TAZ-842"
                        value={joinRoomInput}
                        onChange={(e) => setJoinRoomInput(e.target.value.toUpperCase())}
                        className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl px-3.5 py-2.5 text-sm font-mono font-black text-on-surface uppercase tracking-wider placeholder:text-outline-variant focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div>
                      <span className="text-xs font-bold text-outline block mb-1.5">
                        Pilih Karaktermu (Guest · Bidak O):
                      </span>
                      <div className="grid grid-cols-4 gap-2">
                        {CHARACTER_LIST.map((id) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setP2Char(id)}
                            className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                              p2Char === id
                                ? "border-secondary bg-secondary/10 shadow-sm scale-102"
                                : "border-outline-variant/30 hover:bg-surface-container"
                            }`}
                          >
                            <div
                              className="w-8 h-8"
                              dangerouslySetInnerHTML={{
                                __html: buildCharacterSVG(id, "orange", "normal", false),
                              }}
                            />
                            <span className="text-[10px] font-black truncate max-w-full">
                              {CAMPUS_CHARACTERS[id].name.replace("Si ", "").replace("Kak ", "")}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleJoinRoom()}
                      type="button"
                      className="w-full py-3 rounded-xl font-black text-sm text-white bg-[#f2791e] hover:bg-[#d15b13] active:translate-y-0.5 tracking-wide cursor-pointer shadow-md transition-all"
                    >
                      Gabung Room & Mulai Main
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* ========================================================= */}
        {/* ARENA WORKSPACE (Only shown when playing, hidden in lobby) */}
        {/* ========================================================= */}
        {showArena && (
          <>
            {/* 4. ONLINE STATUS STRIP (When Connected) */}
        {mode === "online" && onlineState === "connected" && (
          <div className="w-full bg-surface border border-outline-variant/30 rounded-2xl px-3 py-2 mb-3 shadow-sm flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="font-bold text-on-surface">
                Room: <strong className="font-mono text-primary">{roomCode}</strong>
              </span>
              <button
                onClick={() => copyToClipboard(shareableUrl, "Link mabar disalin!")}
                type="button"
                className="text-[10px] font-bold text-outline hover:text-primary underline cursor-pointer"
              >
                Salin Link
              </button>
            </div>

            <button
              onClick={leaveOnlineRoom}
              type="button"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-500 hover:text-rose-600 cursor-pointer"
            >
              <FiLogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        )}

        {/* 5. ARENA BATTLE GRID (P1 Left, Board Center, P2 Right on Desktop) */}
        <div className="grid grid-cols-2 md:grid-cols-[180px_auto_180px] lg:grid-cols-[210px_auto_210px] items-center justify-center gap-2 sm:gap-3 md:gap-6 w-full mx-auto my-auto">
          
          {/* P1 CARD (Left on md+, top-left on mobile) */}
          <div
            className={`col-span-1 md:col-span-1 order-1 md:order-1 rounded-2xl md:rounded-3xl p-2 sm:p-2.5 md:p-4 lg:p-5 transition-all flex md:flex-col items-center md:text-center gap-2 sm:gap-2.5 md:gap-3 ${
              isP1Turn || winner === "P1"
                ? "bg-surface border-2 border-primary shadow-xl shadow-primary/15 ring-2 ring-primary/20 scale-[1.01]"
                : "bg-surface/80 border border-outline-variant/30 opacity-90"
            }`}
          >
            <button
              onClick={() => {
                if (mode === "online" && onlineRole !== "P1") return;
                const idx = (CHARACTER_LIST.indexOf(p1Char) + 1) % CHARACTER_LIST.length;
                changeCharacter("P1", CHARACTER_LIST[idx]);
              }}
              disabled={mode === "online" && onlineRole !== "P1"}
              type="button"
              title="Klik untuk ganti karakter"
              className="group relative w-10 h-10 sm:w-11 sm:h-11 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-xl sm:rounded-2xl md:rounded-3xl bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0 overflow-visible hover:border-primary active:scale-95 transition-all cursor-pointer disabled:cursor-default"
            >
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 md:w-13 md:h-13 lg:w-16 lg:h-16 animate-float"
                dangerouslySetInnerHTML={{
                  __html: buildCharacterSVG(p1Char, "navy", p1Mood, true),
                }}
              />
              {(!mode || mode !== "online" || onlineRole === "P1") && (
                <span className="hidden md:inline-block absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-[#1b4086] text-white text-[9px] font-extrabold shadow group-hover:scale-105 transition-transform">
                  Ganti ↻
                </span>
              )}
            </button>

            <div className="min-w-0 flex-1 md:flex-initial md:w-full">
              <div className="flex items-center md:justify-center gap-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-primary truncate">
                  {mode === "online"
                    ? onlineRole === "P1"
                      ? "Kamu (Host)"
                      : "Lawan (Host)"
                    : "Kamu (P1)"}
                </span>
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-primary/10 text-primary shrink-0">
                  X
                </span>
              </div>
              <h2 className="text-xs sm:text-sm md:text-base font-black text-on-surface truncate leading-tight mt-0.5">
                {c1.name}
              </h2>
              <p className="hidden md:block text-[11px] font-medium text-outline truncate mt-0.5">
                {c1.role}
              </p>

              {/* Mobile Score Display */}
              <div className="flex md:hidden items-center gap-1 text-[11px] font-bold text-outline mt-0.5">
                <span>Skor:</span>
                <strong className="font-mono font-black text-primary text-xs">{scores.P1}</strong>
              </div>

              {/* Desktop Score Box */}
              <div className="hidden md:flex items-center justify-center gap-2 mt-2.5 px-3 py-1.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                <span className="text-xs font-bold uppercase tracking-wider">Skor</span>
                <span className="text-lg lg:text-xl font-black font-mono">{scores.P1}</span>
              </div>
            </div>
          </div>

          {/* P2 CARD (Right on md+, top-right on mobile) */}
          <div
            className={`col-span-1 md:col-span-1 order-2 md:order-3 rounded-2xl md:rounded-3xl p-2 sm:p-2.5 md:p-4 lg:p-5 transition-all flex md:flex-col items-center md:text-center gap-2 sm:gap-2.5 md:gap-3 ${
              isP2Turn || winner === "P2"
                ? "bg-surface border-2 border-secondary shadow-xl shadow-secondary/15 ring-2 ring-secondary/20 scale-[1.01]"
                : "bg-surface/80 border border-outline-variant/30 opacity-90"
            }`}
          >
            <button
              onClick={() => {
                if (mode === "online" && onlineRole !== "P2") return;
                const idx = (CHARACTER_LIST.indexOf(p2Char) + 1) % CHARACTER_LIST.length;
                changeCharacter("P2", CHARACTER_LIST[idx]);
              }}
              disabled={mode === "online" && onlineRole !== "P2"}
              type="button"
              title="Klik untuk ganti karakter"
              className="group relative w-10 h-10 sm:w-11 sm:h-11 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-xl sm:rounded-2xl md:rounded-3xl bg-secondary/10 border border-secondary/25 flex items-center justify-center shrink-0 overflow-visible hover:border-secondary active:scale-95 transition-all cursor-pointer disabled:cursor-default"
            >
              <div
                className="w-10 h-10 sm:w-9 sm:h-9 md:w-13 md:h-13 lg:w-16 lg:h-16 animate-float"
                style={{ animationDelay: "-1.5s" }}
                dangerouslySetInnerHTML={{
                  __html: buildCharacterSVG(p2Char, "orange", p2Mood, true),
                }}
              />
              {(!mode || mode !== "online" || onlineRole === "P2") && (
                <span className="hidden md:inline-block absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-[#f2791e] text-white text-[9px] font-extrabold shadow group-hover:scale-105 transition-transform">
                  Ganti ↻
                </span>
              )}
            </button>

            <div className="min-w-0 flex-1 md:flex-initial md:w-full text-left md:text-center">
              <div className="flex items-center md:justify-center gap-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-secondary truncate">
                  {mode === "bot"
                    ? "Komputer"
                    : mode === "online"
                    ? onlineRole === "P2"
                      ? "Kamu (Guest)"
                      : "Lawan (Guest)"
                    : "Pemain 2"}
                </span>
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-secondary/10 text-secondary shrink-0">
                  O
                </span>
              </div>
              <h2 className="text-xs sm:text-sm md:text-base font-black text-on-surface truncate leading-tight mt-0.5">
                {c2.name}
              </h2>
              <p className="hidden md:block text-[11px] font-medium text-outline truncate mt-0.5">
                {c2.role}
              </p>

              {/* Mobile Score Display */}
              <div className="flex md:hidden items-center gap-1 text-[11px] font-bold text-outline mt-0.5">
                <span>Skor:</span>
                <strong className="font-mono font-black text-secondary text-xs">{scores.P2}</strong>
              </div>

              {/* Desktop Score Box */}
              <div className="hidden md:flex items-center justify-center gap-2 mt-2.5 px-3 py-1.5 rounded-2xl bg-secondary/10 border border-secondary/20 text-secondary">
                <span className="text-xs font-bold uppercase tracking-wider">Skor</span>
                <span className="text-lg lg:text-xl font-black font-mono">{scores.P2}</span>
              </div>
            </div>
          </div>

          {/* CENTER COLUMN (Board + Turn Status + Actions) */}
          <div className="col-span-2 md:col-span-1 order-3 md:order-2 flex flex-col items-center w-full">
            
            {/* Status & Draw Pill */}
            <div className="flex items-center justify-center gap-2 mb-1.5 w-full">
              <div
                className={`px-3 py-0.5 sm:py-1 rounded-xl text-[11px] sm:text-xs font-black tracking-wide shadow-xs truncate text-center ${statusPillClass}`}
              >
                {statusText}
              </div>
              {scores.draw > 0 && (
                <span className="text-[10px] sm:text-xs font-bold text-outline">
                  (Seri: {scores.draw})
                </span>
              )}
            </div>

            {/* 3D Tactile Battle Board */}
            <div className="relative w-full max-w-[280px] xs:max-w-[310px] sm:max-w-[340px] md:max-w-[350px] bg-surface p-2 sm:p-3 rounded-[22px] sm:rounded-[26px] border border-outline-variant/40 shadow-xl mb-2 sm:mb-2.5">
              {/* SVG Laser Strike Line (Guaranteed on horizontal, vertical, and diagonal lines) */}
              {gameOver && winningLine && (
                <svg
                  className="pointer-events-none absolute inset-0 w-full h-full z-20 overflow-visible"
                  viewBox="0 0 300 300"
                >
                  {/* Layer 1: Wide Ambient Halo Glow */}
                  <line
                    x1={winningLine.coords[0]}
                    y1={winningLine.coords[1]}
                    x2={winningLine.coords[2]}
                    y2={winningLine.coords[3]}
                    stroke={winner === "P1" ? "#3b82f6" : "#fb923c"}
                    strokeWidth="18"
                    strokeLinecap="round"
                    opacity="0.35"
                    className="strike-beam"
                  />
                  {/* Layer 2: Radiant Energy Beam */}
                  <line
                    x1={winningLine.coords[0]}
                    y1={winningLine.coords[1]}
                    x2={winningLine.coords[2]}
                    y2={winningLine.coords[3]}
                    stroke={winner === "P1" ? "#60a5fa" : "#f97316"}
                    strokeWidth="11"
                    strokeLinecap="round"
                    opacity="0.75"
                    className="strike-beam"
                  />
                  {/* Layer 3: Solid Sharp Core Beam */}
                  <line
                    x1={winningLine.coords[0]}
                    y1={winningLine.coords[1]}
                    x2={winningLine.coords[2]}
                    y2={winningLine.coords[3]}
                    stroke={winner === "P1" ? "#1b4086" : "#ea580c"}
                    strokeWidth="5.5"
                    strokeLinecap="round"
                    className="strike-beam"
                  />
                </svg>
              )}

              {/* 3x3 Tactile Grid */}
              <div className="grid grid-cols-3 grid-rows-3 gap-2 sm:gap-3 w-full aspect-square relative z-10">
                {board.map((owner, idx) => {
                  const isDisabled =
                    owner !== null ||
                    gameOver ||
                    (mode === "bot" && currentTurn === "P2") ||
                    isBotThinking ||
                    (mode === "online" && (onlineState !== "connected" || currentTurn !== onlineRole));

                  const isWinCell = winningLine?.cells.includes(idx as any);
                  const isJustPlaced = lastPlacedIdx === idx;
                  const isVanishing = vanishingIdx === idx;
                  const isThreatEmpty =
                    !gameOver && owner === null && allDangerCells.includes(idx);

                  let cellClasses =
                    "tactile-cell w-full h-full aspect-square flex flex-col items-center justify-center p-1 select-none overflow-hidden ";

                  if (owner === "P1") {
                    const tokenMood: Mood = gameOver
                      ? winner === "P1"
                        ? "happy"
                        : winner === "P2"
                        ? "dizzy"
                        : "nervous"
                      : threats.P2.length > 0
                      ? "nervous"
                      : "normal";

                    cellClasses += isWinCell
                      ? "cell-p1 bg-primary/15 border-2 border-primary "
                      : "cell-p1 bg-primary/5 border border-primary/20 ";

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled
                        className={cellClasses}
                      >
                        <div
                          className={`w-9 h-9 sm:w-11 sm:h-11 shrink-0 ${
                            isJustPlaced ? "animate-token-drop" : ""
                          } ${isWinCell ? "animate-winner-cheer" : ""} ${
                            isVanishing ? "token-vanishing" : ""
                          }`}
                          dangerouslySetInnerHTML={{
                            __html: buildCharacterSVG(p1Char, "navy", tokenMood, false),
                          }}
                        />
                        <span
                          className={`text-[8px] sm:text-[9px] font-black mt-0.5 truncate max-w-full leading-none ${
                            isVanishing ? "text-amber-600 dark:text-amber-400" : "text-primary"
                          }`}
                        >
                          {isVanishing ? "Akan Hilang" : c1.name}
                        </span>
                      </button>
                    );
                  }

                  if (owner === "P2") {
                    const tokenMood: Mood = gameOver
                      ? winner === "P2"
                        ? "happy"
                        : winner === "P1"
                        ? "dizzy"
                        : "nervous"
                      : threats.P1.length > 0
                      ? "nervous"
                      : "normal";

                    cellClasses += isWinCell
                      ? "cell-p2 bg-secondary/15 border-2 border-secondary "
                      : "cell-p2 bg-secondary/5 border border-secondary/20 ";

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled
                        className={cellClasses}
                      >
                        <div
                          className={`w-9 h-9 sm:w-11 sm:h-11 shrink-0 ${
                            isJustPlaced ? "animate-token-drop" : ""
                          } ${isWinCell ? "animate-winner-cheer" : ""} ${
                            isVanishing ? "token-vanishing" : ""
                          }`}
                          dangerouslySetInnerHTML={{
                            __html: buildCharacterSVG(p2Char, "orange", tokenMood, false),
                          }}
                        />
                        <span
                          className={`text-[8px] sm:text-[9px] font-black mt-0.5 truncate max-w-full leading-none ${
                            isVanishing ? "text-amber-600 dark:text-amber-400" : "text-secondary"
                          }`}
                        >
                          {isVanishing ? "Akan Hilang" : c2.name}
                        </span>
                      </button>
                    );
                  }

                  // Empty cell
                  cellClasses += `bg-surface-container-low border border-outline-variant/30 ${
                    isDisabled ? "cursor-not-allowed opacity-90" : "cursor-pointer"
                  } ${isThreatEmpty ? "cell-danger-threat" : ""} `;

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => handleCellClick(idx)}
                      className={cellClasses}
                    >
                      {!isDisabled && (
                        <div
                          className="ghost-peek w-8 h-8 sm:w-10 sm:h-10 pointer-events-none shrink-0"
                          dangerouslySetInnerHTML={{
                            __html: buildCharacterSVG(activeChar, activeTheme, "normal", false),
                          }}
                        />
                      )}
                      {isThreatEmpty && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer Action Buttons */}
            <div className="flex items-center justify-center gap-2 sm:gap-2.5">
              <button
                onClick={handleRematchClick}
                type="button"
                className={`btn-3d-navy inline-flex items-center justify-center gap-1.5 sm:gap-2 px-5 py-2 rounded-xl font-black text-xs sm:text-sm tracking-wide cursor-pointer ${
                  gameOver ? "animate-bounce" : ""
                }`}
              >
                <FiRotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Main Lagi</span>
              </button>

              <button
                onClick={handleRandomMatchup}
                type="button"
                title="Acak Karakter"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface border border-outline-variant/30 text-xs sm:text-sm font-bold text-on-surface hover:bg-surface-container-low active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                <FiShuffle className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="hidden xs:inline">Acak Karakter</span>
              </button>

              <button
                onClick={() => {
                  setScores({ P1: 0, draw: 0, P2: 0 });
                  resetRound();
                  showToast("Skor pertandingan berhasil di-reset!");
                }}
                type="button"
                className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-outline hover:text-rose-600 transition-colors cursor-pointer"
              >
                Reset Skor
              </button>
            </div>

          </div>

        </div>
          </>
        )}

      </div>

      {/* 9. GAME SETTINGS & OPTIONS MODAL / BOTTOM SHEET */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            />

            {/* Modal / Bottom Sheet Box */}
            <motion.div
              initial={{ y: "100%", opacity: 0.8 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="relative z-10 w-full max-w-lg bg-surface border-t sm:border border-outline-variant/30 rounded-t-[28px] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="px-5 py-3.5 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-low/50">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <FiSliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-on-surface">
                      Pengaturan Permainan
                    </h3>
                    <p className="text-[11px] text-outline">
                      Pilihan mode lawan, aturan, karakter & suara
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  type="button"
                  className="p-2 rounded-xl text-outline hover:text-on-surface hover:bg-surface-container cursor-pointer transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 overflow-y-auto space-y-4 text-left">
                {/* 1. Opponent Mode */}
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-outline block mb-2">
                    Mode Lawan
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSwitchMode("bot")}
                      className={`p-2.5 rounded-2xl border text-center flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        mode === "bot"
                          ? "border-[#1b4086] bg-[#1b4086]/10 text-[#1b4086] dark:text-blue-400 font-extrabold shadow-xs"
                          : "border-outline-variant/30 text-outline hover:bg-surface-container"
                      }`}
                    >
                      <FiUser className="w-5 h-5" />
                      <span className="text-xs font-black">Komputer</span>
                      <span className="text-[10px] text-outline">Lawan AI</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSwitchMode("pvp")}
                      className={`p-2.5 rounded-2xl border text-center flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        mode === "pvp"
                          ? "border-[#1b4086] bg-[#1b4086]/10 text-[#1b4086] dark:text-blue-400 font-extrabold shadow-xs"
                          : "border-outline-variant/30 text-outline hover:bg-surface-container"
                      }`}
                    >
                      <FiUsers className="w-5 h-5" />
                      <span className="text-xs font-black">1 Layar</span>
                      <span className="text-[10px] text-outline">Duel 2 Orang</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleSwitchMode("online");
                        setIsSettingsOpen(false);
                      }}
                      className={`p-2.5 rounded-2xl border text-center flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        mode === "online"
                          ? "border-[#f2791e] bg-[#f2791e]/15 text-[#f2791e] font-extrabold shadow-xs"
                          : "border-outline-variant/30 text-[#f2791e] hover:bg-[#f2791e]/10"
                      }`}
                    >
                      <FiGlobe className="w-5 h-5" />
                      <span className="text-xs font-black">Mabar Online</span>
                      <span className="text-[10px] text-outline">Bikin / Gabung</span>
                    </button>
                  </div>
                </div>

                {/* 2. Rule Mode */}
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-outline block mb-2">
                    Aturan Permainan
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={mode === "online" && onlineRole === "P2"}
                      onClick={() => {
                        if (ruleMode !== "classic") {
                          setRuleMode("classic");
                          resetRound();
                        }
                      }}
                      className={`p-2.5 rounded-2xl border text-left flex items-start gap-2.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                        ruleMode === "classic"
                          ? "border-[#1b4086] bg-[#1b4086]/10 text-on-surface shadow-xs font-bold"
                          : "border-outline-variant/30 text-outline hover:bg-surface-container"
                      }`}
                    >
                      <FiZap className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-black block text-on-surface">Mode Klasik</span>
                        <span className="text-[10px] text-outline leading-tight block mt-0.5">
                          Format standar: 3 baris segaris pertama keluar sebagai pemenang.
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      disabled={mode === "online" && onlineRole === "P2"}
                      onClick={() => {
                        if (ruleMode !== "infinity") {
                          setRuleMode("infinity");
                          resetRound();
                        }
                      }}
                      className={`p-2.5 rounded-2xl border text-left flex items-start gap-2.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                        ruleMode === "infinity"
                          ? "border-[#f2791e] bg-[#f2791e]/15 text-on-surface shadow-xs font-bold"
                          : "border-outline-variant/30 text-outline hover:bg-surface-container"
                      }`}
                    >
                      <IoInfinite className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-black block text-on-surface">Mode Infinity</span>
                        <span className="text-[10px] text-outline leading-tight block mt-0.5">
                          Maks 3 bidak. Langkah ke-4 otomatis menghapus bidak pertama!
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 3. Character Picker */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-outline">
                      Pilih Karakter Pemain
                    </span>
                    <button
                      type="button"
                      onClick={handleRandomMatchup}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer"
                    >
                      <FiShuffle className="w-3 h-3" />
                      <span>Acak Karakter</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {/* P1 Char Picker */}
                    <div>
                      <span className="text-[10px] font-bold text-primary block mb-1">
                        {mode === "online" && onlineRole === "P2" ? "Karakter Host (X):" : "Karakter Kamu / P1 (X):"}
                      </span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {CHARACTER_LIST.map((id) => (
                          <button
                            key={`p1_${id}`}
                            type="button"
                            disabled={mode === "online" && onlineRole === "P2"}
                            onClick={() => changeCharacter("P1", id)}
                            className={`p-1.5 rounded-xl border flex flex-col items-center gap-0.5 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                              p1Char === id
                                ? "border-primary bg-primary/10 shadow-xs scale-102"
                                : "border-outline-variant/30 hover:bg-surface-container"
                            }`}
                          >
                            <div
                              className="w-7 h-7"
                              dangerouslySetInnerHTML={{
                                __html: buildCharacterSVG(id, "navy", "normal", false),
                              }}
                            />
                            <span className="text-[9px] font-black truncate max-w-full">
                              {CAMPUS_CHARACTERS[id].name.replace("Si ", "").replace("Kak ", "")}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* P2 Char Picker */}
                    <div>
                      <span className="text-[10px] font-bold text-secondary block mb-1">
                        {mode === "bot"
                          ? "Karakter Komputer (O):"
                          : mode === "online" && onlineRole === "P1"
                          ? "Karakter Lawan (O):"
                          : "Karakter Pemain 2 / Kamu (O):"}
                      </span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {CHARACTER_LIST.map((id) => (
                          <button
                            key={`p2_${id}`}
                            type="button"
                            disabled={mode === "online" && onlineRole === "P1"}
                            onClick={() => changeCharacter("P2", id)}
                            className={`p-1.5 rounded-xl border flex flex-col items-center gap-0.5 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                              p2Char === id
                                ? "border-secondary bg-secondary/10 shadow-xs scale-102"
                                : "border-outline-variant/30 hover:bg-surface-container"
                            }`}
                          >
                            <div
                              className="w-7 h-7"
                              dangerouslySetInnerHTML={{
                                __html: buildCharacterSVG(id, "orange", "normal", false),
                              }}
                            />
                            <span className="text-[9px] font-black truncate max-w-full">
                              {CAMPUS_CHARACTERS[id].name.replace("Si ", "").replace("Kak ", "")}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Audio & Reset Skor */}
                <div className="pt-2 border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      soundEnabled
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-outline-variant/30 bg-surface-container text-outline"
                    }`}
                  >
                    {soundEnabled ? <FiVolume2 className="w-4 h-4" /> : <FiVolumeX className="w-4 h-4" />}
                    <span>Suara: {soundEnabled ? "Aktif" : "Mati"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setScores({ P1: 0, draw: 0, P2: 0 });
                      resetRound();
                      showToast("Skor pertandingan berhasil di-reset!");
                    }}
                    className="px-3 py-1.5 rounded-xl border border-outline-variant/30 text-xs font-bold text-outline hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
                  >
                    Reset Skor (0 - 0)
                  </button>
                </div>
              </div>

              {/* Footer CTA */}
              <div className="p-4 border-t border-outline-variant/20 bg-surface-container-low/50">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="btn-3d-navy w-full py-2.5 rounded-xl font-black text-xs sm:text-sm tracking-wide cursor-pointer"
                >
                  Tutup & Lanjut Main
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
