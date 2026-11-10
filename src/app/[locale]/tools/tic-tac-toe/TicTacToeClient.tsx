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
} from "react-icons/fi";
import { IoGameController, IoInfinite } from "react-icons/io5";
import { FaWhatsapp } from "react-icons/fa";
import { createClient } from "@/utils/supabase/client";

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
    <div className="bg-background text-on-background min-h-screen pt-24 pb-16 px-3 sm:px-6 relative overflow-hidden flex flex-col justify-between">
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

      <div className="w-full max-w-[540px] mx-auto flex flex-col z-10">
        
        {/* 1. TOP NAVIGATION BAR */}
        <header className="flex items-center justify-between gap-2 mb-3.5">
          <Link
            href="/tools"
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-surface border border-outline-variant/30 text-outline hover:text-on-surface text-xs sm:text-sm font-bold shadow-sm hover:shadow transition-all shrink-0"
          >
            <FiArrowLeft className="w-4 h-4 text-outline" />
            <span className="hidden sm:inline">Semua Tools & Games</span>
            <span className="inline sm:hidden">Tools</span>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-secondary/10 border border-secondary/25 text-secondary text-[11px] sm:text-xs font-bold shadow-sm">
              <IoGameController className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Mini Game</span>
            </div>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              type="button"
              title={soundEnabled ? "Matikan Suara" : "Aktifkan Suara"}
              className="p-1.5 sm:p-2 rounded-xl bg-surface border border-outline-variant/30 text-outline hover:text-on-surface shadow-sm hover:bg-surface-container-low active:scale-95 transition-all cursor-pointer"
            >
              {soundEnabled ? (
                <FiVolume2 className="w-4 h-4 text-primary" />
              ) : (
                <FiVolumeX className="w-4 h-4 text-outline" />
              )}
            </button>
          </div>
        </header>

        {/* 2. HERO TITLE */}
        <div className="text-center mb-3">
          <h1 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight">
            Tic-Tac-Toe Kampus
          </h1>
          <p className="text-xs sm:text-sm text-outline mt-0.5">
            Adu taktik 3 baris bareng karakter kampus. Main lawan bot, berdua, atau mabar online!
          </p>
        </div>

        {/* 3. OPPONENT MODE (3-COLUMNS) & RULE MODE */}
        <div className="flex flex-col gap-2 mb-3.5">
          {/* 3-Column Mode Pill */}
          <div className="bg-surface-container-low p-1 rounded-2xl border border-outline-variant/30 shadow-inner grid grid-cols-3 gap-1">
            <button
              onClick={() => handleSwitchMode("bot")}
              type="button"
              className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[11px] sm:text-xs transition-all cursor-pointer ${
                mode === "bot"
                  ? "font-extrabold bg-[#1b4086] text-white shadow-sm"
                  : "font-bold text-outline hover:text-on-surface"
              }`}
            >
              <FiUser className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Komputer</span>
            </button>

            <button
              onClick={() => handleSwitchMode("pvp")}
              type="button"
              className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[11px] sm:text-xs transition-all cursor-pointer ${
                mode === "pvp"
                  ? "font-extrabold bg-[#1b4086] text-white shadow-sm"
                  : "font-bold text-outline hover:text-on-surface"
              }`}
            >
              <FiUsers className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">1 Layar</span>
            </button>

            <button
              onClick={() => handleSwitchMode("online")}
              type="button"
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] sm:text-xs transition-all cursor-pointer ${
                mode === "online"
                  ? "font-extrabold bg-[#f2791e] text-white shadow-sm"
                  : "font-bold text-[#f2791e] hover:bg-[#f2791e]/10"
              }`}
            >
              <FiGlobe className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Mabar Online</span>
            </button>
          </div>

          {/* Rule Twist (Klasik vs Infinity) */}
          <div className="bg-surface-container-low p-1 rounded-2xl border border-outline-variant/30 shadow-inner flex items-center">
            <button
              onClick={() => {
                if (ruleMode === "classic") return;
                setRuleMode("classic");
                resetRound();
              }}
              disabled={mode === "online" && onlineRole === "P2"}
              type="button"
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] sm:text-xs transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                ruleMode === "classic"
                  ? "font-extrabold bg-[#1b4086] text-white shadow-sm"
                  : "font-bold text-outline hover:text-on-surface"
              }`}
            >
              <FiZap className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Mode Klasik</span>
            </button>
            <button
              onClick={() => {
                if (ruleMode === "infinity") return;
                setRuleMode("infinity");
                resetRound();
              }}
              disabled={mode === "online" && onlineRole === "P2"}
              type="button"
              title="Maksimal 3 bidak per pemain! Langkah ke-4 otomatis menghapus bidak pertama."
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] sm:text-xs transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                ruleMode === "infinity"
                  ? "font-extrabold bg-[#f2791e] text-white shadow-sm"
                  : "font-bold text-outline hover:text-on-surface"
              }`}
            >
              <IoInfinite className="w-4 h-4 shrink-0" />
              <span className="truncate">Mode Infinity</span>
            </button>
          </div>
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

        {/* 5. UNIFIED SCORE & STATUS BANNER */}
        <div className="w-full bg-surface border border-outline-variant/30 rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 mb-3 shadow-sm flex items-center justify-between gap-2">
          {/* P1 Score */}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1b4086] shrink-0" />
            <span className="text-xs font-bold text-outline">
              {mode === "online" ? (onlineRole === "P1" ? "Kamu (Host):" : "Host:") : "Kamu:"}{" "}
              <strong className="text-sm sm:text-base font-black text-primary font-mono">
                {scores.P1}
              </strong>
            </span>
          </div>

          {/* Turn / Winner Status Pill */}
          <div
            className={`px-3 py-1 rounded-xl text-[10px] sm:text-xs font-black tracking-wide shadow-sm truncate text-center ${statusPillClass}`}
          >
            {statusText}
          </div>

          {/* P2 Score & Draw */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-outline hidden xs:inline">
              (Seri: {scores.draw})
            </span>
            <span className="text-xs font-bold text-outline">
              {mode === "bot" ? "Bot:" : mode === "online" ? (onlineRole === "P2" ? "Kamu (Guest):" : "Guest:") : "P2:"}{" "}
              <strong className="text-sm sm:text-base font-black text-secondary font-mono">
                {scores.P2}
              </strong>
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#f2791e] shrink-0" />
          </div>
        </div>

        {/* 6. TWO FIGHTER CARDS */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-4">
          
          {/* P1 CARD */}
          <div
            className={`rounded-2xl p-2.5 sm:p-3 transition-all flex items-center gap-2 sm:gap-3 ${
              isP1Turn || winner === "P1"
                ? "bg-surface border-2 border-primary shadow-md scale-[1.01]"
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
              className="group relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0 overflow-visible hover:border-primary active:scale-95 transition-all cursor-pointer disabled:cursor-default"
            >
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 animate-float"
                dangerouslySetInnerHTML={{
                  __html: buildCharacterSVG(p1Char, "navy", p1Mood, true),
                }}
              />
              {(!mode || mode !== "online" || onlineRole === "P1") && (
                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-[#1b4086] text-white text-[8px] font-extrabold shadow group-hover:scale-105 transition-transform">
                  Ganti ↻
                </span>
              )}
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-primary truncate">
                  {mode === "online"
                    ? onlineRole === "P1"
                      ? "Kamu (Host · P1)"
                      : "Lawan (Host · P1)"
                    : "Kamu (P1)"}
                </span>
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-primary/10 text-primary shrink-0">
                  X
                </span>
              </div>
              <h2 className="text-xs sm:text-sm font-black text-on-surface truncate leading-tight mt-0.5">
                {c1.name}
              </h2>
              <p className="text-[10px] font-medium text-outline truncate mt-0.5">
                {c1.role}
              </p>
            </div>
          </div>

          {/* P2 CARD */}
          <div
            className={`rounded-2xl p-2.5 sm:p-3 transition-all flex items-center gap-2 sm:gap-3 ${
              isP2Turn || winner === "P2"
                ? "bg-surface border-2 border-secondary shadow-md scale-[1.01]"
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
              className="group relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-secondary/10 border border-secondary/25 flex items-center justify-center shrink-0 overflow-visible hover:border-secondary active:scale-95 transition-all cursor-pointer disabled:cursor-default"
            >
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 animate-float"
                style={{ animationDelay: "-1.5s" }}
                dangerouslySetInnerHTML={{
                  __html: buildCharacterSVG(p2Char, "orange", p2Mood, true),
                }}
              />
              {(!mode || mode !== "online" || onlineRole === "P2") && (
                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-[#f2791e] text-white text-[8px] font-extrabold shadow group-hover:scale-105 transition-transform">
                  Ganti ↻
                </span>
              )}
            </button>

            <div className="min-w-0 flex-1 text-left">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-secondary truncate">
                  {mode === "bot"
                    ? "Komputer"
                    : mode === "online"
                    ? onlineRole === "P2"
                      ? "Kamu (Guest · P2)"
                      : "Lawan (Guest · P2)"
                    : "Pemain 2"}
                </span>
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-secondary/10 text-secondary shrink-0">
                  O
                </span>
              </div>
              <h2 className="text-xs sm:text-sm font-black text-on-surface truncate leading-tight mt-0.5">
                {c2.name}
              </h2>
              <p className="text-[10px] font-medium text-outline truncate mt-0.5">
                {c2.role}
              </p>
            </div>
          </div>

        </div>

        {/* 7. 3D TACTILE BATTLE BOARD */}
        <div className="relative w-full max-w-[340px] sm:max-w-[360px] mx-auto bg-surface p-3 sm:p-4 rounded-[28px] border border-outline-variant/40 shadow-xl mb-4">
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
          <div className="grid grid-cols-3 grid-rows-3 gap-2.5 sm:gap-3.5 w-full aspect-square relative z-10">
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
                      className={`w-10 h-10 sm:w-12 sm:h-12 shrink-0 ${
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
                      className={`w-10 h-10 sm:w-12 sm:h-12 shrink-0 ${
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
                      className="ghost-peek w-9 h-9 sm:w-10 sm:h-10 pointer-events-none shrink-0"
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

        {/* 8. FOOTER ACTION BUTTONS */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 mb-3.5">
          <button
            onClick={handleRematchClick}
            type="button"
            className="btn-3d-navy inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm tracking-wide cursor-pointer"
          >
            <FiRotateCcw className="w-4 h-4" />
            <span>Main Lagi</span>
          </button>

          <button
            onClick={handleRandomMatchup}
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface border border-outline-variant/30 text-xs sm:text-sm font-bold text-on-surface hover:bg-surface-container-low active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            <FiShuffle className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>Acak Karakter</span>
          </button>

          <button
            onClick={() => {
              setScores({ P1: 0, draw: 0, P2: 0 });
              resetRound();
            }}
            type="button"
            className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-outline hover:text-rose-600 transition-colors cursor-pointer"
          >
            Reset Skor
          </button>
        </div>

        {/* Tips Footer */}
        <div className="p-3 rounded-2xl bg-surface border border-outline-variant/30 text-center text-xs text-outline shadow-sm">
          <div className="flex items-center justify-center gap-2">
            <FiInfo className="w-4 h-4 text-primary shrink-0" />
            <span>
              <strong>Tips Arena:</strong> Mode Infinity membatasi maksimal 3 bidak di papan. Langkah ke-4 otomatis menghapus bidak pertama!
            </span>
          </div>
        </div>
          </>
        )}

      </div>
    </div>
  );
}
