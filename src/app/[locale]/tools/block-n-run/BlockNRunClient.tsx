"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "@/i18n/routing";
import confetti from "canvas-confetti";
import {
  RotateCcw,
  RotateCw,
  Bot,
  Users,
  HelpCircle,
  Trophy,
  AlertCircle,
  Plus,
  Check,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  FiArrowLeft,
  FiGlobe,
  FiCopy,
  FiCheck,
  FiLogOut,
  FiShuffle,
} from "react-icons/fi";
import { IoGameController } from "react-icons/io5";
import { FaWhatsapp } from "react-icons/fa";
import { createClient } from "@/utils/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

// ==========================================
// TIPE & INTERFACE DATA PERMAINAN
// ==========================================
export type PlayerColor = "BLUE" | "RED";
export type WallOrientation = "H" | "V";
export type ActionMode = "MOVE" | "WALL";
export type BotDifficulty = "normal" | "hard";
export type GameMode = "bot" | "pvp" | "online";
export type OnlineRole = "BLUE" | "RED" | null;
export type OnlineState = "idle" | "waiting" | "joining" | "connected" | "opponent_left";

export interface RemoteBroadcastPayload {
  type: "guest_joined" | "host_sync" | "pawn_move" | "place_wall" | "rematch" | "player_left";
  player?: PlayerColor;
  targetR?: number;
  targetC?: number;
  r?: number;
  c?: number;
  orientation?: WallOrientation;
  startingPlayer?: PlayerColor;
  nextStarter?: PlayerColor;
  blueWallsLeft?: number;
  redWallsLeft?: number;
}

export interface Wall {
  r: number;
  c: number;
  orientation: WallOrientation;
  owner: PlayerColor;
}

export interface PawnPosition {
  r: number;
  c: number;
}

export type MoveDirection =
  | "UP"
  | "DOWN"
  | "LEFT"
  | "RIGHT"
  | "UP_LEFT"
  | "UP_RIGHT"
  | "DOWN_LEFT"
  | "DOWN_RIGHT";

export interface ValidMove {
  r: number;
  c: number;
  dirName: MoveDirection;
  isJump: boolean;
}

// ==========================================
// GENERATE KODE ROOM ONLINE
// ==========================================
function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let random = "";
  for (let i = 0; i < 4; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `BNR-${random}`;
}

// ==========================================
// KONSTANTA & ATURAN DASAR PERMAINAN (7x7)
// ==========================================
const BOARD_SIZE = 7;
const INITIAL_WALLS = 5;

const INITIAL_BLUE_POS: PawnPosition = { r: 6, c: 3 }; // Start di baris 6 (bawah), target: baris 0 (atas)
const INITIAL_RED_POS: PawnPosition = { r: 0, c: 3 }; // Start di baris 0 (atas), target: baris 6 (bawah)

const BOARD_TILES = Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => ({
  r: Math.floor(i / BOARD_SIZE),
  c: i % BOARD_SIZE,
}));

const GROOVE_TILES = Array.from(
  { length: (BOARD_SIZE - 1) * (BOARD_SIZE - 1) },
  (_, i) => ({
    r: Math.floor(i / (BOARD_SIZE - 1)),
    c: i % (BOARD_SIZE - 1),
  })
);

// ==========================================
// WEB AUDIO SYNTHESIZER (MODULE LEVEL)
// ==========================================
let audioContextInstance: AudioContext | null = null;

function playTone(freq = 440, type: OscillatorType = "sine", duration = 0.08, gainVol = 0.12) {
  if (typeof window === "undefined") return;
  try {
    if (!audioContextInstance) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) audioContextInstance = new AudioCtx();
    }
    const ctx = audioContextInstance;
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.25, ctx.currentTime + duration);
    gain.gain.setValueAtTime(gainVol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

// ==========================================
// FUNGSI LOGIKA & PATHFINDING (BFS)
// ==========================================

/**
 * Mengecek apakah pergerakan 1 langkah ortogonal dari (r1, c1) ke (r2, c2)
 * terhalang oleh tembok yang sudah terpasang di papan.
 */
function isEdgeBlocked(
  r1: number,
  c1: number,
  r2: number,
  c2: number,
  walls: Wall[]
): boolean {
  if (r2 < 0 || r2 >= BOARD_SIZE || c2 < 0 || c2 >= BOARD_SIZE) return true;

  // Gerak Vertikal (Atas / Bawah) -> Dihalangi oleh tembok Horizontal ('H')
  if (c1 === c2) {
    const minR = Math.min(r1, r2);
    return walls.some(
      (w) => w.orientation === "H" && w.r === minR && (w.c === c1 || w.c === c1 - 1)
    );
  }

  // Gerak Horizontal (Kiri / Kanan) -> Dihalangi oleh tembok Vertikal ('V')
  if (r1 === r2) {
    const minC = Math.min(c1, c2);
    return walls.some(
      (w) => w.orientation === "V" && w.c === minC && (w.r === r1 || w.r === r1 - 1)
    );
  }

  return true;
}

/**
 * Menghitung langkah valid untuk bidak aktif (termasuk aturan melompati lawan ala Quoridor)
 */
function getValidPawnMoves(
  playerPos: PawnPosition,
  opponentPos: PawnPosition,
  walls: Wall[]
): ValidMove[] {
  const moves: ValidMove[] = [];
  const dirs: Array<{ dr: number; dc: number; dirName: MoveDirection }> = [
    { dr: -1, dc: 0, dirName: "UP" },
    { dr: 1, dc: 0, dirName: "DOWN" },
    { dr: 0, dc: -1, dirName: "LEFT" },
    { dr: 0, dc: 1, dirName: "RIGHT" },
  ];

  for (const { dr, dc, dirName } of dirs) {
    const nr = playerPos.r + dr;
    const nc = playerPos.c + dc;

    if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) continue;
    if (isEdgeBlocked(playerPos.r, playerPos.c, nr, nc, walls)) continue;

    // Jika kotak di sebelahnya ditempati oleh bidak lawan
    if (nr === opponentPos.r && nc === opponentPos.c) {
      const jumpR = nr + dr;
      const jumpC = nc + dc;

      // Cek apakah bisa melompat lurus melewati lawan
      if (
        jumpR >= 0 &&
        jumpR < BOARD_SIZE &&
        jumpC >= 0 &&
        jumpC < BOARD_SIZE &&
        !isEdgeBlocked(nr, nc, jumpR, jumpC, walls)
      ) {
        moves.push({ r: jumpR, c: jumpC, dirName, isJump: true });
      } else {
        // Jika di belakang lawan ada tembok atau tepi papan, boleh melompat serong (diagonal)
        const sideDirs: Array<{
          sdr: number;
          sdc: number;
          diagDir: MoveDirection;
        }> =
          dr !== 0
            ? [
                { sdr: 0, sdc: -1, diagDir: dr < 0 ? "UP_LEFT" : "DOWN_LEFT" },
                { sdr: 0, sdc: 1, diagDir: dr < 0 ? "UP_RIGHT" : "DOWN_RIGHT" },
              ]
            : [
                { sdr: -1, sdc: 0, diagDir: dc < 0 ? "UP_LEFT" : "UP_RIGHT" },
                { sdr: 1, sdc: 0, diagDir: dc < 0 ? "DOWN_LEFT" : "DOWN_RIGHT" },
              ];

        for (const { sdr, sdc, diagDir } of sideDirs) {
          const diagR = nr + sdr;
          const diagC = nc + sdc;
          if (
            diagR >= 0 &&
            diagR < BOARD_SIZE &&
            diagC >= 0 &&
            diagC < BOARD_SIZE &&
            !isEdgeBlocked(nr, nc, diagR, diagC, walls)
          ) {
            moves.push({ r: diagR, c: diagC, dirName: diagDir, isJump: true });
          }
        }
      }
    } else {
      moves.push({ r: nr, c: nc, dirName, isJump: false });
    }
  }

  return moves;
}

/**
 * Algoritma BFS (Breadth-First Search) untuk mencari jalur terpendek dari posisi (startPos)
 * menuju baris target (targetRow). Digunakan untuk validasi tembok & otak taktis Bot.
 */
function findShortestPath(
  startPos: PawnPosition,
  targetRow: number,
  walls: Wall[]
): Array<{ r: number; c: number }> | null {
  const queue: Array<{ r: number; c: number; path: Array<{ r: number; c: number }> }> = [
    { r: startPos.r, c: startPos.c, path: [] },
  ];
  const visited = Array.from({ length: BOARD_SIZE }, () =>
    Array(BOARD_SIZE).fill(false)
  );
  visited[startPos.r][startPos.c] = true;

  const dirs = [
    { dr: -1, dc: 0 },
    { dr: 1, dc: 0 },
    { dr: 0, dc: -1 },
    { dr: 0, dc: 1 },
  ];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (curr.r === targetRow) {
      return curr.path;
    }

    for (const { dr, dc } of dirs) {
      const nr = curr.r + dr;
      const nc = curr.c + dc;
      if (
        nr >= 0 &&
        nr < BOARD_SIZE &&
        nc >= 0 &&
        nc < BOARD_SIZE &&
        !visited[nr][nc] &&
        !isEdgeBlocked(curr.r, curr.c, nr, nc, walls)
      ) {
        visited[nr][nc] = true;
        queue.push({
          r: nr,
          c: nc,
          path: [...curr.path, { r: nr, c: nc }],
        });
      }
    }
  }

  return null;
}

/**
 * Mengecek apakah penempatan tembok baru di (r, c, orientation) sah:
 * 1. Tidak tumpang tindih atau berpotongan silang dengan tembok lain.
 * 2. Tidak menutup 100% jalur bagi Bidak Biru maupun Bidak Merah.
 */
function validateWallPlacement(
  r: number,
  c: number,
  orientation: WallOrientation,
  walls: Wall[],
  bluePos: PawnPosition,
  redPos: PawnPosition
): { valid: boolean; reason: string } {
  if (r < 0 || r >= BOARD_SIZE - 1 || c < 0 || c >= BOARD_SIZE - 1) {
    return { valid: false, reason: "Di luar batas papan." };
  }

  // Cek tabrakan atau persilangan titik tengah dengan tembok yang sudah ada
  for (const w of walls) {
    if (w.r === r && w.c === c) {
      return { valid: false, reason: "Bersinggungan dengan tembok lain." };
    }
    if (w.orientation === orientation) {
      if (orientation === "H" && w.r === r && Math.abs(w.c - c) === 1) {
        return { valid: false, reason: "Tembok bertumpukan." };
      }
      if (orientation === "V" && w.c === c && Math.abs(w.r - r) === 1) {
        return { valid: false, reason: "Tembok bertumpukan." };
      }
    }
  }

  // Simulasikan tembok terpasang dan cek BFS kedua pemain
  const nextWalls: Wall[] = [...walls, { r, c, orientation, owner: "BLUE" }];
  const bluePath = findShortestPath(bluePos, 0, nextWalls);
  if (!bluePath) {
    return {
      valid: false,
      reason: "Tidak boleh mengurung jalur Bidak Biru 100%!",
    };
  }

  const redPath = findShortestPath(redPos, BOARD_SIZE - 1, nextWalls);
  if (!redPath) {
    return {
      valid: false,
      reason: "Tidak boleh mengurung jalur Bidak Merah 100%!",
    };
  }

  return { valid: true, reason: "" };
}

