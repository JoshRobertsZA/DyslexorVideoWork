import React from "react";
import { AbsoluteFill, Easing, interpolate, interpolateColors, random, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { Exclaim, Grain, Vignette } from "../components/Fx";
import { Sprite } from "../components/Sprite";
import { Dialogue, EPIC, ROWAN } from "../lore/parts";
import { C, PIXEL } from "../theme";
import { ACCENT, FIGHT_CAM, MUSIC_PREROLL, MUSIC_SKIP } from "./config";
import { DarkWizard, WIZ } from "./DarkWizard";
import { Backdrop, Foreground, GROUND, Layer, NightSky } from "./NightVillage";
import { track } from "./parts";

// The narrated opening, before the fight. Golden hour in the realm of words:
// letters drift like fireflies and hang from the trees, Elder Rowan stands on
// the road. "But wisdom has enemies…": the light drains to night, the lamps
// die, the letters flee, and something knocks three times. Red eyes open in
// the dark. Then the standoff: the Dark Wizard steps out laughing, Rowan
// orders him out ("Make me."), splits in two and fires the first letters, and
// we cut on that action into the duel.

export const OPENING_FRAMES = 1125;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const PX = 10;

// Narration (public/voice/beginningvoiceline1-4). `len` is the take's length
// in frames; `subs` are timed to its phrases (from Whisper word timings),
// relative to `at`.
type Sub = { from: number; to: number; text: string };
type Narration = { at: number; len: number; voice: string; subs: Sub[] };
export const NARRATION: Narration[] = [
  {
    at: 25,
    len: 292,
    voice: "voice/beginningvoiceline1.mp3",
    subs: [
      { from: 0, to: 85, text: "Long ago, in the realm of words," },
      { from: 90, to: 278, text: "letters drifted like fireflies and stories grew on every tree." },
    ],
  },
  {
    at: 320,
    len: 162,
    voice: "voice/beginningvoiceline2.mp3",
    subs: [{ from: 0, to: 158, text: "I was the keeper, Elder Rowan, the wisest wizard of all." }],
  },
  { at: 495, len: 77, voice: "voice/beginningvoiceline3.mp3", subs: [{ from: 0, to: 62, text: "But wisdom has enemies..." }] },
  {
    at: 580,
    len: 147,
    voice: "voice/beginningvoiceline4.mp3",
    subs: [
      { from: 0, to: 76, text: "And on the darkest night of the year," },
      { from: 84, to: 140, text: "one came knocking." },
    ],
  },
];

const KNOCKS = [718, 738, 758];
const EYES_OPEN = 726;
// Same spots they hold on the fight's first frame.
const ROWAN_X = 600;
const CLONE_X = 350;
const WIZ_X = 1400;
const K = PX / 7;

// The standoff after the knocks.
const S = { reveal: 768, laugh: 800, rowan: 905, makeMe: 1030, split: 1078, shield: 1093 };
const DARK_RED = "#ff6b78";
// `reveal` types the text along with the take, holding through its pauses.
type Line = { from: number; dur: number; who: string; text: string; voice: string; reveal: [number, number][] };
const STANDOFF: Line[] = [
  {
    from: S.laugh,
    dur: 105,
    who: "Dark Wizard",
    text: "Heh heh heh... Hello, old man.",
    voice: "voice/evil-line4.mp3",
    reveal: [
      [0, 0],
      [35, 15],
      [44, 15],
      [95, 30],
    ],
  },
  {
    from: S.rowan,
    dur: 120,
    who: "Elder Rowan",
    text: "You don't belong here. Leave this realm!",
    voice: "voice/good-line4.mp3",
    reveal: [
      [0, 0],
      [54, 23],
      [77, 23],
      [109, 40],
    ],
  },
  {
    from: S.makeMe,
    dur: 45,
    who: "Dark Wizard",
    text: "Make me.",
    voice: "voice/evil-line5.mp3",
    reveal: [
      [0, 0],
      [34, 8],
    ],
  },
];

// The first letters, fired just before the cut. They match the fight's
// opening BOLTS (Rowan's k=0 at t0 -14, the copy's k=0 at -8, Rowan's k=1 at
// -3), so they're still in flight on its first frame.
const SHIELD = { x: WIZ_X - 20 * K, y: GROUND - 150 * K, rx: 210 * K, ry: 230 * K };
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const FIRST_BOLTS = [
  { t0: OPENING_FRAMES - 14, dur: 16, from: [ROWAN_X + 62 * K, GROUND - 112 * K], toY: SHIELD.y - 70 + random("br0") * 120, letter: 0 },
  { t0: OPENING_FRAMES - 8, dur: 18, from: [CLONE_X + 62 * K, GROUND - 122 * K], toY: SHIELD.y - 70 + random("bc0") * 120, letter: 7 },
  { t0: OPENING_FRAMES - 3, dur: 16, from: [ROWAN_X + 62 * K, GROUND - 112 * K], toY: SHIELD.y - 70 + random("br1") * 120, letter: 1 },
];

// ---- Pieces ----------------------------------------------------------------

const Feet: React.FC<{ x: number; w: number; feet: number; cx: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  x,
  w,
  feet,
  cx,
  children,
  style,
}) => <div style={{ position: "absolute", left: x - cx * PX, top: GROUND - feet * PX, width: w * PX, ...style }}>{children}</div>;

