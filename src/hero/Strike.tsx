import React from "react";
import { AbsoluteFill, Easing, interpolate, random, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { Dialogue } from "../lore/parts";
import { BODY, C, PIXEL } from "../theme";
import { MUSIC_SKIP, VILLAGE_FRAMES } from "./config";
import { DarkWizard, WIZ } from "./DarkWizard";
import { DYSLEXI_COLOR, DyslexiBuddy } from "./hud/Dyslexi";
import { track } from "./parts";
import { HandPose } from "./realm/hands";
import { Actor, Cam, LH, Pov, idleCol, toScreen, towerWindow, walkCol } from "./realm/Pov";
import { PixelCard } from "./realm/swim";
import { DRAIN, LAMPS, SCORCH } from "./realm/world";
import { villageActors } from "./Village";
import { TRIAL_FRAMES } from "./Trial";

// Scenes 7 and 8 of Episode 1 (docs/EPISODE-1.md): the Wizard strikes, and
// the lowest point. First person, straight on from the trial: Hero at the top
// of the path, the lamps lit, the village cheering. Three knocks, the same as
// the night of the attack. The Dark Wizard rises out of a purple cloud and
// glides up the path, tears the word LIGHT back out of the air, and the lamps
// die and the townsfolk freeze. Rowan charges him and is knocked down;
// Dyslexi leaps in front of Hero and is caught in a cage of jumbled letters.
// He leans in close, says the cruellest thing he could know, and vanishes
// with her toward his tower. Then rain. Hero sits on the path with the card
// she brought from home, its letters swimming, and Rowan limps over to sit
// with her: one word at a time. She looks up at the tower, stands, and goes.
//
// The lines are text only for now, timed to be read comfortably, until
// they're recorded.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const STRIKE_FRAMES = 2000;

// ---- Beats -----------------------------------------------------------------------

const KNOCKS = [46, 78, 110];
const APPEAR = 124;
const ARRIVE = 200;
const STEAL = 340;
const DOUSE = 372;
const FREEZE = 380;
const CHARGE = { from: 412, to: 442 };
const BOLT = 474;
const LEAP = { from: 512, to: 532 };
const LAUGH = 640;
const CAGE = { from: 664, to: 694 };
const LEAN = { from: 712, to: 770 };
const VANISH = 936;
const WHIP = { from: 952, to: 1010 };
const WINDOW_LIT = 1022;
// Scene 8.
const RAIN = 1046;
const SIT = { from: 1084, to: 1144 };
const CARD_UP = { from: 1124, to: 1170 };
const ROWAN_IN = { from: 1300, to: 1380 };
const STAND = { from: 1740, to: 1800 };
const WALK_OFF = { from: 1900, to: STRIKE_FRAMES };

type Who = "wizard" | "rowan" | "dyslexi" | "hero";
type Line = { from: number; dur: number; who: Who; text: string };
const LINES: Line[] = [
  { from: 212, dur: 112, who: "wizard", text: "Well, well. Rowan's little helper." },
  { from: CHARGE.from + 4, dur: 60, who: "rowan", text: "Leave her alone!" },
  { from: LEAP.to, dur: 96, who: "dyslexi", text: "Back off, you overgrown nightlight!" },
  { from: LEAN.to, dur: 156, who: "wizard", text: "Words are hard, aren't they? You couldn't even read a little card." },
  { from: VANISH + 6, dur: 54, who: "hero", text: "DYSLEXI!" },
  { from: 1186, dur: 110, who: "hero", text: "He's right. I can't even read this." },
  { from: 1390, dur: 196, who: "rowan", text: "His spells are made of words, child. And a word can always be read, if you don't give up on it." },
  { from: 1596, dur: 132, who: "rowan", text: "Not fast. Not first. Just... one word at a time." },
  { from: 1810, dur: 90, who: "hero", text: "One word at a time." },
];
const SPEAKER: Record<Who, string> = { wizard: "Dark Wizard", rowan: "Elder Rowan", dyslexi: "Dyslexi", hero: "Hero" };
const TAG: Record<Who, string> = { wizard: "#ff6b78", rowan: C.gold, dyslexi: DYSLEXI_COLOR, hero: C.lilac };
const speaking = (f: number, who: Who) => LINES.some((l) => l.who === who && f >= l.from && f < l.from + l.dur - 20);

// ---- Where things are ----------------------------------------------------------

// Where the trial left her: the top of the main path, looking down it.
const TOP = { x: 0, y: -648 };
const SOUTH = Math.PI;
// His tower, far off to the north-west (the bearing FirstWords uses).
const TOWER = -0.6;
const TOWARD_TOWER = Math.PI * 2 + TOWER;
// The Wizard on the path: rising far down it, gliding up to her, then right
// up close for the whisper.
const wizY = (f: number) =>
  track(f, [
    [APPEAR, -220],
    [ARRIVE, -556],
    [LEAN.from, -556],
    [LEAN.to, -604],
  ]);
const wizRaise = (f: number) =>
  Math.max(
    interpolate(f, [STEAL - 10, STEAL, STEAL + 50, STEAL + 64], [0, 0.8, 0.8, 0], clamp),
    interpolate(f, [BOLT - 8, BOLT, BOLT + 14], [0, 0.6, 0], clamp),
    interpolate(f, [CAGE.from - 10, CAGE.from, CAGE.to, CAGE.to + 14], [0, 0.7, 0.7, 0], clamp),
  );

// Rowan, where the trial left him (stepped off the path), charging in and
// knocked down; then in scene 8 limping over to sit beside her (ROWAN_SAT,
// where the tower scene finds him as she walks away).
const ROWAN_START = { x: -40, y: -470 };
const ROWAN_HIT = { x: -16, y: -514 };
export const ROWAN_SAT = (() => {
  const h = Math.PI * 2 - 0.6;
  return { x: 0 + Math.sin(h) * 52 + Math.cos(h) * 18, y: -648 - Math.cos(h) * 52 + Math.sin(h) * 18 };
})();

// ---- The camera ------------------------------------------------------------------

const forward = (h: number) => ({ x: Math.sin(h), y: -Math.cos(h) });
const right = (h: number) => ({ x: Math.cos(h), y: Math.sin(h) });

const camAt = (f: number): Cam => {
  const heading = interpolate(f, [WHIP.from, WHIP.to], [SOUTH, TOWARD_TOWER], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const go = interpolate(f, [WALK_OFF.from, WALK_OFF.to], [0, 30], clamp);
  const fw = forward(TOWARD_TOWER);
  const walking = f > WALK_OFF.from;
  const step = walking ? Math.sin((f / 30) * Math.PI * 4) : 0;
  // She sits down on the path (lower eye, looking down at the card), and
  // stands again.
  const sit = Math.min(interpolate(f, [SIT.from, SIT.to], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) }), interpolate(f, [STAND.from, STAND.to], [1, 0], { ...clamp, easing: Easing.inOut(Easing.quad) }));
  const look = Math.min(interpolate(f, [SIT.from, SIT.to], [0, 1], clamp), interpolate(f, [STAND.from - 30, STAND.from], [1, 0], clamp));
  let shake = 0;
  for (const k of KNOCKS) if (f >= k && f < k + 12) shake += (1 - (f - k) / 12) * (k === KNOCKS[2] ? 6 : 4);
  return {
    x: TOP.x + fw.x * go + Math.sin(f * 2.3) * shake * 0.4,
    y: TOP.y + fw.y * go,
    heading,
    eye: 26 - 13 * sit + step * 0.7,
    horizon: 120 - 55 * look + Math.cos(f * 3.1) * shake + step * 2,
  };
};

