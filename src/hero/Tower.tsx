import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, Easing, interpolate, random, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { Sprite } from "../components/Sprite";
import { Dialogue } from "../lore/parts";
import { BODY, C } from "../theme";
import { MUSIC_SKIP } from "./config";
import { DarkWizard, WIZ } from "./DarkWizard";
import { DYSLEXI_COLOR, DyslexiBuddy } from "./hud/Dyslexi";
import { getHands, HAND_H, HAND_W } from "./realm/hands";
import { Cam, Pov } from "./realm/Pov";
import { SwimWord } from "./realm/swim";
import { DRAIN, SCORCH, SHEETS } from "./realm/world";
import { ROWAN_SAT } from "./Strike";
import { villageActors } from "./Village";

// Scene 9 of Episode 1 (docs/EPISODE-1.md): the tower. Hero crosses the grey
// land to the Dark Wizard's tower. Its door is sealed with a scrambled word;
// she reads it too fast, then slows down and works it out letter by letter:
// OPEN. At the top, Dyslexi hangs in her cage of letters over a pit of stolen
// words. The Wizard throws a storm of swimming letters at her; everything goes
// quiet; she hears Rowan: one word at a time. The cage's lock is a word, and
// she reads it, slowly: FREE. The cage shatters, the storm's letters line up
// neat and still, the stolen words pour out of his cracking orb and away out
// of the window, and he's blown back into the shadows.
//
// The lines are text only for now, timed to be read comfortably, until
// they're recorded.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const TOWER_FRAMES = 2240;

// ---- Beats -----------------------------------------------------------------------

// The journey (first person, in the realm world).
const SHOT2 = 130;
const TO_DOOR = 250;
// The door.
const DOOR = { in: 280, glow: 300, tooFast: 322, breathe: 410, touch: 440, slide: 452, read: 470, open: 568, out: 616 };
// The top of the tower.
const ROOM = 650;
const STORM = { from: 880, full: 960, quiet: 1000 };
const ECHO = 1100;
const FOCUS = { from: 1180, to: 1240 };
const SAY = 1250;
const FREE_CHUNKS = [
  { letters: [0], at: SAY },
  { letters: [1], at: SAY + 50 },
  { letters: [2, 3], at: SAY + 100 },
];
const FREE_WHOLE = SAY + 160;
const BLAST = 1470;
const POUR = 1560;
const CRACK = 1610;
const BLOWN = { from: 1700, to: 1860 };
const WINDOW_OUT = { from: 2060, to: TOWER_FRAMES };

type Who = "hero" | "wizard" | "dyslexi";
type Line = { from: number; dur: number; who: Who; text: string; reveal?: [number, number][] };
const LINES: Line[] = [
  {
    from: DOOR.tooFast,
    dur: 78,
    who: "hero",
    text: "Nep... o? Nepo?",
  },
  {
    from: DOOR.read,
    dur: 96,
    who: "hero",
    text: "O... p... e... n... OPEN!",
    reveal: [
      [0, 0],
      [1, 4],
      [16, 4],
      [17, 9],
      [32, 9],
      [33, 14],
      [48, 14],
      [49, 19],
      [66, 19],
      [67, 25],
    ],
  },
  { from: ROOM + 30, dur: 56, who: "dyslexi", text: "Hero! You came!" },
  { from: ROOM + 100, dur: 124, who: "wizard", text: "You came. How very brave. How very foolish." },
  { from: STORM.quiet + 10, dur: 76, who: "hero", text: "It's too much... too fast..." },
  {
    from: SAY,
    dur: BLAST - SAY + 6,
    who: "hero",
    text: "F... r... ee... FREE!",
    reveal: [
      [0, 0],
      [1, 4],
      [50, 4],
      [51, 9],
      [100, 9],
      [101, 15],
      [160, 15],
      [161, 21],
    ],
  },
  { from: BLOWN.from + 20, dur: 110, who: "wizard", text: "This isn't over, reader!" },
  { from: 1890, dur: 80, who: "dyslexi", text: "You came for me!" },
  { from: 1974, dur: 76, who: "hero", text: "Of course I did." },
];
const SPEAKER: Record<Who, string> = { hero: "Hero", wizard: "Dark Wizard", dyslexi: "Dyslexi" };
const TAG: Record<Who, string> = { hero: C.lilac, wizard: "#ff6b78", dyslexi: DYSLEXI_COLOR };
const speaking = (f: number, who: Who) => LINES.some((l) => l.who === who && f >= l.from && f < l.from + l.dur - 20);

// ---- Pixel helpers ------------------------------------------------------------------

// One art pixel on the 2D tower scenes.
const P = 8;
const GW = 1920 / P;
const GH = 1080 / P;

