import { random } from "remotion";
import { ACCENT, HERO_LOOK } from "../config";

// The village Hero walks through, in texels (1 texel = 1 art pixel of the
// realm sprites). North is -y. Hero arrives at the bottom of the main path and
// walks north to the row of game houses, laid out like lib/realm/portals.ts:
// Rhyme Time on the left, Spelling Sprint in the middle, Word Match on the right.

export const BOUNDS = { x0: -900, y0: -1100, x1: 900, y1: 300 };

export const MAIN_PATH = { x0: -16, x1: 16, y0: -660, y1: 260 };
export const ROW_PATH = { x0: -330, x1: 330, y0: -700, y1: -660 };
export const HOUSE_Y = -730;
export const HOUSES = [
  { id: "rhyme-time", x: -200, accent: ACCENT.mint },
  { id: "spelling-sprint", x: 0, accent: ACCENT.peach },
  { id: "word-match", x: 200, accent: ACCENT.lavender },
];
export const RING_Y = -680;
export const RING_R = 22;

export const POND = { x: -225, y: -425, rx: 120, ry: 70 };
export const FARM = { x: -250, y: -200, w: 130, h: 70 };

// Where people stand (feet). Partners face each other like lib/realm/townsfolk.ts.
export const SPOTS = {
  guard: { x: -95, y: -120 },
  farmer: { x: -66, y: -120 },
  merchant: { x: 70, y: -340 },
  blacksmith: { x: 99, y: -340 },
  fisherman: { x: -92, y: -420 },
  rowan: { x: 0, y: -470 },
};

// The morning after the Dark Wizard's attack: the realm drained toward grey
// (the stolen words) and burn marks up the main path. Shared by the Arrival
// and the Village so they match.
export const DRAIN = 0.6;
export const SCORCH = [
  { x: -30, y: 70, rx: 16, ry: 11 },
  { x: 24, y: 22, rx: 14, ry: 9 },
  { x: -6, y: -50, rx: 20, ry: 12 },
  { x: 48, y: -130, rx: 18, ry: 11 },
  { x: -52, y: -210, rx: 20, ry: 12 },
  { x: 14, y: -300, rx: 22, ry: 13 },
  { x: -70, y: -380, rx: 18, ry: 11 },
  { x: 60, y: -460, rx: 20, ry: 12 },
  { x: -20, y: -560, rx: 24, ry: 14 },
  { x: 120, y: -640, rx: 18, ry: 10 },
];

export const SHEETS = {
  // Hero's avatar layers, stacked like the app draws them (skin, hair, outfit).
  heroSkin: `realm/hero/skin-tone${HERO_LOOK.skin}.png`,
  heroHair: `realm/hero/hair-${HERO_LOOK.hair}.png`,
  heroOutfit: `realm/hero/outfit-${HERO_LOOK.outfit}.png`,
  rowan: "realm/villager.png",
  dyslexi: "realm/dyslexi.png",
  farmer: "realm/npc_farmer.png",
  guard: "realm/npc_town_guard.png",
  merchant: "realm/npc_merchant.png",
  blacksmith: "realm/npc_blacksmith.png",
  fisherman: "realm/npc_fisherman.png",
  house: "realm/house.png",
  tree: "realm/maple-tree.png",
  fence: "realm/fence.png",
};

const onPath = (x: number, y: number, pad: number) =>
  (x > MAIN_PATH.x0 - pad && x < MAIN_PATH.x1 + pad && y > MAIN_PATH.y0 - pad && y < MAIN_PATH.y1 + pad) ||
  (x > ROW_PATH.x0 - pad && x < ROW_PATH.x1 + pad && y > ROW_PATH.y0 - pad && y < ROW_PATH.y1 + pad);

const inPond = (x: number, y: number, pad: number) =>
  ((x - POND.x) / (POND.rx + pad)) ** 2 + ((y - POND.y) / (POND.ry + pad)) ** 2 < 1;

