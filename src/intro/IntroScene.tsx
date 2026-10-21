import React from "react";
import { AbsoluteFill, Easing, interpolate, interpolateColors, random, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { Exclaim, Grain, Vignette } from "../components/Fx";
import { Sprite } from "../components/Sprite";
import { ROWAN } from "../lore/parts";
import { BODY, C, PIXEL } from "../theme";
import { ACCENT, FIGHT_CAM, MUSIC_PREROLL, MUSIC_SKIP } from "../hero/config";
import { DarkWizard, WIZ } from "../hero/DarkWizard";
import { Foreground, GROUND, LensFoliage, NightSky } from "../hero/NightVillage";
import { OPENING_FRAMES } from "../hero/Opening";
import { track } from "../hero/parts";
import { IntroBackdrop } from "./IntroVillage";

// Elder Rowan's intro, over his new narration (public/voice/rowan-intro.mp3,
// 54.9s). Golden hour in the village: Rowan walks in along the road, the
// words bloom across the sky, the children speak in colours. Then three knocks
// in the pause before "Then he came": the light drains, the lamps die, the
// Wizard steals every letter, and Rowan answers. We end on the same frame the
// narrated Opening ends on (the split, the shield, the first bolts in flight),
// so hero/Summoning.tsx carries on as the duel without any change.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ---- Timing ----------------------------------------------------------------

// The take starts at its first word, so it sits this many frames in.
export const AUDIO_AT = 24;
export const VOICE_FRAMES = 1647;
export const INTRO_FRAMES = AUDIO_AT + VOICE_FRAMES;
// Seconds into the recording -> frame of the scene.
const T = (s: number) => AUDIO_AT + Math.round(s * 30);
const END = INTRO_FRAMES;

// The sky and the lamps' flicker run on a clock that carries on into the duel,
// which starts its own at OPENING_FRAMES.
const clock = (f: number) => f - (INTRO_FRAMES - OPENING_FRAMES);

// Three knocks fall in the two-second silence before "Then he came".
const KNOCKS = [T(22.35), T(22.95), T(23.55)];
const EYES_OPEN = KNOCKS[1];
const REVEAL = T(26.1);
const LAMPS_OUT = T(30.7);
const STEAL = T(33.7);
const S = { split: END - 47, shield: END - 32 };

const STORY_GAIN = 0.71;
const gain = (v: number | ((t: number) => number)) => (typeof v === "function" ? (t: number) => STORY_GAIN * v(t) : STORY_GAIN * v);
const PX = 10;
const K = PX / 7;

// Where everyone stands for the duel.
const ROWAN_X = 600;
const CLONE_X = 350;
const WIZ_X = 1400;
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// ---- Subtitles (timed to the recording's phrases) --------------------------

const SUBS: { from: number; to: number; text: string }[] = [
  { from: 0.0, to: 4.55, text: "For a thousand years, the land of words and light" },
  { from: 5.0, to: 6.55, text: "knew only peace." },
  { from: 7.15, to: 10.15, text: "Every sentence grew like a bright flower," },
  { from: 10.8, to: 15.3, text: "and every dawn arrived as a poem written across the sky." },
  { from: 15.55, to: 18.7, text: "Children of the valley learned to speak in colors," },
  { from: 19.15, to: 22.15, text: "and no voice was ever raised in anger." },
  { from: 24.1, to: 27.0, text: "Then he came, my old enemy," },
  { from: 27.8, to: 29.95, text: "riding in on a cold wind." },
  { from: 30.65, to: 32.6, text: "He did not want to share the light." },
  { from: 33.85, to: 35.65, text: "He wanted to swallow it whole" },
  { from: 36.3, to: 38.5, text: "and leave only silence behind." },
  { from: 40.4, to: 41.9, text: "I will not let him have it." },
  { from: 43.55, to: 46.15, text: "Not one word, not one ray." },
  { from: 46.8, to: 48.5, text: "Stand back, old friend." },
  { from: 50.0, to: 51.15, text: "This ends tonight," },
  { from: 51.8, to: 54.8, text: "and I will end it with the first spell I ever learned." },
];

// ---- Rowan -----------------------------------------------------------------

// He walks in from the middle of the village and stops where the road leaves it.
const ROWAN_START = -380;
const ROWAN_STOP = 520;
const WALK_SPEED = 2.6;
const DECEL = 24;
const WALK_END = Math.round((ROWAN_STOP - ROWAN_START) / WALK_SPEED + DECEL / 2);
const WALK_FULL = WALK_END - DECEL;
const STEP_FWD = T(46.75);
const STEP_LEN = 30;

const rowanX = (f: number) => {
  if (f < WALK_FULL) return ROWAN_START + WALK_SPEED * f;
  if (f < WALK_END) {
    const d = f - WALK_FULL;
    return ROWAN_START + WALK_SPEED * WALK_FULL + WALK_SPEED * d - (WALK_SPEED * d * d) / (2 * DECEL);
  }
  if (f < STEP_FWD) return ROWAN_STOP;
  return interpolate(f, [STEP_FWD, STEP_FWD + STEP_LEN], [ROWAN_STOP, ROWAN_X], { ...clamp, easing: Easing.inOut(Easing.quad) });
};
const rowanWalking = (f: number) => f < WALK_END - 1 || (f >= STEP_FWD && f < STEP_FWD + STEP_LEN);

// ---- Villagers and children ------------------------------------------------

const FLEE_SPEED = 7;
const ADULTS = [
  { src: "realm/npc_farmer.png", x: -170, dy: 20 },
  { src: "realm/npc_merchant.png", x: 80, dy: -8 },
  { src: "realm/npc_town_guard.png", x: 300, dy: 14 },
];
const KIDS = [
  { x: 770, target: 650, hue: 0 },
  { x: 880, target: 720, hue: 150 },
  { x: 990, target: 790, hue: 260 },
];
const KID_GO = T(15.5);
const KID_HERE = T(17.6);
const fleeAt = (i: number) => KNOCKS[0] + 2 + i * 5;

const Feet: React.FC<{ x: number; w: number; feet: number; cx: number; dy?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  x,
  w,
  feet,
  cx,
  dy = 0,
  children,
  style,
}) => <div style={{ position: "absolute", left: x - cx * PX, top: GROUND - feet * PX + dy, width: w * PX, ...style }}>{children}</div>;