// A wall of stone bricks over a rectangle of the art grid.
export const Bricks: React.FC<{ x: number; y: number; w: number; h: number; base: string; mortar: string; light: string; seed: string }> = ({ x, y, w, h, base, mortar, light, seed }) => {
  const rects: React.ReactNode[] = [<rect key="bg" x={x} y={y} width={w} height={h} fill={mortar} />];
  const bw = 12;
  const bh = 5;
  for (let r = 0; r * bh < h; r++) {
    const off = r % 2 ? bw / 2 : 0;
    for (let c = -1; c * bw < w; c++) {
      const bx = x + c * bw + off;
      const x0 = Math.max(x, bx);
      const x1 = Math.min(x + w, bx + bw - 1);
      if (x1 <= x0) continue;
      const by = y + r * bh;
      const shade = random(`${seed}-${r}-${c}`);
      rects.push(<rect key={`${r}-${c}`} x={x0} y={by} width={x1 - x0} height={Math.min(bh - 1, y + h - by)} fill={shade > 0.8 ? light : base} />);
      if (shade < 0.2) rects.push(<rect key={`${r}-${c}-d`} x={x0} y={by + bh - 2} width={x1 - x0} height={1} fill={mortar} />);
    }
  }
  return <>{rects}</>;
};

// Hero's own hand, as in the first-person world, for the 2D scenes. (x, y)
// is the wrist on the 1920x1080 screen.
export const Hand: React.FC<{ x: number; y: number; mirror?: boolean; curl?: 0 | 1 | 2 }> = ({ x, y, mirror = false, curl = 0 }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const S = 18;
  useLayoutEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(getHands()[`back${curl}`], 0, 0, HAND_W * S, HAND_H * S);
  }, [curl]);
  return (
    <canvas
      ref={ref}
      width={HAND_W * S}
      height={HAND_H * S}
      style={{ position: "absolute", left: x - (HAND_W * S) / 2, top: y - HAND_H * S, transform: mirror ? "scaleX(-1)" : undefined }}
    />
  );
};