// ---- People ------------------------------------------------------------------------

const lampLit = (i: number, f: number) => (f < DOUSE + i * 5 ? 1 : 0);

const actorsAt = (f: number, cam: Cam): Actor[] => {
  const frozen = f >= FREEZE;
  const base = villageActors(VILLAGE_FRAMES + TRIAL_FRAMES + (frozen ? FREEZE : f), (i) => lampLit(i, f));
  return base.map((a) => {
    if (a.sheet === "rowan") {
      // Scene 8: limping in from her right and sitting beside her.
      if (f >= WHIP.to) {
        const h = TOWARD_TOWER;
        const fw = forward(h);
        const rt = right(h);
        const k = interpolate(f, [ROWAN_IN.from, ROWAN_IN.to], [0, 1], clamp);
        // Far enough off to see all of him, kneeling at her right.
        const side = 70 - 52 * k;
        const ahead = 52;
        const sitting = f >= ROWAN_IN.to;
        // From where she sat (not the moving camera), so he stays put when she goes.
        return { ...a, x: TOP.x + fw.x * ahead + rt.x * side, y: TOP.y + fw.y * ahead + rt.y * side, row: sitting ? 9 : 3, col: sitting ? 1 : walkCol(f), flip: false };
      }
      const k = interpolate(f, [CHARGE.from, CHARGE.to], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
      const x = ROWAN_START.x + (ROWAN_HIT.x - ROWAN_START.x) * k;
      const y = ROWAN_START.y + (ROWAN_HIT.y - ROWAN_START.y) * k;
      if (f >= BOLT) return { ...a, x, y, row: 9, col: f < BOLT + 6 ? 0 : f < BOLT + 12 ? 1 : 2, flip: false };
      const charging = f >= CHARGE.from && f < CHARGE.to;
      return { ...a, x, y, row: charging ? 3 : 0, col: charging ? walkCol(f) : idleCol(f), flip: false };
    }
    if (a.sheet === "lamp") return a;
    // Cheering until the first knock, startled until he freezes them.
    return { ...a, bubble: f >= KNOCKS[0] - 30 && f < FREEZE };
  });
};

// ---- The Dark Wizard -------------------------------------------------------------

const wizPlace = (f: number, cam: Cam) => {
  const s = toScreen(cam, 0, wizY(f), 0);
  const px = s.px;
  const left = s.x - WIZ.cx * px;
  const top = s.y - WIZ.feet * px;
  // His orb, from the staff's tilt (see DarkWizard: it turns about his hand).
  const th = (-wizRaise(f) * 32 * Math.PI) / 180;
  const ox = -0.5 * Math.cos(th) + 18.5 * Math.sin(th);
  const oy = -0.5 * Math.sin(th) - 18.5 * Math.cos(th);
  return { s, px, left, top, orb: { x: left + (3 + ox) * px, y: top + (20 + oy) * px } };
};

const Wizard: React.FC<{ f: number; cam: Cam }> = ({ f, cam }) => {
  if (f < APPEAR || f >= VANISH + 12) return null;
  const w = wizPlace(f, cam);
  if (w.s.d < 4) return null;
  const rise = interpolate(f, [APPEAR, APPEAR + 40], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const gone = interpolate(f, [VANISH, VANISH + 12], [1, 0], clamp);
  const laughing = f >= LAUGH && f < LAUGH + 50;
  const bob = laughing ? -Math.abs(Math.sin((f - LAUGH) * 0.9)) * w.px * 1.5 : Math.sin(f / 16) * w.px * 0.6;
  return (
    <>
      {/* The cloud he rises out of */}
      <div
        style={{
          position: "absolute",
          left: w.s.x - w.px * 40,
          top: w.s.y - w.px * 14,
          width: w.px * 80,
          height: w.px * 24,
          borderRadius: "50%",
          background: "radial-gradient(#3b1f5fcc, #2a144577 50%, transparent 72%)",
          opacity: rise * gone,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: w.left,
          top: w.top + (1 - rise) * w.px * 30 + bob,
          opacity: rise * gone,
          filter: `drop-shadow(0 0 ${w.px * 3}px #7a3cffaa)`,
          transform: `scale(${1 - (1 - gone) * 0.4})`,
          transformOrigin: "50% 100%",
        }}
      >
        <DarkWizard px={w.px} raise={wizRaise(f)} orb={1 + wizRaise(f) * 1.5} eyes={1} />
      </div>
      {laughing &&
        Array.from({ length: 5 }, (_, i) => {
          const t = (f - LAUGH - i * 8) / 36;
          if (t < 0 || t > 1) return null;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: w.s.x + (i % 2 ? 1 : -1) * w.px * (10 + i * 2),
                top: w.top - t * w.px * 14,
                fontFamily: PIXEL,
                fontSize: Math.max(30, w.px * 3),
                color: "#c9a8ff",
                textShadow: "0 0 14px #7a3cff, 4px 4px 0 #000",
                opacity: Math.sin(t * Math.PI),
              }}
            >
              HA
            </div>
          );
        })}
    </>
  );
};