// ---- The realm's letters ---------------------------------------------------
// Fireflies of letters in the air and letters hanging in the trees. They dim
// when the dark comes; then, as the Wizard laughs, every one is torn away and
// pulled into his staff.

const STEAL = S.laugh - 6;
const FLIGHT = 26;
const stealAt = (i: number, seed: string) => STEAL + Math.floor(random(`${seed}${i}`) * 40);

type Glyph = { x: number; y: number; a: number; size: number; char: string; color: string };

const fireLetter = (i: number, f: number): Glyph => {
  const life = 220 + random(`fl-l${i}`) * 160;
  const t = ((f + random(`fl-o${i}`) * life) % life) / life;
  return {
    x: -250 + random(`fl-x${i}`) * 2500 + Math.sin(f / 40 + i) * 30,
    y: GROUND - 40 - t * 520,
    a: Math.sin(t * Math.PI) * (0.55 + 0.45 * Math.sin(f / 9 + i * 1.7)),
    size: 26 + (i % 3) * 12,
    char: LETTERS[i % 26],
    color: i % 4 ? C.gold : C.cream,
  };
};

const treeLetter = (i: number, f: number): Glyph => ({
  x: -260 + i * 80 + random(`tr-x${i}`) * 40,
  y: 520 + random(`tr-y${i}`) * 90,
  a: 0.6 + 0.4 * Math.sin(f / 14 + i),
  size: 22,
  char: "WORDSTALEREADBOOKSONG"[i % 21],
  color: C.gold,
});

const LETTER_SETS = [
  { n: 46, depth: 0.85, seed: "sf", at: fireLetter },
  { n: 30, depth: 0.6, seed: "st", at: treeLetter },
];

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

// Where his staff's orb is, for a given tilt (see DarkWizard: the staff turns
// by -raise*32deg about the hand at art (3, 20); the orb sits at (2.5, 1.5)).
const orbAt = (raise: number): [number, number] => {
  const th = (-raise * 32 * Math.PI) / 180;
  const dx = -0.5;
  const dy = -18.5;
  const x = dx * Math.cos(th) - dy * Math.sin(th);
  const y = dx * Math.sin(th) + dy * Math.cos(th);
  return [WIZ_X - WIZ.cx * PX + (3 + x) * PX, GROUND - WIZ.feet * PX + (20 + y) * PX];
};

// Staff: tips forward and slams back for each knock, rises to drink the
// letters, and settles to shield height for the fight.
const wizRaise = (f: number) =>
  Math.max(
    ...KNOCKS.map((k) => interpolate(f, [k - 10, k - 4, k], [0, 0.45, 0], clamp)),
    interpolate(f, [STEAL - 8, STEAL + 4, STEAL + 56, STEAL + 70], [0, 0.7, 0.7, 0], clamp),
    interpolate(f, [S.shield - 6, S.shield], [0, 0.3], clamp),
  );

// The letters' flight, drawn in the world layer (converted from their own
// parallax layer at the moment they're torn away).
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

