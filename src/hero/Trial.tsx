import React from "react";
import { AbsoluteFill, Easing, interpolate, random, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { Dialogue } from "../lore/parts";
import { BODY, C } from "../theme";
import { ACCENT, HERO_NAME, VILLAGE_FRAMES } from "./config";
import { linear } from "./parts";
import { DYSLEXI_COLOR, DyslexiBuddy } from "./hud/Dyslexi";
import { HudPopup, Popup } from "./hud/Hud";
import { HandPose } from "./realm/hands";
import { Cam, LH, Pov, idleCol, toScreen, walkCol } from "./realm/Pov";
import { DRAIN, HOUSE_Y, HOUSES, LAMPS, SCORCH } from "./realm/world";
import { Hand } from "./Tower";
import { VILLAGE_END, villageActors } from "./Village";

// The pilot's game (docs/SEASON-1.md). First person, straight on from the
// Village. Hero walks up to the Rhyme Time house with Dyslexi back at her
// shoulder. "Go on, open the door!" She opens it, and the house pulls her in
// and flings her out into space: Rhyme Time, as it is in the app (the purple
// night sky, the stars, the planet, "Which word rhymes with…", the four
// answers, the three dots). She gets CAT wrong first, Dyslexi shows her how
// to listen to the end of a word, and she gets the rest (BALL, BEE). The
// stars gather into the word she won, LIGHT; she sounds it out, it bursts,
// and she's back in the village as the dead lamps down the path relight one
// by one and everyone cheers.
//
// Dyslexi's, Hero's and the farmer's lines here are text only for now, timed
// to be read comfortably, until they're recorded.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const TRIAL_FRAMES = 2460;

// ---- Where things are ----------------------------------------------------------

const RHYME = HOUSES.find((h) => h.id === "rhyme-time")!;
// The 3D house's door (house3d.ts: front texture columns 34–48, rows 30–54).
const HS = 1.35;
const DOOR_X0 = RHYME.x - 30 * HS + 34 * HS;
const DOOR_X1 = RHYME.x - 30 * HS + 49 * HS;
const DOOR_H = 25 * HS;
const DOOR_MID = (DOOR_X0 + DOOR_X1) / 2;
// The ring in front of the house, and right up at the door.
const RING = { x: RHYME.x, y: -664 };
const AT_DOOR = { x: DOOR_MID, y: HOUSE_Y + 22 };
const INTO = { x: DOOR_MID, y: HOUSE_Y - 4 };
const aimAt = (x: number, y: number, tx: number, ty: number) => Math.atan2(tx - x, -(ty - y));

// ---- Beats -------------------------------------------------------------------

const WALK = { from: 40, to: 220 };
const APPROACH = { from: 460, to: 520 };
const REACH = { from: 506, to: 540 };
const OPEN = { from: 540, to: 568 };
const PULL = { from: 568, to: 650 };
const RUSH = { from: 640, to: 680 };
// Space.
const SPACE = 676;
const ARRIVE = { from: 680, to: 760 };
const UI_IN = 830;

type Round = { at: number; word: string; answers: string[]; right: number; wrong?: number; reach: number; reachWrong?: number; next: number };
// The app's own rounds. Relative to `at`: the answers come in at +20, her
// hand reaches at `reach` and touches 30 frames later. The first round has a
// long pause to guess along and a wrong pick.
const ROUNDS: Round[] = [
  { at: 840, word: "CAT", answers: ["HAT", "CUP", "DOG", "SUN"], right: 0, wrong: 2, reachWrong: 120, reach: 330, next: 460 },
  { at: 1300, word: "BALL", answers: ["BED", "WALL", "KITE", "RAIN"], right: 1, reach: 100, next: 210 },
  { at: 1510, word: "BEE", answers: ["TREE", "FISH", "PEN", "BAG"], right: 0, reach: 60, next: 150 },
];
const touchAt = (r: Round) => r.at + r.reach + 30;
const endAt = (r: Round) => r.at + r.next;
const WRONG = ROUNDS[0].at + ROUNDS[0].reachWrong! + 30;
// "c-AT… h-AT": the matching endings light up as Dyslexi says them.
const RIME_PROMPT = ROUNDS[0].at + 240;
const RIME_ANSWER = ROUNDS[0].at + 275;

// The word she won: the stars gather into it, she sounds it out, it bursts.
const SPELL = 1790;
const SOUND = 1850;
const CHUNKS = [
  { letters: [0], at: SOUND },
  { letters: [1, 2, 3], at: SOUND + 45 },
  { letters: [4], at: SOUND + 90 },
];
const WHOLE = SOUND + 136;
const BURST = 2030;
// Back in the village, at the top of the path looking down it, as the lamps
// relight from the nearest to the farthest.
const BACK = 2050;
const TOP = { x: 0, y: -648 };
const LAMP_ON = (i: number) => 2070 + (LAMPS.length - 1 - i) * 12;
const CHEER = 2090;

type Line = { from: number; dur: number; who: "dyslexi" | "hero" | "farmer"; text: string; at?: "top"; reveal?: [number, number][] };
const LINES: Line[] = [
  { from: 80, dur: 70, who: "dyslexi", text: "Psst! Did you miss me?" },
  { from: 152, dur: 56, who: "hero", text: "Dyslexi! Where did you go?" },
  { from: 210, dur: 72, who: "dyslexi", text: "Cats don't do goodbyes. Come on!" },
  { from: 304, dur: 112, who: "dyslexi", text: "This is the Rhyme Time house. Go on, open the door!" },
  { from: 420, dur: 50, who: "hero", text: "...Here goes." },
  { from: PULL.from + 4, dur: 52, who: "dyslexi", text: "Whoa! Hold on!" },
  { from: PULL.from + 44, dur: 40, who: "hero", text: "Aaah!", at: "top" },
  { from: ARRIVE.to - 16, dur: 84, who: "dyslexi", text: "Welcome to Rhyme Time!" },
  { from: WRONG + 12, dur: 45, who: "hero", text: "Oops...", at: "top" },
  {
    from: ROUNDS[0].at + 200,
    dur: 120,
    who: "dyslexi",
    text: "Listen to the end. C-at... h-at!",
    reveal: [
      [0, 0],
      [24, 18],
      [40, 22],
      [70, 22],
      [80, 28],
    ],
  },
  { from: ROUNDS[0].at + 335, dur: 40, who: "hero", text: "HAT!", at: "top" },
  { from: ROUNDS[1].at + 50, dur: 60, who: "hero", text: "Ball... wall...", at: "top" },
  { from: endAt(ROUNDS[2]) + 10, dur: 110, who: "dyslexi", text: "See? I told you. I'm a READING cat, I know talent." },
  {
    from: SOUND,
    dur: BURST - SOUND + 10,
    who: "hero",
    text: "L... igh... t... LIGHT!",
    at: "top",
    reveal: [
      [0, 0],
      [1, 4],
      [45, 4],
      [46, 11],
      [90, 11],
      [91, 15],
      [136, 15],
      [137, 22],
    ],
  },
  { from: CHEER + 70, dur: 80, who: "farmer", text: "Light! Real light!" },
  { from: 2300, dur: 60, who: "dyslexi", text: "One down!" },
  { from: 2364, dur: 80, who: "hero", text: "I... I actually did it!" },
];
const SPEAKER = { dyslexi: "Dyslexi", hero: HERO_NAME, farmer: "Farmer" };
const TAG = { dyslexi: DYSLEXI_COLOR, hero: C.lilac, farmer: "#9fd47a" };

// The first word back, counted, as the village cheers.
const RESTORED: Popup = { at: 2240, kind: "xp", title: "+1 word restored", sub: "1 / 5,000", dur: 110 };

// ---- The village: the walk, the door, the pull ------------------------------------

// Rowan steps off the path to let her by, and she walks up the middle of it
// (between the lamps at x = ±24), along the row to the Rhyme Time house, then
// right up to its door, and is pulled through it.
const ROWAN_ASIDE = { from: 0, to: 36, x: -40 };
const ROUTE: [number, number, number][] = [
  [WALK.from, VILLAGE_END.x, VILLAGE_END.y],
  [WALK.from + 30, 6, -470],
  [WALK.from + 98, 4, -590],
  [WALK.from + 128, -40, -645],
  [WALK.to, RING.x, RING.y],
  [APPROACH.from, RING.x, RING.y],
  [APPROACH.to, AT_DOOR.x, AT_DOOR.y],
  [RUSH.from, AT_DOOR.x, AT_DOOR.y],
  [RUSH.to, INTO.x, INTO.y],
];
const villageCam = (f: number): Cam => {
  if (f >= BACK) return { x: TOP.x, y: TOP.y, heading: Math.PI, eye: 26, horizon: 120 };
  const x = linear(f, ROUTE.map(([t, px]) => [t, px] as [number, number]));
  const y = linear(f, ROUTE.map(([t, , py]) => [t, py] as [number, number]));
  const toDoor = f < WALK.to ? aimAt(x, y, DOOR_MID, HOUSE_Y) : f < APPROACH.from ? aimAt(RING.x, RING.y, DOOR_MID, HOUSE_Y) : 0;
  const heading = f < WALK.from + 20 ? interpolate(f, [0, WALK.from + 20], [VILLAGE_END.heading, toDoor], clamp) : f < APPROACH.to ? interpolate(f, [APPROACH.from, APPROACH.to], [toDoor, 0], clamp) : 0;
  const walking = (f > WALK.from && f < WALK.to) || (f > APPROACH.from && f < APPROACH.to);
  const step = walking ? Math.sin((f / 30) * Math.PI * 4) : 0;
  // The pull shakes her; the rush is a long lens punching into the doorway.
  const shake = interpolate(f, [PULL.from, PULL.to - 20, RUSH.to], [0, 1, 1.6], clamp);
  const rush = interpolate(f, [RUSH.from, RUSH.to], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  return {
    x,
    y,
    heading: heading + Math.sin(f * 1.7) * 0.01 * shake,
    eye: 26 + step * 0.7 - 4 * rush,
    horizon: 120 + step * 2 + Math.cos(f * 2.3) * 3 * shake,
    roll: Math.sin(f * 0.9) * 0.03 * shake,
    focal: 457 + 500 * rush,
  };
};

// The door: its four corners on screen.
const doorQuad = (cam: Cam) => {
  const a = toScreen(cam, DOOR_X0, HOUSE_Y, 0);
  const b = toScreen(cam, DOOR_X1, HOUSE_Y, 0);
  const c = toScreen(cam, DOOR_X1, HOUSE_Y, DOOR_H);
  const d = toScreen(cam, DOOR_X0, HOUSE_Y, DOOR_H);
  return { a, b, c, d, ok: a.d > 1 && b.d > 1 };
};

// Space through the doorway, and the door swinging open on its hinge.
const Doorway: React.FC<{ f: number; cam: Cam }> = ({ f, cam }) => {
  const open = interpolate(f, [OPEN.from, OPEN.to], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  if (open <= 0) return null;
  const q = doorQuad(cam);
  if (!q.ok) return null;
  const x0 = Math.min(q.a.x, q.d.x);
  const x1 = Math.max(q.b.x, q.c.x);
  const y0 = Math.min(q.c.y, q.d.y);
  const y1 = Math.max(q.a.y, q.b.y);
  const w = x1 - x0;
  const h = y1 - y0;
  const leaf = 1 - open;
  return (
    <>
      <div style={{ position: "absolute", left: x0, top: y0, width: w, height: h, overflow: "hidden", background: "radial-gradient(circle at 50% 40%, #2b1c56 0%, #1d1240 45%, #120b2a 100%)" }}>
        {Array.from({ length: 30 }, (_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${random(`ds-x${i}`) * 100}%`,
              top: `${random(`ds-y${i}`) * 100}%`,
              width: 3,
              height: 3,
              background: "#fff",
              opacity: 0.4 + 0.5 * Math.abs(Math.sin(f / 7 + i)),
            }}
          />
        ))}
        {/* A swirl, turning inward */}
        {Array.from({ length: 4 }, (_, i) => {
          const t = ((f / 24 + i / 4) % 1 + 1) % 1;
          return (
            <div
              key={`r${i}`}
              style={{
                position: "absolute",
                left: `${50 - 60 * (1 - t)}%`,
                top: `${50 - 60 * (1 - t)}%`,
                width: `${120 * (1 - t)}%`,
                height: `${120 * (1 - t)}%`,
                borderRadius: "50%",
                border: `${Math.max(2, w * 0.03)}px solid ${i % 2 ? "#a78bfa" : ACCENT.mint}`,
                opacity: t * 0.7,
              }}
            />
          );
        })}
        {/* The door itself, swinging in on its left-hand hinge */}
        <div style={{ position: "absolute", left: 0, top: 0, width: w * leaf, height: h, background: "#5a3a2a", borderRight: `${Math.max(2, w * 0.02)}px solid #2a1810`, boxShadow: "inset 0 0 0 4px #3a2418" }} />
      </div>
      {/* Purple light spilling out of the doorway */}
      <div
        style={{
          position: "absolute",
          left: x0 - w,
          top: y0 - h * 0.4,
          width: w * 3,
          height: h * 1.8,
          background: "radial-gradient(ellipse, #a78bfa55, transparent 60%)",
          mixBlendMode: "screen",
          opacity: open,
          pointerEvents: "none",
        }}
      />
    </>
  );
};

// The pull: wind and loose letters streaming into the doorway.
const Suction: React.FC<{ f: number; cam: Cam }> = ({ f, cam }) => {
  const k = interpolate(f, [PULL.from, PULL.from + 20, RUSH.to], [0, 1, 1], clamp);
  if (k <= 0 || f > RUSH.to) return null;
  const q = doorQuad(cam);
  const cx = q.ok ? (q.a.x + q.c.x) / 2 : 960;
  const cy = q.ok ? (q.a.y + q.c.y) / 2 : 540;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 46 }, (_, i) => {
          const a = random(`sw-a${i}`) * Math.PI * 2;
          const t = ((f / 18 + random(`sw-t${i}`)) % 1 + 1) % 1;
          const r0 = 1300 * (1 - t);
          const r1 = r0 - 200;
          if (r1 < 20) return null;
          return <line key={i} x1={cx + Math.cos(a) * r0} y1={cy + Math.sin(a) * r0 * 0.7} x2={cx + Math.cos(a) * r1} y2={cy + Math.sin(a) * r1 * 0.7} stroke="#e8e4f4" strokeWidth={i % 3 ? 3 : 6} opacity={0.45 * k * t} />;
        })}
      </svg>
      {Array.from({ length: 16 }, (_, i) => {
        const a = random(`sl-a${i}`) * Math.PI * 2;
        const t = ((f / 26 + random(`sl-t${i}`)) % 1 + 1) % 1;
        const r = 1100 * (1 - t) ** 1.5;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: cx + Math.cos(a + t * 3) * r,
              top: cy + Math.sin(a + t * 3) * r * 0.7,
              transform: `translate(-50%, -50%) rotate(${t * 720}deg) scale(${0.4 + (1 - t)})`,
              fontFamily: BODY,
              fontWeight: 700,
              fontSize: 54,
              color: i % 3 ? C.gold : C.cream,
              textShadow: `0 0 14px ${C.gold}`,
              opacity: k * Math.min(1, t * 3),
            }}
          >
            {String.fromCharCode(65 + Math.floor(random(`sl-c${i}`) * 26))}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// Her right hand reaching out for the door handle.
const doorHand = (f: number): HandPose | null => {
  const k = interpolate(f, [REACH.from, REACH.to, OPEN.to, OPEN.to + 20], [0, 1, 1, 0], { ...clamp, easing: Easing.inOut(Easing.quad) });
  if (k <= 0) return null;
  return { x: 470 - 130 * k, y: LH + 240 - (240 - 30) * k, curl: 1, turn: 1, mirror: true };
};

// ---- Space: Rhyme Time ----------------------------------------------------------

// The app's own look (public/games/night-sky.css, rhyme-time.css).
const SKY = "radial-gradient(circle at 50% 18%, #2b1c56 0%, #1d1240 45%, #120b2a 100%)";
const PILL = "linear-gradient(135deg, #8b5cf6, #6d28d9)";
const GLASS = "rgba(255,255,255,0.06)";
const LINE_C = "rgba(255,255,255,0.12)";
const GREEN = "#34d399";
const RED = "#f87171";
const LILAC = "#a78bfa";

const CARD = { x: 960, w: 1000 };
const OPT = { w: 488, h: 112, gap: 24, top: 452 };
const optPos = (k: number) => ({ x: CARD.x - (OPT.w + OPT.gap) / 2 + (k % 2) * (OPT.w + OPT.gap), y: OPT.top + OPT.h / 2 + Math.floor(k / 2) * (OPT.h + OPT.gap) });

const Stars: React.FC<{ f: number; streak: number }> = ({ f, streak }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
    {Array.from({ length: 170 }, (_, i) => {
      const x = random(`st-x${i}`) * 1920;
      const y = random(`st-y${i}`) * 1080;
      const s = 1 + Math.floor(random(`st-s${i}`) * 3);
      const tw = 0.35 + 0.55 * Math.abs(Math.sin(f / (20 + (i % 9) * 4) + i));
      if (streak > 0.02) {
        const dx = x - 960;
        const dy = y - 540;
        return <line key={i} x1={x} y1={y} x2={x - dx * streak * 0.5} y2={y - dy * streak * 0.5} stroke="#fff" strokeWidth={s} opacity={tw} />;
      }
      return <rect key={i} x={x} y={y} width={s} height={s} fill="#fff" opacity={tw} />;
    })}
  </svg>
);

const OptionTile: React.FC<{ r: Round; k: number; f: number; rime: number }> = ({ r, k, f, rime }) => {
  const t = f - r.at;
  const appear = interpolate(t, [20 + k * 4, 36 + k * 4], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
  const touch = touchAt(r);
  const right = k === r.right && f >= touch;
  const wrong = k === r.wrong && f >= WRONG && f < touch;
  const done = f >= touch && k !== r.right;
  const shake = k === r.wrong && f >= WRONG && f < WRONG + 16 ? Math.sin((f - WRONG) * 2.4) * 14 : 0;
  const p = optPos(k);
  const text = r.answers[k];
  return (
    <div
      style={{
        position: "absolute",
        left: p.x - OPT.w / 2 + shake,
        top: p.y - OPT.h / 2 + (1 - appear) * 40,
        width: OPT.w,
        height: OPT.h,
        borderRadius: 22,
        background: right ? "rgba(52,211,153,0.22)" : wrong ? "rgba(248,113,113,0.18)" : GLASS,
        border: `3px solid ${right ? GREEN : wrong ? RED : LINE_C}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: BODY,
        fontWeight: 800,
        fontSize: 46,
        letterSpacing: 2,
        color: "#fff",
        opacity: appear * (done ? 0.4 : 1),
      }}
    >
      {[...text].map((ch, i) => (
        <span key={i} style={{ color: rime > 0 && i >= text.length - 2 ? C.gold : undefined, textShadow: rime > 0 && i >= text.length - 2 ? `0 0 ${18 * rime}px ${C.gold}` : undefined }}>
          {ch}
        </span>
      ))}
    </div>
  );
};

const GameCard: React.FC<{ f: number }> = ({ f }) => {
  const shown = interpolate(f, [UI_IN, UI_IN + 16], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.2)) }) * interpolate(f, [endAt(ROUNDS[2]) + 20, SPELL - 10], [1, 0], clamp);
  if (shown <= 0) return null;
  const ri = ROUNDS.findIndex((r) => f < endAt(r));
  const r = ROUNDS[ri < 0 ? ROUNDS.length - 1 : ri];
  const idx = ri < 0 ? ROUNDS.length - 1 : ri;
  const t = f - r.at;
  const swap = interpolate(t, [0, 10], [0, 1], clamp);
  const touch = touchAt(r);
  const correct = f >= touch;
  const panel = interpolate(f, [touch, touch + 8], [0, 1], clamp);
  const rimeP = idx === 0 ? interpolate(f, [RIME_PROMPT, RIME_PROMPT + 8], [0, 1], clamp) : 0;
  const rimeA = idx === 0 ? interpolate(f, [RIME_ANSWER, RIME_ANSWER + 8], [0, 1], clamp) : 0;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: shown, transform: `scale(${0.9 + 0.1 * shown})` }}>
      {/* Progress dots */}
      <div style={{ position: "absolute", left: CARD.x, top: 150, transform: "translateX(-50%)", display: "flex", gap: 16 }}>
        {ROUNDS.map((q, i) => {
          const doneDot = f >= touchAt(q);
          const now = i === idx && !doneDot;
          return <div key={i} style={{ width: now ? 22 : 18, height: now ? 22 : 18, borderRadius: 999, background: doneDot ? GREEN : now ? LILAC : "rgba(255,255,255,0.2)" }} />;
        })}
      </div>
      {/* The prompt card */}
      <div
        style={{
          position: "absolute",
          left: CARD.x - CARD.w / 2,
          top: 196,
          width: CARD.w,
          height: 226,
          borderRadius: 26,
          background: GLASS,
          border: `2px solid ${LINE_C}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 22,
          opacity: swap,
        }}
      >
        <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 24, letterSpacing: 3, color: "rgba(255,255,255,0.7)" }}>WHICH WORD RHYMES WITH...</div>
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div style={{ padding: "14px 54px", borderRadius: 999, background: PILL, fontFamily: BODY, fontWeight: 800, fontSize: 70, letterSpacing: 3, color: "#fff", boxShadow: "0 10px 30px #6d28d966" }}>
            {[...r.word].map((ch, i) => (
              <span key={i} style={{ color: rimeP > 0 && i >= r.word.length - 2 ? C.gold : undefined, textShadow: rimeP > 0 && i >= r.word.length - 2 ? `0 0 ${20 * rimeP}px ${C.gold}` : undefined }}>
                {ch}
              </span>
            ))}
          </div>
          {/* Listen button */}
          <div style={{ width: 70, height: 70, borderRadius: 999, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={34} height={34} viewBox="0 0 24 24">
              <path d="M4 9h4l5-4v14l-5-4H4z" fill="#fff" opacity={0.85} />
              <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="#fff" strokeWidth={2} fill="none" opacity={0.85} />
            </svg>
          </div>
        </div>
      </div>
      {/* The answers */}
      <div style={{ opacity: swap }}>
        {r.answers.map((_, k) => (
          <OptionTile key={`${r.word}-${k}`} r={r} k={k} f={f} rime={k === r.right ? rimeA : 0} />
        ))}
      </div>
      {/* Correct! */}
      {correct && (
        <div
          style={{
            position: "absolute",
            left: CARD.x - CARD.w / 2,
            top: OPT.top + 2 * OPT.h + OPT.gap + 26,
            width: CARD.w,
            borderRadius: 22,
            background: "linear-gradient(135deg, rgba(52,211,153,0.22), rgba(5,150,105,0.18))",
            border: `2px solid ${GREEN}`,
            padding: "18px 26px",
            display: "flex",
            alignItems: "center",
            gap: 20,
            opacity: panel,
            transform: `translateY(${(1 - panel) * 20}px)`,
          }}
        >
          <div style={{ width: 46, height: 46, borderRadius: 999, background: GREEN, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: BODY, fontWeight: 800, fontSize: 30, color: "#062b1f" }}>✓</div>
          <div style={{ fontFamily: BODY, textAlign: "left" }}>
            <div style={{ fontWeight: 800, fontSize: 34, color: "#fff" }}>Correct!</div>
            <div style={{ fontWeight: 500, fontSize: 24, color: "rgba(255,255,255,0.8)" }}>
              {r.word} rhymes with {r.answers[r.right]}
            </div>
          </div>
          <div style={{ marginLeft: "auto", padding: "12px 40px", borderRadius: 999, background: `linear-gradient(135deg, ${GREEN}, #059669)`, fontFamily: BODY, fontWeight: 800, fontSize: 24, letterSpacing: 2, color: "#062b1f" }}>CONTINUE</div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// Her hand reaching for an answer, touching it, and dropping away.
const answerHand = (f: number) => {
  for (const r of ROUNDS) {
    const reaches: [number, number][] = [];
    if (r.reachWrong !== undefined) reaches.push([r.at + r.reachWrong, r.wrong!]);
    reaches.push([r.at + r.reach, r.right]);
    for (const [at, k] of reaches) {
      if (f < at - 4 || f > at + 66) continue;
      const kk = interpolate(f, [at, at + 28, at + 38, at + 66], [0, 1, 1, 0], { ...clamp, easing: Easing.inOut(Easing.quad) });
      const p = optPos(k);
      return { x: 1500 + (p.x + 60 - 1500) * kk, y: 1080 + 640 - (1080 + 640 - (p.y + 560)) * kk };
    }
  }
  return null;
};

// LIGHT: the stars gather into it, she sounds it out, it bursts.
const WORD = "LIGHT";
const StarWord: React.FC<{ f: number }> = ({ f }) => {
  if (f < SPELL || f > BURST + 30) return null;
  const burst = interpolate(f, [BURST, BURST + 24], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 960, top: 420, transform: `translate(-50%, -50%) scale(${1 + burst * 0.6})`, display: "flex", gap: 22, opacity: 1 - burst }}>
        {[...WORD].map((ch, i) => {
          const at = SPELL + i * 10;
          const k = interpolate(f, [at, at + 26], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
          const sx = (random(`sw${i}`) - 0.5) * 1700;
          const sy = (random(`sh${i}`) - 0.5) * 900;
          const chunk = CHUNKS.find((c) => c.letters.includes(i))!;
          const said = f >= chunk.at;
          const now = said && f < chunk.at + 40 && f < WHOLE;
          const whole = f >= WHOLE;
          return (
            <div
              key={i}
              style={{
                fontFamily: BODY,
                fontWeight: 800,
                fontSize: 190,
                lineHeight: 1,
                color: said || whole ? C.gold : "#fff",
                textShadow: `0 0 ${whole ? 70 : now ? 44 : 24}px ${said || whole ? C.gold : LILAC}, 8px 8px 0 #000`,
                transform: `translate(${sx * (1 - k)}px, ${sy * (1 - k)}px) scale(${(0.2 + 0.8 * k) * (now ? 1.15 : whole ? 1.08 + 0.04 * Math.sin(f / 3) : 1)}) translateY(${now ? -14 : 0}px)`,
                opacity: k,
              }}
            >
              {ch}
            </div>
          );
        })}
      </div>
      {burst > 0 &&
        Array.from({ length: 28 }, (_, i) => {
          const a = random(`tb-a${i}`) * Math.PI * 2;
          const v = 300 + random(`tb-v${i}`) * 700;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: Math.round((960 + Math.cos(a) * v * burst) / 8) * 8,
                top: Math.round((420 + Math.sin(a) * v * burst * 0.7) / 8) * 8,
                width: i % 3 ? 14 : 22,
                height: i % 3 ? 14 : 22,
                background: i % 2 ? C.gold : C.cream,
                boxShadow: `0 0 16px ${C.gold}`,
                opacity: 1 - burst,
              }}
            />
          );
        })}
    </AbsoluteFill>
  );
};

const Space: React.FC<{ f: number }> = ({ f }) => {
  if (f < SPACE || f >= BACK) return null;
  // Tumbling in: spinning and streaking, then settling.
  const settle = interpolate(f, [ARRIVE.from, ARRIVE.to], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const roll = (1 - settle) * 70;
  const streak = (1 - settle) * 1.2;
  const drift = Math.sin(f / 60) * 1.2;
  const hand = answerHand(f);
  return (
    <AbsoluteFill style={{ background: SKY, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `rotate(${roll + drift}deg) scale(${1.25 - 0.2 * settle})` }}>
        <Stars f={f} streak={streak} />
        {/* The planet, top right, and a small far one */}
        <div style={{ position: "absolute", top: -140, right: -120, width: 480, height: 480, borderRadius: 999, background: "radial-gradient(circle at 38% 34%, rgba(255,190,130,0.95) 0%, rgba(230,110,90,0.7) 45%, rgba(90,40,90,0) 72%)" }} />
        <div style={{ position: "absolute", left: 180, top: 760, width: 110, height: 110, borderRadius: 999, background: "radial-gradient(circle at 38% 34%, rgba(127,240,196,0.7) 0%, rgba(40,120,110,0.4) 50%, transparent 72%)" }} />
      </AbsoluteFill>
      <GameCard f={f} />
      <StarWord f={f} />
      {hand && <Hand x={hand.x} y={hand.y} mirror />}
      {/* In from the white-purple of the doorway */}
      <AbsoluteFill style={{ background: "#e8d8ff", opacity: interpolate(f, [SPACE, SPACE + 18], [1, 0], clamp) }} />
      <AbsoluteFill style={{ background: C.cream, opacity: interpolate(f, [BURST, BURST + 4, BACK], [0, 0.9, 1], clamp) }} />
    </AbsoluteFill>
  );
};

// ---- Lamps coming back -------------------------------------------------------------

const lampLit = (i: number, f: number) => (f >= LAMP_ON(i) ? 1 : 0);

const LampGlows: React.FC<{ f: number; cam: Cam }> = ({ f, cam }) => (
  <>
    {LAMPS.map((p, i) => {
      const on = interpolate(f, [LAMP_ON(i), LAMP_ON(i) + 4, LAMP_ON(i) + 10], [0, 1.4, 1], clamp);
      if (on <= 0) return null;
      const s = toScreen(cam, p.x, p.y, 30);
      if (s.d < 4) return null;
      const r = Math.max(30, s.px * 26);
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: s.x - r,
            top: s.y - r,
            width: r * 2,
            height: r * 2,
            borderRadius: "50%",
            background: "radial-gradient(#ffe2a0cc, #ffb24a44 35%, transparent 68%)",
            mixBlendMode: "screen",
            opacity: on * (0.9 + 0.1 * Math.sin(f / 5 + i)),
          }}
        />
      );
    })}
  </>
);

// Colour floods out from the house once the word bursts, and stays.
const bloomR = (f: number) => interpolate(f, [BURST, BURST + 90], [0, 180], { ...clamp, easing: Easing.out(Easing.cubic) });

// ---- Sound -----------------------------------------------------------------------

const TrialSound: React.FC = () => {
  const sfx = (name: string, from: number, volume: number, dur = 40) => (
    <Sequence key={`${name}-${from}`} from={from} durationInFrames={dur} name={`🔊 ${name}`}>
      <Audio src={staticFile(`sfx/${name}.mp3`)} volume={volume} />
    </Sequence>
  );
  return (
    <>
      <Sequence durationInFrames={SPACE} name="🔊 morning wind">
        <Audio src={staticFile("sfx/ambience.mp3")} loop volume={(t) => interpolate(t, [0, PULL.from, SPACE], [0.2, 0.2, 0.5], clamp)} />
      </Sequence>
      {sfx("summon", OPEN.from, 0.45, 60)}
      {sfx("jump-whoosh", PULL.from, 0.4, 40)}
      {sfx("charge-up", PULL.from + 20, 0.35, 60)}
      {sfx("teleport", RUSH.from, 0.55, 60)}
      {/* Rhyme Time's own music, from the moment she lands in space */}
      <Sequence from={SPACE} durationInFrames={BURST - SPACE + 20} name="♪ rhyme time">
        <Audio src={staticFile("music/rhymetime_music.mp3")} volume={(t) => interpolate(t, [0, 30, BURST - SPACE - 10, BURST - SPACE + 20], [0, 0.4, 0.4, 0], clamp)} />
      </Sequence>
      {ROUNDS.map((r) => sfx("ui-boot", r.at, 0.25, 30))}
      {sfx("shield-hit", WRONG, 0.35, 30)}
      {ROUNDS.map((r) => sfx("ui-blip", touchAt(r), 0.6, 20))}
      {sfx("charge-up", SPELL, 0.35, 60)}
      {CHUNKS.map((c) => sfx("ui-blip", c.at, 0.45, 15))}
      {sfx("final-blast", BURST, 0.45, 60)}
      {sfx("summon", BURST + 4, 0.5, 70)}
      {/* Back in the village: the realm theme swells as the lamps relight */}
      <Sequence from={BACK} durationInFrames={TRIAL_FRAMES - BACK} name="♪ realm theme">
        <Audio src={staticFile("music/background-music.mp3")} volume={(t) => interpolate(t, [0, 20, TRIAL_FRAMES - BACK - 40, TRIAL_FRAMES - BACK], [0, 0.4, 0.4, 0.25], clamp)} />
      </Sequence>
      <Sequence from={BACK} durationInFrames={TRIAL_FRAMES - BACK} name="🔊 morning wind">
        <Audio src={staticFile("sfx/ambience.mp3")} loop volume={0.2} />
      </Sequence>
      {LAMPS.map((_, i) => sfx("ui-blip", LAMP_ON(i), 0.25, 12))}
      {sfx("ui-blip", RESTORED.at, 0.5, 15)}
    </>
  );
};

// ---- The scene -------------------------------------------------------------------

export const Trial: React.FC = () => {
  const f = useCurrentFrame();
  const inVillage = f < SPACE || f >= BACK;
  const cam = villageCam(f);
  const ring = interpolate(f, [WALK.to - 30, WALK.to, OPEN.from, BURST], [0.35, 1, 1, 0.8], clamp) * (0.9 + 0.1 * Math.sin(f / 4));
  const dysIn = interpolate(f, [LINES[0].from - 6, LINES[0].from + 8], [0, 1], clamp);
  const talking = LINES.some((l) => l.who === "dyslexi" && f >= l.from && f < l.from + l.dur - 16);
  // Dyslexi is pulled toward the doorway with her.
  const pulled = f < SPACE ? interpolate(f, [PULL.from + 10, RUSH.to], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) }) : 0;
  const dysX = 1640 - 700 * pulled;
  const dysY = 560 - 40 * pulled + Math.sin(f / 2) * 10 * pulled;
  const hand = doorHand(f);
  const cheering = f >= CHEER && f < CHEER + 140;
  const aside = interpolate(f, [ROWAN_ASIDE.from, ROWAN_ASIDE.to], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const actors = villageActors(VILLAGE_FRAMES + f, (i) => lampLit(i, f)).map((a) =>
    a.sheet === "rowan"
      ? { ...a, x: a.x + ROWAN_ASIDE.x * aside, row: aside > 0 && aside < 1 ? 3 : 0, col: aside > 0 && aside < 1 ? walkCol(f) : idleCol(f), flip: false }
      : cheering && a.sheet !== "lamp"
        ? { ...a, bubble: true }
        : a,
  );
  const dialogue = LINES.map((l) => (
    <Dialogue key={l.from} speaker={SPEAKER[l.who]} text={l.text} t={f - l.from} dur={l.dur} color={TAG[l.who]} at={l.at ?? "bottom"} reveal={l.reveal} readable />
  ));
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {inVillage && (
        <Pov
          cam={cam}
          actors={actors}
          hands={hand ? [hand] : []}
          sky="dawn"
          drain={DRAIN}
          scorch={SCORCH}
          glow={{ "rhyme-time": ring }}
          bloom={{ x: RHYME.x, y: -700, r: bloomR(f), k: bloomR(f) > 0 ? 1 : 0 }}
        >
          <Doorway f={f} cam={cam} />
          <Suction f={f} cam={cam} />
          <LampGlows f={f} cam={cam} />
          {/* The doorway's light swallowing the frame */}
          <AbsoluteFill style={{ background: "#e8d8ff", opacity: f < SPACE ? interpolate(f, [RUSH.to - 12, RUSH.to], [0, 1], clamp) : 0, pointerEvents: "none" }} />
          {/* Out of the burst's light, back in the village */}
          <AbsoluteFill style={{ background: C.cream, opacity: interpolate(f, [BACK, BACK + 24], [1, 0], clamp) * (f >= BACK ? 1 : 0), pointerEvents: "none" }} />
        </Pov>
      )}
      <Space f={f} />
      <DyslexiBuddy f={f} x={dysX} y={dysY} scale={6 * (1 - 0.7 * pulled)} appear={dysIn} talking={talking} />
      <HudPopup t={f - RESTORED.at} p={RESTORED} />
      {dialogue}
      <TrialSound />
    </AbsoluteFill>
  );
};