const inFarm = (x: number, y: number, pad: number) =>
  x > FARM.x - pad && x < FARM.x + FARM.w + pad && y > FARM.y - pad && y < FARM.y + FARM.h + pad;

const nearPeople = (x: number, y: number) =>
  Object.values(SPOTS).some((s) => Math.abs(s.x - x) < 70 && Math.abs(s.y - y) < 50) ||
  (y < HOUSE_Y + 120 && y > HOUSE_Y - 60 && x > -360 && x < 360);

// Trees and bushes, scattered once. Kept off the paths and away from people
// so nothing blocks the camera's line of sight.
export const SCATTER: { kind: "tree" | "bush"; x: number; y: number }[] = (() => {
  const out: { kind: "tree" | "bush"; x: number; y: number }[] = [];
  for (let i = 0; i < 420; i++) {
    const x = BOUNDS.x0 + random(`tree-x-${i}`) * (BOUNDS.x1 - BOUNDS.x0);
    const y = BOUNDS.y0 + random(`tree-y-${i}`) * (BOUNDS.y1 - BOUNDS.y0);
    // Keep a wide corridor open around the main path.
    if (Math.abs(x) < 110 && y > -700) continue;
    if (onPath(x, y, 40) || inPond(x, y, 30) || inFarm(x, y, 30) || nearPeople(x, y)) continue;
    if (out.some((o) => Math.abs(o.x - x) < 34 && Math.abs(o.y - y) < 20)) continue;
    out.push({ kind: random(`tree-k-${i}`) < 0.72 ? "tree" : "bush", x, y });
  }
  return out;
})();

// ---- Ground texture -------------------------------------------------------

const G = {
  // lib/realm/pixelart.ts grass, and the tileset's leafy path edge.
  grass: [0x6a, 0xb0, 0x4c],
  grassDark: [0x5d, 0x9e, 0x41],
  grassLight: [0x7c, 0xc3, 0x5b],
  edge: [0x3f, 0x8a, 0x45],
  edgeDark: [0x2f, 0x6d, 0x4f],
  dirt: [0xee, 0x9d, 0x51],
  dirtDark: [0xd9, 0x85, 0x3f],
  dirtLight: [0xf5, 0xb4, 0x6b],
  stone: [0xb4, 0xa0, 0x7f],
  stoneLight: [0xd6, 0xcf, 0xb8],
  stoneShade: [0x8a, 0x7f, 0x6a],
  water: [0x3f, 0x7f, 0xb0],
  deep: [0x31, 0x64, 0x8f],
  shallow: [0x5a, 0xa3, 0xcd],
  sand: [0xe0, 0xc8, 0x94],
  soil: [0x8a, 0x52, 0x34],
  soilDark: [0x6b, 0x3b, 0x27],
  sprout: [0x3d, 0x99, 0x3d],
  flowers: [
    [0xf7, 0x8f, 0xb3],
    [0xf5, 0xf0, 0xe1],
    [0xf6, 0xcf, 0x5d],
  ],
};

// Same seeded generators as lib/realm (pixelart.ts, tilemap.ts), so the tiles
// come out identical to the ones in the app.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash01(x: number, y: number, seed: number) {
  let h = x * 374761393 + y * 668265263 + seed * 2246822519;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 4294967295;
}

const TILE = 16;

// A 16x16 grass tile: flat green with a dozen 1px light/dark speckles.
function grassTile(seed: number): number[][][] {
  const t = Array.from({ length: TILE }, () => Array<number[]>(TILE).fill(G.grass));
  const rand = mulberry32(seed);
  for (let i = 0; i < 12; i++) {
    const c = rand() < 0.5 ? G.grassDark : G.grassLight;
    const x = Math.floor(rand() * TILE);
    const y = Math.floor(rand() * TILE);
    const tall = rand() < 0.3;
    t[y][x] = c;
    if (tall && y + 1 < TILE) t[y + 1][x] = c;
  }
  return t;
}