// A letter tile, like the trial's, in the tower's purple until it's read.
const Tile: React.FC<{ ch: string; x: number; y: number; size: number; lit: number; style?: React.CSSProperties }> = ({ ch, x, y, size, lit, style }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: size,
      height: size * 1.15,
      transform: "translate(-50%, -50%)",
      background: "rgba(18,11,28,0.92)",
      border: `${Math.max(4, size * 0.06)}px solid ${lit > 0.5 ? C.gold : "#b78cff"}`,
      outline: "5px solid #000",
      borderRadius: size * 0.14,
      boxShadow: `0 0 ${size * 0.4}px ${lit > 0.5 ? C.gold : "#7a3cff"}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: BODY,
      fontWeight: 700,
      fontSize: size * 0.72,
      color: lit > 0.5 ? C.gold : "#e8d8ff",
      ...style,
    }}
  >
    {ch}
  </div>
);

// ---- The journey (first person) ----------------------------------------------------

const TOWER = -0.6;
const TOWARD = Math.PI * 2 + TOWER;
const fwd = { x: Math.sin(TOWARD), y: -Math.cos(TOWARD) };
// Where the lowest point left her: the top of the path plus a few steps.
const START = { x: 0 + fwd.x * 30, y: -648 + fwd.y * 30 };

const journeyCam = (f: number): Cam => {
  const step = Math.sin((f / 30) * Math.PI * 4);
  if (f < SHOT2) {
    const go = interpolate(f, [0, SHOT2], [0, 110], clamp);
    return { x: START.x + fwd.x * go, y: START.y + fwd.y * go, heading: TOWARD, eye: 26 + step * 0.7, horizon: 120 + step * 2, focal: interpolate(f, [0, SHOT2], [457, 640], clamp) };
  }
  // Cut: much nearer now, the tower filling a long lens.
  const go = interpolate(f, [SHOT2, TO_DOOR], [0, 50], clamp);
  return { x: -560 + fwd.x * go, y: -980 + fwd.y * go, heading: TOWARD, eye: 26 + step * 0.7, horizon: 250 + step * 2, focal: interpolate(f, [SHOT2, TO_DOOR], [1100, 1350], clamp) };
};

const Journey: React.FC<{ f: number }> = ({ f }) => {
  if (f >= TO_DOOR + 30) return null;
  const cam = journeyCam(f);
  const flash = interpolate(f, [SHOT2 + 40, SHOT2 + 42, SHOT2 + 52, SHOT2 + 80, SHOT2 + 82, SHOT2 + 90], [0, 0.6, 0, 0, 0.4, 0], clamp);
  const dip = interpolate(f, [TO_DOOR - 16, TO_DOOR + 4], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Pov
        cam={cam}
        actors={[
          ...villageActors(99999).filter((a) => a.sheet === "lamp"),
          // Rowan stays kneeling on the path where he sat with her.
          { sheet: "rowan", x: ROWAN_SAT.x, y: ROWAN_SAT.y, row: 9, col: 1 },
        ]}
        sky="dawn"
        drain={DRAIN}
        scorch={SCORCH}
        tower={TOWER}
      >
        <AbsoluteFill style={{ background: "linear-gradient(#1a0d2e, #3b1f5f 55%, #2a1445)", mixBlendMode: "multiply", opacity: 0.45 }} />
        <AbsoluteFill style={{ background: "#c9a8ff", opacity: flash }} />
        <RainLayer f={f} k={0.7} />
      </Pov>
      <AbsoluteFill style={{ background: "#000", opacity: dip }} />
    </AbsoluteFill>
  );
};

const RainLayer: React.FC<{ f: number; k: number }> = ({ f, k }) => (
  <AbsoluteFill style={{ pointerEvents: "none", opacity: k }}>
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: 110 }, (_, i) => {
        const x0 = random(`trx${i}`) * 2200 - 140;
        const sp = 26 + random(`trs${i}`) * 18;
        const y = ((f * sp + random(`try${i}`) * 1200) % 1300) - 120;
        const x = x0 - y * 0.18;
        return <line key={i} x1={x} y1={y} x2={x - 10} y2={y + 54} stroke="#c8d4ea" strokeWidth={i % 4 ? 2 : 3} opacity={0.32} />;
      })}
    </svg>
  </AbsoluteFill>
);

// ---- The door -------------------------------------------------------------------

// The scrambled word and where each tile ends up.
const SCRAMBLED = ["N", "E", "P", "O"];
const TARGET = [3, 2, 1, 0]; // N→4th, E→3rd, P→2nd, O→1st: O P E N
const TILE_X = (i: number) => 960 + (i - 1.5) * 190;

const Door: React.FC<{ f: number }> = ({ f }) => {
  if (f < DOOR.in - 2 || f >= ROOM) return null;
  const fadeIn = interpolate(f, [DOOR.in, DOOR.in + 20], [0, 1], clamp);
  const fadeOut = interpolate(f, [DOOR.out, DOOR.out + 24], [1, 0], clamp);
  const glow = interpolate(f, [DOOR.glow, DOOR.glow + 16], [0, 1], clamp);
  const wrong = interpolate(f, [DOOR.tooFast + 40, DOOR.tooFast + 44, DOOR.tooFast + 60], [0, 1, 0], clamp);
  const slide = interpolate(f, [DOOR.slide, DOOR.slide + 18], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const open = interpolate(f, [DOOR.open, DOOR.open + 36], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  // Hero's hand comes up to touch the letters, and goes when they've moved.
  const reach = interpolate(f, [DOOR.breathe + 10, DOOR.touch, DOOR.slide + 20, DOOR.slide + 44], [0, 1, 1, 0], { ...clamp, easing: Easing.inOut(Easing.quad) });
  // Each letter lights as she sounds it out (O... p... e... n...).
  const litAt = (pos: number) => DOOR.read + 1 + pos * 16;
  return (
    <AbsoluteFill style={{ opacity: fadeIn * fadeOut, background: "#0d0816" }}>
      <svg width={1920} height={1080} viewBox={`0 0 ${GW} ${GH}`} shapeRendering="crispEdges" style={{ position: "absolute", inset: 0 }}>
        <Bricks x={0} y={0} w={GW} h={GH} base="#2b2438" mortar="#15101f" light="#3a3149" seed="door-wall" />
        {/* The arch and the door */}
        <rect x={78} y={14} width={84} height={GH - 14} fill="#0b0712" />
        <rect x={82} y={18} width={76} height={GH - 18} fill="#3a2418" />
        {/* The inside, glowing purple as it swings open */}
        <rect x={82} y={18} width={76 * open} height={GH - 18} fill="#5a2d8c" />
        <rect x={82 + 76 * open} y={18} width={76 * (1 - open)} height={GH - 18} fill="#3a2418" />
        {Array.from({ length: 7 }, (_, i) => (
          <rect key={i} x={82 + 76 * open + i * 11 * (1 - open)} y={18} width={Math.max(0, (1 - open) * 1)} height={GH - 18} fill="#24150e" />
        ))}
        {[34, 100].map((yy) => (
          <rect key={yy} x={82 + 76 * open} y={yy} width={76 * (1 - open)} height={4} fill="#15101f" />
        ))}
      </svg>
      {/* The purple light from inside */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 60%, #c77dff88, transparent 55%)", opacity: open, mixBlendMode: "screen" }} />
      {/* The word on the door */}
      {open < 0.6 &&
        SCRAMBLED.map((ch, i) => {
          const pos = i + (TARGET[i] - i) * slide;
          const lit = f >= litAt(TARGET[i]) ? 1 : 0;
          const arc = Math.sin(slide * Math.PI) * (i % 2 ? -60 : 60);
          return (
            <Tile
              key={i}
              ch={ch}
              x={TILE_X(pos)}
              y={470 + arc + Math.sin(f / 12 + i) * 4}
              size={150}
              lit={lit}
              style={{
                opacity: glow * (1 - open * 1.6),
                transform: `translate(-50%, -50%) scale(${f >= litAt(TARGET[i]) && f < litAt(TARGET[i]) + 14 ? 1.15 : 1})`,
                borderColor: wrong > 0.2 ? "#ff5a6e" : undefined,
              }}
            />
          );
        })}
      {reach > 0 && <Hand x={TILE_X(1) + 120} y={1080 + 640 - 640 * reach + 300} mirror />}
    </AbsoluteFill>
  );
};

// ---- The top of the tower ----------------------------------------------------------

const WIN = { x: 1220, y: 110, w: 420, h: 520 };
const CAGE_C = { x: 760, y: 430 };
const WIZ_PX = 14;
const WIZ_FEET = { x: 1430, y: 930 };

const wizRaise = (f: number) =>
  Math.max(interpolate(f, [STORM.from - 14, STORM.from, STORM.quiet, STORM.quiet + 30], [0, 1, 1, 0.4], clamp), interpolate(f, [POUR - 10, POUR, BLOWN.from], [0.4, 0.9, 0.9], clamp) * (f >= POUR - 10 ? 1 : 0));
const orbAt = (f: number) => {
  const th = (-wizRaise(f) * 32 * Math.PI) / 180;
  const ox = -0.5 * Math.cos(th) + 18.5 * Math.sin(th);
  const oy = -0.5 * Math.sin(th) - 18.5 * Math.cos(th);
  const left = WIZ_FEET.x - WIZ.cx * WIZ_PX;
  const top = WIZ_FEET.y - WIZ.feet * WIZ_PX;
  return { x: left + (3 + ox) * WIZ_PX, y: top + (20 + oy) * WIZ_PX };
};

// The stolen words swirling in the pit.
const PIT_WORDS = ["CAT", "SUN", "TREE", "BOOK", "SONG", "HOME", "STAR", "MOON", "FISH", "RAIN", "BIRD", "SEA", "LIGHT", "TALE", "READ", "WORD"];

const Room: React.FC<{ f: number }> = ({ f }) => {
  if (f < ROOM - 2) return null;
  const fadeIn = interpolate(f, [ROOM, ROOM + 26], [0, 1], clamp);
  const storm = interpolate(f, [STORM.from, STORM.full], [0, 1], clamp) * interpolate(f, [BLAST, BLAST + 6], [1, 0], clamp);
  const blast = interpolate(f, [BLAST, BLAST + 30], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const blown = interpolate(f, [BLOWN.from, BLOWN.to], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const crack = interpolate(f, [CRACK, CRACK + 8], [0, 1], clamp);
  const lightning = interpolate((f % 170) - 120, [0, 2, 10], [0, 1, 0], clamp) * (f < BLAST ? 1 : 0);
  // Pushing in on the lock while she reads it, and back out after.
  const focus = Math.min(interpolate(f, [FOCUS.from, FOCUS.to], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) }), interpolate(f, [BLAST + 10, BLAST + 50], [1, 0], { ...clamp, easing: Easing.inOut(Easing.cubic) }));
  const zoom = 1 + 0.7 * focus;
  const lock = { x: CAGE_C.x, y: CAGE_C.y + 190 };
  const dawn = interpolate(f, [POUR, BLOWN.to + 60], [0, 1], clamp);
  const orb = orbAt(f);
  return (
    <AbsoluteFill style={{ opacity: fadeIn, background: "#0d0816", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: `${lock.x}px ${lock.y}px` }}>
        <svg width={1920} height={1080} viewBox={`0 0 ${GW} ${GH}`} shapeRendering="crispEdges" style={{ position: "absolute", inset: 0 }}>
          <Bricks x={0} y={0} w={GW} h={100} base="#2b2438" mortar="#15101f" light="#3a3149" seed="room-wall" />
          {/* Floor */}
          <rect x={0} y={100} width={GW} height={GH - 100} fill="#1c1626" />
          {Array.from({ length: 12 }, (_, i) => (
            <rect key={i} x={i * 22 - (i % 2) * 6} y={104 + (i % 3) * 9} width={18} height={1} fill="#141019" />
          ))}
          <rect x={0} y={99} width={GW} height={2} fill="#0b0712" />
          {/* The window: stormy sky, then dawn breaking once the words are free */}
          <rect x={WIN.x / P - 3} y={WIN.y / P - 3} width={WIN.w / P + 6} height={WIN.h / P + 3} fill="#0b0712" />
          <rect x={WIN.x / P} y={WIN.y / P} width={WIN.w / P} height={WIN.h / P} fill="#1a0d2e" />
        </svg>
        {/* Sky in the window */}
        <div
          style={{
            position: "absolute",
            left: WIN.x,
            top: WIN.y,
            width: WIN.w,
            height: WIN.h,
            background: `linear-gradient(${dawn > 0.5 ? "#5b6aa3, #f0b49a" : "#1a0d2e, #3b1f5f"})`,
            opacity: 1,
          }}
        />
        <div style={{ position: "absolute", left: WIN.x, top: WIN.y, width: WIN.w, height: WIN.h, background: "linear-gradient(#5b6aa3, #f0b49a)", opacity: dawn }} />
        <div style={{ position: "absolute", left: WIN.x, top: WIN.y, width: WIN.w, height: WIN.h, background: "#e8d8ff", opacity: lightning * 0.7 }} />
        {/* Purple torchlight */}
        {[220, 1780].map((tx, i) => (
          <div key={tx} style={{ position: "absolute", left: tx - 160, top: 220, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(#c77dff77, transparent 65%)", opacity: 0.8 + 0.2 * Math.sin(f / 3 + i) }} />
        ))}
        {/* The pit of stolen words */}
        <div style={{ position: "absolute", left: 420, top: 830, width: 680, height: 170, borderRadius: "50%", background: "radial-gradient(#000 40%, #2a1445 75%, #15101f 100%)", boxShadow: "0 0 40px #7a3cff66" }} />
        {PIT_WORDS.map((w, i) => {
          const gone = interpolate(f, [POUR + i * 4, POUR + 40 + i * 4], [0, 1], clamp);
          if (gone >= 1) return null;
          const a = (i / PIT_WORDS.length) * Math.PI * 2 + f / 30;
          return (
            <div
              key={w}
              style={{
                position: "absolute",
                left: 760 + Math.cos(a) * 280 * (1 - gone),
                top: 915 + Math.sin(a) * 60 - gone * 500,
                transform: "translate(-50%, -50%)",
                fontFamily: BODY,
                fontWeight: 700,
                fontSize: 30,
                color: C.gold,
                textShadow: `0 0 12px ${C.gold}`,
                opacity: (0.5 + 0.5 * Math.sin(a)) * (1 - gone),
              }}
            >
              {w}
            </div>
          );
        })}
        {/* The chain and the cage */}
        <Cage f={f} blast={blast} />
        {/* The Wizard by the window */}
        <div
          style={{
            position: "absolute",
            left: WIZ_FEET.x - WIZ.cx * WIZ_PX + blown * 260,
            top: WIZ_FEET.y - WIZ.feet * WIZ_PX - blown * 40,
            opacity: 1 - blown,
            filter: `drop-shadow(0 0 30px #7a3cffaa) brightness(${1 - blown * 0.6})`,
            transform: `rotate(${blown * 12}deg)`,
            transformOrigin: "50% 100%",
          }}
        >
          <DarkWizard px={WIZ_PX} raise={wizRaise(f)} orb={1 + storm + (f >= POUR && f < BLOWN.from ? 1 : 0)} eyes={1} />
        </div>
        {/* The orb cracks */}
        {crack > 0 && blown < 1 && (
          <svg width={140} height={140} viewBox="0 0 14 14" shapeRendering="crispEdges" style={{ position: "absolute", left: orb.x - 70 + blown * 260, top: orb.y - 70, opacity: crack * (1 - blown) }}>
            {[
              [7, 2, 1, 4],
              [6, 5, 1, 3],
              [8, 6, 3, 1],
              [5, 8, 1, 3],
              [9, 7, 1, 3],
            ].map(([x, y, w, h], i) => (
              <rect key={i} x={x} y={y} width={w} height={h} fill="#ffffff" />
            ))}
          </svg>
        )}
        {/* The stolen words pouring out of his orb and away through the window */}
        <Flock f={f} />
        {/* Shadows swallowing him */}
        <div
          style={{
            position: "absolute",
            left: 1180,
            top: 300,
            width: 760,
            height: 800,
            background: "radial-gradient(#000000ee, #000000aa 45%, transparent 70%)",
            opacity: interpolate(f, [BLOWN.from + 60, BLOWN.to], [0, 1], clamp) * interpolate(f, [BLOWN.to + 20, BLOWN.to + 80], [1, 0], clamp),
          }}
        />
      </AbsoluteFill>
      {/* The storm of swimming letters, filling the screen */}
      <Storm f={f} k={storm} />
      {/* The blast of FREE */}
      <AbsoluteFill style={{ background: C.cream, opacity: interpolate(f, [BLAST, BLAST + 3, BLAST + 20], [0, 0.85, 0], clamp) }} />
      <FreeWord f={f} />
      <LinedUp f={f} />
    </AbsoluteFill>
  );
};

