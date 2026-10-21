import React from "react";
import { AbsoluteFill, random } from "remotion";
import { Bush, Crop, House, Tree } from "../components/Sprite";
import { GROUND, Layer } from "../hero/NightVillage";

// The village for the intro: the same road and trees as hero/NightVillage's
// Backdrop, but it runs a long way further left so Elder Rowan can walk in
// from the middle of the village. Everything from x = -340 rightwards is drawn
// with the same seeds as the original, so it matches the duel at the cut. The
// new houses and lamps all sit left of what the duel's camera can see.

const PX = 7;
// Ground pattern tile is 16 art pixels; the extension is a whole number of tiles.
const EXT = 16 * PX * 15;

const N = {
  grass: "#2f5a3e",
  grassDark: "#244a33",
  grassLight: "#3d6e4c",
  edge: "#1d3b2a",
  dirt: "#7a5a48",
  dirtLight: "#94725c",
  ridge: "#141a3a",
  ridgeLit: "#2a3566",
  hill: "#1b2448",
};

const LampPost: React.FC<{ on: number; f: number; seed: string }> = ({ on, f, seed }) => {
  const flick = on * (0.85 + 0.15 * Math.sin(f / 3 + random(seed) * 9));
  return (
    <div style={{ position: "relative", width: 10 * PX, height: 34 * PX }}>
      <div
        style={{
          position: "absolute",
          left: 5 * PX - 220,
          top: 5 * PX - 220,
          width: 440,
          height: 440,
          borderRadius: "50%",
          background: "radial-gradient(#ffcf7a88, #ffb24a22 40%, transparent 68%)",
          opacity: flick,
        }}
      />
      <svg width={10 * PX} height={34 * PX} viewBox="0 0 10 34" shapeRendering="crispEdges" style={{ position: "absolute", inset: 0 }}>
        <rect x={4} y={9} width={2} height={25} fill="#1c130d" />
        <rect x={4} y={9} width={1} height={25} fill="#3a2a1d" />
        <rect x={3} y={32} width={4} height={2} fill="#1c130d" />
        <rect x={2} y={1} width={6} height={1} fill="#120c08" />
        <rect x={2} y={2} width={6} height={6} fill="#120c08" />
        <rect x={3} y={3} width={4} height={4} fill={on > 0.5 ? "#ffd98f" : "#3a3138"} opacity={on > 0.5 ? flick : 1} />
        <rect x={4} y={0} width={2} height={1} fill="#120c08" />
        <rect x={3} y={8} width={4} height={1} fill="#120c08" />
      </svg>
    </div>
  );
};

// Same rows as the original, plus more to the left (indices below the
// original range keep the original's seeds for everything that overlaps).
const ROW_TREES = [
  -2100, -1900, -1700, -1500, -1320, -1140, -960, -800, -620, -440, -260, -60, 120, 330, 470, 700, 900, 1100, 1260, 1480, 1640, 1860, 2060, 2280, 2470, 2700, 2900, 3120, 3330, 3560, 3740,
];
const ROW_OFFSET = 10; // so the original trees keep their index (and so their size and kind)

// Lit lamps along the village road, all left of x = 0 (the duel's lamp at 180
// stays the one that lives; 1660 is the one that dies).
const LAMPS = [
  { x: 180, dark: false },
  { x: 1660, dark: true },
  { x: -300, dark: false },
  { x: -760, dark: false },
  { x: -1220, dark: false },
  { x: -1680, dark: false },
];

// Houses of the village, behind the road. Layer space at depth 0.8.
const HOUSES = [
  { x: -250, s: 3.3, p: 0 },
  { x: -700, s: 3, p: 4 },
  { x: -1180, s: 3.5, p: 8 },
  { x: -1640, s: 3.1, p: 2 },
  { x: -2100, s: 3.4, p: 6 },
];

const BASE = 670;