// A grass tile with two or three 2px flowers, yellow centres.
function flowerTile(seed: number): number[][][] {
  const t = grassTile(seed);
  const rand = mulberry32(seed * 7 + 1);
  const count = 2 + Math.floor(rand() * 2);
  for (let i = 0; i < count; i++) {
    const fx = 2 + Math.floor(rand() * (TILE - 4));
    const fy = 2 + Math.floor(rand() * (TILE - 4));
    const c = G.flowers[Math.floor(rand() * G.flowers.length)];
    t[fy][fx + 1] = c;
    t[fy + 1][fx] = c;
    t[fy + 1][fx + 1] = c;
    t[fy][fx] = G.flowers[2];
  }
  return t;
}

// `mip` is the floor averaged over 4x4 texels, used in the distance so the
// speckles don't shimmer.
export type Ground = { w: number; h: number; ox: number; oy: number; px: Uint32Array; mip: Uint32Array };

const pack = ([r, g, b]: number[]) => (255 << 24) | (b << 16) | (g << 8) | r;

let ground: Ground | null = null;

// Paints the whole village floor once into a texel array, with the realm's
// own grass tiles, flowers, path, water and farm colours.
export function getGround(): Ground {
  if (ground) return ground;
  const w = BOUNDS.x1 - BOUNDS.x0;
  const h = BOUNDS.y1 - BOUNDS.y0;
  const ox = -BOUNDS.x0;
  const oy = -BOUNDS.y0;
  const px = new Uint32Array(w * h);
  const set = (x: number, y: number, c: number[]) => {
    const ix = Math.round(x) + ox;
    const iy = Math.round(y) + oy;
    if (ix >= 0 && iy >= 0 && ix < w && iy < h) px[iy * w + ix] = pack(c);
  };

  // Grass, tile by tile like lib/realm/tilemap.ts: 22% flower tiles, the
  // rest one of four speckled grass tiles.
  const grass = [grassTile(11), grassTile(23), grassTile(37), grassTile(51)].map((t) => t.map((row) => row.map(pack)));
  const flowers = [flowerTile(101), flowerTile(113)].map((t) => t.map((row) => row.map(pack)));
  for (let ty = 0; ty < Math.ceil(h / TILE); ty++)
    for (let tx = 0; tx < Math.ceil(w / TILE); tx++) {
      const tile =
        hash01(tx, ty, 777) < 0.22 ? flowers[Math.floor(hash01(tx, ty, 556) * 2)] : grass[Math.floor(hash01(tx, ty, 557) * 4)];
      for (let y = 0; y < TILE; y++)
        for (let x = 0; x < TILE; x++) {
          const ix = tx * TILE + x;
          const iy = ty * TILE + y;
          if (ix < w && iy < h) px[iy * w + ix] = tile[y][x];
        }
    }

  // Pond: sand rim, shallows, water.
  for (let y = -POND.ry - 12; y <= POND.ry + 12; y++)
    for (let x = -POND.rx - 12; x <= POND.rx + 12; x++) {
      const e = (x / POND.rx) ** 2 + (y / POND.ry) ** 2;
      if (e < 0.55) set(POND.x + x, POND.y + y, G.deep);
      else if (e < 0.85) set(POND.x + x, POND.y + y, G.water);
      else if (e < 1) set(POND.x + x, POND.y + y, G.shallow);
      else if (e < 1.18) set(POND.x + x, POND.y + y, G.sand);
    }

  // Farm: soil with furrows and sprouts.
  for (let y = 0; y < FARM.h; y++)
    for (let x = 0; x < FARM.w; x++) {
      const furrow = y % 10 >= 7;
      const sprout = !furrow && y % 10 === 3 && x % 8 === 3;
      set(FARM.x + x, FARM.y + y, sprout ? G.sprout : furrow ? G.soilDark : G.soil);
      if (sprout) set(FARM.x + x, FARM.y + y - 1, G.sprout);
    }

  // Paths: dirt with light speckle, and the tileset's leafy grass edge
  // hanging over it: a ragged dark-green fringe with a shadow under it.
  const paintPath = (p: { x0: number; x1: number; y0: number; y1: number }) => {
    for (let y = p.y0; y < p.y1; y++)
      for (let x = p.x0; x < p.x1; x++) set(x, y, hash01(x, y, 555) < 0.035 ? G.dirtLight : G.dirt);
  };
  const fringe = (p: { x0: number; x1: number; y0: number; y1: number }) => {
    const leaf = (x: number, y: number, depth: number, dx: number, dy: number) => {
      for (let i = 0; i < depth; i++) set(x + dx * i, y + dy * i, i === depth - 1 ? G.edgeDark : G.edge);
      set(x + dx * depth, y + dy * depth, G.dirtDark);
    };
    const ragged = (a: number, b: number) => 1 + Math.floor(hash01(a, b, 901) * 2.4);
    for (let y = p.y0; y < p.y1; y++) {
      leaf(p.x0, y, ragged(p.x0, y), 1, 0);
      leaf(p.x1 - 1, y, ragged(p.x1, y), -1, 0);
    }
    for (let x = p.x0; x < p.x1; x++) {
      leaf(x, p.y0, ragged(x, p.y0), 0, 1);
      leaf(x, p.y1 - 1, ragged(x, p.y1), 0, -1);
    }
  };
  const paths = [MAIN_PATH, ROW_PATH, ...HOUSES.map((hs) => ({ x0: hs.x - 14, x1: hs.x + 14, y0: HOUSE_Y - 6, y1: ROW_PATH.y0 + 4 }))];
  for (const p of paths) fringe(p);
  // Dirt goes down after every fringe, so where two paths meet the fringe
  // between them is covered and they join cleanly.
  for (const p of paths) paintPath({ x0: p.x0 + 3, x1: p.x1 - 3, y0: p.y0 + 3, y1: p.y1 - 3 });

  // Stepping-stone pebbles along both edges of the main path.
  const pebble = (cx: number, cy: number) => {
    // Rounded stone: light top-left, shaded bottom edge, no hard outline on top.
    for (let y = -3; y <= 3; y++)
      for (let x = -4; x <= 4; x++) {
        const e = (x / 4.2) ** 2 + (y / 3.2) ** 2;
        if (e >= 1) continue;
        const c = y >= 2 || (e > 0.7 && y > 0) ? G.stoneShade : x + y < -3 ? G.stoneLight : G.stone;
        set(cx + x, cy + y, c);
      }
    for (let x = -3; x <= 3; x++) set(cx + x, cy + 4, G.grassDark);
  };
  for (let y = MAIN_PATH.y1 - 20; y > MAIN_PATH.y0 + 10; y -= 46) {
    pebble(MAIN_PATH.x0 - 9, y + random(`pb-l${y}`) * 10);
    pebble(MAIN_PATH.x1 + 9, y + 20 + random(`pb-r${y}`) * 10);
  }

  // 4x4 box-averaged copy for distant floor.
  const mip = new Uint32Array(w * h);
  const mw = Math.ceil(w / 4);
  const mh = Math.ceil(h / 4);
  for (let my = 0; my < mh; my++)
    for (let mx = 0; mx < mw; mx++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let n = 0;
      for (let y = my * 4; y < Math.min(h, my * 4 + 4); y++)
        for (let x = mx * 4; x < Math.min(w, mx * 4 + 4); x++) {
          const c = px[y * w + x];
          r += c & 255;
          g += (c >> 8) & 255;
          b += (c >> 16) & 255;
          n++;
        }
      const avg = (255 << 24) | (Math.round(b / n) << 16) | (Math.round(g / n) << 8) | Math.round(r / n);
      for (let y = my * 4; y < Math.min(h, my * 4 + 4); y++)
        for (let x = mx * 4; x < Math.min(w, mx * 4 + 4); x++) mip[y * w + x] = avg;
    }

  ground = { w, h, ox, oy, px, mip };
  return ground;
}
