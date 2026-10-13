import React from "react";
import { AbsoluteFill, Easing, interpolate, random, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { Grain, Vignette } from "../components/Fx";
import { Sprite } from "../components/Sprite";
import { Dialogue, EPIC, ROWAN } from "../lore/parts";
import { C, PIXEL, TITLE } from "../theme";
import { ACCENT, FIGHT_CAM, MUSIC_PREROLL, MUSIC_SKIP } from "./config";
import { DarkWizard, WIZ } from "./DarkWizard";
import { Backdrop, Foreground, GROUND, NightSky } from "./NightVillage";
import { OPENING_FRAMES } from "./Opening";
import { track } from "./parts";

// Prologue, long before the trailer. We cut in mid-duel: Elder Rowan and a
// spell-copy of himself against the Dark Wizard. The Wizard breaks their beam,
// the copy shatters, and with his last spell Rowan summons help from another
// world. The chime of that spell is the one Hero hears behind her door.

// After the flash: pure white, the narrator's last line, then the title.
export const SUMMONING_FRAMES = 1050;
// When the summoning chime rings, relative to this act.
export const SUMMON_CHIME = 800;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = { ...clamp, easing: Easing.inOut(Easing.quad) };

const PX = 10;
// Offsets below were measured at 7px per art pixel.
const K = PX / 7;
const DARK_RED = "#ff6b78";
const VIOLET = "#7a3cff";
const LAVENDER = "#b78cff";
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// ---- Beats -----------------------------------------------------------------

const B = {
  slam: 72,
  teleport: 163,
  beam: 190,
  charge: 296,
  break: 351,
  land: 395,
  advance: 470,
  rise: 660,
  ring: 670,
  finalBlast: 778,
  flash: 812,
};

// On the white after the flash: the narrator's last line, then the title.
const END = { line: 835, lineOut: 955, title: 968 };

// `voice` lines type along with the recording: `speak` is how long the words
// take, in frames (from the Whisper word timings).
// The recordings in public/voice are loudness-normalised copies of the takes.
// `reveal` holds the text through a pause in the take.
type Line = { from: number; dur: number; who: string; text: string; voice?: string; speak?: number; reveal?: [number, number][] };
const LINES: Line[] = [
  { from: 88, dur: 118, who: "Dark Wizard", text: "Every word in this realm will be mine!", voice: "voice/evil-line1.mp3", speak: 92 },
  { from: 210, dur: 95, who: "Elder Rowan", text: "Not while I still stand!", voice: "voice/good-line1.mp3", speak: 68 },
  { from: 306, dur: 45, who: "Dark Wizard", text: "ENOUGH!", voice: "voice/evil-line2.mp3", speak: 19 },
  { from: 470, dur: 92, who: "Dark Wizard", text: "Your magic is fading, old man.", voice: "voice/evil-line3.mp3", speak: 72 },
  {
    from: 563,
    dur: 128,
    who: "Elder Rowan",
    text: "One spell left... I can't win this alone.",
    voice: "voice/good-line2.mp3",
    speak: 118,
    reveal: [
      [0, 0],
      [40, 18],
      [72, 18],
      [118, 41],
    ],
  },
  {
    from: 692,
    dur: 118,
    who: "Elder Rowan",
    text: "Whoever hears this... the realm needs you!",
    voice: "voice/good-line3.mp3",
    speak: 116,
    reveal: [
      [0, 0],
      [44, 22],
      [63, 22],
      [116, 42],
    ],
  },
];

// Frames drawn as inverted "impact frames".
const IMPACT_FRAMES: [number, number][] = [
  [B.slam, 3],
  [B.break, 4],
  [B.finalBlast + 14, 2],
];

// Lightning called down on where they stand; each one leaps clear just before.
const STRIKES = [
  { at: 100, x: 455 },
  { at: 122, x: 360 },
  { at: 140, x: 540 },
];

// ---- Motion ----------------------------------------------------------------

const hop = (f: number, t0: number, t1: number, h: number) => (f > t0 && f < t1 ? Math.sin(((f - t0) / (t1 - t0)) * Math.PI) * h : 0);
const between = (f: number, t0: number, t1: number) => f >= t0 && f < t1;

const rowanX = (f: number) =>
  track(f, [
    [B.slam + 2, 600],
    [B.slam + 16, 500],
    [90, 500],
    [106, 620],
    [130, 620],
    [146, 690],
    [B.break, 690],
    [B.land, 420],
  ]);
const rowanY = (f: number) => GROUND - hop(f, 90, 106, 150) - hop(f, 130, 146, 130) - hop(f, B.break, B.land, 200);

const cloneX = (f: number) =>
  track(f, [
    [B.slam + 2, 350],
    [B.slam + 16, 280],
    [112, 280],
    [128, 210],
  ]);
const cloneY = (f: number) => GROUND - 10 - hop(f, 112, 128, 150);

const wizX = (f: number) =>
  f < B.teleport + 4
    ? 1400
    : track(f, [
        [B.advance, 1260],
        [B.advance + 90, 1080],
        [B.finalBlast + 16, 1080],
        [B.flash, 1180],
      ]);

// Staff: tips forward to cast. Orb: grows as he charges.
const wizRaise = (f: number) =>
  Math.max(
    f < B.break ? 0.3 : 0,
    interpolate(f, [B.slam - 8, B.slam, B.slam + 10], [0, 1, 0], clamp),
    interpolate(f, [90, 96, 142, 150], [0, 1, 1, 0], clamp),
    interpolate(f, [B.beam - 6, B.beam, B.break, B.break + 12], [0, 1, 1, 0], clamp),
    interpolate(f, [B.rise, B.finalBlast - 10, B.finalBlast, B.finalBlast + 20], [0, 1, 1, 0.3], clamp),
  );
const wizOrb = (f: number) =>
  1 +
  interpolate(f, [B.beam, B.beam + 10], [0, 0.6], clamp) * (f < B.break ? 1 : 0) +
  interpolate(f, [B.charge, B.break - 6], [0, 2], clamp) * (f < B.break ? 1 : 0) +
  interpolate(f, [B.rise, B.finalBlast], [0, 2.5], clamp) * (f < B.finalBlast + 2 ? 1 : 0);

// Where the beams meet: holds, pushes toward the Wizard, then he charges
// and drives it back into Rowan.
const clashX = (f: number) =>
  track(f, [
    [B.beam + 8, 990],
    [215, 980],
    [240, 1010],
    [272, 1110],
    [B.charge, 1090],
    [322, 990],
    [345, 880],
    [B.break, 850],
  ]);
const CLASH_Y = GROUND - 175 * K;

// Hands, for bolts and beams.
const rowanHand = (f: number): [number, number] => [rowanX(f) + 62 * K, rowanY(f) - 112 * K];
const cloneHand = (f: number): [number, number] => [cloneX(f) + 62 * K, cloneY(f) - 112 * K];
// The orb at the top of the staff when tipped fully forward.
const wizOrbAt = (f: number): [number, number] => [wizX(f) - 148 * K, GROUND - 241 * K];

type Bolt = { t0: number; dur: number; from: [number, number]; to: [number, number]; gold: boolean; big?: number };

// The opening barrage: already in flight on frame 0.
const SHIELD = { dx: -20 * K, y: GROUND - 150 * K, rx: 210 * K, ry: 230 * K };
const BOLTS: Bolt[] = [
  ...Array.from({ length: 7 }, (_, k) => ({
    t0: -14 + k * 11,
    dur: 16,
    from: [600 + 62 * K, GROUND - 112 * K] as [number, number],
    to: [1400 + SHIELD.dx - SHIELD.rx + 10, SHIELD.y - 70 + random(`br${k}`) * 120] as [number, number],
    gold: true,
  })),
  ...Array.from({ length: 6 }, (_, k) => ({
    t0: -8 + k * 11,
    dur: 18,
    from: [350 + 62 * K, GROUND - 122 * K] as [number, number],
    to: [1400 + SHIELD.dx - SHIELD.rx + 10, SHIELD.y - 70 + random(`bc${k}`) * 120] as [number, number],
    gold: true,
  })),
  // His last attack, swallowed by the summoning light.
  { t0: B.finalBlast, dur: 14, from: [1080 - 148 * K, GROUND - 241 * K], to: [650, 330], gold: false, big: 2.4 },
];

const impacts = [
  ...BOLTS.map((b) => ({ at: b.t0 + b.dur, pos: b.to, gold: b.gold, size: b.big ?? 0.8 })),
  ...STRIKES.map((s) => ({ at: s.at, pos: [s.x, GROUND - 20] as [number, number], gold: false, size: 1.8 })),
  { at: B.break, pos: [520, GROUND - 150 * K] as [number, number], gold: false, size: 4 },
];

// Screen shake: impacts, the slam, a rumble through the beam struggle.
const shake = (f: number) => {
  let a = 0;
  for (const i of impacts) {
    const d = f - i.at;
    if (d >= 0 && d < 14) a += (1 - d / 14) * 5 * i.size;
  }
  for (const [at, amp, len] of [
    [B.slam, 22, 18],
    [B.break, 30, 30],
    [B.land, 12, 12],
  ])
    if (f >= at && f < at + len) a += (1 - (f - at) / len) * amp;
  if (between(f, B.beam, B.break)) a += interpolate(f, [B.beam, B.charge, B.break], [3, 5, 12], clamp);
  return { x: Math.sin(f * 2.3) * a, y: Math.cos(f * 3.1) * a * 0.6 };
};

// ---- Pieces ----------------------------------------------------------------

// A figure placed by its feet.
const Feet: React.FC<{ x: number; y: number; w: number; feet: number; cx: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  x,
  y,
  w,
  feet,
  cx,
  children,
  style,
}) => <div style={{ position: "absolute", left: x - cx * PX, top: y - feet * PX, width: w * PX, ...style }}>{children}</div>;