export const IntroBackdrop: React.FC<{ f: number; cam: number; corrupt: number; lampsOut: number; day?: number }> = ({ f, cam, corrupt, lampsOut, day = 0 }) => (
  <AbsoluteFill style={day > 0 ? { filter: `brightness(${1 + 1.2 * day}) saturate(${1 + 0.35 * day}) sepia(${0.3 * day})` } : undefined}>
    {/* Ridges */}
    <Layer cam={cam} depth={0.15}>
      <svg width={2400} height={1080} viewBox="0 0 600 270" shapeRendering="crispEdges" style={{ position: "absolute", left: -240, top: 0 }}>
        <path
          d="M0 140 L30 126 L52 132 L80 112 L104 124 L130 104 L160 122 L196 110 L224 126 L260 98 L292 118 L330 106 L360 124 L400 96 L430 114 L466 102 L500 122 L540 108 L570 120 L600 112 V270 H0 Z"
          fill={N.ridge}
        />
        <path d="M30 126 L52 132 M80 112 L104 124 M130 104 L160 122 M260 98 L292 118 M400 96 L430 114" stroke={N.ridgeLit} strokeWidth={1.5} />
        <path d="M0 160 L60 150 L120 156 L200 146 L280 154 L360 148 L440 156 L520 148 L600 154 V270 H0 Z" fill={N.hill} />
      </svg>
    </Layer>
    {/* Treeline silhouette */}
    <Layer cam={cam} depth={0.35}>
      {Array.from({ length: 56 + 24 }, (_, k) => {
        const i = k - 24;
        const x = -300 + i * 76 + random(`tl-x${i}`) * 30;
        const s = 3 + random(`tl-s${i}`) * 1.4;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: 640 - 46 * s, filter: "brightness(0.16) saturate(0.6) hue-rotate(60deg)" }}>
            <Tree scale={s} />
          </div>
        );
      })}
      <div style={{ position: "absolute", left: -2400, right: -400, top: 636, height: 60, background: "#0e1a22" }} />
    </Layer>
    {/* Village houses, between the treeline and the near trees */}
    <Layer cam={cam} depth={0.8}>
      {HOUSES.map((h, i) => (
        <div key={i} style={{ position: "absolute", left: h.x, top: 742 - 136 * h.s, filter: "brightness(0.8)" }}>
          <House scale={h.s} phase={h.p} />
        </div>
      ))}
    </Layer>
    {/* Near trees */}
    <Layer cam={cam} depth={0.6}>
      <div style={{ position: "absolute", left: -2800, right: -500, top: BASE - 20, height: 400, background: "#1d3a2b" }} />
      {ROW_TREES.map((x, k) => {
        const i = k - ROW_OFFSET;
        const bush = (((i % 4) + 4) % 4) === 3;
        const ts = 3 + (((i % 3) + 3) % 3) * 0.5;
        return (
          <div
            key={k}
            style={{ position: "absolute", left: x, top: BASE - (bush ? 33 * 3.6 : 46 * ts) + 6, filter: "brightness(0.36) saturate(0.7) hue-rotate(25deg)" }}
          >
            {bush ? <Bush scale={3.6} /> : <Tree scale={ts} />}
          </div>
        );
      })}
    </Layer>
    {/* Ground: grass, the road, stones */}
    <Layer cam={cam} depth={1}>
      <svg width={4200 + EXT} height={430} style={{ position: "absolute", left: -340 - EXT, top: 650 }} shapeRendering="crispEdges">
        <defs>
          <pattern id="iv-grass" width={16 * PX} height={16 * PX} patternUnits="userSpaceOnUse">
            <rect width={16 * PX} height={16 * PX} fill={N.grass} />
            {Array.from({ length: 12 }, (_, i) => (
              <rect
                key={i}
                x={Math.floor(random(`gp-x${i}`) * 16) * PX}
                y={Math.floor(random(`gp-y${i}`) * 16) * PX}
                width={PX}
                height={(random(`gp-t${i}`) < 0.3 ? 2 : 1) * PX}
                fill={i % 2 ? N.grassDark : N.grassLight}
              />
            ))}
          </pattern>
        </defs>
        <rect width={4200 + EXT} height={430} fill="url(#iv-grass)" />
        <rect width={4200 + EXT} height={PX} fill={N.edge} />
        <rect x={0} y={GROUND - 650 - 40} width={4200 + EXT} height={84} fill={N.dirt} />
        {Array.from({ length: (4200 + EXT) / PX }, (_, j) => {
          const i = j - EXT / PX;
          return (
            <React.Fragment key={j}>
              <rect x={j * PX} y={GROUND - 650 - 40} width={PX} height={(1 + Math.floor(random(`fr-t${i}`) * 2.4)) * PX} fill={N.edge} />
              <rect
                x={j * PX}
                y={GROUND - 650 + 44 - (1 + Math.floor(random(`fr-b${i}`) * 2.4)) * PX}
                width={PX}
                height={(1 + Math.floor(random(`fr-b${i}`) * 2.4)) * PX}
                fill={N.edge}
              />
              {random(`dl${i}`) < 0.05 && <rect x={j * PX} y={GROUND - 650 - 10 + Math.floor(random(`dy${i}`) * 6) * PX} width={PX} height={PX} fill={N.dirtLight} />}
            </React.Fragment>
          );
        })}
      </svg>
      {Array.from({ length: 22 + 9 }, (_, k) => {
        const i = k - 9;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: -300 + i * 190 + random(`st${i}`) * 60,
              top: GROUND + 50 + random(`sy${i}`) * 20,
              filter: "brightness(0.45) saturate(0.6)",
            }}
          >
            <Crop src="realm/path-decor.png" sheetW={80} sheetH={64} x={0} y={0} w={16} h={16} scale={4} />
          </div>
        );
      })}
      {LAMPS.map((l, i) => (
        <div key={i} style={{ position: "absolute", left: l.x, top: GROUND - 60 - 34 * PX }}>
          <LampPost on={l.dark ? 1 - lampsOut : 1} f={f} seed={`lamp${i}`} />
        </div>
      ))}
    </Layer>
    {/* The Wizard's fog along the ground */}
    <Layer cam={cam} depth={1}>
      {Array.from({ length: 12 }, (_, i) => {
        const x = 2000 - ((f * (0.8 + random(`fg-s${i}`)) + random(`fg-x${i}`) * 900) % 1500);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: GROUND - 60 + random(`fg-y${i}`) * 90,
              width: 360,
              height: 70,
              borderRadius: "50%",
              background: i % 2 ? "#5a2a7a" : "#3a1a55",
              filter: "blur(18px)",
              opacity: corrupt * 0.55 * Math.min(1, (x - 500) / 500),
            }}
          />
        );
      })}
    </Layer>
  </AbsoluteFill>
);