// Red eyes opening in the dark, with his silhouette behind them. A flash of
// lightning reveals him; he laughs, then raises his shield.
const EyesInTheDark: React.FC<{ f: number }> = ({ f }) => {
  const shape = interpolate(f, [670, KNOCKS[0] - 1, KNOCKS[0], S.reveal, S.reveal + 20], [0, 0.35, 0.85, 0.85, 1], clamp);
  // Each knock's lightning lights him up for a moment.
  const knockLit = Math.max(...KNOCKS.map((k) => interpolate(f, [k - 1, k, k + 9], [0, 1, 0], clamp)));
  const drink = interpolate(f, [STEAL, STEAL + 66, STEAL + 90], [0, 1.6, 0], clamp);
  const lit = interpolate(f, [S.reveal, S.reveal + 24], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const laughing = f >= S.laugh && f < S.laugh + 45;
  const bob = laughing ? -Math.round(Math.abs(Math.sin((f - S.laugh) * 0.9)) * 2) * PX : 0;
  const open = interpolate(f, [EYES_OPEN, EYES_OPEN + 8], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
  const flare = 1 + interpolate(f, [KNOCKS[2], OPENING_FRAMES], [0, 1.5], clamp);
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
          transform: `translateY(${bob}px)`,
        }}
      >
        <DarkWizard
          px={PX}
          eyes={lit}
          orb={0.6 + 0.4 * lit + drink}
          raise={wizRaise(f)}
        />
      </Feet>
      {/* His laugh, floating up */}
      {laughing &&
        Array.from({ length: 5 }, (_, i) => {
          const t = (f - S.laugh - i * 7) / 36;
          if (t < 0 || t > 1) return null;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: WIZ_X + (i % 2 ? 60 : -170) + Math.sin(t * 6 + i) * 20,
                top: GROUND - WIZ.feet * PX - 20 - t * 160,
                fontFamily: PIXEL,
                fontSize: 34 + (i % 3) * 8,
                color: "#c9a8ff",
                textShadow: "0 0 14px #7a3cff, 4px 4px 0 #000",
                opacity: Math.sin(t * Math.PI),
              }}
            >
              HA
            </div>
          );
        })}
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
          style={{ top: GROUND - 10 - 43 * PX, opacity: 0.72 + 0.15 * Math.sin((f - OPENING_FRAMES) / 2.5), filter: `brightness(1.4) saturate(0.5) drop-shadow(0 0 14px ${ACCENT.mint})` }}
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

const Subtitle: React.FC<{ f: number; at: number; sub: Sub }> = ({ f, at, sub }) => {
  const t = f - at - sub.from;
  const dur = sub.to - sub.from;
  if (t < 0 || t > dur) return null;
  const a = interpolate(t, [0, 8, dur - 10, dur], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 90 }}>
      <div
        style={{
          fontFamily: EPIC,
          fontSize: 46,
          lineHeight: 1.4,
          color: C.cream,
          textAlign: "center",
          maxWidth: 1500,
          letterSpacing: 1,
          textShadow: "0 3px 0 #000, 0 0 30px #000, 0 0 60px #000",
          opacity: a,
          filter: `blur(${(1 - a) * 5}px)`,
        }}
      >
        {sub.text}
      </div>
    </AbsoluteFill>
  );
};

// Camera: drifts across the realm to Rowan, settles on him, pulls back as
// the light goes, turns toward the knocking and pushes in on the eyes, then
// the standoff's pans.
const camX = (f: number) =>
  track(f, [
      [0, 1350],
      [300, 760],
      [480, 700],
      [580, 820],
      [690, 1150],
      [775, 1300],
      [S.laugh, 1300],
      [S.laugh + 14, 1360],
      [S.rowan - 6, 1360],
      // Whip pan to Rowan, back for "Make me.", then wide for the split.
      [S.rowan + 6, 700],
      [S.makeMe - 8, 700],
      [S.makeMe + 4, 1360],
      [S.split - 4, 1360],
      [S.split + 8, 980],
      // Drift toward the shield as the letters fly, into the fight's first frame.
      [OPENING_FRAMES, FIGHT_CAM.x],
  ]);

// ---- Scene -----------------------------------------------------------------