const Rowan: React.FC<{ x: number; y: number; row: number; col?: number; style?: React.CSSProperties; spin?: number }> = ({ x, y, row, col, style, spin = 0 }) => (
  <Feet x={x} y={y} w={48} feet={43} cx={24.5} style={style}>
    <div style={{ transform: `rotate(${spin}deg)`, transformOrigin: `${24.5 * PX}px ${30 * PX}px` }}>
      <Sprite src={ROWAN} row={row} col={col} scale={PX} animFps={10} />
    </div>
  </Feet>
);

// A straight beam between two points.
const Beam: React.FC<{ a: [number, number]; b: [number, number]; color: string; core: string; w: number; f: number }> = ({ a, b, color, core, w, f }) => {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
  const wob = w * (0.85 + 0.15 * Math.sin(f * 1.7) + 0.1 * Math.sin(f * 4.1));
  return (
    <div style={{ position: "absolute", left: a[0], top: a[1], width: len, height: 0, transform: `rotate(${ang}deg)`, transformOrigin: "0 0" }}>
      <div style={{ position: "absolute", left: 0, top: -wob, width: len, height: wob * 2, background: color, boxShadow: `0 0 ${wob * 2}px ${wob}px ${color}` }} />
      <div style={{ position: "absolute", left: 0, top: -wob * 0.4, width: len, height: wob * 0.8, background: core }} />
      {/* Stepped pixel sparks running along it */}
      {Array.from({ length: Math.floor(len / 60) }, (_, k) => (
        <div
          key={k}
          style={{
            position: "absolute",
            left: (k * 60 + f * 14) % len,
            top: (random(`bm${k}-${Math.floor(f / 3)}`) - 0.5) * wob * 3,
            width: 10,
            height: 10,
            background: core,
          }}
        />
      ))}
    </div>
  );
};

