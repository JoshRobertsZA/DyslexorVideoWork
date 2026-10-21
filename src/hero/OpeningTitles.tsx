import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { BODY, C } from "../theme";
import { CARRY_LEVEL, IDENT_MUSIC, IDENT_MUSIC_END, MASTER } from "./Ident";

// The opening titles, straight after the Dyslexor Studios ident, like the
// start of a film: a tour of the realm in six HD-2D cinematic shots (Kling
// stills in public/titles, made from the game's own house sprite and tiles),
// each brought to life here with a slow camera move, light rays, drifting
// mist, rising motes, flickering lamps and drifting golden letters. Credits
// fade in one at a time, alternating bottom-left and bottom-right. It ends on
// dawn over the realm and dissolves (over its last TITLES_OVERLAP frames) into
// Rowan's story, which starts underneath; see StoryBridge.tsx. The ident's
// music carries on under it and fades under Rowan's first line.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
// 2.39:1 bars, carried on from the ident and drawn back at the end.
const BAR = Math.round((1080 - 1920 / 2.39) / 2);
// The stills are 3104 x 1312; shown full width, centred in the frame.
const PLATE_H = (1920 * 1312) / 3104;
const PLATE_TOP = (1080 - PLATE_H) / 2;

type Pt = [number, number]; // 0..1 across / down the still
type Shot = {
  src: string;
  frames: number;
  // The camera move: scale from -> to, centred on `focus`, drifting by `pan` (px).
  zoom: [number, number];
  focus: Pt;
  pan: Pt;
  rays?: { at: Pt; color: string; strength: number };
  mist?: { color: string; y: number };
  motes?: { at: Pt; spread: number; color: string };
  glows?: { at: Pt; color: string; size: number; flicker?: boolean }[];
  letters?: boolean;
  shimmer?: { y: [number, number] };
};

const SHOTS: Shot[] = [
  {
    // The village from above: the three game houses and their portals.
    src: "titles/t2-village.png",
    frames: 230,
    zoom: [1.12, 1.02],
    focus: [0.5, 0.6],
    pan: [-30, 0],
    rays: { at: [0.5, 0.05], color: "255,214,150", strength: 0.22 },
    glows: [
      { at: [0.37, 0.84], color: "127,240,196", size: 120 },
      { at: [0.5, 0.85], color: "255,178,122", size: 110 },
      { at: [0.66, 0.84], color: "195,166,255", size: 120 },
    ],
    letters: true,
  },
  {
    // The Rhyme Time house: through the grass to its mint portal.
    src: "titles/t3-rhyme.png",
    frames: 230,
    zoom: [1.0, 1.14],
    focus: [0.47, 0.62],
    pan: [0, 0],
    rays: { at: [0.5, 0.07], color: "255,220,160", strength: 0.26 },
    motes: { at: [0.46, 0.78], spread: 0.17, color: "127,240,196" },
    glows: [{ at: [0.46, 0.78], color: "127,240,196", size: 260 }],
  },
  {
    // The pond at golden hour.
    src: "titles/t4-pond.png",
    frames: 230,
    zoom: [1.06, 1.0],
    focus: [0.5, 0.5],
    pan: [26, 0],
    rays: { at: [0.5, 0.24], color: "255,206,150", strength: 0.24 },
    mist: { color: "255,220,190", y: 0.5 },
    shimmer: { y: [0.5, 0.78] },
  },
  {
    // The lamp-lit path at dusk.
    src: "titles/t5-path.png",
    frames: 210,
    zoom: [1.0, 1.12],
    focus: [0.5, 0.45],
    pan: [0, 0],
    mist: { color: "150,170,220", y: 0.55 },
    glows: [
      { at: [0.31, 0.3], color: "255,190,110", size: 150, flicker: true },
      { at: [0.7, 0.3], color: "255,190,110", size: 150, flicker: true },
      { at: [0.414, 0.42], color: "255,190,110", size: 80, flicker: true },
      { at: [0.605, 0.42], color: "255,190,110", size: 80, flicker: true },
      { at: [0.449, 0.46], color: "255,190,110", size: 50, flicker: true },
      { at: [0.573, 0.46], color: "255,190,110", size: 50, flicker: true },
    ],
  },
  {
    // The Wizard's tower at night: a brief, ominous glimpse.
    src: "titles/t6-tower.png",
    frames: 170,
    zoom: [1.0, 1.1],
    focus: [0.5, 0.35],
    pan: [0, 10],
    rays: { at: [0.49, 0.21], color: "170,200,255", strength: 0.2 },
    mist: { color: "140,170,220", y: 0.85 },
    glows: [
      { at: [0.5, 0.25], color: "199,125,255", size: 90, flicker: true },
      { at: [0.49, 0.47], color: "199,125,255", size: 70, flicker: true },
      { at: [0.52, 0.47], color: "199,125,255", size: 70, flicker: true },
    ],
  },
  {
    // Dawn over the realm, the tower a silhouette in the sun. The last shot:
    // its letters gather into the bridge to Rowan's story (StoryBridge.tsx).
    src: "titles/t1-dawn.png",
    frames: 300,
    zoom: [1.0, 1.1],
    focus: [0.5, 0.35],
    pan: [0, 18],
    rays: { at: [0.5, 0.05], color: "255,214,150", strength: 0.32 },
    mist: { color: "255,236,210", y: 0.42 },
    letters: true,
  },
];
const XFADE = 24;
const starts = SHOTS.map((_, i) => SHOTS.slice(0, i).reduce((n, s) => n + s.frames - XFADE, 0));

