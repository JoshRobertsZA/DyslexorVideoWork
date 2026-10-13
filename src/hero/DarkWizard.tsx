import React from "react";

// The Dark Wizard from the Dyslexor 2.0 trailer: black hooded robe with red
// trim, glowing red eyes, a staff with a purple orb. Drawn in art pixels to
// sit beside the 48px realm sprites. Faces left; feet on row FEET.

export const WIZ = { w: 30, h: 40, feet: 39, cx: 14 };

const PAL: Record<string, string> = {
  K: "#0b0710",
  R: "#2b2633",
  H: "#3d3647",
  r: "#1c1823",
  T: "#b3243a",
  F: "#050307",
  E: "#ff4a4a",
  e: "#a51d2a",
  D: "#15121b",
};

// Hood and face. The tip trails back over his shoulder.
const HOOD = [
  "                 KKK",
  "               KKRRK",
  "             KKRRRK",
  "            KHRRRRK",
  "           KHRRRRRRK",
  "          KHRRRRRRRRK",
  "         KHRRRRRRRRRRK",
  "         KHKKKKKKKKRRRK",
  "        KHKFFFFFFFFKRRK",
  "        KHKFFFFFFFFKRRK",
  "        KHKFEEFFEEFKRRK",
  "        KHKFeeFFeeFKRRK",
  "        KHKFFFFFFFFKRRRK",
  "        KHRKFFFFFFKRRRRK",
  "       KHRRKKKKKKKKRRRRK",
];

const grid: string[][] = (() => {
  const g = Array.from({ length: WIZ.h }, () => Array<string>(WIZ.w).fill(" "));
  HOOD.forEach((row, y) => [...row].forEach((ch, x) => (g[y][x] = ch)));
  // Robe widens to the hem: red trim down the front edge, buttons, a belt.
  for (let y = 15; y < WIZ.h; y++) {
    const t = (y - 15) / (WIZ.h - 16);
    const L = Math.round(6 - 3 * t);
    const R = Math.round(23 + 2 * t);
    for (let x = L; x <= R; x++) {
      let ch = "R";
      if (x === L || x === R || y === WIZ.h - 1) ch = "K";
      else if (y >= WIZ.h - 3) ch = "T";
      else if (x === L + 1) ch = "T";
      else if (x === L + 2) ch = "H";
      else if (x >= R - 3) ch = "r";
      else if (y === 25) ch = "T";
      else if (x === 14 && y % 3 === 0) ch = "D";
      g[y][x] = ch;
    }
  }
  // Sleeve reaching forward to the staff.
  for (let y = 18; y <= 21; y++)
    for (let x = 3; x <= 7; x++) g[y][x] = y === 18 || y === 21 ? "K" : x < 5 ? "r" : "R";
  return g;
})();

// One <rect> per run of same-colour pixels in a row.
const RECTS = grid.flatMap((row, y) => {
  const out: { x: number; y: number; w: number; c: string }[] = [];
  let x = 0;
  while (x < row.length) {
    const ch = row[x];
    let w = 1;
    while (x + w < row.length && row[x + w] === ch) w++;
    if (ch !== " ") out.push({ x, y, w, c: PAL[ch] });
    x += w;
  }
  return out;
});

// `raise` 0..1 tips the staff forward to cast; `orb` scales the orb's glow.
export const DarkWizard: React.FC<{ px: number; raise?: number; orb?: number; eyes?: number }> = ({
  px,
  raise = 0,
  orb = 1,
  eyes = 1,
}) => {
  // Staff pivots on his hand at (3, 20).
  const angle = -raise * 32;
  return (
    <svg
      width={WIZ.w * px}
      height={WIZ.h * px}
      viewBox={`0 0 ${WIZ.w} ${WIZ.h}`}
      shapeRendering="crispEdges"
      style={{ overflow: "visible" }}
    >
      <defs>
        <radialGradient id="dw-orb">
          <stop offset="0%" stopColor="#e8d8ff" stopOpacity={0.95} />
          <stop offset="35%" stopColor="#b78cff" stopOpacity={0.6} />
          <stop offset="100%" stopColor="#7a3cff" stopOpacity={0} />
        </radialGradient>
        <filter id="dw-eye" x="-2" y="-2" width="5" height="5">
          <feGaussianBlur stdDeviation="0.8" />
        </filter>
      </defs>
      <ellipse cx={WIZ.cx} cy={WIZ.feet + 0.5} rx={12} ry={1.6} fill="#000" opacity={0.45} />
      {RECTS.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={r.c} />
      ))}
      {/* Eye glow */}
      <g opacity={eyes} filter="url(#dw-eye)">
        <rect x={12} y={10} width={2} height={1} fill="#ff4a4a" />
        <rect x={16} y={10} width={2} height={1} fill="#ff4a4a" />
      </g>
      <g transform={`rotate(${angle} 3 20)`}>
        <circle cx={2.5} cy={1.5} r={5 * orb} fill="url(#dw-orb)" shapeRendering="auto" />
        <rect x={2} y={4} width={2} height={35} fill="#2a1a10" />
        <rect x={2} y={4} width={1} height={35} fill="#6b4a2e" />
        <rect x={1} y={0} width={4} height={4} fill="#7a3cff" />
        <rect x={0} y={1} width={6} height={2} fill="#7a3cff" />
        <rect x={1} y={1} width={2} height={2} fill="#e8d8ff" />
        <rect x={1} y={4} width={4} height={1} fill="#0b0710" />
      </g>
      {/* Pale hand over the staff */}
      <rect x={1} y={19} width={4} height={2} fill="#a9b8a2" />
      <rect x={1} y={21} width={4} height={1} fill="#6f7d6a" />
    </svg>
  );
};