const BoltView: React.FC<{ b: Bolt; f: number; i: number }> = ({ b, f, i }) => {
  const t = (f - b.t0) / b.dur;
  if (t < 0 || t > 1) return null;
  const big = b.big ?? 1;
  const x = b.from[0] + (b.to[0] - b.from[0]) * t;
  const y = b.from[1] + (b.to[1] - b.from[1]) * t + Math.sin(t * Math.PI) * -24;
  const color = b.gold ? C.gold : LAVENDER;
  const dir = Math.sign(b.to[0] - b.from[0]);
  return (
    <>
      {Array.from({ length: 6 }, (_, k) => (
        <div
          key={k}
          style={{
            position: "absolute",
            left: Math.round((x - dir * (k + 1) * 22 * big) / 4) * 4,
            top: Math.round((y + Math.sin(k * 2 + f) * 6) / 4) * 4,
            width: (12 - k * 1.6) * big,
            height: (12 - k * 1.6) * big,
            background: color,
            opacity: 0.7 - k * 0.1,
          }}
        />
      ))}
      {b.gold ? (
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
          {LETTERS[Math.floor(random(`bl${i}`) * 26)]}
        </div>
      ) : (
        <div
          style={{
            position: "absolute",
            left: x - 18 * big,
            top: y - 18 * big,
            width: 36 * big,
            height: 36 * big,
            background: VIOLET,
            border: `${6 * big}px solid #e8d8ff`,
            boxShadow: `0 0 ${40 * big}px ${16 * big}px ${VIOLET}aa`,
            transform: `rotate(${f * 12}deg)`,
          }}
        />
      )}
    </>
  );
};

// Pixel squares bursting from an impact.
const Burst: React.FC<{ at: number; pos: [number, number]; gold: boolean; size: number; f: number; seed: string }> = ({ at, pos, gold, size, f, seed }) => {
  const d = f - at;
  if (d < 0 || d > 26) return null;
  const t = d / 26;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: pos[0] - 90 * size,
          top: pos[1] - 90 * size,
          width: 180 * size,
          height: 180 * size,
          borderRadius: "50%",
          background: `radial-gradient(${C.cream}, ${gold ? C.gold : LAVENDER}cc 30%, transparent 65%)`,
          opacity: 1 - t,
          transform: `scale(${0.4 + t})`,
        }}
      />
      {Array.from({ length: 16 }, (_, k) => {
        const a = random(`${seed}a${k}`) * Math.PI * 2;
        const v = (60 + random(`${seed}v${k}`) * 160) * size;
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: Math.round((pos[0] + Math.cos(a) * v * t) / 4) * 4,
              top: Math.round((pos[1] + Math.sin(a) * v * t + 160 * t * t) / 4) * 4,
              width: k % 3 ? 8 : 14,
              height: k % 3 ? 8 : 14,
              background: k % 2 ? (gold ? C.gold : LAVENDER) : C.cream,
              opacity: 1 - t,
            }}
          />
        );
      })}
    </>
  );
};

// His shield, rippling where the letters hit, until he blows it outward.
const Shield: React.FC<{ f: number }> = ({ f }) => {
  if (f > B.slam + 18) return null;
  const burst = interpolate(f, [B.slam, B.slam + 18], [0, 1], clamp);
  const cx = 1400 + SHIELD.dx;
  const hits = BOLTS.filter((b) => b.gold).map((b) => ({ at: b.t0 + b.dur, pos: b.to }));
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: cx - SHIELD.rx,
          top: SHIELD.y - SHIELD.ry,
          width: SHIELD.rx * 2,
          height: SHIELD.ry * 2,
          borderRadius: "50%",
          border: `8px solid ${LAVENDER}`,
          background: `radial-gradient(transparent 55%, ${VIOLET}55 100%)`,
          boxShadow: `0 0 40px ${VIOLET}, inset 0 0 40px ${VIOLET}88`,
          opacity: (0.75 + 0.2 * Math.sin(f / 2)) * (1 - burst),
          transform: `scale(${1 + burst * 3})`,
        }}
      />
      {hits.map((h, i) => {
        const d = f - h.at;
        if (d < 0 || d > 12) return null;
        const s = 40 + d * 14;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: h.pos[0] - s / 2,
              top: h.pos[1] - s / 2,
              width: s,
              height: s,
              borderRadius: "50%",
              border: `6px solid #e8d8ff`,
              opacity: 1 - d / 12,
            }}
          />
        );
      })}
      {/* Shockwave along the ground */}
      {burst > 0 && (
        <div
          style={{
            position: "absolute",
            left: cx - 1400 * burst,
            top: GROUND - 60,
            width: 2800 * burst,
            height: 80,
            borderRadius: "50%",
            border: `10px solid ${LAVENDER}`,
            opacity: 1 - burst,
          }}
        />
      )}
    </>
  );
};