// LIGHT torn back out of the air: its letters stream past her from behind and
// into his orb.
const Stolen: React.FC<{ f: number; cam: Cam }> = ({ f, cam }) => {
  if (f < STEAL || f > STEAL + 70) return null;
  const { orb } = wizPlace(f, cam);
  return (
    <>
      {[..."LIGHT"].map((ch, i) => {
        const t = (f - STEAL - i * 6) / 34;
        if (t < 0 || t > 1) return null;
        const p = t * t;
        const sx = i % 2 ? 1900 : 20;
        const sy = 1000 - i * 40;
        const swirl = Math.sin(p * Math.PI) * 160 * (i % 2 ? -1 : 1);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: sx + (orb.x - sx) * p + swirl * 0.5,
              top: sy + (orb.y - sy) * p - swirl * 0.3,
              transform: `translate(-50%, -50%) scale(${2.4 - p * 2}) rotate(${p * 360 * (i % 2 ? 1 : -1)}deg)`,
              fontFamily: BODY,
              fontWeight: 700,
              fontSize: 90,
              color: p < 0.6 ? C.gold : "#c9a8ff",
              textShadow: `0 0 24px ${p < 0.6 ? C.gold : "#7a3cff"}`,
            }}
          >
            {ch}
          </div>
        );
      })}
    </>
  );
};