const Townsfolk: React.FC<{ f: number; day: number }> = ({ f, day }) => {
  const rx = rowanX(f);
  const lit = { filter: `brightness(${0.85 + 0.2 * day})` };
  return (
    <>
      {ADULTS.map((a, i) => {
        const fs = fleeAt(i);
        const fleeing = f >= fs;
        const x = fleeing ? a.x - FLEE_SPEED * (f - fs) : a.x;
        return (
          <Feet key={a.src} x={x} w={48} feet={43} cx={24.5} dy={a.dy} style={lit}>
            <Sprite src={a.src} row={fleeing ? 4 : 1} scale={PX} animFps={fleeing ? 12 : 6} flip={fleeing || rx < a.x} />
          </Feet>
        );
      })}
      {KIDS.map((k, i) => {
        const fs = fleeAt(i + 3);
        const fleeing = f >= fs;
        const coming = f >= KID_GO && f < KID_HERE;
        const base = interpolate(f, [KID_GO + i * 6, KID_HERE], [k.x, k.target], { ...clamp, easing: Easing.out(Easing.quad) });
        const x = fleeing ? k.target - FLEE_SPEED * 1.2 * (f - fs) : base;
        const joy = !fleeing && !coming && f >= KID_HERE ? Math.abs(Math.sin((f + i * 9) / 6)) * 24 : 0;
        return (
          <Feet key={i} x={x} w={48} feet={43} cx={24.5} dy={26 + i * 6 - joy} style={{ filter: `hue-rotate(${k.hue}deg) brightness(${0.9 + 0.2 * day})` }}>
            <Sprite src="realm/classmate.png" row={fleeing || coming ? 4 : 1} scale={PX} animFps={fleeing ? 14 : 9} flip />
          </Feet>
        );
      })}
    </>
  );
};

// "Learned to speak in colors": letters in every colour float up from the children.
const SPEECH = ["#ff6b78", "#ffb27a", "#f6c945", "#7ff0c4", "#7aa8ff", "#c3a6ff"];
const ColorLetters: React.FC<{ f: number }> = ({ f }) => {
  const from = T(16.6);
  return (
    <>
      {Array.from({ length: 30 }, (_, n) => {
        const t0 = from + n * 5;
        const t = (f - t0) / 80;
        if (t < 0 || t > 1 || f >= KNOCKS[0]) return null;
        const kid = KIDS[n % 3];
        const x = kid.target + (n % 2 ? 24 : -16) + Math.sin(t * 5 + n) * 26;
        const y = GROUND - 31 * PX - t * 300;
        return (
          <div
            key={n}
            style={{
              position: "absolute",
              left: x,
              top: y,
              fontFamily: PIXEL,
              fontSize: 44 + (n % 3) * 8,
              color: SPEECH[n % SPEECH.length],
              textShadow: `0 0 18px ${SPEECH[n % SPEECH.length]}, 4px 4px 0 #0008`,
              opacity: Math.sin(t * Math.PI),
              transform: `translate(-50%, -50%) rotate(${Math.sin(t * 6 + n) * 14}deg)`,
            }}
          >
            {LETTERS[(n * 11 + 3) % 26]}
          </div>
        );
      })}
    </>
  );
};

// "Every dawn arrived as a poem written across the sky": a line of golden
// letters writes itself high over the village.
const POEM = "WORDS ARE LIGHT";
const SkyPoem: React.FC<{ f: number; day: number }> = ({ f, day }) => {
  const from = T(10.9);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: day }}>
      {POEM.split("").map((ch, i) => {
        if (ch === " ") return null;
        const t = interpolate(f, [from + i * 7, from + i * 7 + 20], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
        const fade = interpolate(f, [KNOCKS[0] - 20, KNOCKS[0]], [1, 0], clamp);
        const n = POEM.length - 1;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 960 - (n * 100) / 2 + i * 100,
              top: 260 - Math.sin((i / n) * Math.PI) * 90 + (1 - t) * 40 + Math.sin(f / 30 + i) * 4,
              fontFamily: PIXEL,
              fontSize: 72,
              color: i % 2 ? C.cream : C.gold,
              textShadow: `0 0 26px ${C.gold}, 0 0 60px #ffb24a, 5px 5px 0 #7a4a2a66`,
              opacity: t * fade,
              transform: `translate(-50%, -50%) scale(${0.6 + 0.4 * t})`,
            }}
          >
            {ch}
          </div>
        );
      })}
    </div>
  );
};