// Lightning bolts hitting the road, leaving scorch marks.
const Strikes: React.FC<{ f: number }> = ({ f }) => (
  <>
    {STRIKES.map((s, i) => {
      const d = f - s.at;
      if (d < -4) return null;
      const scorch = (
        <div
          key={`sc${i}`}
          style={{
            position: "absolute",
            left: s.x - 70,
            top: GROUND + 4,
            width: 140,
            height: 26,
            borderRadius: "50%",
            background: "#140a1c",
            opacity: d >= 0 ? 0.75 : 0,
          }}
        />
      );
      if (d > 10) return scorch;
      let x = s.x;
      const pts = [`${x},${-80}`];
      for (let y = 0; y <= GROUND; y += 60) {
        x = s.x + (random(`sk${i}-${y}-${Math.floor(f / 2)}`) - 0.5) * 40;
        pts.push(`${Math.round(x)},${y}`);
      }
      pts.push(`${s.x},${GROUND}`);
      return (
        <React.Fragment key={i}>
          {scorch}
          <svg width={1920 * 2} height={GROUND + 40} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: d < 0 ? 0.3 : 1 - d / 10 }}>
            <polyline points={pts.join(" ")} fill="none" stroke={LAVENDER} strokeWidth={26} opacity={0.5} />
            <polyline points={pts.join(" ")} fill="none" stroke="#f4ecff" strokeWidth={8} />
          </svg>
        </React.Fragment>
      );
    })}
  </>
);

// Where the beams meet.
const Clash: React.FC<{ f: number; x: number }> = ({ f, x }) => {
  const pulse = 1 + 0.18 * Math.sin(f * 1.3) + 0.1 * Math.sin(f * 3.7);
  const heat = interpolate(f, [B.beam, B.charge, B.break], [1, 1.2, 1.8], clamp);
  const s = 200 * pulse * heat;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x - s / 2,
          top: CLASH_Y - s / 2,
          width: s,
          height: s,
          borderRadius: "50%",
          background: `radial-gradient(#fff, ${C.cream} 20%, ${f > B.charge ? LAVENDER : C.gold}bb 45%, transparent 70%)`,
        }}
      />
      {Array.from({ length: 24 }, (_, k) => {
        const life = 16;
        const born = f - ((f + k * 3) % life);
        const t = (f - born) / life;
        const a = random(`cs${k}-${born}`) * Math.PI * 2;
        const v = 120 + random(`cv${k}-${born}`) * 220;
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: Math.round((x + Math.cos(a) * v * t) / 4) * 4,
              top: Math.round((CLASH_Y + Math.sin(a) * v * t + 90 * t * t) / 4) * 4,
              width: k % 3 ? 8 : 12,
              height: k % 3 ? 8 : 12,
              background: k % 2 ? C.gold : LAVENDER,
              opacity: 1 - t,
            }}
          />
        );
      })}
      {/* The road breaking up under it */}
      {Array.from({ length: 18 }, (_, k) => {
        const life = 40;
        const t = ((f + k * 7) % life) / life;
        const rx = x + (random(`db${k}`) - 0.5) * 500;
        return (
          <div
            key={`d${k}`}
            style={{
              position: "absolute",
              left: Math.round((rx + Math.sin(t * 6 + k) * 10) / 7) * 7,
              top: Math.round((GROUND + 20 - t * 260) / 7) * 7,
              width: k % 3 ? 14 : 21,
              height: k % 3 ? 14 : 21,
              background: k % 2 ? "#5e4436" : "#2f5a3e",
              opacity: Math.sin(t * Math.PI),
            }}
          />
        );
      })}
    </>
  );
};

// The copy breaks apart into the letters it was made of, in slow motion.
const Shatter: React.FC<{ f: number; x: number }> = ({ f, x }) => {
  const d = (f - B.break) * 0.45;
  if (d < 0 || d > 50) return null;
  const t = d / 50;
  return (
    <>
      {Array.from({ length: 26 }, (_, k) => {
        const a = -Math.PI / 2 + (random(`sh-a${k}`) - 0.5) * Math.PI * 1.7;
        const v = 6 + random(`sh-v${k}`) * 12;
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: x + Math.cos(a) * v * d - 4 * d,
              top: GROUND - 150 * K + Math.sin(a) * v * d + 0.3 * d * d,
              fontFamily: PIXEL,
              fontSize: 34 + (k % 3) * 12,
              color: k % 3 ? ACCENT.mint : C.cream,
              textShadow: `0 0 16px ${ACCENT.mint}`,
              opacity: 1 - t,
              transform: `rotate(${(random(`sh-r${k}`) - 0.5) * d * 16}deg)`,
            }}
          >
            {LETTERS[k]}
          </div>
        );
      })}
    </>
  );
};

// Purple smoke for his teleport.
const Smoke: React.FC<{ f: number; at: number; x: number }> = ({ f, at, x }) => {
  const d = f - at;
  if (d < 0 || d > 34) return null;
  const t = d / 34;
  return (
    <>
      {Array.from({ length: 12 }, (_, k) => {
        const a = (k / 12) * Math.PI * 2;
        const s = (90 + random(`sm${at}${k}`) * 80) * (0.6 + t);
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: x + Math.cos(a) * 150 * t - s / 2,
              top: GROUND - 140 * K + Math.sin(a) * 90 * t - s / 2 - 60 * t,
              width: s,
              height: s,
              borderRadius: "50%",
              background: k % 2 ? "#3a2457" : "#241638",
              opacity: (1 - t) * 0.95,
            }}
          />
        );
      })}
    </>
  );
};