// The bolt that knocks Rowan down.
const Bolt: React.FC<{ f: number; cam: Cam }> = ({ f, cam }) => {
  const k = interpolate(f, [BOLT - 1, BOLT, BOLT + 10], [0, 1, 0], clamp);
  if (k <= 0) return null;
  const { orb } = wizPlace(f, cam);
  const r = toScreen(cam, ROWAN_HIT.x, ROWAN_HIT.y, 18);
  const pts = Array.from({ length: 9 }, (_, i) => {
    const t = i / 8;
    const j = i === 0 || i === 8 ? 0 : (random(`bolt${i}-${Math.floor(f / 2)}`) - 0.5) * 60;
    return `${orb.x + (r.x - orb.x) * t + j},${orb.y + (r.y - orb.y) * t + j * 0.5}`;
  }).join(" ");
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: k }}>
      <polyline points={pts} fill="none" stroke="#7a3cff" strokeWidth={40} strokeLinejoin="round" opacity={0.45} />
      <polyline points={pts} fill="none" stroke="#b78cff" strokeWidth={18} strokeLinejoin="round" />
      <polyline points={pts} fill="none" stroke="#ffffff" strokeWidth={7} strokeLinejoin="round" />
    </svg>
  );
};

// ---- Dyslexi and the cage --------------------------------------------------------

