import { HERO_LOOK, OUTFIT, SKIN } from "../config";

// Hero's first-person hands, hand-drawn pixel art in the realm sprite style:
// warm dark outline, three skin tones, nails, knuckles and a ribbed hoodie
// cuff. This is her LEFT hand seen from the back, fingers up; the right hand
// is the same art mirrored.
//
//   o outline   s skin   l light   d shade   n nail   k crease
//   r cuff rib  c sleeve C sleeve shade      . empty
const BACK = [
  "..........ooo.........",
  ".........olndo........",
  "......oooolndo........",
  ".....olndolsdoooo.....",
  ".....olndolsdolndo....",
  ".....olsdolsdolndo....",
  "..oooolsdolkdolsdo....",
  ".olndolkdolsdolsdo....",
  ".olndolsdolsdolkdo....",
  ".olsdolsdolsdolsdo....",
  ".olkdolsdolsdolsdo....",
  ".olsdolsdolsdolsdo....",
  ".olsddlsddlsddlsdo....",
  ".ollskllskllsklsdo....",
  ".olsssssssssssssdoooo.",
  ".olsssssssssssssdolnso",
  ".olsssssssssssssdolsdo",
  ".olsssssssssssssdossdo",
  ".olsssssssssssssskssdo",
  ".olssssssssssssssssdo.",
  ".olsssssssssssssssdo..",
  ".olssssssssssssssdo...",
  "..olssssssssssssdo....",
  "..olssssssssssssdo....",
  "...olssssssssssdo.....",
  "....olssssssssdo......",
  "....olssssssssdo......",
  "...oooooooooooooo.....",
  "..orcrcrcrcrcrcrco....",
  "..orcrcrcrcrcrcrco....",
  "..oCCCCCCCCCCCCCCo....",
  ".occcccccccccccccCCo..",
  ".occcccccccccccccCCo..",
  ".occcccccccccccccCCo..",
];

export const HAND_W = 22;
export const HAND_H = BACK.length;

// Where each finger's 3px interior starts, and the row of its top cap.
const FINGERS = [
  { a: 2, tip: 6 }, // pinky
  { a: 6, tip: 2 }, // ring
  { a: 10, tip: 0 }, // middle
  { a: 14, tip: 3 }, // index
];
const KNUCKLE_ROW = 12;

const rows = (g: string[]) => g.map((r) => r.padEnd(HAND_W, ".").slice(0, HAND_W).split(""));

// Curling the fingers toward the camera: each finger slides down behind the
// knuckles, so less of it shows. curl 1 = half, curl 2 = a fist.
function curl(level: 0 | 1 | 2): string[][] {
  const g = rows(BACK);
  if (level === 0) return g;
  const out = g.map((r) => r.slice());
  const newTips = FINGERS.map((f) =>
    level === 1 ? f.tip + Math.ceil((KNUCKLE_ROW - f.tip) / 2) : KNUCKLE_ROW - 2,
  );
  for (let y = 0; y < KNUCKLE_ROW; y++) for (let x = 0; x < 18; x++) out[y][x] = ".";
  FINGERS.forEach((f, i) => {
    const shift = newTips[i] - f.tip;
    for (let y = newTips[i]; y < KNUCKLE_ROW; y++)
      for (let x = f.a - 1; x <= f.a + 3; x++) {
        const src = g[y - shift][x];
        // Side outlines are shared with the neighbour; only ever add them.
        if (x === f.a - 1 || x === f.a + 3) {
          if (y > newTips[i] && out[y][x] === ".") out[y][x] = "o";
        } else {
          out[y][x] = src === "n" && level === 2 ? "l" : src;
        }
      }
  });
  return out;
}

// The palm side: the back mirrored (the thumb swaps sides), no nails, a
// lighter palm with two creases.
function palm(g: string[][]): string[][] {
  const m = g.map((r) => r.slice().reverse());
  for (let y = 0; y < m.length; y++)
    for (let x = 0; x < HAND_W; x++) {
      if (m[y][x] === "n") m[y][x] = "l";
      if (m[y][x] === "s" && y >= 13 && y < 27) m[y][x] = "p";
    }
  const crease = (y: number, x0: number, x1: number) => {
    for (let x = x0; x <= x1; x++) if (m[y][x] === "p") m[y][x] = "k";
  };
  crease(16, 7, 12);
  crease(17, 13, 15);
  crease(19, 9, 16);
  crease(22, 6, 9);
  return m;
}

const OUTLINE = "#21110d";

const mix = (a: string, b: string, t: number) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
};

function paint(g: string[][]): HTMLCanvasElement {
  const [light, base, shade] = SKIN[HERO_LOOK.skin];
  const [sleeve, sleeveShade] = OUTFIT[HERO_LOOK.outfit];
  const colors: Record<string, string> = {
    o: OUTLINE,
    s: base,
    l: light,
    d: shade,
    n: mix(light, "#ffd9d0", 0.55),
    k: mix(base, shade, 0.7),
    p: mix(base, light, 0.45),
    r: mix(sleeve, "#ffffff", 0.18),
    c: sleeve,
    C: sleeveShade,
  };
  const c = document.createElement("canvas");
  c.width = HAND_W;
  c.height = HAND_H;
  const ctx = c.getContext("2d")!;
  g.forEach((row, y) =>
    row.forEach((ch, x) => {
      if (ch === ".") return;
      ctx.fillStyle = colors[ch];
      ctx.fillRect(x, y, 1, 1);
    }),
  );
  return c;
}

let cache: Record<string, HTMLCanvasElement> | null = null;

export function getHands() {
  if (!cache) {
    cache = {};
    for (const level of [0, 1, 2] as const) {
      const g = curl(level);
      cache[`back${level}`] = paint(g);
      cache[`palm${level}`] = paint(palm(g));
    }
  }
  return cache;
}

export type HandPose = {
  // Screen position of the wrist bottom-centre in low-res pixels.
  x: number;
  y: number;
  curl: 0 | 1 | 2;
  // 1 = back of the hand, -1 = palm, in between = mid-turn.
  turn: number;
  // Right hand: the left hand mirrored.
  mirror?: boolean;
};