// "Not one word, not one ray": gold and mint light gathers round Rowan.
const RowanLight: React.FC<{ f: number }> = ({ f }) => {
  const g = interpolate(f, [T(40.3), T(41.8), T(46.3), T(47.6)], [0, 0.85, 1, 0.45], clamp);
  if (g <= 0) return null;
  const cx = rowanX(f);
  const cy = GROUND - 23 * PX;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: cx - 420,
          top: cy - 420,
          width: 840,
          height: 840,
          borderRadius: "50%",
          background: `radial-gradient(${C.cream}aa, ${ACCENT.mint}55 28%, ${C.gold}22 52%, transparent 70%)`,
          opacity: g * (0.8 + 0.2 * Math.sin(f / 5)),
        }}
      />
      {Array.from({ length: 9 }, (_, i) => {
        const a = f / 26 + (i / 9) * Math.PI * 2;
        const r = 190 + Math.sin(f / 17 + i) * 24;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: cx + Math.cos(a) * r,
              top: cy + Math.sin(a) * r * 0.55 - 20,
              fontFamily: PIXEL,
              fontSize: 34,
              color: i % 2 ? C.gold : ACCENT.mint,
              textShadow: `0 0 16px ${C.gold}`,
              opacity: g,
              transform: "translate(-50%, -50%)",
            }}
          >
            {"WORD"[i % 4]}
          </div>
        );
      })}
    </>
  );
};

// ---- The realm's letters (as in the narrated Opening) ----------------------

const FLIGHT = 26;
const stealAt = (i: number, seed: string) => STEAL + Math.floor(random(`${seed}${i}`) * 40);

type Glyph = { x: number; y: number; a: number; size: number; char: string; color: string };

const fireLetter = (i: number, f: number): Glyph => {
  const life = 220 + random(`fl-l${i}`) * 160;
  const t = ((f + random(`fl-o${i}`) * life) % life) / life;
  return {
    x: -2300 + random(`fl-x${i}`) * 4500 + Math.sin(f / 40 + i) * 30,
    y: GROUND - 40 - t * 520,
    a: Math.sin(t * Math.PI) * (0.55 + 0.45 * Math.sin(f / 9 + i * 1.7)),
    size: 26 + (i % 3) * 12,
    char: LETTERS[i % 26],
    color: i % 4 ? C.gold : C.cream,
  };
};

const treeLetter = (i: number, f: number): Glyph => ({
  x: -2000 + i * 80 + random(`tr-x${i}`) * 40,
  y: 520 + random(`tr-y${i}`) * 90,
  a: 0.6 + 0.4 * Math.sin(f / 14 + i),
  size: 22,
  char: "WORDSTALEREADBOOKSONG"[i % 21],
  color: C.gold,
});

const LETTER_SETS = [
  { n: 70, depth: 0.85, seed: "sf", at: fireLetter },
  { n: 60, depth: 0.6, seed: "st", at: treeLetter },
];

const Layer: React.FC<{ cam: number; depth: number; children: React.ReactNode }> = ({ cam, depth, children }) => (
  <AbsoluteFill style={{ transform: `translateX(${-(cam - 960) * depth}px)` }}>{children}</AbsoluteFill>
);

const Glyphs: React.FC<{ f: number; cam: number; set: (typeof LETTER_SETS)[number]; dim: number }> = ({ f, cam, set, dim }) => (
  <Layer cam={cam} depth={set.depth}>
    {Array.from({ length: set.n }, (_, i) => {
      if (f >= stealAt(i, set.seed)) return null;
      const g = set.at(i, f);
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: Math.round(g.x / 2) * 2,
            top: Math.round(g.y / 2) * 2,
            fontFamily: PIXEL,
            fontSize: g.size,
            color: g.color,
            textShadow: `0 0 14px ${C.gold}, 0 0 28px #ffb24a`,
            opacity: g.a * dim,
            transform: set.depth < 0.7 ? `rotate(${Math.sin(f / 25 + i) * 10}deg)` : undefined,
          }}
        >
          {g.char}
        </div>
      );
    })}
  </Layer>
);

// Where the Wizard's staff orb is, for a given tilt (see DarkWizard).
const orbAt = (raise: number): [number, number] => {
  const th = (-raise * 32 * Math.PI) / 180;
  const dx = -0.5;
  const dy = -18.5;
  const x = dx * Math.cos(th) - dy * Math.sin(th);
  const y = dx * Math.sin(th) + dy * Math.cos(th);
  return [WIZ_X - WIZ.cx * PX + (3 + x) * PX, GROUND - WIZ.feet * PX + (20 + y) * PX];
};

const wizRaise = (f: number) =>
  Math.max(
    ...KNOCKS.map((k) => interpolate(f, [k - 10, k - 4, k], [0, 0.45, 0], clamp)),
    interpolate(f, [STEAL - 8, STEAL + 4, STEAL + 56, STEAL + 70], [0, 0.7, 0.7, 0], clamp),
    interpolate(f, [S.shield - 6, S.shield], [0, 0.3], clamp),
  );