const dysPos = (f: number, cam: Cam) => {
  const leap = interpolate(f, [LEAP.from, LEAP.to], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  let x = 1640 + (960 - 1640) * leap;
  let y = 560 + (640 - 560) * leap - Math.sin(leap * Math.PI) * 220;
  // Taken: she and the cage are pulled into his orb as he vanishes.
  const taken = interpolate(f, [VANISH - 30, VANISH], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  if (taken > 0) {
    const { orb } = wizPlace(Math.min(f, VANISH - 1), cam);
    x += (orb.x - x) * taken;
    y += (orb.y - y) * taken;
  }
  return { x, y, scale: 6 + leap * 1.5 - taken * 6 };
};

const LetterCage: React.FC<{ f: number; x: number; y: number; k: number }> = ({ f, x, y, k }) => {
  const close = interpolate(f, [CAGE.from, CAGE.to], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.3)) });
  if (close <= 0) return null;
  const n = 18;
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2 + f / 40;
        const r = 520 - 360 * close;
        const ch = String.fromCharCode(65 + Math.floor(random(`cage${i}`) * 26));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x + Math.cos(a) * r * 0.85 * k,
              top: y - 40 * k + Math.sin(a) * r * k,
              transform: `translate(-50%, -50%) rotate(${Math.sin(f / 6 + i) * 20}deg)`,
              fontFamily: BODY,
              fontWeight: 700,
              fontSize: 64 * k,
              color: "#c9a8ff",
              textShadow: "0 0 18px #7a3cff, 4px 4px 0 #000",
              opacity: close,
            }}
          >
            {ch}
          </div>
        );
      })}
    </>
  );
};

const Dyslexi: React.FC<{ f: number; cam: Cam }> = ({ f, cam }) => {
  if (f >= VANISH) return null;
  const p = dysPos(f, cam);
  const k = Math.max(0, p.scale / 7.5);
  const caught = f >= CAGE.to;
  return (
    <>
      <DyslexiBuddy f={f} x={p.x} y={p.y + (caught ? Math.sin(f / 2) * 4 : 0)} scale={Math.max(0.5, p.scale)} talking={speaking(f, "dyslexi")} />
      <LetterCage f={f} x={p.x} y={p.y} k={k} />
    </>
  );
};

// ---- The sky, the tower, the rain -------------------------------------------------

const Gloom: React.FC<{ f: number }> = ({ f }) => {
  let dark = 0;
  KNOCKS.forEach((k, i) => (dark = Math.max(dark, interpolate(f, [k, k + 10], [i * 0.16, (i + 1) * 0.16], clamp))));
  dark = Math.max(dark, interpolate(f, [APPEAR, ARRIVE], [0.48, 0.55], clamp) * (f >= APPEAR ? 1 : 0));
  const flash = Math.max(...KNOCKS.map((k) => interpolate(f, [k, k + 2, k + 10], [0, 0.5, 0], clamp)), interpolate(f, [VANISH, VANISH + 3, VANISH + 16], [0, 0.6, 0], clamp));
  return (
    <>
      <AbsoluteFill style={{ background: "linear-gradient(#1a0d2e, #3b1f5f 55%, #2a1445)", mixBlendMode: "multiply", opacity: dark, pointerEvents: "none" }} />
      <AbsoluteFill style={{ background: "#c9a8ff", opacity: flash, pointerEvents: "none" }} />
    </>
  );
};