// Anime speed lines rushing in on a point (screen space).
const SpeedLines: React.FC<{ f: number; cx: number; cy: number; o: number }> = ({ f, cx, cy, o }) => {
  if (o <= 0) return null;
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: o, mixBlendMode: "screen" }}>
      {Array.from({ length: 48 }, (_, k) => {
        const a = random(`sl${k}-${Math.floor(f / 2)}`) * Math.PI * 2;
        const r0 = 380 + random(`sr${k}-${Math.floor(f / 2)}`) * 260;
        return (
          <line
            key={k}
            x1={cx + Math.cos(a) * r0}
            y1={cy + Math.sin(a) * r0}
            x2={cx + Math.cos(a) * 1600}
            y2={cy + Math.sin(a) * 1600}
            stroke="#f4ecff"
            strokeWidth={2 + (k % 4) * 2}
            opacity={0.35}
          />
        );
      })}
    </svg>
  );
};

// Rowan can't stand, so from his knees he tears a portal open in the sky above
// the road: a slit of light that rips open into a doorway, the same mint
// gateway Hero later walks through. Letters and dust are pulled up into it,
// it swallows the Wizard's last blast, and the camera rises through it into
// her world.
const PORTAL = { x: 650, w: 240, h: 380 };
const PORTAL_CY = 330;