// The credits, in order. Each holds `HOLD` frames, alternating sides.
const CARDS: { role: string; names: string[] }[] = [
  { role: "Dyslexor Studios", names: ["presents"] },
  { role: "A film by", names: ["Joshua Roberts"] },
  { role: "Starring", names: ["Sushmitha Nooka"] },
  { role: "Written by", names: ["Joshua Roberts", "Dylan Shortt", "Sushmitha Nooka"] },
  { role: "Storyboards by", names: ["Dylan Shortt"] },
  { role: "Edited by", names: ["Joshua Roberts", "Sushmitha Nooka"] },
  { role: "Sound design by", names: ["Joshua Roberts"] },
  { role: "Directed by", names: ["Joshua Roberts"] },
];
const FIRST = 60;
const HOLD = 105;
const GAP = 25;
const cardAt = (i: number) => FIRST + i * (HOLD + GAP);

export const OPENING_TITLES_FRAMES = starts[SHOTS.length - 1] + SHOTS[SHOTS.length - 1].frames;
// The story starts this long before the titles end, under them.
export const TITLES_OVERLAP = 90;

// ---- Layers drawn over a still, in the still's own 0..1 space -------------------

const px = (p: Pt) => ({ left: `${p[0] * 100}%`, top: `${p[1] * 100}%` });

// Soft beams fanning down from a light, slowly turning and breathing.
const Rays: React.FC<{ t: number; at: Pt; color: string; strength: number }> = ({ t, at, color, strength }) => {
  const breathe = 0.8 + 0.2 * Math.sin(t / 40);
  const turn = Math.sin(t / 120) * 4;
  const beams = Array.from({ length: 9 }, (_, i) => {
    const a = -70 + i * 17.5 + (random(`ray${i}`) - 0.5) * 8;
    const w = 3 + random(`rw${i}`) * 5;
    return `transparent ${a - w - 0.01}deg, rgba(${color},${(0.35 + 0.65 * random(`ro${i}`)) * strength}) ${a - w}deg ${a}deg, transparent ${a + 0.01}deg`;
  });
  return (
    <div
      style={{
        position: "absolute",
        ...px(at),
        width: 2600,
        height: 2600,
        marginLeft: -1300,
        marginTop: -1300,
        background: `conic-gradient(from ${180 + turn}deg at 50% 50%, transparent -90deg, ${beams.join(", ")}, transparent 270deg)`,
        WebkitMaskImage: "radial-gradient(circle at 50% 50%, #000 0%, #000 12%, transparent 62%)",
        maskImage: "radial-gradient(circle at 50% 50%, #000 0%, #000 12%, transparent 62%)",
        mixBlendMode: "screen",
        opacity: breathe,
        filter: "blur(10px)",
      }}
    />
  );
};

// Bands of mist drifting slowly sideways.
const Mist: React.FC<{ t: number; color: string; y: number }> = ({ t, color, y }) => (
  <>
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          left: `${-30 + ((t * (0.05 + i * 0.03) + i * 37) % 60)}%`,
          top: `${(y + (i - 1) * 0.12) * 100}%`,
          width: "90%",
          height: "22%",
          marginTop: "-11%",
          background: `radial-gradient(ellipse 50% 50% at 50% 50%, rgba(${color},0.22), transparent 70%)`,
          filter: "blur(30px)",
          mixBlendMode: "screen",
        }}
      />
    ))}
  </>
);

