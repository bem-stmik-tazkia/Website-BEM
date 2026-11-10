export type CharacterId = "koding" | "ambis" | "aktivis" | "asdos";
export type Mood = "normal" | "happy" | "nervous" | "dizzy";

export interface WinLine {
  cells: [number, number, number];
  coords: [number, number, number, number];
}

export const WIN_LINES: WinLine[] = [
  { cells: [0, 1, 2], coords: [35, 52, 265, 52] },
  { cells: [3, 4, 5], coords: [35, 150, 265, 150] },
  { cells: [6, 7, 8], coords: [35, 248, 265, 248] },
  { cells: [0, 3, 6], coords: [52, 35, 52, 265] },
  { cells: [1, 4, 7], coords: [150, 35, 150, 265] },
  { cells: [2, 5, 8], coords: [248, 35, 248, 265] },
  { cells: [0, 4, 8], coords: [40, 40, 260, 260] },
  { cells: [2, 4, 6], coords: [260, 40, 40, 260] },
];

/**
 * Authentic Campus Character Vector SVG Generator
 */
export function buildCharacterSVG(
  charId: CharacterId,
  theme: "navy" | "orange" = "navy",
  mood: Mood = "normal",
  isHud = false
) {
  const c =
    theme === "navy"
      ? {
          main: "#1e3a8a",
          bright: "#2563eb",
          soft: "#93c5fd",
          glow: "#60a5fa",
        }
      : {
          main: "#c2410c",
          bright: "#f97316",
          soft: "#fdba74",
          glow: "#fb923c",
        };

  const skin = "#fde68a";
  const cheek = "#fda4af";
  const ink = "#0f172a";
  const trackClass = isHud ? "hud-eye-pupil" : "board-eye-pupil";

  function renderFace(withGlasses = false, glassesType = "tech") {
    let eyes = "";
    let mouth = "";
    let sweat = "";

    if (mood === "happy") {
      eyes = `
        <g class="${trackClass}">
          <path d="M21 31 Q24.5 26.5 28 31" fill="none" stroke="${ink}" stroke-width="2.6" stroke-linecap="round"/>
          <path d="M36 31 Q39.5 26.5 43 31" fill="none" stroke="${ink}" stroke-width="2.6" stroke-linecap="round"/>
        </g>
      `;
      mouth = `
        <path d="M25 38.5 Q32 46 39 38.5 Z" fill="#ef4444" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M27 39.5 H37" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
      `;
    } else if (mood === "dizzy") {
      eyes = `
        <g>
          <path d="M21.5 28.5 L26.5 33.5 M26.5 28.5 L21.5 33.5" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>
          <path d="M37.5 28.5 L42.5 33.5 M42.5 28.5 L37.5 33.5" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>
        </g>
      `;
      mouth = `<path d="M26.5 42.5 Q32 37.5 37.5 42.5" fill="none" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/>`;
    } else if (mood === "nervous") {
      eyes = `
        <g class="${trackClass}">
          <circle cx="24.5" cy="31" r="3.2" fill="#ffffff" stroke="${ink}" stroke-width="1.8"/>
          <circle cx="24.5" cy="31" r="1.4" fill="${ink}"/>
          <circle cx="39.5" cy="31" r="3.2" fill="#ffffff" stroke="${ink}" stroke-width="1.8"/>
          <circle cx="39.5" cy="31" r="1.4" fill="${ink}"/>
        </g>
      `;
      mouth = `<path d="M26 40.5 Q29 38.5 32 40.5 T38 40.5" fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>`;
      sweat = `<path d="M47 21 C47 21 50 25 47 27 C44 25 47 21 47 21 Z" fill="#38bdf8"/>`;
    } else {
      // Normal Focused Tracking Eyes
      eyes = `
        <g class="eye-track-group ${trackClass}">
          <circle cx="24.5" cy="31" r="2.7" fill="${ink}"/>
          <circle cx="23.6" cy="29.8" r="0.95" fill="#ffffff"/>
          <circle cx="39.5" cy="31" r="2.7" fill="${ink}"/>
          <circle cx="38.6" cy="29.8" r="0.95" fill="#ffffff"/>
        </g>
      `;
      mouth = `<path d="M28 39.5 Q32 43 36 39.5" fill="none" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/>`;
    }

    let glasses = "";
    if (withGlasses) {
      if (glassesType === "tech") {
        glasses = `
          <rect x="18.5" y="26.5" width="11.5" height="8.5" rx="2.5" fill="${c.glow}" fill-opacity="0.18" stroke="${c.main}" stroke-width="2.1"/>
          <rect x="34" y="26.5" width="11.5" height="8.5" rx="2.5" fill="${c.glow}" fill-opacity="0.18" stroke="${c.main}" stroke-width="2.1"/>
          <line x1="30" y1="30.5" x2="34" y2="30.5" stroke="${c.main}" stroke-width="2.1"/>
        `;
      } else if (glassesType === "round") {
        glasses = `
          <circle cx="24.5" cy="30.5" r="5.5" fill="#ffffff" fill-opacity="0.25" stroke="${ink}" stroke-width="2"/>
          <circle cx="39.5" cy="30.5" r="5.5" fill="#ffffff" fill-opacity="0.25" stroke="${ink}" stroke-width="2"/>
          <line x1="30" y1="30.5" x2="34" y2="30.5" stroke="${ink}" stroke-width="2"/>
        `;
      } else {
        glasses = `
          <path d="M18 27.5 H30 V34.5 H19 Z" fill="#ffffff" fill-opacity="0.22" stroke="${ink}" stroke-width="2"/>
          <path d="M34 27.5 H46 L45 34.5 H34 Z" fill="#ffffff" fill-opacity="0.22" stroke="${ink}" stroke-width="2"/>
          <line x1="30" y1="29.5" x2="34" y2="29.5" stroke="${ink}" stroke-width="2"/>
        `;
      }
    }

    return `
      <ellipse cx="20.5" cy="36" rx="2.6" ry="1.4" fill="${cheek}" opacity="0.65"/>
      <ellipse cx="43.5" cy="36" rx="2.6" ry="1.4" fill="${cheek}" opacity="0.65"/>
      ${eyes}
      ${glasses}
      ${mouth}
      ${sweat}
    `;
  }

  // 1. SI KODING (Mahasiswa IT)
  if (charId === "koding") {
    return `
      <svg class="w-full h-full overflow-visible" viewBox="0 0 64 64" fill="none">
        <path d="M11 58 C11 46 19 43 32 43 C45 43 53 46 53 58" fill="${c.main}" stroke="${ink}" stroke-width="2"/>
        <path d="M24 43 L32 53 L40 43" fill="${c.soft}"/>
        <path d="M12 31 C12 15 20 9 32 9 C44 9 52 15 52 31" stroke="${c.bright}" stroke-width="4" stroke-linecap="round"/>
        <rect x="9" y="25" width="6" height="12" rx="3" fill="${c.bright}" stroke="${ink}" stroke-width="1.8"/>
        <rect x="49" y="25" width="6" height="12" rx="3" fill="${c.bright}" stroke="${ink}" stroke-width="1.8"/>
        <rect x="16" y="16" width="32" height="30" rx="14" fill="${skin}" stroke="${ink}" stroke-width="2"/>
        <path d="M16 27 C16 17 23 13 32 13 C41 13 48 17 48 27 C44 21 38 20 32 20 C24 20 19 22 16 27 Z" fill="${ink}"/>
        ${renderFace(true, "tech")}
        <rect x="24" y="49" width="16" height="7" rx="3.5" fill="${ink}"/>
        <text x="32" y="54.5" text-anchor="middle" fill="${c.soft}" font-size="6" font-weight="800" font-family="monospace">&lt;/&gt;</text>
      </svg>
    `;
  }

  // 2. SI AMBIS (Juara Kelas)
  if (charId === "ambis") {
    return `
      <svg class="w-full h-full overflow-visible" viewBox="0 0 64 64" fill="none">
        <path d="M12 58 C12 46 20 43 32 43 C44 43 52 46 52 58" fill="${c.main}" stroke="${ink}" stroke-width="2"/>
        <path d="M23 43 L32 54 L41 43" fill="#ffffff" stroke="${ink}" stroke-width="1.6"/>
        <path d="M28 43 L32 51 L36 43" stroke="${c.bright}" stroke-width="2" fill="none"/>
        <rect x="29.5" y="51" width="5" height="7" rx="1.5" fill="#facc15" stroke="${ink}" stroke-width="1"/>
        <rect x="16" y="16" width="32" height="30" rx="14" fill="${skin}" stroke="${ink}" stroke-width="2"/>
        <path d="M16 26 C16 15 22 11 32 11 C42 11 48 15 48 26 C45 18 36 17 32 18 C26 18 19 21 16 26 Z" fill="${ink}"/>
        ${renderFace(true, "round")}
      </svg>
    `;
  }

  // 3. SI AKTIVIS (Anak Organisasi)
  if (charId === "aktivis") {
    return `
      <svg class="w-full h-full overflow-visible" viewBox="0 0 64 64" fill="none">
        <path d="M11 58 C11 46 19 43 32 43 C45 43 53 46 53 58" fill="${c.main}" stroke="${ink}" stroke-width="2"/>
        <path d="M25 43 L32 55 L39 43" fill="#ffffff" stroke="${ink}" stroke-width="1.5"/>
        <circle cx="41" cy="51" r="2.8" fill="#facc15" stroke="${ink}" stroke-width="1.2"/>
        <rect x="16" y="17" width="32" height="29" rx="13.5" fill="${skin}" stroke="${ink}" stroke-width="2"/>
        <path d="M15 24 C15 13 22 10 32 10 C42 10 49 13 49 24 Z" fill="${c.main}" stroke="${ink}" stroke-width="2"/>
        <path d="M14 23.5 Q32 19.5 52 24.5" stroke="${c.bright}" stroke-width="3.6" stroke-linecap="round"/>
        <circle cx="32" cy="16.5" r="2.6" fill="#facc15"/>
        ${renderFace(false)}
      </svg>
    `;
  }

  // 4. KAK ASDOS (Asisten Dosen)
  return `
    <svg class="w-full h-full overflow-visible" viewBox="0 0 64 64" fill="none">
      <path d="M11 58 C11 46 19 43 32 43 C45 43 53 46 53 58" fill="${c.main}" stroke="${ink}" stroke-width="2"/>
      <path d="M24 43 L32 55 L40 43" fill="#ffffff"/>
      <path d="M30.5 45 L32 55 L33.5 45" fill="${c.bright}"/>
      <rect x="16" y="17" width="32" height="29" rx="13.5" fill="${skin}" stroke="${ink}" stroke-width="2"/>
      <path d="M16 26 C16 16 23 13 32 13 C41 13 48 16 48 26 C44 20 38 19 30 20 C23 20.5 19 23 16 26 Z" fill="${ink}"/>
      <polygon points="32,6 50,13 32,18 14,13" fill="${c.main}" stroke="${ink}" stroke-width="1.8"/>
      <path d="M46 14 L48 22" stroke="#facc15" stroke-width="2.2" stroke-linecap="round"/>
      ${renderFace(true, "asdos")}
    </svg>
  `;
}
