import React from "react";
import { AbsoluteFill, interpolateColors, random } from "remotion";
import { Bush, Crop, Tree } from "../components/Sprite";
import { C } from "../theme";
import { ACCENT } from "./config";

// The village at night, side-on, for the Summoning. Layers scroll at
// different speeds against the camera (`cam` = world x at screen centre).
// Rowan's side keeps the moon and the lamps; the Wizard's side goes dark
// as `corrupt` rises: lamps die, fog creeps in, the sky bruises purple.
// `day` (0..1) lifts the same set to golden hour for the narrated opening.

export const GROUND = 770;
const PX = 7;

const N = {
  grass: "#2f5a3e",
  grassDark: "#244a33",
  grassLight: "#3d6e4c",
  edge: "#1d3b2a",
  dirt: "#7a5a48",
  dirtDark: "#5e4436",
  dirtLight: "#94725c",
  ridge: "#141a3a",
  ridgeLit: "#2a3566",
  hill: "#1b2448",
};

// Horizontal offset for a layer: `depth` 0 = fixed to the sky, 1 = moves with the ground.
const shift = (cam: number, depth: number) => -(cam - 960) * depth;

export const Layer: React.FC<{ cam: number; depth: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ cam, depth, children, style }) => (
  <AbsoluteFill style={{ transform: `translateX(${shift(cam, depth)}px)`, ...style }}>{children}</AbsoluteFill>
);

// Stepped pixel cloud, in 8px art pixels.
const CLOUD = [
  [6, 0, 10, 1],
  [3, 1, 18, 1],
  [1, 2, 26, 2],
  [0, 4, 34, 2],
  [4, 6, 24, 1],
];
const Cloud: React.FC<{ x: number; y: number; s: number; color: string; rim: string }> = ({ x, y, s, color, rim }) => (
  <svg width={34 * s} height={7 * s} viewBox="0 0 34 7" shapeRendering="crispEdges" style={{ position: "absolute", left: x, top: y }}>
    {CLOUD.map(([cx, cy, w, h], i) => (
      <rect key={i} x={cx} y={cy} width={w} height={h} fill={color} />
    ))}
    <rect x={6} y={0} width={10} height={1} fill={rim} />
    <rect x={3} y={1} width={3} height={1} fill={rim} />
  </svg>
);