// Motes of light rising from a point, like a slow fountain.
const Motes: React.FC<{ t: number; at: Pt; spread: number; color: string }> = ({ t, at, spread, color }) => (
  <>
    {Array.from({ length: 46 }, (_, i) => {
      const r = (k: string) => random(`mote-${k}-${i}`);
      const life = 150 + r("l") * 120;
      const age = (t + r("o") * life) % life;
      const k = age / life;
      const x = at[0] + (r("x") - 0.5) * spread * 2 + Math.sin((t + i * 30) / 40) * 0.01;
      const y = at[1] - k * (0.35 + r("h") * 0.3);
      const size = 4 + r("s") * 9;
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${x * 100}%`,
            top: `${y * 100}%`,
            width: size,
            height: size,
            borderRadius: "50%",
            background: `rgba(${color},1)`,
            boxShadow: `0 0 ${size * 2.5}px rgba(${color},0.9)`,
            opacity: Math.sin(k * Math.PI) * (0.5 + 0.5 * r("a")),
            filter: r("b") < 0.3 ? "blur(2px)" : undefined,
          }}
        />
      );
    })}
  </>
);

// A soft pool of light, pulsing gently (or flickering, for flames).
const Glow: React.FC<{ t: number; at: Pt; color: string; size: number; flicker?: boolean; seed: number }> = ({ t, at, color, size, flicker, seed }) => {
  const pulse = flicker ? 0.82 + 0.1 * Math.sin(t / 3.1 + seed) + 0.08 * Math.sin(t / 1.7 + seed * 2) : 0.75 + 0.25 * Math.sin(t / 30 + seed);
  return (
    <div
      style={{
        position: "absolute",
        ...px(at),
        width: size * 2,
        height: size * 2,
        marginLeft: -size,
        marginTop: -size,
        borderRadius: "50%",
        background: `radial-gradient(circle, rgba(${color},0.55), rgba(${color},0.18) 40%, transparent 70%)`,
        mixBlendMode: "screen",
        opacity: pulse,
      }}
    />
  );
};

// Glints dancing on water.
const Shimmer: React.FC<{ t: number; y: [number, number] }> = ({ t, y }) => (
  <>
    {Array.from({ length: 40 }, (_, i) => {
      const r = (k: string) => random(`glint-${k}-${i}`);
      const on = Math.max(0, Math.sin(t / (6 + r("p") * 8) + r("o") * 6));
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${(0.36 + r("x") * 0.28) * 100}%`,
            top: `${(y[0] + r("y") * (y[1] - y[0])) * 100}%`,
            width: 10 + r("w") * 26,
            height: 2,
            background: "rgba(255,236,200,0.9)",
            boxShadow: "0 0 8px rgba(255,220,170,0.8)",
            opacity: on * 0.7,
          }}
        />
      );
    })}
  </>
);