const Rain: React.FC<{ f: number }> = ({ f }) => {
  const k = interpolate(f, [RAIN, RAIN + 60], [0, 1], clamp);
  if (k <= 0) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: k }}>
      <AbsoluteFill style={{ background: "#2a3346", mixBlendMode: "multiply", opacity: 0.35 }} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 140 }, (_, i) => {
          const x0 = random(`rx${i}`) * 2200 - 140;
          const sp = 26 + random(`rs${i}`) * 18;
          const y = ((f * sp + random(`ry${i}`) * 1200) % 1300) - 120;
          const x = x0 - y * 0.18;
          return <line key={i} x1={x} y1={y} x2={x - 10} y2={y + 54} stroke="#c8d4ea" strokeWidth={i % 4 ? 2 : 3} opacity={0.35} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

const TowerWindow: React.FC<{ f: number; cam: Cam }> = ({ f, cam }) => {
  const tw = towerWindow(cam, TOWER);
  const lamp = interpolate(f, [WINDOW_LIT, WINDOW_LIT + 6, WINDOW_LIT + 14, WINDOW_LIT + 40], [0, 1, 0.75, 0.9], clamp) * (0.9 + 0.1 * Math.sin(f / 5));
  // The streak that carries her off, flying into the window.
  const streak = interpolate(f, [WHIP.to - 30, WINDOW_LIT], [0, 1], clamp);
  return (
    <>
      {tw && streak > 0 && streak < 1 && (
        <div
          style={{
            position: "absolute",
            left: 960 + (tw.x - 960) * streak,
            top: 600 + (tw.y - 600) * streak,
            width: 60 * (1 - streak) + 10,
            height: 60 * (1 - streak) + 10,
            marginLeft: -(30 * (1 - streak) + 5),
            marginTop: -(30 * (1 - streak) + 5),
            borderRadius: "50%",
            background: "radial-gradient(#e8d8ff, #7a3cff 50%, transparent 72%)",
          }}
        />
      )}
      {tw && lamp > 0 && (
        <div style={{ position: "absolute", left: tw.x, top: tw.y, opacity: lamp }}>
          <div style={{ position: "absolute", left: -tw.px * 14, top: -tw.px * 14, width: tw.px * 28, height: tw.px * 28, borderRadius: "50%", background: "radial-gradient(#c77dffaa, #7b2cbf33 45%, transparent 70%)" }} />
          <div style={{ position: "absolute", left: -tw.px * 1.5, top: -tw.px * 2, width: tw.px * 3, height: tw.px * 4, background: "#e6b3ff", boxShadow: `0 0 ${tw.px * 3}px #c77dff` }} />
        </div>
      )}
    </>
  );
};

// ---- The card in her hands ------------------------------------------------------

const cardUp = (f: number) => Math.min(interpolate(f, [CARD_UP.from, CARD_UP.to], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) }), interpolate(f, [STAND.from - 20, STAND.from + 10], [1, 0], clamp));
// The letters calm a little as Rowan talks her through it.
const cardSwim = (f: number) => interpolate(f, [1596, 1700], [1, 0.45], clamp);

const cardHands = (f: number): HandPose[] => {
  const k = cardUp(f);
  if (k <= 0) return [];
  const y = LH + 250 - (250 - 60) * k;
  return [
    { x: 236, y, curl: 1, turn: 1 },
    { x: 404, y, curl: 1, turn: 1, mirror: true },
  ];
};

// ---- Sound -----------------------------------------------------------------------