// ==========================================
// KOMPONEN UTAMA BLOCK 'N RUN! (TEMA TERANG & 2D RAPI BUKAN MIRING)
// ==========================================
export default function BlockNRunClient() {
  // Mode Permainan
  const [mode, setMode] = useState<GameMode>("bot");
  const vsBot = mode === "bot";
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>("hard"); // 'normal' | 'hard'
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Online Multiplayer State
  const [onlineRole, setOnlineRole] = useState<OnlineRole>(null);
  const [onlineState, setOnlineState] = useState<OnlineState>("idle");
  const [roomCode, setRoomCode] = useState<string>("");
  const [joinRoomInput, setJoinRoomInput] = useState<string>("");
  const [onlineTab, setOnlineTab] = useState<"create" | "join">("create");
  const [isCopiedCode, setIsCopiedCode] = useState<boolean>(false);
  const [isCopiedLink, setIsCopiedLink] = useState<boolean>(false);
  const [toastData, setToastData] = useState<{
    msg: string;
    type: "success" | "warning" | "info";
  } | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Giliran Pertama & Acak Starter ("ganti2an / random")
  const [startingPlayer, setStartingPlayer] = useState<PlayerColor>("BLUE");
  const [randomStarter, setRandomStarter] = useState<boolean>(true);

  // State Posisi Bidak & Tembok
  const [bluePos, setBluePos] = useState<PawnPosition>(INITIAL_BLUE_POS);
  const [redPos, setRedPos] = useState<PawnPosition>(INITIAL_RED_POS);
  const [walls, setWalls] = useState<Wall[]>([]);
  const [blueWallsLeft, setBlueWallsLeft] = useState<number>(INITIAL_WALLS);
  const [redWallsLeft, setRedWallsLeft] = useState<number>(INITIAL_WALLS);

  // State Giliran & Aksi Interaktif
  const [turn, setTurn] = useState<PlayerColor>("BLUE");
  const [actionMode, setActionMode] = useState<ActionMode>("MOVE");
  const [wallOrientation, setWallOrientation] = useState<WallOrientation>("H");
  const [hoveredWall, setHoveredWall] = useState<{ r: number; c: number } | null>(null);
  const [warningMsg, setWarningMsg] = useState<string>("");
  const [winner, setWinner] = useState<PlayerColor | null>(null);

  // Toast Notifikasi (Selalu Tampil di Lapisan Terdepan & Cerdas Deteksi Icon Error/Info/Success)
  const showToast = useCallback(
    (msg: string, explicitType?: "success" | "warning" | "info") => {
      let resolvedType: "success" | "warning" | "info" = explicitType || "success";

      if (!explicitType) {
        const lower = msg.toLowerCase();
        if (
          lower.includes("gagal") ||
          lower.includes("terlebih dahulu") ||
          lower.includes("habis") ||
          lower.includes("tidak") ||
          lower.includes("salah") ||
          lower.includes("kurung") ||
          lower.includes("tumpang") ||
          lower.includes("bersinggungan") ||
          lower.includes("batas") ||
          lower.includes("meninggalkan") ||
          lower.includes("error")
        ) {
          resolvedType = "warning";
        } else if (
          lower.includes("keluar") ||
          lower.includes("mengajak") ||
          lower.includes("acak") ||
          lower.includes("selalu") ||
          lower.includes("permintaan")
        ) {
          resolvedType = "info";
        }
      }

      setToastData({ msg, type: resolvedType });
      setTimeout(() => {
        setToastData((cur) => (cur?.msg === msg ? null : cur));
      }, 3200);
    },
    []
  );

  // Salin ke Clipboard Helper
  const copyToClipboard = useCallback(
    (text: string, msg: string) => {
      if (typeof window !== "undefined" && navigator.clipboard) {
        navigator.clipboard.writeText(text);
        showToast(msg, "success");
      }
    },
    [showToast]
  );

  // Shareable URL untuk Online Mabar
  const shareableUrl = useMemo(() => {
    if (typeof window === "undefined" || !roomCode) return "";
    return `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
  }, [roomCode]);

  // Efek Suara
  const playSound = useCallback(
    (type: "move" | "wall" | "rotate" | "error" | "win") => {
      if (!soundEnabled) return;
      if (type === "move") playTone(480, "triangle", 0.08, 0.15);
      if (type === "wall") playTone(240, "sine", 0.12, 0.2);
      if (type === "rotate") playTone(640, "sine", 0.05, 0.1);
      if (type === "error") playTone(180, "sawtooth", 0.12, 0.12);
      if (type === "win") {
        const notes = [440, 554.37, 659.25, 880];
        notes.forEach((freq, idx) => {
          setTimeout(() => playTone(freq, "triangle", 0.22, 0.2), idx * 110);
        });
      }
    },
    [soundEnabled]
  );

  // Efek Confetti saat menang
  useEffect(() => {
    if (winner === "BLUE") {
      playSound("win");
      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.55 },
        });
      } catch {}
    } else if (winner === "RED") {
      if (!vsBot) {
        playSound("win");
        try {
          confetti({
            particleCount: 90,
            spread: 80,
            origin: { y: 0.55 },
          });
        } catch {}
      } else {
        playSound("error");
      }
    }
  }, [winner, vsBot, playSound]);

  // Hitung langkah valid untuk pemain yang sedang aktif
  const activeValidMoves = useMemo(() => {
    if (winner) return [];
    if (mode === "bot" && turn === "RED") return [];
    if (mode === "online" && onlineRole !== turn) return [];
    const currentPos = turn === "BLUE" ? bluePos : redPos;
    const oppPos = turn === "BLUE" ? redPos : bluePos;
    return getValidPawnMoves(currentPos, oppPos, walls);
  }, [turn, bluePos, redPos, walls, winner, mode, onlineRole]);

  // Hitung jarak terpendek masing-masing pemain
  const pathStats = useMemo(() => {
    const bPath = findShortestPath(bluePos, 0, walls);
    const rPath = findShortestPath(redPos, BOARD_SIZE - 1, walls);
    return {
      blueSteps: bPath ? bPath.length : 0,
      redSteps: rPath ? rPath.length : 0,
    };
  }, [bluePos, redPos, walls]);

  // Fungsi Reset Permainan (Bisa acak starter atau bergantian)
  const resetGame = useCallback(
    (forcedStarter?: PlayerColor) => {
      let nextStarter: PlayerColor;
      if (forcedStarter) {
        nextStarter = forcedStarter;
      } else if (randomStarter) {
        nextStarter = Math.random() < 0.5 ? "BLUE" : "RED";
      } else {
        nextStarter = "BLUE";
      }
      setStartingPlayer(nextStarter);
      setTurn(nextStarter);
      setBluePos(INITIAL_BLUE_POS);
      setRedPos(INITIAL_RED_POS);
      setWalls([]);
      setBlueWallsLeft(INITIAL_WALLS);
      setRedWallsLeft(INITIAL_WALLS);
      setActionMode("MOVE");
      setHoveredWall(null);
      setWarningMsg("");
      setWinner(null);
      playSound("move");
    },
    [randomStarter, playSound]
  );

  // ==========================================
  // LOGIKA ONLINE MULTIPLAYER (REAL-TIME BROADCAST)
  // ==========================================

  // Keluar dari Room Online
  const leaveOnlineRoom = useCallback(() => {
    if (channel) {
      try {
        channel.send({
          type: "broadcast",
          event: "game_event",
          payload: { type: "player_left" },
        });
        const supabase = createClient();
        supabase.removeChannel(channel);
      } catch {}
      setChannel(null);
    }
    setOnlineRole(null);
    setOnlineState("idle");
    setRoomCode("");
    resetGame("BLUE");
    showToast("Keluar dari room online.", "info");
  }, [channel, resetGame, showToast]);

  // Handle Event Sinkronisasi Realtime
  const handleRemoteGameEvent = useCallback(
    (payload: RemoteBroadcastPayload, myRole: "BLUE" | "RED", activeChannel?: RealtimeChannel | null) => {
      if (!payload || !payload.type) return;

      const ch = activeChannel || channel;

      // 1. Guest bergabung (diterima oleh Host / BLUE)
      if (payload.type === "guest_joined" && myRole === "BLUE") {
        setOnlineState("connected");
        playSound("win");
        showToast("Lawan bergabung! Pertandingan dimulai.", "success");

        // Host tentukan giliran pertama (acak / adil)
        const starter: PlayerColor = randomStarter
          ? Math.random() < 0.5
            ? "BLUE"
            : "RED"
          : "BLUE";
        setStartingPlayer(starter);
        setTurn(starter);
        setBluePos(INITIAL_BLUE_POS);
        setRedPos(INITIAL_RED_POS);
        setWalls([]);
        setBlueWallsLeft(INITIAL_WALLS);
        setRedWallsLeft(INITIAL_WALLS);
        setWinner(null);

        // Host kirim status awal ke Guest
        ch?.send({
          type: "broadcast",
          event: "game_event",
          payload: {
            type: "host_sync",
            startingPlayer: starter,
            blueWallsLeft: INITIAL_WALLS,
            redWallsLeft: INITIAL_WALLS,
          },
        });
      }

      // 2. Host sync back (diterima oleh Guest / RED)
      if (payload.type === "host_sync" && myRole === "RED") {
        const starter: PlayerColor = payload.startingPlayer || "BLUE";
        setStartingPlayer(starter);
        setTurn(starter);
        setBluePos(INITIAL_BLUE_POS);
        setRedPos(INITIAL_RED_POS);
        setWalls([]);
        setBlueWallsLeft(payload.blueWallsLeft ?? INITIAL_WALLS);
        setRedWallsLeft(payload.redWallsLeft ?? INITIAL_WALLS);
        setWinner(null);
        setOnlineState("connected");
        playSound("win");
        showToast(
          `Terhubung dengan Host! ${
            starter === "RED" ? "Kamu (Merah)" : "Lawan (Biru)"
          } jalan duluan.`,
          "success"
        );
      }

      // 3. Langkah Bidak Lawan
      if (
        payload.type === "pawn_move" &&
        typeof payload.targetR === "number" &&
        typeof payload.targetC === "number"
      ) {
        const { player, targetR, targetC } = payload;
        playSound("move");
        if (player === "BLUE") {
          setBluePos({ r: targetR, c: targetC });
          if (targetR === 0) {
            setWinner("BLUE");
            return;
          }
          setTurn("RED");
        } else if (player === "RED") {
          setRedPos({ r: targetR, c: targetC });
          if (targetR === BOARD_SIZE - 1) {
            setWinner("RED");
            return;
          }
          setTurn("BLUE");
        }
      }

      // 4. Pemasangan Tembok Lawan
      if (
        payload.type === "place_wall" &&
        typeof payload.r === "number" &&
        typeof payload.c === "number" &&
        payload.orientation &&
        payload.player
      ) {
        const { player, r, c, orientation } = payload;
        playSound("wall");
        setWalls((prev) => [...prev, { r, c, orientation, owner: player }]);
        if (player === "BLUE") {
          setBlueWallsLeft((prev) => prev - 1);
          setTurn("RED");
        } else if (player === "RED") {
          setRedWallsLeft((prev) => prev - 1);
          setTurn("BLUE");
        }
      }

      // 5. Permintaan Main Lagi (Rematch)
      if (payload.type === "rematch") {
        const nextStarter: PlayerColor =
          payload.nextStarter || (startingPlayer === "BLUE" ? "RED" : "BLUE");
        setStartingPlayer(nextStarter);
        setTurn(nextStarter);
        setBluePos(INITIAL_BLUE_POS);
        setRedPos(INITIAL_RED_POS);
        setWalls([]);
        setBlueWallsLeft(INITIAL_WALLS);
        setRedWallsLeft(INITIAL_WALLS);
        setWinner(null);
        playSound("move");
        showToast(
          `Lawan mengajak main lagi! Giliran ${
            nextStarter === myRole ? "Kamu" : "Lawan"
          } jalan duluan.`,
          "info"
        );
      }

      // 6. Lawan Meninggalkan Room
      if (payload.type === "player_left") {
        setOnlineState("opponent_left");
        showToast("Lawan telah meninggalkan room.", "warning");
      }
    },
    [channel, randomStarter, startingPlayer, playSound, showToast]
  );

  // Host: Buat Room Baru
  const handleCreateRoom = useCallback(() => {
    const code = generateRoomCode();
    setRoomCode(code);
    setOnlineRole("BLUE"); // Host selalu Bidak Biru (start bawah)
    setOnlineState("waiting");
    resetGame("BLUE");

    try {
      const supabase = createClient();
      const newChannel = supabase.channel(`blocknrun_${code}`, {
        config: { broadcast: { self: false } },
      });

      newChannel
        .on("broadcast", { event: "game_event" }, ({ payload }) => {
          handleRemoteGameEvent(payload, "BLUE", newChannel);
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            playSound("move");
            showToast(`Room ${code} siap! Bagikan kode atau link ke teman.`, "success");
          }
        });

      setChannel(newChannel);
    } catch {
      playSound("error");
      showToast("Gagal membuat room. Periksa koneksi internet.", "warning");
    }
  }, [resetGame, handleRemoteGameEvent, playSound, showToast]);

  // Guest: Gabung ke Room
  const handleJoinRoom = useCallback(
    (targetCode?: string) => {
      const raw = (targetCode || joinRoomInput).trim().toUpperCase();
      if (!raw) {
        playSound("error");
        showToast("Masukkan kode room terlebih dahulu!", "warning");
        return;
      }
      const cleanCode = raw.startsWith("BNR-") ? raw : `BNR-${raw}`;
      setRoomCode(cleanCode);
      setOnlineRole("RED"); // Guest selalu Bidak Merah (start atas)
      setOnlineState("joining");
      resetGame("BLUE");

      try {
        const supabase = createClient();
        const newChannel = supabase.channel(`blocknrun_${cleanCode}`, {
          config: { broadcast: { self: false } },
        });

        newChannel
          .on("broadcast", { event: "game_event" }, ({ payload }) => {
            handleRemoteGameEvent(payload, "RED", newChannel);
          })
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              setTimeout(() => {
                newChannel.send({
                  type: "broadcast",
                  event: "game_event",
                  payload: { type: "guest_joined" },
                });
              }, 450);
            }
          });

        setChannel(newChannel);
      } catch {
        playSound("error");
        showToast("Gagal bergabung ke room. Periksa kode room.", "warning");
      }
    },
    [joinRoomInput, resetGame, handleRemoteGameEvent, playSound, showToast]
  );

  // Rematch di Online Mode
  const handleRematchOnline = useCallback(() => {
    if (!onlineRole) return;
    const nextStarter: PlayerColor = startingPlayer === "BLUE" ? "RED" : "BLUE";
    setStartingPlayer(nextStarter);
    setTurn(nextStarter);
    setBluePos(INITIAL_BLUE_POS);
    setRedPos(INITIAL_RED_POS);
    setWalls([]);
    setBlueWallsLeft(INITIAL_WALLS);
    setRedWallsLeft(INITIAL_WALLS);
    setWinner(null);
    playSound("move");

    channel?.send({
      type: "broadcast",
      event: "game_event",
      payload: {
        type: "rematch",
        nextStarter,
      },
    });

    showToast(
      `Permintaan main lagi dikirim! Giliran ${
        nextStarter === onlineRole ? "Kamu" : "Lawan"
      } jalan duluan.`,
      "info"
    );
  }, [channel, onlineRole, startingPlayer, playSound, showToast]);

  // Switch Mode Handler
  const handleSwitchMode = (newMode: GameMode) => {
    if (mode === "online" && newMode !== "online") {
      leaveOnlineRoom();
    }
    setMode(newMode);
    resetGame();
  };

  // Auto-detect room di URL parameter (?room=BNR-XXXX atau ?code=BNR-XXXX)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get("room") || params.get("code");
      if (roomParam) {
        const code = roomParam.trim().toUpperCase();
        setTimeout(() => {
          setMode("online");
          setJoinRoomInput(code);
          setOnlineTab("join");
        }, 0);
      }
    }
  }, []);

  // Unmount cleanup Supabase channel
  useEffect(() => {
    return () => {
      if (channel) {
        try {
          const supabase = createClient();
          supabase.removeChannel(channel);
        } catch {}
      }
    };
  }, [channel]);

  // Shortcut Keyboard ('R' atau Spasi untuk putar tembok, 'W' untuk toggle mode tembok)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (winner) return;
      if (mode === "online" && onlineRole !== turn) return;
      if (e.key === "r" || e.key === "R" || e.key === " ") {
        if (actionMode === "WALL") {
          e.preventDefault();
          setWallOrientation((prev) => {
            const next = prev === "H" ? "V" : "H";
            playSound("rotate");
            return next;
          });
        }
      } else if (e.key === "w" || e.key === "W") {
        const wallsRemaining = turn === "BLUE" ? blueWallsLeft : redWallsLeft;
        if (wallsRemaining > 0) {
          setActionMode((prev) => {
            const next = prev === "MOVE" ? "WALL" : "MOVE";
            playSound("rotate");
            return next;
          });
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [actionMode, winner, turn, blueWallsLeft, redWallsLeft, playSound, mode, onlineRole]);

  // Hilangkan pesan peringatan otomatis setelah 2.8 detik
  useEffect(() => {
    if (!warningMsg) return;
    const t = setTimeout(() => setWarningMsg(""), 2800);
    return () => clearTimeout(t);
  }, [warningMsg]);

  // Eksekusi Langkah Bidak Pemain
  const handleMovePawn = (targetR: number, targetC: number) => {
    if (winner) return;
    if (mode === "bot" && turn === "RED") return;
    if (mode === "online" && onlineRole !== turn) return;
    if (actionMode !== "MOVE") {
      setActionMode("MOVE");
    }

    const isValid = activeValidMoves.some(
      (m) => m.r === targetR && m.c === targetC
    );
    if (!isValid) return;

    playSound("move");

    // Sinkronisasi ke Lawan jika sedang Online Mabar
    if (mode === "online" && channel && onlineState === "connected") {
      channel.send({
        type: "broadcast",
        event: "game_event",
        payload: {
          type: "pawn_move",
          player: turn,
          targetR,
          targetC,
        },
      });
    }

    if (turn === "BLUE") {
      setBluePos({ r: targetR, c: targetC });
      if (targetR === 0) {
        setWinner("BLUE");
        return;
      }
      setTurn("RED");
    } else {
      setRedPos({ r: targetR, c: targetC });
      if (targetR === BOARD_SIZE - 1) {
        setWinner("RED");
        return;
      }
      setTurn("BLUE");
    }
    setActionMode("MOVE");
    setWarningMsg("");
  };

  // Eksekusi Pemasangan Tembok Pemain
  const handlePlaceWall = (r: number, c: number) => {
    if (winner) return;
    if (mode === "bot" && turn === "RED") return;
    if (mode === "online" && onlineRole !== turn) return;
    if (actionMode !== "WALL") return;

    const currentWallsLeft = turn === "BLUE" ? blueWallsLeft : redWallsLeft;
    if (currentWallsLeft <= 0) {
      setWarningMsg("Tembokmu sudah habis!");
      showToast("Tembokmu sudah habis!", "warning");
      playSound("error");
      setActionMode("MOVE");
      return;
    }

    const check = validateWallPlacement(
      r,
      c,
      wallOrientation,
      walls,
      bluePos,
      redPos
    );
    if (!check.valid) {
      setWarningMsg(check.reason);
      showToast(check.reason, "warning");
      playSound("error");
      return;
    }

    playSound("wall");
    const newWall: Wall = { r, c, orientation: wallOrientation, owner: turn };
    setWalls((prev) => [...prev, newWall]);

    // Sinkronisasi Tembok ke Lawan jika sedang Online Mabar
    if (mode === "online" && channel && onlineState === "connected") {
      channel.send({
        type: "broadcast",
        event: "game_event",
        payload: {
          type: "place_wall",
          player: turn,
          r,
          c,
          orientation: wallOrientation,
        },
      });
    }

    if (turn === "BLUE") {
      setBlueWallsLeft((prev) => prev - 1);
      setTurn("RED");
    } else {
      setRedWallsLeft((prev) => prev - 1);
      setTurn("BLUE");
    }

    setHoveredWall(null);
    setActionMode("MOVE");
    setWarningMsg("");
  };

  // ==========================================
  // LOGIKA KECERDASAN BUATAN (BOT TACTICAL BFS)
  // ==========================================
  useEffect(() => {
    if (!vsBot || turn !== "RED" || winner) return;

    const timer = setTimeout(() => {
      const botMoves = getValidPawnMoves(redPos, bluePos, walls);
      const currentBluePath = findShortestPath(bluePos, 0, walls) || [];
      const currentRedPath =
        findShortestPath(redPos, BOARD_SIZE - 1, walls) || [];

      // Cek kemenangan instan Bot
      const winningMove = botMoves.find((m) => m.r === BOARD_SIZE - 1);
      if (winningMove) {
        playSound("move");
        setRedPos({ r: winningMove.r, c: winningMove.c });
        setWinner("RED");
        return;
      }

      // Evaluasi apakah Bot memasang tembok
      let bestWallCandidate: { r: number; c: number; orientation: WallOrientation } | null = null;
      let bestWallScore = -999;

      if (redWallsLeft > 0) {
        for (let r = 0; r < BOARD_SIZE - 1; r++) {
          for (let c = 0; c < BOARD_SIZE - 1; c++) {
            for (const orient of ["H", "V"] as WallOrientation[]) {
              const isNearBlue =
                Math.abs(r - bluePos.r) <= 2 && Math.abs(c - bluePos.c) <= 2;
              const isOnBluePath = currentBluePath.some(
                (step) => Math.abs(step.r - r) <= 1 && Math.abs(step.c - c) <= 1
              );
              if (!isNearBlue && !isOnBluePath) continue;

              const check = validateWallPlacement(
                r,
                c,
                orient,
                walls,
                bluePos,
                redPos
              );
              if (!check.valid) continue;

              const simulatedWalls: Wall[] = [
                ...walls,
                { r, c, orientation: orient, owner: "RED" },
              ];
              const newBluePath = findShortestPath(
                bluePos,
                0,
                simulatedWalls
              );
              const newRedPath = findShortestPath(
                redPos,
                BOARD_SIZE - 1,
                simulatedWalls
              );

              if (newBluePath && newRedPath) {
                const blueDelay = newBluePath.length - currentBluePath.length;
                const redDelay = newRedPath.length - currentRedPath.length;
                const netGain = blueDelay - redDelay;

                if (netGain > 0 && netGain > bestWallScore) {
                  bestWallScore = netGain;
                  bestWallCandidate = { r, c, orientation: orient };
                }
              }
            }
          }
        }
      }

      const blueIsThreatening =
        currentBluePath.length <= currentRedPath.length ||
        currentBluePath.length <= 3;
      const minGainThreshold = botDifficulty === "hard" ? 1 : 2;

      const shouldPlaceWall =
        bestWallCandidate &&
        ((blueIsThreatening && bestWallScore >= minGainThreshold) ||
          bestWallScore >= 3);

      if (shouldPlaceWall && bestWallCandidate) {
        playSound("wall");
        setWalls((prev) => [
          ...prev,
          { ...bestWallCandidate!, owner: "RED" },
        ]);
        setRedWallsLeft((prev) => prev - 1);
        setTurn("BLUE");
        return;
      }

      // Langkah bidak optimal
      let chosenMove = botMoves[0];
      let shortestAfterMove = 999;

      for (const mv of botMoves) {
        const pathFromMove = findShortestPath(
          { r: mv.r, c: mv.c },
          BOARD_SIZE - 1,
          walls
        );
        const dist = pathFromMove ? pathFromMove.length : 999;
        if (
          dist < shortestAfterMove ||
          (dist === shortestAfterMove && botDifficulty === "normal" && Math.random() < 0.4)
        ) {
          shortestAfterMove = dist;
          chosenMove = mv;
        }
      }

      if (chosenMove) {
        playSound("move");
        setRedPos({ r: chosenMove.r, c: chosenMove.c });
        if (chosenMove.r === BOARD_SIZE - 1) {
          setWinner("RED");
          return;
        }
      }
      setTurn("BLUE");
    }, 550);

    return () => clearTimeout(timer);
  }, [vsBot, turn, winner, redPos, bluePos, walls, redWallsLeft, botDifficulty, playSound]);


  // Preview tembok hover
  const hoverWallValidation = useMemo(() => {
    if (!hoveredWall || actionMode !== "WALL") return null;
    return validateWallPlacement(
      hoveredWall.r,
      hoveredWall.c,
      wallOrientation,
      walls,
      bluePos,
      redPos
    );
  }, [hoveredWall, actionMode, wallOrientation, walls, bluePos, redPos]);

  return (
    <div
      className="min-h-screen w-full bg-background text-slate-800 dark:text-slate-100 flex flex-col justify-between select-none overflow-x-hidden relative pt-16 sm:pt-20 md:pt-24 pb-24 sm:pb-8 transition-colors"
      style={{
        fontFamily: "'Plus Jakarta Sans', 'Outfit', system-ui, sans-serif",
      }}
    >
      {/* Background Ambience Terang */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[520px] pointer-events-none overflow-hidden z-0">
        <div className="absolute top-6 left-1/4 w-96 h-96 bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-16 right-1/4 w-96 h-96 bg-amber-500/8 dark:bg-amber-500/15 rounded-full blur-3xl" />
      </div>

      {/* ==========================================
          STYLE PAPAN KAYU 2D RAPI (BUKAN MIRING)
         ========================================== */}
      <style jsx global>{`
        .title-3d {
          color: #d97706;
          background: linear-gradient(180deg, #f59e0b 0%, #d97706 60%, #b45309 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0px 2px 0px #78350f) drop-shadow(0px 4px 10px rgba(180, 83, 9, 0.25));
          letter-spacing: 0.04em;
        }

        /* Papan Kayu 2D Bersih, Simetris, Tegak (Bukan Miring) */
        .wood-board-2d {
          background: linear-gradient(135deg, #c6864e 0%, #a46431 50%, #8a4f22 100%);
          border: 6px solid #deb07c;
          border-radius: 24px;
          box-shadow: 
            0 14px 28px -6px rgba(138, 79, 34, 0.25),
            0 4px 14px rgba(0, 0, 0, 0.08);
        }

        .dark .wood-board-2d {
          background: linear-gradient(135deg, #9a5a2a 0%, #7d441c 50%, #603212 100%);
          border: 6px solid #b87a48;
          box-shadow: 
            0 14px 28px -6px rgba(0, 0, 0, 0.5),
            0 4px 14px rgba(0, 0, 0, 0.25);
        }

        /* Kotak Petak Kayu 2D Rapi */
        .wood-tile-2d {
          background: 
            repeating-linear-gradient(
              -32deg,
              rgba(138, 79, 34, 0.06) 0px,
              rgba(138, 79, 34, 0.06) 5px,
              transparent 5px,
              transparent 11px
            ),
            linear-gradient(145deg, #f1c798 0%, #dea870 55%, #cb8c4e 100%);
          box-shadow: 
            inset 1px 1px 2px rgba(255, 255, 255, 0.65),
            0 2px 4px rgba(100, 50, 10, 0.18);
          border-radius: 12px;
          transition: transform 0.12s ease, box-shadow 0.12s ease, filter 0.12s ease;
        }

        .dark .wood-tile-2d {
          background: 
            repeating-linear-gradient(
              -32deg,
              rgba(0, 0, 0, 0.1) 0px,
              rgba(0, 0, 0, 0.1) 5px,
              transparent 5px,
              transparent 11px
            ),
            linear-gradient(145deg, #bf8149 0%, #a46833 55%, #884e20 100%);
          box-shadow: 
            inset 1px 1px 2px rgba(255, 255, 255, 0.25),
            0 2px 4px rgba(0, 0, 0, 0.35);
        }

        /* Kotak Langkah Valid Hijau */
        .wood-tile-valid-2d {
          background: linear-gradient(145deg, #86efac 0%, #4ade80 50%, #22c55e 100%);
          box-shadow: 
            0 0 16px rgba(34, 197, 94, 0.6),
            inset 0 0 4px rgba(255, 255, 255, 0.85);
          border-radius: 12px;
          cursor: pointer;
        }

        .wood-tile-valid-2d:hover {
          transform: scale(1.05);
          filter: brightness(1.07);
        }

        /* Tembok Oranye Tegak Lurus 2D */
        .wall-flat-orange {
          background: linear-gradient(180deg, #fb923c 0%, #f97316 45%, #c2410c 100%);
          border: 1.5px solid #ffedd5;
          box-shadow: 0 3px 8px rgba(194, 65, 12, 0.45);
        }

        /* Tray HUD Bawah */
        .hud-tray-light {
          background: #ffffff;
          border: 2px solid #e2e8f0;
          box-shadow: 
            0 6px 0 #cbd5e1,
            0 10px 20px rgba(0, 0, 0, 0.08),
            inset 0 1px 1px rgba(255, 255, 255, 0.8);
        }
        .dark .hud-tray-light {
          background: #1e2433;
          border: 2px solid #334155;
          box-shadow: 
            0 6px 0 #0f172a,
            0 10px 20px rgba(0, 0, 0, 0.5),
            inset 0 1px 1px rgba(255, 255, 255, 0.08);
        }

        .btn-blue-3d {
          background: linear-gradient(180deg, #0284c7 0%, #0369a1 100%);
          border: 2px solid #7dd3fc;
          box-shadow: 
            0 5px 0 #075985,
            0 8px 16px rgba(2, 132, 199, 0.35),
            inset 0 2px 2px rgba(255, 255, 255, 0.45);
          transition: transform 0.1s ease, box-shadow 0.1s ease;
        }

        .btn-blue-3d:active {
          transform: translateY(3px);
          box-shadow: 0 2px 0 #075985;
        }

        .btn-amber-3d {
          background: linear-gradient(180deg, #fb923c 0%, #ea580c 100%);
          border: 2px solid #fed7aa;
          box-shadow: 
            0 5px 0 #9a3412,
            0 8px 16px rgba(234, 88, 12, 0.35),
            inset 0 2px 2px rgba(255, 255, 255, 0.45);
          transition: transform 0.1s ease, box-shadow 0.1s ease;
        }

        .btn-amber-3d:active {
          transform: translateY(3px);
          box-shadow: 0 2px 0 #9a3412;
        }
      `}</style>


      {/* ==========================================
          1. HEADER KHUSUS MOBILE (< md)
          Kompak, rapi, hemat ruang vertikal
         ========================================== */}
      <div className="flex md:hidden flex-col gap-2 w-full max-w-md mx-auto px-3 z-30 pb-1">
        {/* Mobile Baris 1: Back | Judul | Suara + Reset */}
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/tools"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-xs shrink-0"
          >
            <FiArrowLeft className="w-3.5 h-3.5 text-slate-500" />
            <span>Tools</span>
          </Link>

          <div className="flex items-center gap-1.5 min-w-0">
            <h1 className="text-lg xs:text-xl font-black title-3d tracking-tight whitespace-nowrap">
              BLOCK &apos;N RUN!
            </h1>
            <button
              onClick={() => setShowRulesModal(true)}
              className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer shrink-0"
              title="Aturan Main (5 Detik Paham)"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setSoundEnabled((prev) => !prev)}
              type="button"
              title={soundEnabled ? "Matikan Suara" : "Aktifkan Suara"}
              className="p-1.5 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition shadow-xs cursor-pointer"
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-primary" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
            <button
              onClick={() => resetGame()}
              className="p-1.5 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-primary transition shadow-xs cursor-pointer"
              title="Reset Permainan"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mobile Baris 2: Mode Pill + Turn Status (1 baris proporsional!) */}
        <div className="flex items-center justify-between gap-1.5 bg-white/90 dark:bg-slate-800/90 px-2 py-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          {/* Mode BOT / 2P / ONLINE */}
          <div className="inline-flex items-center gap-0.5 bg-slate-100 dark:bg-slate-900 rounded-lg p-0.5 text-[11px] font-bold">
            <button
              onClick={() => handleSwitchMode("bot")}
              className={`px-1.5 py-0.5 rounded-md transition cursor-pointer flex items-center gap-0.5 ${
                mode === "bot"
                  ? "bg-slate-900 text-white shadow-xs font-extrabold"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
              }`}
            >
              <Bot className="w-3 h-3 text-emerald-400" />
              <span>BOT</span>
            </button>
            <button
              onClick={() => handleSwitchMode("pvp")}
              className={`px-1.5 py-0.5 rounded-md transition cursor-pointer flex items-center gap-0.5 ${
                mode === "pvp"
                  ? "bg-slate-900 text-white shadow-xs font-extrabold"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
              }`}
            >
              <Users className="w-3 h-3 text-sky-500" />
              <span>2P</span>
            </button>
            <button
              onClick={() => handleSwitchMode("online")}
              className={`px-1.5 py-0.5 rounded-md transition cursor-pointer flex items-center gap-0.5 ${
                mode === "online"
                  ? "bg-[#1b4086] text-white shadow-xs font-extrabold"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
              }`}
            >
              <FiGlobe className="w-3 h-3 text-amber-400" />
              <span>ONLINE</span>
            </button>

            {mode === "bot" && (
              <button
                onClick={() =>
                  setBotDifficulty((d) => (d === "normal" ? "hard" : "normal"))
                }
                className="ml-0.5 px-1 py-0.5 rounded-md transition text-[10px] font-extrabold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                title="Ganti Kesulitan Bot"
              >
                {botDifficulty === "normal" ? "Normal" : "Taktis"}
              </button>
            )}

            {mode !== "online" && (
              <button
                onClick={() => {
                  setRandomStarter((r) => !r);
                  showToast(
                    randomStarter
                      ? "Giliran awal: Biru selalu duluan"
                      : "Giliran awal: Diacak otomatis",
                    "info"
                  );
                }}
                className={`ml-0.5 px-1 py-0.5 rounded-md transition text-[10px] font-extrabold flex items-center gap-0.5 border cursor-pointer ${
                  randomStarter
                    ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700"
                }`}
                title="Toggle Giliran Awal Acak"
              >
                <FiShuffle className="w-2.5 h-2.5" />
                <span>{randomStarter ? "Acak" : "Biru"}</span>
              </button>
            )}
          </div>

          {/* Turn Badge Compact */}
          <div
            className={`px-2.5 py-0.5 rounded-lg font-black text-[11px] tracking-wider uppercase transition-all shadow-xs ${
              turn === "BLUE"
                ? "bg-emerald-500 text-white shadow-[0_0_8px_rgba(16,185,129,0.35)]"
                : "bg-rose-500 text-white shadow-[0_0_8px_rgba(244,63,94,0.35)]"
            }`}
          >
            {winner
              ? winner === "BLUE"
                ? mode === "online"
                  ? onlineRole === "BLUE"
                    ? "MENANG!"
                    : "LAWAN MENANG!"
                  : "BIRU MENANG!"
                : mode === "online"
                ? onlineRole === "RED"
                  ? "MENANG!"
                  : "LAWAN MENANG!"
                : "MERAH MENANG!"
              : mode === "online"
              ? turn === onlineRole
                ? "GILIRAN KAMU"
                : "GILIRAN LAWAN"
              : turn === "BLUE"
              ? "GILIRAN BIRU"
              : vsBot
              ? "BOT..."
              : "GILIRAN MERAH"}
          </div>
        </div>

        {/* Mobile Baris 3: Step Counter & Room Status Minimalis */}
        <div className="flex items-center justify-center min-h-[20px]">
          {warningMsg ? (
            <div className="flex items-center gap-1 text-[11px] font-bold text-rose-500 animate-pulse">
              <AlertCircle className="w-3 h-3 inline shrink-0" />
              <span>{warningMsg}</span>
            </div>
          ) : mode === "online" && onlineState === "connected" ? (
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span>
                Room: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{roomCode}</strong>
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span>
                {turn === onlineRole ? (
                  <strong className="text-emerald-600 dark:text-emerald-400">Giliranmu Melangkah</strong>
                ) : (
                  <span>Menunggu giliran lawan...</span>
                )}
              </span>
            </div>
          ) : (
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                <span>Biru: <strong className="text-blue-600 dark:text-sky-400">{pathStats.blueSteps}</strong> langkah</span>
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                <span>Merah: <strong className="text-rose-600 dark:text-rose-400">{pathStats.redSteps}</strong> langkah</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ==========================================
          2. HEADER KHUSUS DESKTOP (>= md)
          Luas, megah, seimbang seperti tampilan awal
         ========================================== */}
      <div className="hidden md:flex flex-col w-full z-20">
        {/* Top Nav Bar Desktop */}
        <div className="w-full max-w-6xl mx-auto px-4 pb-2 flex items-center justify-between gap-3">
          <Link
            href="/tools"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold shadow-xs hover:shadow-sm transition-all"
          >
            <FiArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Semua Tools & Games</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 text-xs font-bold shadow-xs">
              <IoGameController className="w-3.5 h-3.5" />
              <span>Mini Game Taktik</span>
            </div>

            <button
              onClick={() => setSoundEnabled((prev) => !prev)}
              type="button"
              title={soundEnabled ? "Matikan Efek Suara" : "Aktifkan Efek Suara"}
              className="p-2 rounded-xl bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition shadow-xs cursor-pointer"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-primary" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
            </button>
          </div>
        </div>

        {/* Main Header Row Desktop */}
        <header className="w-full max-w-6xl mx-auto px-4 pt-1 pb-2 flex items-center justify-between gap-4">
          {/* Kiri Atas: Judul 3D & Switch Mode */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl lg:text-5xl font-black tracking-wider title-3d">
                BLOCK &apos;N RUN!
              </h1>
              <button
                onClick={() => setShowRulesModal(true)}
                className="p-2 rounded-full bg-white/90 dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer shadow-xs"
                title="Aturan Main (5 Detik Paham)"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Pill Toggle VS BOT / 2P / ONLINE */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="inline-flex items-center bg-white/95 dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 rounded-full p-1 shadow-sm">
                <button
                  onClick={() => handleSwitchMode("bot")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-extrabold tracking-wide transition cursor-pointer ${
                    mode === "bot"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  <Bot className="w-3.5 h-3.5 text-emerald-400" />
                  <span>VS BOT</span>
                </button>

                <button
                  onClick={() => handleSwitchMode("pvp")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-extrabold tracking-wide transition cursor-pointer ${
                    mode === "pvp"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-sky-500" />
                  <span>2P LOKAL</span>
                </button>

                <button
                  onClick={() => handleSwitchMode("online")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-extrabold tracking-wide transition cursor-pointer ${
                    mode === "online"
                      ? "bg-[#1b4086] text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  <FiGlobe className="w-3.5 h-3.5 text-amber-400" />
                  <span>ONLINE MABAR</span>
                </button>
              </div>

              {/* Pilihan Kesulitan Bot */}
              {mode === "bot" && (
                <div className="inline-flex items-center bg-white/95 dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 rounded-full p-1 text-xs font-bold shadow-sm">
                  <button
                    onClick={() => setBotDifficulty("normal")}
                    className={`px-2.5 py-1 rounded-full transition cursor-pointer ${
                      botDifficulty === "normal"
                        ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    }`}
                  >
                    Bot Normal
                  </button>
                  <button
                    onClick={() => setBotDifficulty("hard")}
                    className={`px-2.5 py-1 rounded-full transition cursor-pointer ${
                      botDifficulty === "hard"
                        ? "bg-orange-500/20 text-orange-700 dark:text-orange-300 border border-orange-500/30"
                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    }`}
                  >
                    Bot Taktis (Hard)
                  </button>
                </div>
              )}

              {/* Toggle Giliran Mulai Acak */}
              {mode !== "online" && (
                <button
                  onClick={() => {
                    setRandomStarter((r) => !r);
                    showToast(
                      randomStarter
                        ? "Giliran pertama: Biru selalu jalan duluan"
                        : "Giliran pertama: Diacak otomatis",
                      "info"
                    );
                  }}
                  className={`px-2.5 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 border cursor-pointer ${
                    randomStarter
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
                      : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500"
                  }`}
                  title="Toggle Giliran Pertama Acak / Adil"
                >
                  <FiShuffle className="w-3 h-3" />
                  <span>Mulai: {randomStarter ? "Acak" : "Biru"}</span>
                </button>
              )}

              {/* Online Room Info Pill saat Connected */}
              {mode === "online" && onlineState === "connected" && (
                <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-black shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>ROOM: {roomCode}</span>
                  <button
                    onClick={() => {
                      copyToClipboard(shareableUrl, "Link room disalin!");
                      setIsCopiedLink(true);
                      setTimeout(() => setIsCopiedLink(false), 2000);
                    }}
                    className="hover:text-primary transition cursor-pointer"
                    title="Salin Link Room"
                  >
                    {isCopiedLink ? (
                      <FiCheck className="w-3.5 h-3.5 text-emerald-600 inline" />
                    ) : (
                      <FiCopy className="w-3.5 h-3.5 inline" />
                    )}
                  </button>
                  <button
                    onClick={leaveOnlineRoom}
                    className="ml-1 text-rose-500 hover:text-rose-700 transition cursor-pointer"
                    title="Keluar Room"
                  >
                    <FiLogOut className="w-3.5 h-3.5 inline" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Kanan Atas: Reset Game & Indikator Giliran */}
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={() => resetGame()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm transition cursor-pointer"
              title="Ulangi Permainan"
            >
              <RotateCcw className="w-3.5 h-3.5 text-primary" />
              <span>Reset</span>
            </button>

            {/* Badge YOUR TURN Desktop */}
            <div className="relative flex items-center mt-1">
              <div
                className={`px-5 py-1.5 rounded-full font-black text-sm tracking-wider uppercase border-2 transition-all ${
                  turn === "BLUE"
                    ? "bg-emerald-500 text-white border-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                    : "bg-rose-500 text-white border-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.5)]"
                }`}
              >
                {winner
                  ? winner === "BLUE"
                    ? mode === "online"
                      ? onlineRole === "BLUE"
                        ? "YOU WIN!"
                        : "OPPONENT WINS!"
                      : "BLUE WINS!"
                    : mode === "online"
                    ? onlineRole === "RED"
                      ? "YOU WIN!"
                      : "OPPONENT WINS!"
                    : "RED WINS!"
                  : mode === "online"
                  ? turn === onlineRole
                    ? `YOUR TURN (${onlineRole})`
                    : `OPPONENT'S TURN (${onlineRole === "BLUE" ? "RED" : "BLUE"})`
                  : turn === "BLUE"
                  ? "YOUR TURN (BLUE)"
                  : vsBot
                  ? "BOT THINKING..."
                  : "RED'S TURN"}
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* ==========================================
          AREA TENGAH: PAPAN KAYU 2D FLAT (7x7 BUKAN MIRING)
         ========================================== */}
      <main className="flex-1 flex flex-col items-center justify-center relative py-4 sm:py-6 px-3 sm:px-4 z-10">
        {/* Glow Halus Lantai */}
        <div className="pointer-events-none absolute w-[300px] sm:w-[460px] h-[300px] sm:h-[460px] rounded-full bg-amber-500/8 blur-3xl" />

        {/* Papan 2D Rapi - Tegak Lurus, Simetris, Bersih */}
        <div
          className="relative wood-board-2d p-3 sm:p-4 select-none [--board-gap:8px] sm:[--board-gap:10px]"
          style={{
            width: "min(92vw, 440px)",
            height: "min(92vw, 440px)",
          }}
        >
          {/* Indikator Garis Finish Atas (Target Biru) */}
          <div
            className="absolute -top-2 left-6 right-6 h-1.5 rounded-full bg-sky-400 shadow-[0_0_12px_#38bdf8]"
            title="Garis Finish Bidak Biru (Baris Paling Atas)"
          />
          {/* Indikator Garis Finish Bawah (Target Merah) */}
          <div
            className="absolute -bottom-2 left-6 right-6 h-1.5 rounded-full bg-rose-500 shadow-[0_0_12px_#f43f5e]"
            title="Garis Finish Bidak Merah (Baris Paling Bawah)"
          />

          {/* Grid 7x7 Kotak Kayu Bersih Tanpa Garis Cacat */}
          <div
            className="relative w-full h-full grid grid-cols-7 grid-rows-7"
            style={{ gap: "var(--board-gap)" }}
          >
            {BOARD_TILES.map(({ r, c }) => {
              const isBlueHere = bluePos.r === r && bluePos.c === c;
              const isRedHere = redPos.r === r && redPos.c === c;

              const validMoveObj =
                actionMode === "MOVE"
                  ? activeValidMoves.find((m) => m.r === r && m.c === c)
                  : null;

              return (
                <div
                  key={`tile-${r}-${c}`}
                  onClick={() => validMoveObj && handleMovePawn(r, c)}
                  className={`relative select-none flex items-center justify-center ${
                    validMoveObj
                      ? "wood-tile-valid-2d cursor-pointer"
                      : "wood-tile-2d"
                  }`}
                >
                  {/* Panah Hijau Penunjuk Arah Langkah Valid */}
                  {validMoveObj && (
                    <div className="flex items-center justify-center w-full h-full animate-pulse z-10 pointer-events-none">
                      <DirectionArrowSVG dir={validMoveObj.dirName} />
                    </div>
                  )}

                  {/* Bidak Biru (Karakter Utama) */}
                  {isBlueHere && (
                    <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none p-0.5">
                      <PawnCharacterSVG color="BLUE" isTurn={turn === "BLUE" && !winner} />
                    </div>
                  )}

                  {/* Bidak Merah (Bot / Lawan) */}
                  {isRedHere && (
                    <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none p-0.5">
                      <PawnCharacterSVG color="RED" isTurn={turn === "RED" && !winner} />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Tembok Oranye Presisi Terpasang di Celah Parit */}
            {walls.map((w, idx) => {
              const isH = w.orientation === "H";
              const centerLeft = `calc(${((w.c + 1) / 7) * 100}% + ${(w.c - 2.5) / 7} * var(--board-gap))`;
              const centerTop = `calc(${((w.r + 1) / 7) * 100}% + ${(w.r - 2.5) / 7} * var(--board-gap))`;
              const wallSpan = `calc((200% - 5 * var(--board-gap)) / 7)`;

              return (
                <div
                  key={`wall-${idx}`}
                  style={{
                    left: centerLeft,
                    top: centerTop,
                    width: isH ? wallSpan : "8px",
                    height: isH ? "8px" : wallSpan,
                    transform: "translate(-50%, -50%)",
                  }}
                  className="absolute rounded-full wall-flat-orange z-20 pointer-events-none"
                />
              );
            })}

            {/* Ghost Preview Tembok saat Mode Pasang Tembok Aktif */}
            {actionMode === "WALL" && hoveredWall && (
              <div
                style={{
                  left: `calc(${((hoveredWall.c + 1) / 7) * 100}% + ${(hoveredWall.c - 2.5) / 7} * var(--board-gap))`,
                  top: `calc(${((hoveredWall.r + 1) / 7) * 100}% + ${(hoveredWall.r - 2.5) / 7} * var(--board-gap))`,
                  width:
                    wallOrientation === "H"
                      ? `calc((200% - 5 * var(--board-gap)) / 7)`
                      : "8px",
                  height:
                    wallOrientation === "V"
                      ? `calc((200% - 5 * var(--board-gap)) / 7)`
                      : "8px",
                  transform: "translate(-50%, -50%)",
                }}
                className={`absolute rounded-full z-20 pointer-events-none transition-all ${
                  hoverWallValidation?.valid
                    ? "bg-amber-400/90 border-2 border-white shadow-[0_0_14px_#fb923c]"
                    : "bg-rose-500/90 border-2 border-white shadow-[0_0_14px_#f43f5e]"
                }`}
              />
            )}

            {/* 6x6 Titik Hotspot Presisi Parit Tembok */}
            {actionMode === "WALL" &&
              GROOVE_TILES.map(({ r, c }) => {
                const centerLeft = `calc(${((c + 1) / 7) * 100}% + ${(c - 2.5) / 7} * var(--board-gap))`;
                const centerTop = `calc(${((r + 1) / 7) * 100}% + ${(r - 2.5) / 7} * var(--board-gap))`;

                return (
                  <button
                    key={`groove-${r}-${c}`}
                    type="button"
                    onMouseEnter={() => setHoveredWall({ r, c })}
                    onMouseLeave={() => setHoveredWall(null)}
                    onClick={() => handlePlaceWall(r, c)}
                    style={{
                      left: centerLeft,
                      top: centerTop,
                      transform: "translate(-50%, -50%)",
                    }}
                    className="absolute w-8 h-8 rounded-full z-30 flex items-center justify-center group focus:outline-none cursor-pointer"
                    title="Klik untuk memasang tembok di sini"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400/60 group-hover:bg-amber-500 group-hover:scale-150 transition shadow-xs" />
                  </button>
                );
              })}
          </div>
        </div>
      </main>

      {/* ==========================================
          3. HUD KONTROL KHUSUS MOBILE (< lg)
          Satu kartu rapi tepat di bawah papan, tidak terpotong layar!
         ========================================== */}
      <div className="flex lg:hidden flex-col gap-2 w-full max-w-[400px] mx-auto px-3 mb-2 z-20">
        <div className="hud-tray-light rounded-2xl p-2.5 flex flex-col gap-2 shadow-xs">
          {/* Baris Atas HUD: Info Pemain Biru (Kiri) & Merah (Kanan) */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-2">
            {/* Status Biru (Anda / Host) */}
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-[0_0_6px_#38bdf8] shrink-0" />
              <span className="text-[11px] font-black tracking-wider text-blue-600 dark:text-sky-400 uppercase">
                {mode === "online"
                  ? onlineRole === "BLUE"
                    ? "BIRU (KAMU)"
                    : "BIRU (LAWAN)"
                  : "BIRU"}
              </span>
              <div className="flex items-center gap-0.5 ml-1">
                {Array.from({ length: INITIAL_WALLS }).map((_, idx) => (
                  <div
                    key={`m-blue-${idx}`}
                    className={`w-2 h-4 sm:w-2.5 sm:h-5 rounded-xs transition-all ${
                      idx < blueWallsLeft
                        ? "wall-flat-orange transform -skew-x-6"
                        : "bg-slate-200 dark:bg-slate-700 opacity-40"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-black text-slate-800 dark:text-white ml-0.5">
                {blueWallsLeft}
              </span>
            </div>

            {/* Status Merah (Lawan / Bot / Tamu) */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-slate-800 dark:text-white mr-0.5">
                {redWallsLeft}
              </span>
              <div className="flex items-center gap-0.5 mr-1">
                {Array.from({ length: INITIAL_WALLS }).map((_, idx) => (
                  <div
                    key={`m-red-${idx}`}
                    className={`w-2 h-4 sm:w-2.5 sm:h-5 rounded-xs transition-all ${
                      idx < redWallsLeft
                        ? "wall-flat-orange transform skew-x-6"
                        : "bg-slate-200 dark:bg-slate-700 opacity-40"
                    }`}
                  />
                ))}
              </div>
              <span className="text-[11px] font-black tracking-wider text-rose-600 dark:text-rose-400 uppercase">
                {mode === "online"
                  ? onlineRole === "RED"
                    ? "MERAH (KAMU)"
                    : "MERAH (LAWAN)"
                  : vsBot
                  ? "BOT"
                  : "MERAH"}
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_6px_#f43f5e] shrink-0" />
            </div>
          </div>

          {/* Baris Bawah HUD: Tombol + PASANG TEMBOK & Petunjuk Langkah */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={
                  Boolean(winner) ||
                  (mode === "bot" && turn === "RED") ||
                  (mode === "online" && onlineRole !== turn) ||
                  (turn === "BLUE" ? blueWallsLeft <= 0 : redWallsLeft <= 0)
                }
                onClick={() =>
                  setActionMode((prev) => (prev === "WALL" ? "MOVE" : "WALL"))
                }
                className={`px-3 py-1.5 rounded-xl font-black text-[11px] tracking-wider uppercase text-white disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-all ${
                  actionMode === "WALL" ? "btn-amber-3d" : "btn-blue-3d"
                }`}
              >
                {actionMode === "WALL" ? "✕ BATAL" : "+ TEMBOK"}
              </button>

              {actionMode === "WALL" && (
                <button
                  type="button"
                  onClick={() => {
                    playSound("rotate");
                    setWallOrientation((prev) => (prev === "H" ? "V" : "H"));
                  }}
                  className="px-2 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-amber-500 text-amber-700 dark:text-amber-300 font-extrabold text-[11px] flex items-center gap-1 shadow-xs cursor-pointer transition-all"
                  title="Putar Orientasi Tembok (Shortcut: R)"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>{wallOrientation === "H" ? "Horiz" : "Vert"}</span>
                </button>
              )}
            </div>

            {/* Petunjuk Aksi Aktif */}
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 text-right leading-tight truncate">
              {warningMsg ? (
                <span className="text-rose-500 font-bold">{warningMsg}</span>
              ) : mode === "online" ? (
                turn === onlineRole ? (
                  actionMode === "WALL" ? (
                    <span className="text-amber-600 dark:text-amber-400 font-bold">Klik celah parit</span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Giliranmu! Klik panah</span>
                  )
                ) : (
                  <span>Menunggu lawan...</span>
                )
              ) : actionMode === "WALL" ? (
                <span className="text-amber-600 dark:text-amber-400 font-bold">Klik celah parit</span>
              ) : turn === "BLUE" ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Klik panah hijau</span>
              ) : vsBot ? (
                <span>Bot berpikir...</span>
              ) : (
                <span>Giliran Merah</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================
          4. HUD FOOTER KHUSUS DESKTOP (>= lg)
          Desain 3 kolom terpisah, megah dan luas
         ========================================== */}
      <footer className="hidden lg:flex w-full max-w-6xl mx-auto px-4 pb-4 pt-1 items-center justify-between gap-6 z-20">
        {/* KIRI BAWAH: BLUE PLAYER RACK + TOMBOL "+ PLACE WALL" */}
        <div className="flex flex-col items-start gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-[0_0_8px_#38bdf8]" />
            <span className="text-sm font-black tracking-wider text-blue-600 dark:text-sky-400 uppercase">
              {mode === "online"
                ? onlineRole === "BLUE"
                  ? "BLUE PLAYER (HOST · KAMU)"
                  : "BLUE PLAYER (HOST · LAWAN)"
                : "BLUE PLAYER (YOU)"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Rak Tembok + Angka Sisa Tembok */}
            <div className="hud-tray-light rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-xs">
              <div className="flex items-center gap-1.5 h-8">
                {Array.from({ length: INITIAL_WALLS }).map((_, idx) => {
                  const isAvailable = idx < blueWallsLeft;
                  return (
                    <div
                      key={`blue-rack-${idx}`}
                      className={`w-4 h-7 rounded-sm transition-all ${
                        isAvailable
                          ? "wall-flat-orange transform -skew-x-6"
                          : "bg-slate-200 dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600 opacity-40"
                      }`}
                    />
                  );
                })}
              </div>
              <div className="pl-2 border-l border-slate-300 dark:border-slate-700 text-2xl font-black text-slate-800 dark:text-white">
                {blueWallsLeft}
              </div>
            </div>

            {/* Tombol "+ PLACE WALL" & Tombol Putar Orientasi */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={
                  Boolean(winner) ||
                  (mode === "bot" && turn === "RED") ||
                  (mode === "online" && onlineRole !== turn) ||
                  (turn === "BLUE" ? blueWallsLeft <= 0 : redWallsLeft <= 0)
                }
                onClick={() =>
                  setActionMode((prev) => (prev === "WALL" ? "MOVE" : "WALL"))
                }
                className={`px-5 py-3 rounded-2xl font-black text-sm tracking-wider uppercase text-white disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-all ${
                  actionMode === "WALL" ? "btn-amber-3d" : "btn-blue-3d"
                }`}
              >
                {actionMode === "WALL" ? "✕ BATAL TEMBOK" : "+ PLACE WALL"}
              </button>

              {actionMode === "WALL" && (
                <button
                  type="button"
                  onClick={() => {
                    playSound("rotate");
                    setWallOrientation((prev) => (prev === "H" ? "V" : "H"));
                  }}
                  className="px-3.5 py-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-2 border-amber-500 text-amber-700 dark:text-amber-300 font-extrabold text-sm flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
                  title="Putar Posisi Tembok (Shortcut: Tombol R)"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>{wallOrientation === "H" ? "HORIZ" : "VERT"}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* TENGAH BAWAH: Indikator Giliran Neon Desktop */}
        <div className="flex flex-col items-center">
          <div
            className={`px-5 py-2 rounded-full text-xs font-black tracking-widest uppercase border transition-all text-center shadow-xs ${
              turn === "BLUE"
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/60 shadow-[0_0_15px_rgba(52,211,153,0.25)]"
                : "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.25)]"
            }`}
          >
            {mode === "online"
              ? actionMode === "WALL"
                ? `PILIH PARIT TEMBOK (${wallOrientation === "H" ? "HORIZONTAL" : "VERTIKAL"})`
                : turn === onlineRole
                ? "GILIRAN KAMU! KLIK PANAH HIJAU UNTUK MELANGKAH"
                : "MENUNGGU LAWAN MENGAMBIL LANGKAH..."
              : actionMode === "WALL"
              ? `PILIH PARIT TEMBOK (${wallOrientation === "H" ? "HORIZONTAL" : "VERTIKAL"})`
              : turn === "BLUE"
              ? "KLIK PANAH HIJAU UNTUK MELANGKAH"
              : vsBot
              ? "BOT SEDANG MENGHITUNG LANGKAH..."
              : "GILIRAN PEMAIN MERAH"}
          </div>
        </div>

        {/* KANAN BAWAH: RED PLAYER RACK */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black tracking-wider text-rose-600 dark:text-rose-400 uppercase">
              {mode === "online"
                ? onlineRole === "RED"
                  ? "RED PLAYER (TAMU · KAMU)"
                  : "RED PLAYER (TAMU · LAWAN)"
                : vsBot
                ? "RED PLAYER (BOT)"
                : "RED PLAYER (P2)"}
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
          </div>

          <div className="hud-tray-light rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-xs">
            <div className="pr-2 border-r border-slate-300 dark:border-slate-700 text-2xl font-black text-slate-800 dark:text-white">
              {redWallsLeft}
            </div>
            <div className="flex items-center gap-1.5 h-8 justify-end">
              {Array.from({ length: INITIAL_WALLS }).map((_, idx) => {
                const isAvailable = idx < redWallsLeft;
                return (
                  <div
                    key={`red-rack-${idx}`}
                    className={`w-4 h-7 rounded-sm transition-all ${
                      isAvailable
                        ? "wall-flat-orange transform skew-x-6"
                        : "bg-slate-200 dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600 opacity-40"
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </footer>

      {/* ==========================================
          MODAL KEMENANGAN / GAME OVER
         ========================================== */}
      {winner && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#1b2030] border-2 border-slate-200 dark:border-slate-600 rounded-3xl max-w-md w-full p-6 text-center shadow-2xl">
            <div
              className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                winner === "BLUE"
                  ? "bg-sky-500/15 border-2 border-sky-400 text-sky-600 dark:text-sky-300"
                  : "bg-rose-500/15 border-2 border-rose-400 text-rose-600 dark:text-rose-300"
              }`}
            >
              <Trophy className="w-9 h-9" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2">
              {mode === "online"
                ? winner === onlineRole
                  ? "KAMU MENANG!"
                  : "LAWAN MENANG!"
                : winner === "BLUE"
                ? "KAMU MENANG!"
                : vsBot
                ? "BOT MENANG!"
                : "PEMAIN MERAH MENANG!"}
            </h2>

            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              {mode === "online"
                ? winner === onlineRole
                  ? "Strategi labirinmu luar biasa! Bidakmu berhasil mencapai garis seberang lebih dulu dari lawan."
                  : "Bidak lawan berhasil menembus garis seberang lebih dulu. Ajak main lagi untuk membalas!"
                : winner === "BLUE"
                ? `Strategi labirinmu sukses! Bidak Biru berhasil menembus garis seberang dengan sisa ${blueWallsLeft} tembok.`
                : "Bidak Merah berhasil mencapai garis bawah lebih dulu. Coba tutup jalur tengahnya lebih awal di ronde berikutnya!"}
            </p>

            <div className="flex flex-col gap-3 justify-center">
              {mode === "online" ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleRematchOnline}
                    className="flex-1 px-5 py-3.5 rounded-xl btn-blue-3d text-white font-black text-sm tracking-wide uppercase cursor-pointer shadow-md"
                  >
                    Ajak Main Lagi
                  </button>
                  <button
                    onClick={leaveOnlineRoom}
                    className="px-4 py-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-300 font-bold text-sm cursor-pointer transition"
                  >
                    Keluar Room
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => resetGame()}
                  className="w-full px-6 py-3.5 rounded-xl btn-blue-3d text-white font-black text-sm tracking-wide uppercase cursor-pointer shadow-md"
                >
                  Main Lagi
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL LOBBY ONLINE MULTIPLAYER
         ========================================== */}
      {mode === "online" && onlineState !== "connected" && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#1b2030] border-2 border-slate-200 dark:border-slate-700 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative text-left">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#1b4086] text-white flex items-center justify-center shadow-xs">
                  <FiGlobe className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                    Mabar Online Real-Time
                  </h3>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    Adu taktik Block &apos;n Run bareng teman
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleSwitchMode("bot")}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
                title="Tutup & Kembali ke Mode Bot"
              >
                ✕
              </button>
            </div>

            {/* Content berdasarkan onlineState */}
            {onlineState === "waiting" ? (
              /* Status Menunggu Lawan */
              <div className="flex flex-col items-center text-center py-2">
                <div className="relative mb-3 flex items-center justify-center">
                  <span className="w-14 h-14 rounded-full bg-emerald-500/20 animate-ping absolute" />
                  <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md relative z-10">
                    <Users className="w-6 h-6 animate-pulse" />
                  </div>
                </div>

                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  Room Siap Dimainkan!
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Kamu adalah <strong className="text-sky-600 dark:text-sky-400">Pemain Biru (Host)</strong>. Bagikan kode atau link di bawah:
                </p>

                {/* Kode Room Box */}
                <div className="w-full mt-3.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border-2 border-dashed border-primary/40 flex items-center justify-between gap-2">
                  <div className="text-left">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                      Kode Room
                    </span>
                    <span className="text-xl sm:text-2xl font-black font-mono tracking-wider title-3d">
                      {roomCode}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      copyToClipboard(roomCode, "Kode room disalin ke clipboard!");
                      setIsCopiedCode(true);
                      setTimeout(() => setIsCopiedCode(false), 2000);
                    }}
                    type="button"
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-primary transition-all cursor-pointer shadow-xs"
                    title="Salin Kode Room"
                  >
                    {isCopiedCode ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <FiCopy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Link Room Box */}
                <div className="w-full mt-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareableUrl}
                      className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-600 dark:text-slate-300 select-all truncate"
                    />
                    <button
                      onClick={() => {
                        copyToClipboard(shareableUrl, "Link mabar disalin!");
                        setIsCopiedLink(true);
                        setTimeout(() => setIsCopiedLink(false), 2000);
                      }}
                      type="button"
                      className="px-3 py-2 rounded-xl btn-blue-3d text-white text-xs font-black transition-all cursor-pointer shrink-0"
                    >
                      {isCopiedLink ? "Disalin!" : "Salin Link"}
                    </button>
                  </div>

                  {/* WhatsApp Share Button */}
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                      `Ayo duel taktik BLOCK 'N RUN bareng aku!\nKode Room: *${roomCode}*\nAtau klik link langsung:\n${shareableUrl}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs"
                  >
                    <FaWhatsapp className="w-4 h-4" />
                    <span>Kirim Undangan ke WhatsApp</span>
                  </a>
                </div>

                {/* Pulse Status */}
                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
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
              /* Status Menghubungkan */
              <div className="text-center py-6 flex flex-col items-center">
                <span className="w-9 h-9 rounded-full border-3 border-primary border-t-transparent animate-spin mb-3" />
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  Menghubungkan ke Room {roomCode}...
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Sinkronisasi koneksi dengan Host. Pertandingan akan segera dimulai!
                </p>
                <button
                  onClick={leaveOnlineRoom}
                  type="button"
                  className="mt-4 text-xs text-rose-500 hover:underline font-bold cursor-pointer"
                >
                  Batal
                </button>
              </div>
            ) : onlineState === "opponent_left" ? (
              /* Status Lawan Keluar */
              <div className="text-center py-5 flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
                  <FiLogOut className="w-6 h-6" />
                </div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  Lawan Meninggalkan Room
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
                  Pemain lawan telah keluar atau koneksinya terputus. Buat room baru atau main lagi dengan teman lain.
                </p>
                <div className="flex gap-2 mt-4 w-full">
                  <button
                    onClick={() => {
                      setOnlineState("idle");
                      setOnlineTab("create");
                    }}
                    type="button"
                    className="flex-1 py-2.5 rounded-xl btn-blue-3d text-white font-black text-xs uppercase cursor-pointer"
                  >
                    Buat Room Baru
                  </button>
                  <button
                    onClick={() => handleSwitchMode("bot")}
                    type="button"
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer"
                  >
                    Kembali ke Bot
                  </button>
                </div>
              </div>
            ) : (
              /* Lobby Utama: Buat Room vs Gabung Room Tabs */
              <div>
                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl mb-4">
                  <button
                    onClick={() => setOnlineTab("create")}
                    type="button"
                    className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                      onlineTab === "create"
                        ? "bg-[#1b4086] text-white shadow-xs"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                    }`}
                  >
                    Buat Room Baru
                  </button>
                  <button
                    onClick={() => setOnlineTab("join")}
                    type="button"
                    className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                      onlineTab === "join"
                        ? "bg-[#1b4086] text-white shadow-xs"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                    }`}
                  >
                    Gabung Room
                  </button>
                </div>

                {onlineTab === "create" ? (
                  <div className="flex flex-col gap-3">
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      <span className="font-black text-slate-800 dark:text-white flex items-center gap-1.5 mb-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>Cara Mabar Online:</span>
                      </span>
                      1. Klik tombol di bawah untuk membuat Room.<br />
                      2. Bagikan <strong>Kode Room</strong> atau <strong>Link</strong> ke temanmu via WhatsApp.<br />
                      3. Giliran pertama akan diundi secara otomatis & langkah tersinkronisasi realtime!
                    </div>

                    <button
                      onClick={handleCreateRoom}
                      type="button"
                      className="btn-blue-3d w-full py-3 rounded-xl text-white font-black text-sm tracking-wide cursor-pointer uppercase shadow-md flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>Buat Room & Dapatkan Kode</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                        Masukkan Kode Room dari Teman:
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: BNR-7K2X"
                        value={joinRoomInput}
                        onChange={(e) => setJoinRoomInput(e.target.value.toUpperCase())}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleJoinRoom();
                        }}
                        className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono font-black text-slate-900 dark:text-white uppercase tracking-wider placeholder:text-slate-400 focus:outline-none focus:border-primary"
                      />
                    </div>

                    <button
                      onClick={() => handleJoinRoom()}
                      type="button"
                      className="btn-blue-3d w-full py-3 rounded-xl text-white font-black text-sm tracking-wide cursor-pointer uppercase shadow-md flex items-center justify-center gap-2"
                    >
                      <span>Gabung ke Room</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL ATURAN SINGKAT (5 DETIK PAHAM)
         ========================================== */}
      {showRulesModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#1b2030] border-2 border-slate-200 dark:border-slate-600 rounded-3xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3 mb-4">
              <h3 className="text-xl font-black text-amber-600 dark:text-amber-300 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-500" />
                <span>CARA MAIN: BLOCK &apos;N RUN!</span>
              </h3>
              <button
                onClick={() => setShowRulesModal(false)}
                className="text-slate-400 hover:text-slate-800 dark:hover:text-white font-bold text-sm px-2 py-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                <p className="font-bold text-sky-600 dark:text-sky-300 mb-1">
                  1. Tujuan Utama (Balap Lintas Seberang)
                </p>
                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
                  Bawa <strong>Bidak Biru</strong> milikmu dari baris bawah sampai menyentuh kotak mana saja di <strong>baris paling atas</strong> lebih dulu daripada Bidak Merah.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                <p className="font-bold text-emerald-600 dark:text-emerald-300 mb-1">
                  2. Pilih 1 Aksi di Setiap Giliran
                </p>
                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
                  • <strong>Melangkah 1 Kotak:</strong> Klik langsung kotak berpanah hijau di sekitar bidakmu.<br />
                  • <strong>Pasang 1 Tembok:</strong> Klik tombol <strong>+ PLACE WALL</strong> (masing-masing punya 5 tembok), lalu klik parit di papan untuk menghadang jalan lawan.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                <p className="font-bold text-amber-600 dark:text-amber-300 mb-1">
                  3. Aturan Emas Critical Thinking
                </p>
                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
                  Kamu boleh membuat jalan lawan memutar sejauh mungkin, <strong>TAPI dilarang mengurung lawan 100% tanpa jalan keluar</strong>. Sistem akan otomatis mengecek apakah masih ada minimal 1 jalur tersisa.
                </p>
              </div>
            </div>

            <div className="mt-6 text-right">
              <button
                onClick={() => setShowRulesModal(false)}
                className="px-6 py-2.5 rounded-xl btn-blue-3d text-white font-black text-xs sm:text-sm uppercase cursor-pointer"
              >
                Siap Bermain!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification (Z-[99999] agar selalu berada di paling depan di atas modal & backdrop) */}
      {toastData && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-[99999] px-4 py-2.5 rounded-full text-xs sm:text-sm font-extrabold shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-200 flex items-center gap-2 pointer-events-none transition-all ${
            toastData.type === "warning"
              ? "bg-rose-950/95 text-rose-100 border border-rose-500 shadow-[0_4px_20px_rgba(244,63,94,0.35)]"
              : toastData.type === "info"
              ? "bg-slate-900/95 dark:bg-slate-800/95 text-sky-200 border border-sky-500/60 shadow-lg"
              : "bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 border border-emerald-500/50 dark:border-slate-200 shadow-xl"
          }`}
        >
          {toastData.type === "warning" ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 stroke-[2.5]" />
          ) : toastData.type === "info" ? (
            <HelpCircle className="w-4 h-4 text-sky-400 shrink-0 stroke-[2.5]" />
          ) : (
            <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0 stroke-[2.5]" />
          )}
          <span>{toastData.msg}</span>
        </div>
      )}
    </div>
  );
}

// ==========================================
// KOMPONEN VISUAL BIDAK KARAKTER (TEGAK DI ATAS KOTAK)
// ==========================================
function PawnCharacterSVG({ color, isTurn }: { color: PlayerColor; isTurn: boolean }) {
  const isBlue = color === "BLUE";

  return (
    <div className="relative flex flex-col items-center justify-center w-10 h-12 sm:w-12 sm:h-14 select-none">
      {/* Lingkaran Glow di Bawah Kaki Bidak saat Gilirannya */}
      {isTurn && (
        <div
          className={`absolute bottom-0.5 w-8 h-3.5 rounded-full blur-[2px] animate-pulse ${
            isBlue ? "bg-sky-400/80" : "bg-rose-500/80"
          }`}
        />
      )}

      <svg
        viewBox="0 0 80 100"
        className="w-full h-full overflow-visible drop-shadow-[0_4px_6px_rgba(0,0,0,0.35)]"
      >
        <defs>
          <linearGradient id={`blueBodyGrad-${isBlue ? 'b' : 'r'}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="50%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>

          <linearGradient id={`redBodyGrad-${isBlue ? 'b' : 'r'}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="50%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </linearGradient>

          <linearGradient id={`woodFaceGrad-${isBlue ? 'b' : 'r'}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f3c68f" />
            <stop offset="100%" stopColor="#c68b59" />
          </linearGradient>
        </defs>

        {/* Alas Kayu Bulat di Kaki Bidak */}
        <ellipse cx="40" cy="86" rx="24" ry="9" fill="#7c4722" />
        <ellipse cx="40" cy="83" rx="23" ry="8" fill="#c88a51" />

        {/* Badan Kerucut Bidak */}
        <path
          d="M20 82 C22 52, 30 44, 40 44 C50 44, 58 52, 60 82 Z"
          fill={isBlue ? `url(#blueBodyGrad-${isBlue ? 'b' : 'r'})` : `url(#redBodyGrad-${isBlue ? 'b' : 'r'})`}
          stroke={isBlue ? "#93c5fd" : "#fca5a5"}
          strokeWidth="1.5"
        />

        {/* Kilau Highlight di Badan */}
        <path
          d="M27 77 C29 56, 33 49, 37 48"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />

        {/* Kepala Bulat Bidak */}
        <circle
          cx="40"
          cy="30"
          r="16"
          fill={`url(#woodFaceGrad-${isBlue ? 'b' : 'r'})`}
          stroke="#5c3217"
          strokeWidth="1.5"
        />

        {/* Topi/Helm Kubah di Kepala Bidak */}
        <path
          d="M24 28 C24 15, 56 15, 56 28 C48 23, 32 23, 24 28 Z"
          fill={isBlue ? `url(#blueBodyGrad-${isBlue ? 'b' : 'r'})` : `url(#redBodyGrad-${isBlue ? 'b' : 'r'})`}
        />

        {/* Kilau di Helm */}
        <ellipse
          cx="34"
          cy="20"
          rx="5"
          ry="2.5"
          fill="rgba(255,255,255,0.6)"
          transform="rotate(-15 34 20)"
        />

        {/* Mata Karakter Bidak */}
        <circle cx="34" cy="33" r="2.2" fill="#1e293b" />
        <circle cx="46" cy="33" r="2.2" fill="#1e293b" />
      </svg>
    </div>
  );
}

// ==========================================
// KOMPONEN PANAH HIJAU PENUNJUK ARAH (SVG)
// ==========================================
function DirectionArrowSVG({ dir }: { dir: MoveDirection | string }) {
  const rotationMap: Record<string, string> = {
    UP: "rotate(0deg)",
    UP_RIGHT: "rotate(45deg)",
    RIGHT: "rotate(90deg)",
    DOWN_RIGHT: "rotate(135deg)",
    DOWN: "rotate(180deg)",
    DOWN_LEFT: "rotate(-135deg)",
    LEFT: "rotate(-90deg)",
    UP_LEFT: "rotate(-45deg)",
  };

  return (
    <svg
      viewBox="0 0 40 40"
      style={{ transform: rotationMap[dir] || "rotate(0deg)" }}
      className="w-6 h-6 sm:w-8 sm:h-8 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
    >
      <path
        d="M20 6 L33 20 L25 20 L25 34 L15 34 L15 20 L7 20 Z"
        fill="#ecfdf5"
        stroke="#15803d"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