const Cage: React.FC<{ f: number; blast: number }> = ({ f, blast }) => {
  const sway = Math.sin(f / 26) * 3;
  const n = 18;
  const lockLit = (i: number) => FREE_CHUNKS.some((c) => c.letters.includes(i) && f >= c.at);
  return (
    <div style={{ position: "absolute", left: CAGE_C.x, top: CAGE_C.y, transform: `rotate(${sway}deg)`, transformOrigin: `0px -430px` }}>
      {/* chain */}
      {blast < 0.2 && <div style={{ position: "absolute", left: -6, top: -430, width: 12, height: 260, background: "repeating-linear-gradient(#3a3149 0 16px, #15101f 16px 24px)" }} />}
      {/* Dyslexi inside, until the cage breaks */}
      {blast <= 0 && (
        <div style={{ position: "absolute", left: -25 * 7, top: -31 * 7 + Math.sin(f / 2) * 3 }}>
          <Sprite src={SHEETS.dyslexi} row={0} scale={7} animFps={speaking(f, "dyslexi") ? 10 : 6} />
        </div>
      )}
      {/* The bars: jumbled letters, flying apart when it breaks */}
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2 + f / 50;
        const r = 170 + blast * 900;
        const ch = String.fromCharCode(65 + Math.floor(random(`tcage${i}`) * 26));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: Math.cos(a) * r * 0.85,
              top: -30 + Math.sin(a) * r,
              transform: `translate(-50%, -50%) rotate(${Math.sin(f / 6 + i) * 20 + blast * 400}deg)`,
              fontFamily: BODY,
              fontWeight: 700,
              fontSize: 64,
              color: "#c9a8ff",
              textShadow: "0 0 18px #7a3cff, 4px 4px 0 #000",
              opacity: 1 - blast,
            }}
          >
            {ch}
          </div>
        );
      })}
      {/* The lock: the word FREE */}
      {blast <= 0 && (
        <div style={{ position: "absolute", left: 0, top: 190, transform: "translate(-50%, -50%)", display: "flex", gap: 8, padding: 14, background: "#15101f", border: "6px solid #3a3149", outline: "5px solid #000", borderRadius: 16 }}>
          {[..."FREE"].map((ch, i) => (
            <div
              key={i}
              style={{
                fontFamily: BODY,
                fontWeight: 700,
                fontSize: 54,
                lineHeight: 1,
                width: 44,
                textAlign: "center",
                color: lockLit(i) || f >= FREE_WHOLE ? C.gold : "#c9a8ff",
                textShadow: lockLit(i) || f >= FREE_WHOLE ? `0 0 18px ${C.gold}` : "0 0 10px #7a3cff",
              }}
            >
              {ch}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// The storm: words and letters fly out of his orb and swirl round her,
// swimming the way the card's letters do.
const STORM_WORDS = ["CAT", "NIGHT", "STAR", "FREE", "WORD", "READ", "HAT", "KITE", "CAR", "LIGHT", "OPEN", "SUN", "ADVENTURE", "TREE", "BOOK", "HOME"];
const Storm: React.FC<{ f: number; k: number }> = ({ f, k }) => {
  if (k <= 0) return null;
  const orb = orbAt(f);
  // Once it's full, everything quietens: the room dims around her.
  const quiet = interpolate(f, [STORM.quiet, STORM.quiet + 30], [0, 1], clamp);
  const calm = interpolate(f, [ECHO, FOCUS.to], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "#0d0816", opacity: k * (0.35 + 0.3 * quiet) }} />
      {Array.from({ length: 40 }, (_, i) => {
        const word = STORM_WORDS[i % STORM_WORDS.length];
        const out = interpolate(f, [STORM.from + (i % 10) * 4, STORM.from + 40 + (i % 10) * 4], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
        const a = random(`sa${i}`) * Math.PI * 2 + f / (60 + (i % 5) * 10) * (i % 2 ? 1 : -1);
        const rad = 260 + random(`sr${i}`) * 700;
        const x = 960 + Math.cos(a) * rad * 1.3;
        const y = 540 + Math.sin(a) * rad * 0.6;
        // While she focuses, they drift back from the middle so the lock is clear.
        const px = orb.x + (x - orb.x) * out;
        const py = orb.y + (y - orb.y) * out;
        return (
          <div key={i} style={{ position: "absolute", left: px, top: py, transform: `translate(-50%, -50%) scale(${0.6 + random(`ss${i}`) * 0.9})`, opacity: k * out * (1 - 0.6 * calm) }}>
            <SwimWord text={word} f={f + i * 7} swim={1} size={56} color="#e8d8ff" seed={`storm${i}`} style={{ textShadow: "0 0 16px #7a3cff, 4px 4px 0 #000" }} />
          </div>
        );
      })}
      {/* Rowan's voice, remembered */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            fontFamily: BODY,
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: 64,
            color: C.cream,
            textShadow: `0 0 30px ${C.gold}, 0 0 60px #000`,
            opacity: interpolate(f, [ECHO, ECHO + 16, ECHO + 70, ECHO + 90], [0, 1, 1, 0], clamp),
          }}
        >
          One word at a time.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// FREE, spelled out big as she sounds it, then blasting outward.
const FreeWord: React.FC<{ f: number }> = ({ f }) => {
  if (f < SAY - 10 || f > BLAST + 30) return null;
  const blast = interpolate(f, [BLAST, BLAST + 24], [0, 1], clamp);
  return (
    <div style={{ position: "absolute", left: 960, top: 400, transform: `translate(-50%, -50%) scale(${1 + blast})`, display: "flex", gap: 24, opacity: 1 - blast }}>
      {[..."FREE"].map((ch, i) => {
        const chunk = FREE_CHUNKS.find((c) => c.letters.includes(i))!;
        const said = f >= chunk.at;
        const now = said && f < chunk.at + 40 && f < FREE_WHOLE;
        const whole = f >= FREE_WHOLE;
        const k = interpolate(f, [SAY - 10 + i * 4, SAY + i * 4], [0, 1], clamp);
        return (
          <div
            key={i}
            style={{
              fontFamily: BODY,
              fontWeight: 700,
              fontSize: 190,
              lineHeight: 1,
              color: said || whole ? C.gold : "#c9a8ff",
              textShadow: `0 0 ${whole ? 70 : now ? 44 : 20}px ${said || whole ? C.gold : "#7a3cff"}, 8px 8px 0 #000`,
              transform: `scale(${k * (now ? 1.15 : whole ? 1.1 + 0.05 * Math.sin(f / 3) : 1)}) translateY(${now ? -14 : 0}px)`,
              opacity: k,
            }}
          >
            {ch}
          </div>
        );
      })}
    </div>
  );
};

// After the blast the storm's letters stop swimming and line up, neat and
// still, then drift away with the flock.
const LinedUp: React.FC<{ f: number }> = ({ f }) => {
  const k = interpolate(f, [BLAST + 4, BLAST + 40], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const away = interpolate(f, [POUR + 20, POUR + 90], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  if (k <= 0 || away >= 1) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: 16 }, (_, i) => {
        const word = STORM_WORDS[i];
        const row = Math.floor(i / 4);
        const col = i % 4;
        const tx = 420 + col * 360;
        const ty = 220 + row * 130;
        const sx = 960 + Math.cos(i * 2.1) * 900;
        const sy = 540 + Math.sin(i * 2.1) * 500;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: sx + (tx - sx) * k + (WIN.x + WIN.w / 2 - tx) * away,
              top: sy + (ty - sy) * k + (WIN.y + WIN.h / 2 - ty) * away,
              transform: `translate(-50%, -50%) scale(${1 - away * 0.7})`,
              fontFamily: BODY,
              fontWeight: 700,
              fontSize: 60,
              color: C.gold,
              textShadow: `0 0 18px ${C.gold}, 4px 4px 0 #000`,
              opacity: k * (1 - away),
            }}
          >
            {word}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// Thousands of stolen words, like a flock of golden birds, pouring out of his
// cracking orb and away through the window.
const Flock: React.FC<{ f: number }> = ({ f }) => {
  if (f < POUR || f > BLOWN.to + 160) return null;
  const orb = orbAt(Math.min(f, BLOWN.from));
  const exit = { x: WIN.x + WIN.w * 0.5, y: WIN.y + WIN.h * 0.35 };
  return (
    <>
      {Array.from({ length: 60 }, (_, i) => {
        const t = (f - POUR - i * 3) / 70;
        if (t < 0 || t > 1) return null;
        const p = Easing.inOut(Easing.quad)(t);
        const wob = Math.sin(t * Math.PI * 2 + i) * 60;
        const ch = String.fromCharCode(65 + Math.floor(random(`fl${i}`) * 26));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: orb.x + (exit.x - orb.x) * p + wob * 0.3,
              top: orb.y + (exit.y - orb.y) * p - Math.sin(p * Math.PI) * 200 + wob,
              transform: `translate(-50%, -50%) scale(${1 - p * 0.5})`,
              fontFamily: BODY,
              fontWeight: 700,
              fontSize: 44,
              color: C.gold,
              textShadow: `0 0 14px ${C.gold}`,
              opacity: Math.sin(t * Math.PI),
            }}
          >
            {ch}
          </div>
        );
      })}
    </>
  );
};

// ---- Dyslexi back on her shoulder ------------------------------------------------------

const DyslexiBack: React.FC<{ f: number }> = ({ f }) => {
  const k = interpolate(f, [BLAST + 6, BLAST + 30], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  if (k <= 0) return null;
  // From where the cage hung (pushed in on the lock) to her spot by Hero.
  const x = CAGE_C.x + (1640 - CAGE_C.x) * k;
  const y = CAGE_C.y + (560 - CAGE_C.y) * k - Math.sin(k * Math.PI) * 240;
  return <DyslexiBuddy f={f} x={x} y={y} scale={6} appear={1} talking={speaking(f, "dyslexi")} />;
};

// ---- Sound -----------------------------------------------------------------------

const TowerSound: React.FC = () => {
  const sfx = (name: string, from: number, volume: number, dur = 40) => (
    <Sequence key={`${name}-${from}`} from={from} durationInFrames={dur} name={`🔊 ${name}`}>
      <Audio src={staticFile(`sfx/${name}.mp3`)} volume={volume} />
    </Sequence>
  );
  return (
    <>
      <Sequence durationInFrames={ROOM} name="🔊 wind and rain">
        <Audio src={staticFile("sfx/ambience.mp3")} loop volume={(t) => interpolate(t, [0, ROOM - 40, ROOM], [0.4, 0.4, 0], clamp)} />
      </Sequence>
      {/* Hope from the lowest point carries her there */}
      <Sequence durationInFrames={TO_DOOR + 30} name="♪ hope">
        <Audio src={staticFile("music/rebirth-background-music.mp3")} trimBefore={404} volume={(t) => interpolate(t, [0, TO_DOOR - 10, TO_DOOR + 30], [0.3, 0.3, 0], clamp)} />
      </Sequence>
      {sfx("thunder-strike", SHOT2 + 36, 0.45, 80)}
      {sfx("jump-whoosh", TO_DOOR - 14, 0.3, 24)}
      {sfx("shield-hit", DOOR.tooFast + 40, 0.35, 24)}
      {sfx("jump-whoosh", DOOR.slide, 0.3, 24)}
      {[0, 1, 2, 3].map((i) => sfx("ui-blip", DOOR.read + 1 + i * 16, 0.45, 12))}
      {sfx("summon", DOOR.open, 0.45, 60)}
      {/* The tower: the fight music, low, dropping out to nothing in the quiet */}
      <Sequence from={ROOM} durationInFrames={BLAST - ROOM} name="♪ fight">
        <Audio
          src={staticFile("music/fighting-background-music.mp3")}
          trimBefore={MUSIC_SKIP}
          volume={(t) => interpolate(t + ROOM, [ROOM, ROOM + 40, STORM.quiet - 10, STORM.quiet + 20, BLAST - 4, BLAST], [0, 0.32, 0.4, 0.02, 0.02, 0], clamp)}
        />
      </Sequence>
      {sfx("charge-up", STORM.from - 10, 0.45, 60)}
      {sfx("jump-whoosh", STORM.from + 10, 0.4, 30)}
      {FREE_CHUNKS.map((c) => sfx("ui-blip", c.at, 0.55, 15))}
      {sfx("charge-up", FREE_WHOLE - 30, 0.4, 40)}
      {sfx("final-blast", BLAST, 0.6, 60)}
      {sfx("shatter", BLAST + 2, 0.5, 45)}
      {sfx("summon", POUR, 0.5, 70)}
      {sfx("shatter", CRACK, 0.35, 40)}
      {sfx("shockwave", BLOWN.from, 0.45, 50)}
      {sfx("teleport", BLOWN.to - 30, 0.4, 50)}
      {/* After: the realm theme, warm */}
      <Sequence from={BLAST + 20} durationInFrames={TOWER_FRAMES - BLAST - 20} name="♪ realm theme">
        <Audio src={staticFile("music/background-music.mp3")} volume={(t) => interpolate(t, [0, 60, TOWER_FRAMES - BLAST - 60], [0, 0.35, 0.35], clamp)} />
      </Sequence>
    </>
  );
};

// ---- The scene -------------------------------------------------------------------

export const Tower: React.FC = () => {
  const f = useCurrentFrame();
  // Through the window and out, after the words.
  const outK = interpolate(f, [WINDOW_OUT.from, WINDOW_OUT.to], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Journey f={f} />
      <Door f={f} />
      <AbsoluteFill style={{ transform: `scale(${1 + outK * 6})`, transformOrigin: `${WIN.x + WIN.w / 2}px ${WIN.y + WIN.h / 2}px` }}>
        <Room f={f} />
      </AbsoluteFill>
      <DyslexiBack f={f} />
      {LINES.map((l) => (
        <Dialogue key={l.from} speaker={SPEAKER[l.who]} text={l.text} t={f - l.from} dur={l.dur} color={TAG[l.who]} at={l.who === "hero" ? "top" : "bottom"} reveal={l.reveal} readable />
      ))}
      <TowerSound />
    </AbsoluteFill>
  );
};