const SkyPortal: React.FC<{ f: number }> = ({ f }) => {
  const d = f - B.ring;
  if (d < 0) return null;
  // A vertical slit of light, then it tears open sideways.
  const tall = interpolate(d, [0, 12], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const wide = interpolate(d, [10, 40], [0.03, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
  const flare = interpolate(f, [B.finalBlast + 14, B.flash], [0, 1], clamp);
  const pulse = 1 + 0.04 * Math.sin(f / 4) + flare * 0.5;
  const w = PORTAL.w * wide * pulse;
  const h = PORTAL.h * tall * pulse;
  const left = PORTAL.x - w / 2;
  const top = PORTAL_CY - h / 2;
  const stepF = Math.floor(f / 3) * 3;
  return (
    <>
      {/* A shaft of its light falling on the road, and on Rowan */}
      <div
        style={{
          position: "absolute",
          left: PORTAL.x - 260,
          top: PORTAL_CY,
          width: 520,
          height: GROUND + 40 - PORTAL_CY,
          background: `linear-gradient(${ACCENT.mint}55, ${ACCENT.mint}22 70%, transparent)`,
          clipPath: "polygon(38% 0, 62% 0, 100% 100%, 0 100%)",
          opacity: wide * (0.8 + 0.2 * Math.sin(f / 5)),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: PORTAL.x - 300,
          top: GROUND - 50,
          width: 600,
          height: 100,
          borderRadius: "50%",
          background: `radial-gradient(${ACCENT.mint}88, transparent 70%)`,
          opacity: wide,
        }}
      />
      <div style={{ position: "absolute", left, top, width: w, height: h, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse, ${C.cream} ${10 + flare * 50}%, ${ACCENT.mint} ${45 + flare * 30}%, #1d5a4c 100%)` }} />
        {/* Rings rushing outward, like the doorway portal */}
        {Array.from({ length: 6 }, (_, i) => {
          const t = (stepF / 36 + i / 6) % 1;
          const rw = w * (0.15 + t * 1.0);
          const rh = h * (0.15 + t * 1.0);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: w / 2 - rw / 2,
                top: h / 2 - rh / 2,
                width: rw,
                height: rh,
                border: `${10 - t * 5}px solid ${[ACCENT.mint, ACCENT.lavender, ACCENT.peach][i % 3]}`,
                opacity: (1 - t) * 0.7,
              }}
            />
          );
        })}
      </div>
      {/* Frame */}
      <div
        style={{
          position: "absolute",
          left: left - 10,
          top: top - 10,
          width: w + 20,
          height: h + 20,
          border: `10px solid ${ACCENT.mint}`,
          boxShadow: `0 0 50px 10px ${ACCENT.mint}aa, inset 0 0 30px ${ACCENT.mint}`,
          opacity: tall,
        }}
      />
      {/* Letters and dust pulled in */}
      {tall > 0.5 &&
        Array.from({ length: 18 }, (_, k) => {
          const life = 50;
          const t = ((f + k * 11) % life) / life;
          const a = random(`pl-a${k}`) * Math.PI * 2 + t * 3;
          const r = (1 - t) * (300 + random(`pl-r${k}`) * 250);
          return (
            <div
              key={k}
              style={{
                position: "absolute",
                left: PORTAL.x + Math.cos(a) * r,
                top: PORTAL_CY + Math.sin(a) * r * 0.8,
                fontFamily: PIXEL,
                fontSize: k % 3 ? 20 : 30,
                color: k % 2 ? ACCENT.mint : C.gold,
                textShadow: `0 0 12px ${ACCENT.mint}`,
                opacity: Math.sin(t * Math.PI),
                transform: `translate(-50%, -50%) scale(${1 - t * 0.7})`,
              }}
            >
              {k % 3 === 0 ? "\u25A0" : LETTERS[k + 4]}
            </div>
          );
        })}
    </>
  );
};

const musicVolume = (f: number) => {
  const duck = LINES.filter((l) => l.voice).reduce(
    (v, l) => Math.min(v, interpolate(f, [l.from - 6, l.from, l.from + (l.speak ?? 0) + 10, l.from + (l.speak ?? 0) + 25], [1, 0.4, 0.4, 1], clamp)),
    1,
  );
  return interpolate(f, [0, SUMMON_CHIME - 10, SUMMON_CHIME + 40], [0.45, 0.45, 0], clamp) * duck;
};

// ---- Sound effects ---------------------------------------------------------
// public/sfx. `at` is the frame the hit should land on, `hit` is how far into
// the file (seconds) that hit is, `len` is frames to play before cutting.
type Cue = { src: string; at: number; hit: number; vol: number; len: number; fade?: number };
// Master level for every effect, so the stacked hits stay under 0dB.
const SFX_LEVEL = 0.7;

const gold = BOLTS.filter((b) => b.gold);
const SFX: Cue[] = [
  { src: "ambience", at: 0, hit: 0.3, vol: 0.9, len: B.flash + 20, fade: 50 },
  // Opening barrage: a zap as each letter leaves, a ripple as it hits.
  ...gold.filter((b) => b.t0 >= 0).map((b) => ({ src: "bolt-zap", at: b.t0, hit: 0.06, vol: 0.3, len: 26 })),
  ...gold.filter((b) => b.t0 + b.dur >= 2).map((b) => ({ src: "shield-hit", at: b.t0 + b.dur, hit: 0.02, vol: 1.6, len: 20 })),
  // Staff slam and the shield bursting.
  { src: "staff-slam", at: B.slam, hit: 0.02, vol: 0.9, len: 100, fade: 50 },
  { src: "shockwave", at: B.slam + 2, hit: 0.27, vol: 0.8, len: 60, fade: 20 },
  { src: "body-hit", at: B.slam + 14, hit: 0.08, vol: 0.5, len: 25 },
  // Dodging the lightning.
  ...[90, 112, 130].map((t) => ({ src: "jump-whoosh", at: t + 5, hit: 0.35, vol: 0.35, len: 24 })),
  ...STRIKES.map((s) => ({ src: "thunder-strike", at: s.at, hit: 0.98, vol: 0.75, len: 29 + 70, fade: 40 })),
  // Teleport out, then in.
  { src: "teleport", at: B.teleport - 3, hit: 0.05, vol: 1, len: 35 },
  { src: "teleport", at: B.teleport + 3, hit: 0.05, vol: 0.8, len: 35 },
  // Beam struggle: ignition, then a burning bed of retriggered zaps and crackle.
  { src: "beam-loop", at: B.beam, hit: 0.06, vol: 0.9, len: 40 },
  ...Array.from({ length: Math.floor((B.break - B.beam - 14) / 14) }, (_, k) => ({
    src: "beam-loop",
    at: B.beam + 14 + k * 14,
    hit: 0.06,
    vol: interpolate(k, [0, 10], [0.35, 0.65], clamp),
    len: 26,
  })),
  ...Array.from({ length: Math.floor((B.break - B.beam - 8) / 9) }, (_, k) => ({
    src: "beam-clash",
    at: B.beam + 8 + k * 9 + Math.floor(random(`bc${k}`) * 4),
    hit: 0.04,
    vol: 1.2,
    len: 18,
  })),
  { src: "charge-up", at: B.charge, hit: 0, vol: 1.1, len: B.break - B.charge + 4, fade: 4 },
  // The break.
  { src: "beam-break", at: B.break, hit: 0.08, vol: 1, len: 90, fade: 40 },
  { src: "staff-slam", at: B.break, hit: 0.02, vol: 0.6, len: 80, fade: 40 },
  { src: "shatter", at: B.break + 3, hit: 0.06, vol: 0.55, len: 45 },
  { src: "jump-whoosh", at: B.break + 10, hit: 0.35, vol: 0.3, len: 24 },
  { src: "body-hit", at: B.land, hit: 0.08, vol: 1, len: 30 },
  // The summoning, his final charge and blast, the flare.
  { src: "summon", at: B.ring + 8, hit: 0.24, vol: 0.9, len: 50 },
  { src: "charge-up", at: B.rise + 30, hit: 0, vol: 0.6, len: B.finalBlast - B.rise - 30, fade: 6 },
  { src: "final-blast", at: B.finalBlast, hit: 0.02, vol: 0.85, len: 50, fade: 20 },
  { src: "shockwave", at: B.finalBlast + 14, hit: 0.27, vol: 0.7, len: 50, fade: 20 },
  { src: "summon", at: B.finalBlast + 16, hit: 0.24, vol: 1, len: 50 },
  // A soft swell as the title appears on the white.
  { src: "summon", at: END.title + 4, hit: 0.24, vol: 0.45, len: 50 },
];


// ---- On the white ------------------------------------------------------------
// The narrator's last line, each phrase appearing as it's spoken (Whisper
// timings from the take, in frames from END.line), then the title.
const END_LINE = {
  voice: "voice/endingvoiceline.mp3",
  phrases: [
    { at: 0, text: "...and somewhere," },
    { at: 45, text: " far away," },
    { at: 82, text: " someone heard." },
  ],
};

const EndingOnWhite: React.FC<{ f: number }> = ({ f }) => {
  const line = interpolate(f, [END.lineOut - 15, END.lineOut], [1, 0], clamp);
  const title = interpolate(f, [END.title, END.title + 26], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const tag = interpolate(f, [END.title + 30, END.title + 50], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          position: "absolute",
          fontFamily: EPIC,
          fontSize: 54,
          color: C.plum,
          letterSpacing: 3,
          opacity: line,
        }}
      >
        {END_LINE.phrases.map((p) => {
          const a = interpolate(f, [END.line + p.at, END.line + p.at + 14], [0, 1], clamp);
          return (
            <span key={p.at} style={{ opacity: a, filter: `blur(${(1 - a) * 5}px)` }}>
              {p.text}
            </span>
          );
        })}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
        <div
          style={{
            fontFamily: TITLE,
            fontSize: 220,
            color: C.gold,
            letterSpacing: 10,
            textShadow: `10px 10px 0 ${C.plum}`,
            opacity: title,
            transform: `scale(${1.12 - title * 0.12})`,
          }}
        >
          DYSLEXOR
        </div>
        <div style={{ fontFamily: EPIC, fontSize: 44, color: C.plum, opacity: tag }}>Every reader starts somewhere.</div>
        <div style={{ fontFamily: PIXEL, fontSize: 26, color: C.purple, opacity: tag, marginTop: 10 }}>dyslexor.com</div>
      </div>
    </AbsoluteFill>
  );
};

// ---- Scene -----------------------------------------------------------------

export const Summoning: React.FC = () => {
  const f = useCurrentFrame();
  const sk = shake(f);
  // Clouds, fog, grass and lamps keep moving across the cut from the Opening.
  const bg = f + OPENING_FRAMES;
  const ringLit = interpolate(f, [B.ring, B.ring + 40], [0, 1], clamp);

  const rx = rowanX(f);
  const ry = rowanY(f);
  const flying = between(f, B.break, B.land);
  const hopping = between(f, 90, 106) || between(f, 130, 146);
  const kneeling = f >= B.land;
  const rowanRow = flying || kneeling ? 9 : hopping ? 4 : 1;
  const rowanCol = flying ? 2 : kneeling ? 1 : undefined;
  const beamOn = between(f, B.beam, B.break);
  const jitter = beamOn ? (random(`rj${f}`) - 0.5) * 6 : 0;

  const cx = cloneX(f);
  const cy = cloneY(f);
  const cloneOn = f < B.break + 2;

  const wx = wizX(f);
  const wizHidden = between(f, B.teleport - 1, B.teleport + 5);

  // Camera: tight on the shield, out to the duel, follows the dodges, pushes
  // in on the clash, swings after Rowan, and settles on him for the summoning.
  const clash = clashX(f);
  // Frame 0 picks up exactly where the Opening's camera ends (see FIGHT_CAM).
  const cam = track(f, [
    [0, FIGHT_CAM.x],
    [50, 1000],
    [B.slam + 20, 860],
    [150, 900],
    [B.beam, 1000],
    [B.break - 30, clashX(B.break - 30)],
    [B.break, 820],
    [B.land + 10, 760],
    [B.advance, 900],
    [B.advance + 90, 860],
    [565, 700],
    [B.rise, 680],
    [B.finalBlast, 760],
    [B.flash, PORTAL.x],
  ]);
  let zoom = track(f, [
    [0, FIGHT_CAM.zoom],
    [50, 1],
    [B.beam, 1],
    [B.break - 4, 1.22],
    [B.break + 10, 1.1],
    [B.land + 20, 1],
    [565, 1],
    [B.rise - 10, 1.15],
    [B.rise + 20, 1.05],
    [B.finalBlast + 10, 1.12],
    // Through the portal.
    [B.flash, 3.4],
  ]);
  // Punch-in on every big hit.
  for (const [at, k] of [
    [B.slam, 0.08],
    [B.break, 0.12],
    [B.finalBlast + 14, 0.06],
  ])
    if (f >= at && f < at + 12) zoom += k * (1 - (f - at) / 12);

  const corrupt = interpolate(f, [0, B.break, B.ring, B.flash], [0.8, 1, 1, 0.3], clamp);
  let lightning = 0;
  for (const at of [B.slam, ...STRIKES.map((s) => s.at), B.teleport, B.charge + 10, B.break, B.finalBlast])
    lightning = Math.max(lightning, interpolate(f, [at - 2, at, at + 10], [0, 1, 0], clamp));

  const impact = IMPACT_FRAMES.some(([at, len]) => between(f, at, at + len));
  const whiteHit = interpolate(f, [B.break + 4, B.break + 6, B.break + 20], [0, 0.9, 0], clamp);
  // Into the portal: up to pure white, and it stays white.
  const white = interpolate(f, [B.flash - 14, B.flash + 4], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });

  const speed =
    interpolate(f, [B.beam + 10, B.beam + 40, B.charge, B.break, B.break + 25], [0, 0.35, 0.5, 0.9, 0], clamp) +
    interpolate(f, [B.finalBlast, B.finalBlast + 10, B.flash], [0, 0.6, 0], clamp);
  const toScreen = (x: number) => (x - cam) * zoom + 960;

  // Tilts up to the sky portal for the final push-in.
  const rise = interpolate(f, [B.finalBlast - 20, B.flash], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const world = { position: "absolute", inset: 0, transform: `translateX(${960 - cam}px)` } as const;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `translate(${sk.x}px, ${sk.y + rise * (540 - PORTAL_CY)}px) scale(${1.02 * zoom})`,
          transformOrigin: `960px ${GROUND - 260 + rise * (PORTAL_CY - (GROUND - 260))}px`,
          filter: impact ? "invert(1) grayscale(1) contrast(4)" : undefined,
        }}
      >
        <NightSky f={bg} cam={cam} corrupt={corrupt} flash={lightning} lit={ringLit} litX={PORTAL.x + 960 - cam} />
        <Backdrop f={bg} cam={cam} corrupt={corrupt} lampsOut={1} />
        <div style={world}>
          <Strikes f={f} />

          {cloneOn && (
            <Rowan
              x={cx}
              y={cy}
              row={between(f, 112, 128) ? 4 : 1}
              style={{
                opacity: 0.72 + 0.15 * Math.sin(f / 2.5) - (f > B.break - 12 ? (Math.floor(f / 2) % 2) * 0.4 : 0),
                filter: `brightness(1.4) saturate(0.5) drop-shadow(0 0 14px ${ACCENT.mint})`,
              }}
            />
          )}

          {/* Afterimages while he's thrown */}
          {flying &&
            [6, 4, 2].map((k) => (
              <Rowan key={k} x={rowanX(f - k)} y={rowanY(f - k)} row={9} col={2} spin={-(f - k - B.break) * 9} style={{ opacity: 0.12 * (8 - k) / 2 }} />
            ))}
          <Rowan
            x={rx + jitter}
            y={ry}
            row={rowanRow}
            col={rowanCol}
            spin={flying ? -(f - B.break) * 9 : 0}
            style={f >= B.ring ? { filter: `drop-shadow(0 0 ${10 + ringLit * 24}px ${ACCENT.mint})` } : undefined}
          />

          {!wizHidden && (
            <Feet x={wx} y={GROUND} w={WIZ.w} feet={WIZ.feet} cx={WIZ.cx} style={{ transform: `translateY(${Math.round(Math.sin(f / 14) * 1.5) * PX}px)` }}>
              <DarkWizard
                px={PX}
                raise={wizRaise(f)}
                orb={wizOrb(f)}
                eyes={between(f, B.charge, B.break) || between(f, B.rise, B.finalBlast) ? 1 : 0.7 + 0.3 * Math.sin(f / 6)}
              />
            </Feet>
          )}
          <Smoke f={f} at={B.teleport - 3} x={1400} />
          <Smoke f={f} at={B.teleport + 3} x={1260} />
          <Shield f={f} />

          {beamOn && (
            <>
              <Beam a={cloneHand(f)} b={[rowanHand(f)[0] + 20, rowanHand(f)[1] - 8]} color={ACCENT.mint} core={C.cream} w={10} f={f} />
              <Beam
                a={rowanHand(f)}
                b={[interpolate(f, [B.beam, B.beam + 8], [rowanHand(f)[0], clash], clamp), CLASH_Y]}
                color={C.gold}
                core="#fff8dc"
                w={interpolate(f, [B.beam, B.charge, B.break], [20, 24, 14], clamp)}
                f={f}
              />
              <Beam
                a={wizOrbAt(f)}
                b={[interpolate(f, [B.beam, B.beam + 8], [wizOrbAt(f)[0], clash], clamp), CLASH_Y]}
                color={VIOLET}
                core="#e8d8ff"
                w={interpolate(f, [B.beam, B.charge, B.break], [20, 20, 40], clamp)}
                f={f}
              />
              {f >= B.beam + 8 && <Clash f={f} x={clash} />}
            </>
          )}
          {/* The purple beam breaks through */}
          {between(f, B.break, B.break + 12) && (
            <Beam a={wizOrbAt(f)} b={[380, GROUND - 130 * K]} color={VIOLET} core="#fff" w={interpolate(f, [B.break, B.break + 12], [60, 0], clamp)} f={f} />
          )}

          {BOLTS.map((b, i) => (
            <BoltView key={i} b={b} f={f} i={i} />
          ))}
          {impacts.map((im, i) => (
            <Burst key={i} at={im.at} pos={im.pos} gold={im.gold} size={im.size} f={f} seed={`bu${i}`} />
          ))}
          <Shatter f={f} x={210} />
          {/* His spell, from the ground into the portal */}
          {f >= B.ring && (
            <Beam
              a={[rowanX(B.land) + 50 * K, GROUND - 70 * K]}
              b={[PORTAL.x, PORTAL_CY + PORTAL.h / 2]}
              color={ACCENT.mint}
              core={C.cream}
              w={interpolate(f, [B.ring, B.ring + 12], [0, 7], clamp)}
              f={f}
            />
          )}
          <SkyPortal f={f} />
        </div>
        <Foreground f={bg} cam={cam} />

        <AbsoluteFill style={{ background: "rgba(30,20,70,0.12)", pointerEvents: "none" }} />
        <Vignette strength={0.6} />
      </AbsoluteFill>

      <SpeedLines f={f} cx={toScreen(f < B.finalBlast - 20 ? clash : PORTAL.x)} cy={f < B.finalBlast - 20 ? CLASH_Y : 540} o={speed} />
      <AbsoluteFill style={{ backgroundColor: "#fff", opacity: whiteHit }} />
      {LINES.map((l) => (
        <Dialogue
          key={l.from}
          speaker={l.who}
          text={l.text}
          t={f - l.from}
          dur={l.dur}
          color={l.who === "Dark Wizard" ? DARK_RED : C.gold}
          speed={l.speak ? l.text.length / l.speak : undefined}
          reveal={l.reveal}
        />
      ))}
      <Grain opacity={0.06} />
      <AbsoluteFill style={{ backgroundColor: "#fff", opacity: white }} />
      <EndingOnWhite f={f} />
      <Sequence from={END.line} durationInFrames={END.lineOut - END.line + 20} name="🗣 Narrator">
        <Audio src={staticFile(END_LINE.voice)} volume={1} />
      </Sequence>

      {/* Fight music, carried on from the Opening's first bolt, dipping under
          each voice line and fading out into the summoning chime. */}
      <Sequence durationInFrames={SUMMON_CHIME + 40} name="♪ fight">
        <Audio src={staticFile("music/fighting-background-music.mp3")} trimBefore={MUSIC_SKIP + MUSIC_PREROLL} volume={musicVolume} />
      </Sequence>
      {LINES.filter((l) => l.voice).map((l) => (
        <Sequence key={l.from} from={l.from} durationInFrames={l.dur + 15} name={`🗣 ${l.who}`}>
          <Audio src={staticFile(l.voice!)} volume={1} />
        </Sequence>
      ))}
      {SFX.map((c, i) => {
        const from = Math.round(c.at - c.hit * 30);
        return (
          <Sequence key={i} from={from} durationInFrames={c.len} name={`🔊 ${c.src}`}>
            <Audio
              src={staticFile(`sfx/${c.src}.mp3`)}
              volume={(t) => SFX_LEVEL * c.vol * interpolate(t, [0, 2, c.len - (c.fade ?? 8), c.len], [from < 0 ? 0 : 1, 1, 1, 0], clamp)}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