// Golden letters drifting across the sky, at different depths.
const Letters: React.FC<{ t: number }> = ({ t }) => (
  <>
    {Array.from({ length: 22 }, (_, i) => {
      const r = (k: string) => random(`letter-${k}-${i}`);
      const depth = r("d");
      const size = 18 + depth * 46;
      const x = ((r("x") + t * (0.0004 + depth * 0.0009)) % 1.1) - 0.05;
      const y = 0.12 + r("y") * 0.55 + Math.sin(t / (50 + r("p") * 40) + i) * 0.015;
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${x * 100}%`,
            top: `${y * 100}%`,
            fontFamily: BODY,
            fontWeight: 700,
            fontSize: size,
            color: "#ffe7a8",
            textShadow: `0 0 ${size * 0.4}px rgba(255,200,110,0.95), 0 0 ${size}px rgba(255,180,90,0.6)`,
            opacity: (0.45 + 0.55 * depth) * (0.7 + 0.3 * Math.sin(t / 20 + i)),
            filter: depth < 0.35 ? `blur(${(0.35 - depth) * 6}px)` : undefined,
            transform: `rotate(${(r("r") - 0.5) * 30 + Math.sin(t / 60 + i) * 8}deg)`,
          }}
        >
          {"ABCDEFGHIJKLMNOPRSTUVWY"[Math.floor(r("c") * 23)]}
        </div>
      );
    })}
  </>
);

const ShotView: React.FC<{ shot: Shot; t: number }> = ({ shot, t }) => {
  const k = interpolate(t, [0, shot.frames], [0, 1], { ...clamp, easing: Easing.inOut(Easing.sin) });
  const s = shot.zoom[0] + (shot.zoom[1] - shot.zoom[0]) * k;
  const dx = shot.pan[0] * (k - 0.5) * 2;
  const dy = shot.pan[1] * (k - 0.5) * 2;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: PLATE_TOP,
        width: 1920,
        height: PLATE_H,
        transformOrigin: `${shot.focus[0] * 100}% ${shot.focus[1] * 100}%`,
        transform: `translate(${dx}px, ${dy}px) scale(${s})`,
      }}
    >
      <Img src={staticFile(shot.src)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      {shot.mist && <Mist t={t} {...shot.mist} />}
      {shot.rays && <Rays t={t} {...shot.rays} />}
      {shot.shimmer && <Shimmer t={t} {...shot.shimmer} />}
      {shot.glows?.map((g, i) => <Glow key={i} t={t} seed={i * 1.7} {...g} />)}
      {shot.motes && <Motes t={t} {...shot.motes} />}
      {shot.letters && <Letters t={t} />}
    </div>
  );
};

const Card: React.FC<{ i: number; f: number }> = ({ i, f }) => {
  const t = f - cardAt(i);
  if (t < 0 || t > HOLD) return null;
  const o = interpolate(t, [0, 18, HOLD - 18, HOLD], [0, 1, 1, 0], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const left = i % 2 === 0;
  const c = CARDS[i];
  return (
    <div
      style={{
        position: "absolute",
        bottom: BAR + 56,
        [left ? "left" : "right"]: 130,
        textAlign: left ? "left" : "right",
        opacity: o,
        transform: `translateY(${(1 - o) * 6}px)`,
        textShadow: "0 2px 14px rgba(0,0,0,0.85), 0 0 30px rgba(0,0,0,0.5)",
      }}
    >
      <div style={{ fontFamily: BODY, fontWeight: 300, fontSize: 24, letterSpacing: "0.32em", color: C.cream, opacity: 0.8, textTransform: "uppercase" }}>{c.role}</div>
      {c.names.map((n) => (
        <div key={n} style={{ fontFamily: BODY, fontWeight: 500, fontSize: 38, letterSpacing: "0.08em", color: C.cream, marginTop: 8 }}>
          {n}
        </div>
      ))}
    </div>
  );
};

const Grain: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill
    style={{
      opacity: 0.06,
      mixBlendMode: "overlay",
      backgroundImage: `radial-gradient(circle at ${random(`tg${f}`) * 100}% ${random(`th${f}`) * 100}%, #fff 0.5px, transparent 1px)`,
      backgroundSize: "3px 3px",
    }}
  />
);

export const OpeningTitles: React.FC = () => {
  const f = useCurrentFrame();
  const fadeIn = interpolate(f, [0, 45], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  // Dissolves (to transparent) into the story playing underneath.
  const fadeOut = interpolate(f, [OPENING_TITLES_FRAMES - TITLES_OVERLAP, OPENING_TITLES_FRAMES], [1, 0], { ...clamp, easing: Easing.inOut(Easing.quad) });
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", opacity: fadeOut }}>
      <AbsoluteFill style={{ opacity: fadeIn }}>
        {SHOTS.map((shot, i) => {
          const t = f - starts[i];
          if (t < 0 || t > shot.frames) return null;
          const o = i === 0 ? 1 : interpolate(t, [0, XFADE], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
          return (
            <AbsoluteFill key={shot.src} style={{ opacity: o }}>
              <ShotView shot={shot} t={t} />
            </AbsoluteFill>
          );
        })}
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 70% at 50% 50%, transparent 55%, rgba(0,0,0,0.45) 100%)" }} />
        <Grain f={f} />
      </AbsoluteFill>
      {/* A soft shade along the bottom, so the credits read on bright shots */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: BAR, height: 260, background: "linear-gradient(transparent, rgba(0,0,0,0.42))" }} />
      {CARDS.map((_, i) => (
        <Card key={i} i={i} f={f} />
      ))}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: BAR, background: "#000" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: BAR, background: "#000" }} />
      {/* The ident's music carries straight on under the titles, settling a
          little lower under the credits. */}
      {/* It hands over to Rowan's story (Opening.tsx) as the overlap begins,
          which carries the same track on from the same point. */}
      <Sequence durationInFrames={OPENING_TITLES_FRAMES - TITLES_OVERLAP} name="♪ ident music (cont.)">
        <Audio
          src={staticFile(IDENT_MUSIC)}
          trimBefore={IDENT_MUSIC_END}
          volume={(t) => MASTER * interpolate(t, [0, 90], [CARRY_LEVEL, 0.42], { ...clamp, easing: Easing.inOut(Easing.quad) })}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