const StolenLetters: React.FC<{ f: number }> = ({ f }) => {
  const orb = orbAt(wizRaise(f));
  return (
    <>
      {LETTER_SETS.flatMap((set) =>
        Array.from({ length: set.n }, (_, i) => {
          const s0 = stealAt(i, set.seed);
          const t = (f - s0) / FLIGHT;
          if (t < 0 || t > 1) return null;
          const g = set.at(i, s0);
          const sx = g.x + (camX(s0) - 960) * (1 - set.depth);
          const p = t * t;
          const swirl = Math.sin(p * Math.PI) * 90 * (i % 2 ? 1 : -1);
          return (
            <div
              key={`${set.seed}${i}`}
              style={{
                position: "absolute",
                left: sx + (orb[0] - sx) * p + swirl * 0.4,
                top: g.y + (orb[1] - g.y) * p - swirl,
                fontFamily: PIXEL,
                fontSize: g.size,
                color: interpolateColors(p, [0, 1], [g.color, "#c9a8ff"]),
                textShadow: `0 0 16px ${interpolateColors(p, [0, 1], [C.gold, "#7a3cff"])}`,
                opacity: Math.max(g.a, 0.6),
                transform: `translate(-50%, -50%) scale(${1 - p * 0.6}) rotate(${p * 360 * (i % 2 ? 1 : -1)}deg)`,
              }}
            >
              {g.char}
            </div>
          );
        }),
      )}
    </>
  );
};

// Each knock: the staff hits the road, a purple shock-ring and dust.
const STAFF_FOOT = WIZ_X - WIZ.cx * PX + 2.5 * PX;
const KnockImpacts: React.FC<{ f: number }> = ({ f }) => (
  <>
    {KNOCKS.map((k) => {
      const d = f - k;
      if (d < 0 || d > 22) return null;
      const t = d / 22;
      return (
        <React.Fragment key={k}>
          <div
            style={{
              position: "absolute",
              left: STAFF_FOOT - 30 - 330 * t,
              top: GROUND - 8 - 50 * t,
              width: 60 + 660 * t,
              height: 16 + 100 * t,
              borderRadius: "50%",
              border: `${8 - t * 5}px solid #b78cff`,
              boxShadow: "0 0 20px #7a3cff",
              opacity: 1 - t,
            }}
          />
          {Array.from({ length: 12 }, (_, i) => {
            const a = Math.PI + random(`kd${k}${i}`) * Math.PI;
            const v = 80 + random(`kv${k}${i}`) * 160;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: Math.round((STAFF_FOOT + Math.cos(a) * v * t) / 6) * 6,
                  top: Math.round((GROUND + Math.sin(a) * v * t * 0.8 + 140 * t * t) / 6) * 6,
                  width: 12,
                  height: 12,
                  background: i % 2 ? "#6b4a3a" : "#3a2457",
                  opacity: 1 - t,
                }}
              />
            );
          })}
        </React.Fragment>
      );
    })}
  </>
);