export const Opening: React.FC = () => {
  const f = useCurrentFrame();

  const day = interpolate(f, [495, 580], [1, 0], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const corrupt = interpolate(f, [555, 730], [0, 0.8], clamp);
  const lampsOut = interpolate(f, [640, 655], [0, 1], clamp);
  let flash = 0;
  for (const k of KNOCKS) flash = Math.max(flash, interpolate(f, [k - 1, k, k + 9], [0, 1, 0], clamp));

  const cam = camX(f);
  const zoom = track(f, [
    [320, 1],
    [470, 1.12],
    [540, 1],
    [700, 1],
    [790, 1.35],
    [S.laugh + 14, 1.45],
    [S.rowan - 6, 1.45],
    [S.rowan + 6, 1.3],
    [S.makeMe - 8, 1.3],
    [S.makeMe + 4, 1.65],
    [S.split - 4, 1.65],
    [S.split + 8, 1],
    // The fight scales its world by 1.02, so match that here.
    [OPENING_FRAMES, FIGHT_CAM.zoom * 1.02],
  ]);
  flash = Math.max(flash, interpolate(f, [S.reveal - 1, S.reveal, S.reveal + 12], [0, 1, 0], clamp));
  let kick = 0;
  for (const k of KNOCKS) if (f >= k && f < k + 8) kick += 0.025 * (1 - (f - k) / 8);
  const shake = KNOCKS.reduce((a, k) => a + (f >= k && f < k + 10 ? (1 - (f - k) / 10) * 10 : 0), 0);

  const turned = f >= 690;
  const alarmed = f >= KNOCKS[0] && f < KNOCKS[0] + 40;
  const fadeIn = interpolate(f, [0, 30], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          opacity: fadeIn,
          transform: `translate(${Math.sin(f * 2.3) * shake}px, ${Math.cos(f * 3.1) * shake * 0.6}px) scale(${zoom + kick})`,
          transformOrigin: `960px ${GROUND - 260}px`,
        }}
      >
        <NightSky f={f} cam={cam} corrupt={corrupt} flash={flash} lit={0} litX={0} day={day} />
        <Backdrop f={f} cam={cam} corrupt={corrupt} lampsOut={lampsOut} day={day} />
        <Glyphs f={f} cam={cam} set={LETTER_SETS[1]} dim={0.5 + 0.5 * day} />
        <div style={{ position: "absolute", inset: 0, transform: `translateX(${960 - cam}px)` }}>
          <Feet x={ROWAN_X} w={48} feet={43} cx={24.5} style={{ filter: `brightness(${1 + 0.15 * day})` }}>
            <Sprite src={ROWAN} row={turned ? 1 : 0} scale={PX} animFps={6} />
          </Feet>
          {alarmed && (
            <div style={{ position: "absolute", left: ROWAN_X - 30, top: GROUND - 32 * PX - 100 }}>
              <Exclaim px={7} />
            </div>
          )}
          <EyesInTheDark f={f} />
          <KnockImpacts f={f} />
          <Standoff f={f} />
          <StolenLetters f={f} />
        </div>
        <Glyphs f={f} cam={cam} set={LETTER_SETS[0]} dim={0.5 + 0.5 * day} />
        <Foreground f={f} cam={cam} day={day} />
        <AbsoluteFill style={{ background: "rgba(30,20,70,0.12)", opacity: 1 - day, pointerEvents: "none" }} />
        {/* Ends on the fight's 0.6 so the cut matches */}
        <Vignette strength={0.45 + 0.15 * (1 - day)} />
      </AbsoluteFill>

      {/* Shade under the subtitles so they read over the ground */}
      <AbsoluteFill
        style={{ background: "linear-gradient(transparent 70%, #000a 100%)", opacity: interpolate(f, [720, 760], [1, 0], clamp), pointerEvents: "none" }}
      />
      {NARRATION.flatMap((n) => n.subs.map((sub) => <Subtitle key={`${n.at}-${sub.from}`} f={f} at={n.at} sub={sub} />))}
      {/* Tension: a low rumble and a rising charge from "Make me." into the
          first bolt, where the fight music hits (and carries on into the
          Summoning). */}
      <Sequence from={S.makeMe - 10} durationInFrames={OPENING_FRAMES - S.makeMe + 10} name="🔊 rumble">
        <Audio
          src={staticFile("sfx/thunder-strike.mp3")}
          trimBefore={66}
          volume={(t) => interpolate(t, [0, 40, OPENING_FRAMES - S.makeMe - 4, OPENING_FRAMES - S.makeMe + 10], [0, 0.5, 0.7, 0], clamp)}
        />
      </Sequence>
      <Sequence from={OPENING_FRAMES - MUSIC_PREROLL - 80} durationInFrames={80} name="🔊 riser">
        <Audio src={staticFile("sfx/charge-up.mp3")} volume={(t) => interpolate(t, [0, 60, 80], [0.15, 0.6, 0.6], clamp)} />
      </Sequence>
      <Sequence from={OPENING_FRAMES - MUSIC_PREROLL} durationInFrames={MUSIC_PREROLL} name="♪ fight (first hit)">
        <Audio src={staticFile("music/fighting-background-music.mp3")} trimBefore={MUSIC_SKIP} volume={0.45} />
      </Sequence>
      <Sequence from={OPENING_FRAMES - MUSIC_PREROLL} durationInFrames={30} name="🔊 first-bolt boom">
        <Audio src={staticFile("sfx/staff-slam.mp3")} volume={(t) => interpolate(t, [0, 20, 30], [0.35, 0.35, 0], clamp)} />
      </Sequence>
      {STANDOFF.map((l) => (
        <Dialogue key={l.from} speaker={l.who} text={l.text} t={f - l.from} dur={l.dur} color={l.who === "Dark Wizard" ? DARK_RED : C.gold} reveal={l.reveal} />
      ))}
      <Grain opacity={0.06} />

      {/* Sound: the realm's own theme while it's peaceful, wind and storm as
          the dark comes, three booming knocks. */}
      <Sequence durationInFrames={580} name="♪ realm theme">
        <Audio src={staticFile("music/background-music.mp3")} volume={(t) => interpolate(t, [0, 30, 500, 580], [0, 0.35, 0.35, 0], clamp)} />
      </Sequence>
      <Sequence from={500} durationInFrames={OPENING_FRAMES - 500} name="🔊 ambience">
        <Audio src={staticFile("sfx/ambience.mp3")} volume={(t) => interpolate(t, [0, 120], [0, 0.6], clamp)} />
      </Sequence>
      {KNOCKS.map((k, i) => (
        <Sequence key={k} from={k} durationInFrames={i === 2 ? 40 : 20} name="🔊 knock">
          <Audio src={staticFile("sfx/staff-slam.mp3")} volume={(t) => 0.55 * interpolate(t, [0, i === 2 ? 30 : 12, i === 2 ? 40 : 20], [1, 1, 0], clamp)} />
        </Sequence>
      ))}
      <Sequence from={KNOCKS[0] - 29} durationInFrames={OPENING_FRAMES - KNOCKS[0] + 29} name="🔊 thunder">
        <Audio src={staticFile("sfx/thunder-strike.mp3")} volume={0.4} />
      </Sequence>
      {/* Out of the way before his laugh */}
      <Sequence from={S.reveal - 29} durationInFrames={S.laugh - S.reveal + 29 + 6} name="🔊 reveal thunder">
        <Audio src={staticFile("sfx/thunder-strike.mp3")} volume={(t) => 0.55 * interpolate(t, [0, 40, S.laugh - S.reveal + 35], [1, 1, 0], clamp)} />
      </Sequence>
      {[S.rowan - 2, S.makeMe - 6, S.split + 2].map((at) => (
        <Sequence key={at} from={at - 10} durationInFrames={24} name="🔊 whip pan">
          <Audio src={staticFile("sfx/jump-whoosh.mp3")} volume={0.22} />
        </Sequence>
      ))}
      <Sequence from={S.split - 7} durationInFrames={45} name="🔊 split">
        <Audio src={staticFile("sfx/summon.mp3")} volume={0.45} />
      </Sequence>
      <Sequence from={S.shield} durationInFrames={20} name="🔊 shield up">
        <Audio src={staticFile("sfx/shield-hit.mp3")} volume={1.1} />
      </Sequence>
      {FIRST_BOLTS.map((b) => (
        <Sequence key={b.t0} from={b.t0 - 2} durationInFrames={OPENING_FRAMES - b.t0 + 2} name="🔊 bolt">
          <Audio src={staticFile("sfx/bolt-zap.mp3")} volume={0.21} />
        </Sequence>
      ))}
      {STANDOFF.map((l) => (
        <Sequence key={l.from} from={l.from} durationInFrames={l.dur + 15} name={`🗣 ${l.who}`}>
          <Audio src={staticFile(l.voice)} volume={1} />
        </Sequence>
      ))}
      {NARRATION.map((n) => (
        <Sequence key={n.at} from={n.at} durationInFrames={n.len} name="🗣 Narrator">
          <Audio src={staticFile(n.voice)} volume={1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