export const NightSky: React.FC<{ f: number; cam: number; corrupt: number; flash: number; lit: number; litX: number; day?: number }> = ({
  f,
  cam,
  corrupt,
  flash,
  lit,
  litX,
  day = 0,
}) => (
  <AbsoluteFill style={{ background: "linear-gradient(#050817 0%, #0e1838 45%, #233063 78%, #34407a 100%)" }}>
    {/* The Wizard's side bruises purple */}
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 85% 75%, #6a1f55, #2a0f3a 45%, transparent 75%)", opacity: corrupt * 0.9 }} />
    <Layer cam={cam} depth={0.04}>
      {Array.from({ length: 120 }, (_, i) => {
        const tw = 0.3 + 0.7 * Math.abs(Math.sin(f / (9 + (i % 7)) + i));
        const big = i % 11 === 0;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: Math.round((random(`ns-x${i}`) * 2200 - 140) / 4) * 4,
              top: Math.round((random(`ns-y${i}`) * random(`ns-z${i}`) * 560) / 4) * 4,
              width: big ? 8 : 4,
              height: big ? 8 : 4,
              background: i % 5 === 0 ? "#cfe0ff" : C.cream,
              opacity: tw * (big ? 1 : 0.7),
              boxShadow: big ? "0 0 10px #cfe0ff" : undefined,
            }}
          />
        );
      })}
      {/* Moon over Rowan's side */}
      <div
        style={{
          position: "absolute",
          left: 120,
          top: -20,
          width: 440,
          height: 440,
          borderRadius: "50%",
          background: "radial-gradient(#f6efd655, #f6efd611 45%, transparent 70%)",
        }}
      />
      <svg width={198} height={198} viewBox="0 0 22 22" shapeRendering="crispEdges" style={{ position: "absolute", left: 240, top: 100 }}>
        {Array.from({ length: 22 }, (_, y) =>
          Array.from({ length: 22 }, (_, x) => {
            const d = Math.hypot(x - 10.5, y - 10.5);
            if (d > 10) return null;
            const crater =
              Math.hypot(x - 7, y - 8) < 2.2 || Math.hypot(x - 14, y - 13) < 1.6 || Math.hypot(x - 12, y - 5) < 1.2 || Math.hypot(x - 6, y - 15) < 1;
            const shade = x + y > 27 && d > 6;
            return <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={crater ? "#d6caa4" : shade ? "#ddd3b4" : d > 8.8 ? "#ebe2c4" : "#f8f1da"} />;
          }),
        )}
      </svg>
    </Layer>
    {/* Golden hour: warm sky and a low sun, drained away as `day` falls */}
    <AbsoluteFill style={{ background: "linear-gradient(#5d79c4 0%, #c98fa8 42%, #f4b47c 70%, #ffd89a 88%)", opacity: day }}>
      <Layer cam={cam} depth={0.04}>
        <div
          style={{
            position: "absolute",
            left: 1300,
            top: 280,
            width: 520,
            height: 520,
            borderRadius: "50%",
            background: "radial-gradient(#fff3c8, #ffd27a99 25%, #ffb45a33 50%, transparent 70%)",
          }}
        />
        <svg width={176} height={176} viewBox="0 0 22 22" shapeRendering="crispEdges" style={{ position: "absolute", left: 1472, top: 452 }}>
          {Array.from({ length: 22 }, (_, y) =>
            Array.from({ length: 22 }, (_, x) => {
              const d = Math.hypot(x - 10.5, y - 10.5);
              return d > 10 ? null : <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={d > 8.6 ? "#ffd27a" : "#fff1c2"} />;
            }),
          )}
        </svg>
      </Layer>
    </AbsoluteFill>
    {/* Clouds drift right to left; storm clouds pile up over the Wizard */}
    {Array.from({ length: 9 }, (_, i) => {
      const storm = i >= 5;
      const speed = 0.25 + random(`nc-s${i}`) * 0.35;
      const x = ((((random(`nc-x${i}`) * 2600 - f * speed) % 2600) + 2600) % 2600) - 400;
      const s = storm ? 10 + random(`nc-w${i}`) * 4 : 6 + random(`nc-w${i}`) * 4;
      return (
        <div key={i} style={{ opacity: storm ? corrupt * 0.95 : 0.55 }}>
          <Cloud
            x={storm ? 1000 + random(`nc-x${i}`) * 900 - f * 0.15 : Math.round(x / 8) * 8}
            y={storm ? 20 + (i - 5) * 70 : 80 + random(`nc-y${i}`) * 260}
            s={s}
            color={storm ? "#1c0d2c" : interpolateColors(day, [0, 1], ["#1a2550", "#d98a86"])}
            rim={storm ? "#4a2366" : interpolateColors(day, [0, 1], ["#33427a", "#ffd9a0"])}
          />
        </div>
      );
    })}
    {/* Lightning when he casts */}
    {flash > 0 && (
      <>
        <AbsoluteFill style={{ background: "radial-gradient(ellipse at 80% 20%, #c9a8ff, transparent 70%)", opacity: flash * 0.45 }} />
        <svg width={1920} height={600} viewBox="0 0 480 150" shapeRendering="crispEdges" style={{ position: "absolute", left: 0, top: 0, opacity: flash }}>
          {(() => {
            const seed = Math.floor(f / 20);
            let x = 330 + random(`lt${seed}`) * 120;
            const pts: string[] = [`${x},0`];
            for (let y = 10; y <= 110; y += 10) {
              x += (random(`lt${seed}-${y}`) - 0.5) * 22;
              pts.push(`${Math.round(x)},${y}`);
            }
            return <polyline points={pts.join(" ")} fill="none" stroke="#efe2ff" strokeWidth={2} />;
          })()}
        </svg>
      </>
    )}
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at ${litX}px 330px, ${ACCENT.mint}77, transparent 55%)`, opacity: lit }} />
  </AbsoluteFill>
);

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

// Near tree row behind the road, and lamps along it.
// Runs to about x 3,700 so the Village can walk the whole road.
const ROW_TREES = [-260, -60, 120, 330, 470, 700, 900, 1100, 1260, 1480, 1640, 1860, 2060, 2280, 2470, 2700, 2900, 3120, 3330, 3560, 3740];
const LAMPS = [
  { x: 180, dark: false },
  { x: 1660, dark: true },
];
const BASE = 670;

export const Backdrop: React.FC<{ f: number; cam: number; corrupt: number; lampsOut: number; day?: number }> = ({ f, cam, corrupt, lampsOut, day = 0 }) => (
  <AbsoluteFill style={day > 0 ? { filter: `brightness(${1 + 1.2 * day}) saturate(${1 + 0.35 * day}) sepia(${0.3 * day})` } : undefined}>
    {/* Moonlit ridges */}
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
      {Array.from({ length: 56 }, (_, i) => {
        const x = -300 + i * 76 + random(`tl-x${i}`) * 30;
        const s = 3 + random(`tl-s${i}`) * 1.4;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: 640 - 46 * s, filter: "brightness(0.16) saturate(0.6) hue-rotate(60deg)" }}>
            <Tree scale={s} />
          </div>
        );
      })}
      <div style={{ position: "absolute", left: -400, right: -400, top: 636, height: 60, background: "#0e1a22" }} />
    </Layer>
    {/* Near trees */}
    <Layer cam={cam} depth={0.6}>
      <div style={{ position: "absolute", left: -500, right: -500, top: BASE - 20, height: 400, background: "#1d3a2b" }} />
      {ROW_TREES.map((x, i) => (
        <div
          key={i}
          style={{ position: "absolute", left: x, top: BASE - (i % 4 === 3 ? 33 * 3.6 : 46 * (3 + (i % 3) * 0.5)) + 6, filter: "brightness(0.36) saturate(0.7) hue-rotate(25deg)" }}
        >
          {i % 4 === 3 ? <Bush scale={3.6} /> : <Tree scale={3 + (i % 3) * 0.5} />}
        </div>
      ))}
    </Layer>
    {/* Ground: grass, the road, stones */}
    <Layer cam={cam} depth={1}>
      <svg width={4200} height={430} style={{ position: "absolute", left: -340, top: 650 }} shapeRendering="crispEdges">
        <defs>
          <pattern id="nv-grass" width={16 * PX} height={16 * PX} patternUnits="userSpaceOnUse">
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
        <rect width={4200} height={430} fill="url(#nv-grass)" />
        <rect width={4200} height={PX} fill={N.edge} />
        {/* Road, with a ragged leafy fringe like the realm's paths */}
        <rect x={0} y={GROUND - 650 - 40} width={4200} height={84} fill={N.dirt} />
        {Array.from({ length: 4200 / PX }, (_, i) => (
          <React.Fragment key={i}>
            <rect x={i * PX} y={GROUND - 650 - 40} width={PX} height={(1 + Math.floor(random(`fr-t${i}`) * 2.4)) * PX} fill={N.edge} />
            <rect
              x={i * PX}
              y={GROUND - 650 + 44 - (1 + Math.floor(random(`fr-b${i}`) * 2.4)) * PX}
              width={PX}
              height={(1 + Math.floor(random(`fr-b${i}`) * 2.4)) * PX}
              fill={N.edge}
            />
            {random(`dl${i}`) < 0.05 && (
              <rect x={i * PX} y={GROUND - 650 - 10 + Math.floor(random(`dy${i}`) * 6) * PX} width={PX} height={PX} fill={N.dirtLight} />
            )}
          </React.Fragment>
        ))}
      </svg>
      {Array.from({ length: 22 }, (_, i) => (
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
      ))}
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

// Leaves right up against the lens, soft and out of focus, poking into the
// bottom corners. They slide past faster than anything in the world, which
// sells the depth whenever the camera moves. Drawn over the zoomed world, so
// they stay the same size in close-ups.
const LENS_LEAVES = [
  { x: -120, y: 1010, r: 230 },
  { x: 380, y: 1120, r: 170 },
  { x: 1700, y: 1060, r: 260 },
  { x: 2350, y: 1100, r: 190 },
  { x: 3050, y: 1030, r: 240 },
];
export const LensFoliage: React.FC<{ f: number; cam: number; day?: number }> = ({ f, cam, day = 0 }) => {
  const leaf = interpolateColors(day, [0, 1], ["#050c09", "#1a2c12"]);
  const rim = interpolateColors(day, [0, 1], ["#0c1a14", "#6b7a2a"]);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", filter: "blur(9px)" }}>
      {LENS_LEAVES.map((l, i) => {
        const x = l.x - (cam - 960) * 1.9 + Math.sin(f / 35 + i) * 10;
        return (
          <div key={i} style={{ position: "absolute", left: x - l.r, top: l.y - l.r, width: l.r * 2, height: l.r * 2 }}>
            {[0, 1, 2, 3, 4].map((k) => {
              const a = (k / 5) * Math.PI * 2 + i;
              const rr = l.r * (0.45 + 0.12 * (k % 2));
              return (
                <div
                  key={k}
                  style={{
                    position: "absolute",
                    left: l.r + Math.cos(a) * l.r * 0.45 - rr,
                    top: l.r + Math.sin(a) * l.r * 0.4 - rr,
                    width: rr * 2,
                    height: rr * 1.6,
                    borderRadius: "50%",
                    background: `radial-gradient(ellipse at 40% 25%, ${rim}, ${leaf} 55%)`,
                    transform: `rotate(${a * 30}deg)`,
                  }}
                />
              );
            })}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// Dark grass and bushes in front of the action, framing the bottom of the shot.
export const Foreground: React.FC<{ f: number; cam: number; day?: number }> = ({ f, cam, day = 0 }) => (
  <Layer cam={cam} depth={1.35} style={{ pointerEvents: "none", filter: day > 0 ? `brightness(${1 + 1.4 * day}) sepia(${0.3 * day})` : undefined }}>
    <svg width={4600} height={260} viewBox={`0 0 ${4600 / PX} ${260 / PX}`} shapeRendering="crispEdges" style={{ position: "absolute", left: -440, top: 860 }}>
      {Array.from({ length: Math.floor(4600 / PX / 2) }, (_, i) => {
        // Tufts in clumps: tall in the middle of a clump, gaps between.
        const clump = Math.sin(i * 0.23) + Math.sin(i * 0.071 + 2) + random(`fgc${i}`) * 0.8;
        if (clump < 0.2) return null;
        const h = Math.round(2 + clump * 3 + random(`fgr${i}`) * 4);
        const sway = Math.round(Math.sin(f / 18 + i * 0.4) * 0.8);
        return <rect key={i} x={i * 2 + sway} y={260 / PX - h - 18} width={1} height={h} fill={i % 3 ? "#10241a" : "#16301f"} />;
      })}
      <rect x={0} y={260 / PX - 19} width={4600 / PX} height={20} fill="#0c1c14" />
    </svg>
    {[
      { x: -60, s: 9 },
      { x: 1700, s: 11 },
      { x: 2120, s: 8 },
    ].map((b, i) => (
      <div key={i} style={{ position: "absolute", left: b.x, top: 1080 - 33 * b.s + 90, filter: "brightness(0.1) saturate(0.4) hue-rotate(50deg)" }}>
        <Bush scale={b.s} />
      </div>
    ))}
  </Layer>
);