// Red eyes opening in the dark, with his silhouette behind them. Lightning
// reveals him as "Then he came, my old enemy" plays out.
const EyesInTheDark: React.FC<{ f: number }> = ({ f }) => {
  const shape = interpolate(f, [KNOCKS[0] - 30, KNOCKS[0] - 1, KNOCKS[0], REVEAL, REVEAL + 20], [0, 0.35, 0.85, 0.85, 1], clamp);
  const knockLit = Math.max(...KNOCKS.map((k) => interpolate(f, [k - 1, k, k + 9], [0, 1, 0], clamp)));
  const drink = interpolate(f, [STEAL, STEAL + 66, STEAL + 90], [0, 1.6, 0], clamp);
  const lit = interpolate(f, [REVEAL, REVEAL + 24], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const open = interpolate(f, [EYES_OPEN, EYES_OPEN + 8], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
  const flare = 1 + interpolate(f, [KNOCKS[2], END], [0, 1.5], clamp);
  const left = WIZ_X - WIZ.cx * PX;
  const top = GROUND - WIZ.feet * PX;
  return (
    <>
      <Feet
        x={WIZ_X}
        w={WIZ.w}
        feet={WIZ.feet}
        cx={WIZ.cx}
        style={{
          opacity: shape,
          filter: `brightness(${0.18 + 0.5 * knockLit * (1 - lit) + 0.82 * lit}) saturate(${0.4 + 0.6 * lit})`,
        }}
      >
        <DarkWizard px={PX} eyes={lit} orb={0.6 + 0.4 * lit + drink} raise={wizRaise(f)} />
      </Feet>
      {[12, 16].map((ex) => (
        <div
          key={ex}
          style={{
            position: "absolute",
            left: left + ex * PX - 4,
            top: top + 10 * PX - 2,
            width: 2 * PX + 8,
            height: PX + 4,
            background: "#ff4a4a",
            transform: `scaleY(${open})`,
            opacity: 1 - lit,
            boxShadow: `0 0 ${18 * flare}px ${6 * flare}px #ff2a2aaa`,
          }}
        />
      ))}
    </>
  );
};

// Rowan splits in two, the Wizard's shield comes up, and the first letters fly.
const SHIELD = { x: WIZ_X - 20 * K, y: GROUND - 150 * K, rx: 210 * K, ry: 230 * K };
const FIRST_BOLTS = [
  { t0: END - 14, dur: 16, from: [ROWAN_X + 62 * K, GROUND - 112 * K], toY: SHIELD.y - 70 + random("br0") * 120, letter: 0 },
  { t0: END - 8, dur: 18, from: [CLONE_X + 62 * K, GROUND - 122 * K], toY: SHIELD.y - 70 + random("bc0") * 120, letter: 7 },
  { t0: END - 3, dur: 16, from: [ROWAN_X + 62 * K, GROUND - 112 * K], toY: SHIELD.y - 70 + random("br1") * 120, letter: 1 },
];

const Standoff: React.FC<{ f: number }> = ({ f }) => {
  const cloneX = interpolate(f, [S.split, S.split + 18], [ROWAN_X, CLONE_X], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
  const shield = interpolate(f, [S.shield, S.shield + 10], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
  return (
    <>
      {f >= S.split && (
        <Feet
          x={cloneX}
          w={48}
          feet={43}
          cx={24.5}
          dy={-10}
          style={{ opacity: 0.72 + 0.15 * Math.sin((f - END) / 2.5), filter: `brightness(1.4) saturate(0.5) drop-shadow(0 0 14px ${ACCENT.mint})` }}
        >
          <Sprite src={ROWAN} row={1} scale={PX} animFps={10} />
        </Feet>
      )}
      {f >= S.split - 6 && f < S.split + 16 && (
        <div
          style={{
            position: "absolute",
            left: ROWAN_X - 200,
            top: GROUND - 400,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: `radial-gradient(${C.cream}, ${ACCENT.mint}88 40%, transparent 70%)`,
            opacity: interpolate(f, [S.split - 6, S.split, S.split + 16], [0, 1, 0], clamp),
          }}
        />
      )}
      {shield > 0 && (
        <div
          style={{
            position: "absolute",
            left: SHIELD.x - SHIELD.rx,
            top: SHIELD.y - SHIELD.ry,
            width: SHIELD.rx * 2,
            height: SHIELD.ry * 2,
            borderRadius: "50%",
            border: "8px solid #b78cff",
            background: "radial-gradient(transparent 55%, #7a3cff55 100%)",
            boxShadow: "0 0 40px #7a3cff, inset 0 0 40px #7a3cff88",
            opacity: 0.75 + 0.2 * Math.sin(f / 2),
            transform: `scale(${shield})`,
          }}
        />
      )}
      {FIRST_BOLTS.map((b) => {
        const t = (f - b.t0) / b.dur;
        if (t < 0 || t > 1) return null;
        const toX = SHIELD.x - SHIELD.rx + 10;
        const x = b.from[0] + (toX - b.from[0]) * t;
        const y = b.from[1] + (b.toY - b.from[1]) * t + Math.sin(t * Math.PI) * -24;
        return (
          <React.Fragment key={b.t0}>
            {Array.from({ length: 6 }, (_, k) => (
              <div
                key={k}
                style={{
                  position: "absolute",
                  left: Math.round((x - (k + 1) * 22) / 4) * 4,
                  top: Math.round((y + Math.sin(k * 2 + f) * 6) / 4) * 4,
                  width: 12 - k * 1.6,
                  height: 12 - k * 1.6,
                  background: C.gold,
                  opacity: 0.7 - k * 0.1,
                }}
              />
            ))}
            <div
              style={{
                position: "absolute",
                left: x,
                top: y,
                transform: "translate(-50%, -50%)",
                fontFamily: PIXEL,
                fontSize: 58,
                color: C.gold,
                textShadow: `0 0 24px ${C.gold}, 4px 4px 0 #000`,
              }}
            >
              {LETTERS[Math.floor(random(`bl${b.letter}`) * 26)]}
            </div>
          </React.Fragment>
        );
      })}
    </>
  );
};

// ---- Lens and overlay effects ----------------------------------------------

// Letters right in front of the lens while the realm is golden, and the one
// the film opens on, rising sharp toward the camera and blurring as it passes.
const LensLetters: React.FC<{ f: number; cam: number; dim: number }> = ({ f, cam, dim }) => {
  if (dim <= 0) return null;
  const glow = `0 0 30px ${C.gold}, 0 0 70px #ffb24a`;
  const first = interpolate(f, [0, 140], [0, 1], clamp);
  const pass = interpolate(f, [70, 140], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden" }}>
      {first < 1 && (
        <div
          style={{
            position: "absolute",
            left: 960 + Math.sin(f / 30) * 24,
            top: 760 - first * 420,
            fontFamily: PIXEL,
            fontSize: 150,
            color: C.cream,
            textShadow: glow,
            opacity: interpolate(f, [24, 42, 110, 140], [0, 1, 1, 0], clamp),
            filter: `blur(${pass * 14}px)`,
            transform: `translate(-50%, -50%) scale(${1 + pass * 2.2}) rotate(${Math.sin(f / 20) * 6}deg)`,
          }}
        >
          W
        </div>
      )}
      {Array.from({ length: 9 }, (_, i) => {
        const life = 260 + random(`ll-l${i}`) * 160;
        const t = ((f + random(`ll-o${i}`) * life) % life) / life;
        const x = -700 + random(`ll-x${i}`) * 3300 - (cam - 960) * 1.7 + Math.sin(f / 50 + i) * 40;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: 1250 - t * 1600,
              fontFamily: PIXEL,
              fontSize: 160 + (i % 3) * 70,
              color: i % 3 ? C.gold : C.cream,
              textShadow: glow,
              opacity: Math.sin(t * Math.PI) * (0.25 + (i % 3) * 0.1) * dim,
              filter: `blur(${7 + (i % 3) * 3}px)`,
              transform: `rotate(${Math.sin(f / 40 + i) * 12}deg)`,
            }}
          >
            {LETTERS[(i * 7 + 3) % 26]}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// "Riding in on a cold wind": pale streaks tearing across the frame.
const Wind: React.FC<{ f: number }> = ({ f }) => {
  const a = interpolate(f, [T(24.0), T(25.5), T(30), T(31.5)], [0, 0.5, 0.5, 0], clamp);
  if (a <= 0) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden", opacity: a }}>
      {Array.from({ length: 16 }, (_, i) => {
        const speed = 38 + random(`wd-s${i}`) * 40;
        const x = 2300 - (((f * speed) / 1.6 + random(`wd-x${i}`) * 2600) % 2800);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: 120 + random(`wd-y${i}`) * 820,
              width: 180 + random(`wd-w${i}`) * 320,
              height: 3 + (i % 3),
              background: "linear-gradient(90deg, transparent, #cdd8ff, transparent)",
              opacity: 0.25 + random(`wd-o${i}`) * 0.4,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const Subtitle: React.FC<{ f: number; sub: { from: number; to: number; text: string } }> = ({ f, sub }) => {
  const from = T(sub.from);
  const dur = T(sub.to) + 6 - from;
  const t = f - from;
  if (t < 0 || t > dur) return null;
  const a = interpolate(t, [0, 8, dur - 10, dur], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 80 }}>
      {/* Lexend, big, on a soft dark band: easy to read for every viewer. */}
      <div
        style={{
          fontFamily: BODY,
          fontWeight: 500,
          fontSize: 54,
          lineHeight: 1.35,
          color: C.cream,
          textAlign: "center",
          maxWidth: 1500,
          padding: "14px 36px",
          borderRadius: 18,
          background: "rgba(8, 6, 20, 0.55)",
          textShadow: "0 2px 0 #000, 0 0 24px #000",
          opacity: a,
          filter: `blur(${(1 - a) * 5}px)`,
        }}
      >
        {sub.text}
      </div>
    </AbsoluteFill>
  );
};

// ---- Camera ----------------------------------------------------------------

// [frame, world x at the centre, zoom, focus y]. Zoom scales about (960, focus y).
// A crane down from the sun, a tracking shot beside Rowan, a wide shot for the
// poem, a push in on the children, a pan toward the knocks, close on the Wizard,
// pulling wide as the lamps die, a hard cut to Rowan, whip pans between the two
// of them, then wide for the split and a drift into the duel's first frame.
const WIDE_Y = GROUND - 260;
const KEYS: [number, number, number, number][] = [
  [0, 300, 2.7, 140],
  [190, 290, 1.15, 510],
  [215, 330, 1.5, 560],
  [345, 700, 1.5, 560],
  [378, 700, 1.12, 300],
  [488, 640, 1.1, 300],
  [KNOCKS[0] - 14, 640, 1.55, 575],
  [KNOCKS[0] + 4, 610, 1.6, 575],
  [KNOCKS[2] + 12, 1050, 1.2, WIDE_Y],
  [REVEAL, 1300, 1.35, WIDE_Y],
  [T(27.8), 1390, 2.0, 527],
  [T(29.95), 1390, 2.1, 527],
  [T(30.65), 1050, 1.05, WIDE_Y],
  [T(38.5), 1000, 1.25, WIDE_Y],
  [T(40.4) - 1, 1000, 1.3, WIDE_Y],
  [T(40.4), ROWAN_STOP - 4, 3.0, 730],
  [T(46.2), ROWAN_STOP - 4, 3.3, 722],
  [T(46.75), ROWAN_STOP - 4, 3.3, 722],
  [T(46.75) + 8, 1390, 2.3, 527],
  [T(49.9), 1390, 2.5, 527],
  [T(49.9) + 8, ROWAN_X - 4, 2.7, 730],
  [S.split - 30, ROWAN_X - 4, 3.0, 730],
  [S.split - 4, 1390, 3.2, 527],
  [S.split + 8, 980, 1.0, WIDE_Y],
  // The duel scales its world by 1.02, so match that here.
  [END, FIGHT_CAM.x, FIGHT_CAM.zoom * 1.02, WIDE_Y],
];
const camX = (f: number) => track(f, KEYS.map((k): [number, number] => [k[0], k[1]]));
const camZoom = (f: number) => track(f, KEYS.map((k): [number, number] => [k[0], k[2]]));
const camFocus = (f: number) => track(f, KEYS.map((k): [number, number] => [k[0], k[3]]));

// ---- Scene -----------------------------------------------------------------

export const IntroScene: React.FC = () => {
  const f = useCurrentFrame();
  const c = clock(f);

  const day = interpolate(f, [KNOCKS[0], T(26.2)], [1, 0], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const corrupt = interpolate(f, [KNOCKS[0], T(33)], [0, 0.8], clamp);
  const lampsOut = interpolate(f, [LAMPS_OUT, LAMPS_OUT + 15], [0, 1], clamp);
  let flash = 0;
  for (const k of KNOCKS) flash = Math.max(flash, interpolate(f, [k - 1, k, k + 9], [0, 1, 0], clamp));
  flash = Math.max(flash, interpolate(f, [REVEAL - 1, REVEAL, REVEAL + 12], [0, 1, 0], clamp));

  const cam = camX(f);
  const zoom = camZoom(f);
  const focusY = camFocus(f);
  let kick = 0;
  for (const k of KNOCKS) if (f >= k && f < k + 8) kick += 0.025 * (1 - (f - k) / 8);
  const shake = KNOCKS.reduce((a, k) => a + (f >= k && f < k + 10 ? (1 - (f - k) / 10) * 10 : 0), 0);

  const alarmed = f >= KNOCKS[0] && f < KNOCKS[0] + 40;
  const fadeIn = interpolate(f, [0, 30], [0, 1], clamp);
  const walking = rowanWalking(f);
  const rx = rowanX(f);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          opacity: fadeIn,
          transform: `translate(${Math.sin(f * 2.3) * shake}px, ${Math.cos(f * 3.1) * shake * 0.6}px) scale(${zoom + kick})`,
          transformOrigin: `960px ${focusY}px`,
        }}
      >
        <NightSky f={c} cam={cam} corrupt={corrupt} flash={flash} lit={0} litX={0} day={day} />
        <SkyPoem f={f} day={day} />
        <IntroBackdrop f={c} cam={cam} corrupt={corrupt} lampsOut={lampsOut} day={day} />
        <Glyphs f={f} cam={cam} set={LETTER_SETS[1]} dim={0.5 + 0.5 * day} />
        <div style={{ position: "absolute", inset: 0, transform: `translateX(${960 - cam}px)` }}>
          <Townsfolk f={f} day={day} />
          <RowanLight f={f} />
          <Feet x={rx} w={48} feet={43} cx={24.5} style={{ filter: `brightness(${1 + 0.15 * day})` }}>
            <Sprite src={ROWAN} row={walking ? 4 : 1} scale={PX} animFps={walking ? 5 : 6} />
          </Feet>
          {alarmed && (
            <div style={{ position: "absolute", left: rx - 30, top: GROUND - 32 * PX - 100 }}>
              <Exclaim px={7} />
            </div>
          )}
          <ColorLetters f={f} />
          <EyesInTheDark f={f} />
          <KnockImpacts f={f} />
          <Standoff f={f} />
          <StolenLetters f={f} />
        </div>
        <Glyphs f={f} cam={cam} set={LETTER_SETS[0]} dim={0.5 + 0.5 * day} />
        <Foreground f={c} cam={cam} day={day} />
        <AbsoluteFill style={{ background: "rgba(30,20,70,0.12)", opacity: 1 - day, pointerEvents: "none" }} />
        {/* Golden hour: warm light pouring in from the low sun. */}
        <AbsoluteFill
          style={{ background: "radial-gradient(ellipse at 72% 18%, #ffcf8a66, transparent 60%)", mixBlendMode: "screen", opacity: day, pointerEvents: "none" }}
        />
        <Vignette strength={0.45 + 0.15 * (1 - day)} />
      </AbsoluteFill>
      <LensFoliage f={c} cam={cam} day={day} />
      <LensLetters f={f} cam={cam} dim={day} />
      <Wind f={f} />

      {/* Shade under the subtitles so they read over the ground */}
      <AbsoluteFill style={{ background: "linear-gradient(transparent 70%, #000a 100%)", pointerEvents: "none" }} />
      {SUBS.map((sub) => (
        <Subtitle key={sub.from} f={f} sub={sub} />
      ))}
      <Grain opacity={0.06} />

      {/* Sound. The realm's theme and the birds while it is peaceful, gone on the
          first knock; a drone and the wind while the dark comes; three booming
          knocks; thunder at the reveal; then, as in the narrated Opening, the
          rumble, the riser and the fight music's first hit, which the duel
          picks up. */}
      <Sequence durationInFrames={KNOCKS[0] + 20} name="♪ realm theme">
        <Audio src={staticFile("music/background-music.mp3")} volume={(t) => STORY_GAIN * 0.5 * interpolate(t, [0, 60, KNOCKS[0] - 20, KNOCKS[0] + 12], [0, 1, 1, 0], clamp)} />
      </Sequence>
      <Sequence durationInFrames={KNOCKS[0] + 10} name="🔊 birds">
        <Audio src={staticFile("sfx/birds-chirping.mp3")} volume={(t) => STORY_GAIN * 0.35 * interpolate(t, [0, 45, KNOCKS[0] - 50, KNOCKS[0]], [0, 1, 1, 0], clamp)} />
      </Sequence>
      <Sequence from={KNOCKS[0] - 20} durationInFrames={END - MUSIC_PREROLL - KNOCKS[0] + 20} name="♪ drone">
        <Audio
          src={staticFile("music/mystery-drone.mp3")}
          volume={(t) => STORY_GAIN * 0.4 * interpolate(t, [0, 60, END - MUSIC_PREROLL - KNOCKS[0] - 60, END - MUSIC_PREROLL - KNOCKS[0] + 20], [0, 1, 1, 0], clamp)}
        />
      </Sequence>
      <Sequence from={T(24.0)} durationInFrames={END - MUSIC_PREROLL - T(24.0)} name="🔊 ambience">
        <Audio src={staticFile("sfx/ambience.mp3")} volume={gain((t) => interpolate(t, [0, 90], [0, 0.6], clamp))} />
      </Sequence>
      {KNOCKS.map((k, i) => (
        <Sequence key={k} from={k} durationInFrames={i === 2 ? 40 : 20} name="🔊 knock">
          <Audio src={staticFile("sfx/staff-slam.mp3")} volume={gain((t) => 0.55 * interpolate(t, [0, i === 2 ? 30 : 12, i === 2 ? 40 : 20], [1, 1, 0], clamp))} />
        </Sequence>
      ))}
      <Sequence from={KNOCKS[0] - 29} durationInFrames={REVEAL - KNOCKS[0] + 29 + 30} name="🔊 thunder">
        <Audio src={staticFile("sfx/thunder-strike.mp3")} volume={gain(0.4)} />
      </Sequence>
      <Sequence from={REVEAL - 29} durationInFrames={80} name="🔊 reveal thunder">
        <Audio src={staticFile("sfx/thunder-strike.mp3")} volume={gain((t) => 0.55 * interpolate(t, [0, 40, 80], [1, 1, 0], clamp))} />
      </Sequence>
      <Sequence from={STEAL - 10} durationInFrames={120} name="🔊 letters drawn in">
        <Audio src={staticFile("sfx/summon.mp3")} volume={gain((t) => 0.4 * interpolate(t, [0, 20, 100, 120], [0, 1, 1, 0], clamp))} />
      </Sequence>
      {[T(46.75) - 2, T(49.9) - 2, S.split - 18].map((at) => (
        <Sequence key={at} from={at - 10} durationInFrames={24} name="🔊 whip pan">
          <Audio src={staticFile("sfx/jump-whoosh.mp3")} volume={gain(0.22)} />
        </Sequence>
      ))}
      <Sequence from={T(40.2)} durationInFrames={120} name="🔊 Rowan's light">
        <Audio src={staticFile("sfx/charge-up.mp3")} volume={gain((t) => 0.3 * interpolate(t, [0, 30, 90, 120], [0, 1, 1, 0], clamp))} />
      </Sequence>
      <Sequence from={T(49.9) - 10} durationInFrames={END - T(49.9) + 10} name="🔊 rumble">
        <Audio
          src={staticFile("sfx/thunder-strike.mp3")}
          trimBefore={66}
          volume={gain((t) => interpolate(t, [0, 40, END - T(49.9) - 4, END - T(49.9) + 10], [0, 0.5, 0.7, 0], clamp))}
        />
      </Sequence>
      <Sequence from={S.split - 7} durationInFrames={45} name="🔊 split">
        <Audio src={staticFile("sfx/summon.mp3")} volume={gain(0.45)} />
      </Sequence>
      <Sequence from={S.shield} durationInFrames={20} name="🔊 shield up">
        <Audio src={staticFile("sfx/shield-hit.mp3")} volume={gain(1.1)} />
      </Sequence>
      {FIRST_BOLTS.map((b) => (
        <Sequence key={b.t0} from={b.t0 - 2} durationInFrames={END - b.t0 + 2} name="🔊 bolt">
          <Audio src={staticFile("sfx/bolt-zap.mp3")} volume={gain(0.21)} />
        </Sequence>
      ))}
      <Sequence from={END - 80 - MUSIC_PREROLL} durationInFrames={80} name="🔊 riser">
        <Audio src={staticFile("sfx/charge-up.mp3")} volume={gain((t) => interpolate(t, [0, 60, 80], [0.15, 0.6, 0.6], clamp))} />
      </Sequence>
      <Sequence from={END - MUSIC_PREROLL} durationInFrames={MUSIC_PREROLL} name="♪ fight (first hit)">
        <Audio src={staticFile("music/fighting-background-music.mp3")} trimBefore={MUSIC_SKIP} volume={gain(0.45)} />
      </Sequence>
      <Sequence from={END - MUSIC_PREROLL} durationInFrames={30} name="🔊 first-bolt boom">
        <Audio src={staticFile("sfx/staff-slam.mp3")} volume={gain((t) => interpolate(t, [0, 20, 30], [0.35, 0.35, 0], clamp))} />
      </Sequence>

      {/* Elder Rowan's narration */}
      <Sequence from={AUDIO_AT} durationInFrames={VOICE_FRAMES} name="🗣 Elder Rowan">
        <Audio src={staticFile("voice/rowan-intro.mp3")} volume={gain(1.15)} />
      </Sequence>
    </AbsoluteFill>
  );
};