const StrikeSound: React.FC = () => {
  const sfx = (name: string, from: number, volume: number, dur = 40) => (
    <Sequence key={`${name}-${from}`} from={from} durationInFrames={dur} name={`🔊 ${name}`}>
      <Audio src={staticFile(`sfx/${name}.mp3`)} volume={volume} />
    </Sequence>
  );
  return (
    <>
      {/* The trial's theme, cut dead by the first knock. */}
      <Sequence durationInFrames={KNOCKS[0] + 2} name="♪ realm theme (cut)">
        <Audio src={staticFile("music/background-music.mp3")} trimBefore={TRIAL_FRAMES - 420} volume={0.25} />
      </Sequence>
      {KNOCKS.map((k, i) => sfx("staff-slam", k, i === 2 ? 0.7 : 0.55, i === 2 ? 40 : 24))}
      {sfx("thunder-strike", APPEAR - 20, 0.5, 90)}
      <Sequence from={APPEAR} durationInFrames={WHIP.to - APPEAR} name="♪ fight (low)">
        <Audio src={staticFile("music/fighting-background-music.mp3")} trimBefore={MUSIC_SKIP} volume={(t) => interpolate(t, [0, 40, LEAN.from - APPEAR, LEAN.to - APPEAR, VANISH - APPEAR, WHIP.to - APPEAR], [0, 0.28, 0.28, 0.06, 0.06, 0], clamp)} />
      </Sequence>
      {sfx("charge-up", STEAL - 6, 0.4, 50)}
      {LAMPS.map((_, i) => sfx("ui-blip", DOUSE + i * 5, 0.12, 8))}
      {sfx("bolt-zap", BOLT - 2, 0.5, 30)}
      {sfx("body-hit", BOLT + 8, 0.7, 30)}
      {sfx("jump-whoosh", LEAP.from, 0.35, 24)}
      {sfx("shield-hit", CAGE.to - 4, 0.6, 30)}
      {sfx("teleport", VANISH - 6, 0.6, 50)}
      {sfx("jump-whoosh", WHIP.from, 0.3, 30)}
      {sfx("thunder-strike", WINDOW_LIT - 10, 0.35, 80)}
      {/* Rain and the drone under the lowest point, and something like hope at the end. */}
      <Sequence from={RAIN} durationInFrames={STRIKE_FRAMES - RAIN} name="🔊 wind and rain">
        <Audio src={staticFile("sfx/ambience.mp3")} loop volume={0.4} />
      </Sequence>
      <Sequence from={VANISH} durationInFrames={STRIKE_FRAMES - VANISH} name="♪ mystery">
        <Audio src={staticFile("music/mystery-drone.mp3")} volume={(t) => interpolate(t, [0, 60, 1596 - VANISH, 1700 - VANISH], [0, 0.45, 0.45, 0.15], clamp)} />
      </Sequence>
      <Sequence from={1596} durationInFrames={STRIKE_FRAMES - 1596} name="♪ hope">
        <Audio src={staticFile("music/rebirth-background-music.mp3")} volume={(t) => interpolate(t, [0, 120, STRIKE_FRAMES - 1596 - 20, STRIKE_FRAMES - 1596], [0, 0.3, 0.3, 0.2], clamp)} />
      </Sequence>
    </>
  );
};

// ---- The scene -------------------------------------------------------------------

export const Strike: React.FC = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  // The colour the first word brought back drains away again.
  const bloomK = interpolate(f, [STEAL + 20, STEAL + 60], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Pov
        cam={cam}
        actors={actorsAt(f, cam)}
        hands={cardHands(f)}
        sky="dawn"
        drain={DRAIN}
        scorch={SCORCH}
        bloom={{ x: -200, y: -700, r: 180, k: bloomK }}
        tower={TOWER}
      >
        <LampGutter f={f} cam={cam} />
        <Gloom f={f} />
        <Wizard f={f} cam={cam} />
        <Stolen f={f} cam={cam} />
        <Bolt f={f} cam={cam} />
        <Dyslexi f={f} cam={cam} />
        <TowerWindow f={f} cam={cam} />
        <Rain f={f} />
        {cardUp(f) > 0 && <PixelCard f={f} swim={cardSwim(f)} x={960} y={720 + (1 - cardUp(f)) * 500} w={520} tilt={-3} />}
        {LINES.map((l) => (
          <Dialogue key={l.from} speaker={SPEAKER[l.who]} text={l.text} t={f - l.from} dur={l.dur} color={TAG[l.who]} at={l.who === "hero" ? "top" : "bottom"} readable />
        ))}
        <StrikeSound />
      </Pov>
    </AbsoluteFill>
  );
};

// The lamps' glow, flickering at each knock, gone when he douses them.
const LampGutter: React.FC<{ f: number; cam: Cam }> = ({ f, cam }) => (
  <>
    {LAMPS.map((p, i) => {
      if (!lampLit(i, f)) return null;
      const s = toScreen(cam, p.x, p.y, 30);
      if (s.d < 4) return null;
      let gutter = 1;
      for (const k of KNOCKS) gutter = Math.min(gutter, interpolate(f, [k, k + 3, k + 14], [1, 0.15, 1], clamp));
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
            opacity: gutter * (0.9 + 0.1 * Math.sin(f / 5 + i)),
          }}
        />
      );
    })}
  </>
);
