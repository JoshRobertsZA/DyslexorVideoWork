import React from "react";
import { AbsoluteFill, Easing, interpolate, random, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { Sprite } from "../components/Sprite";
import { Dialogue } from "../lore/parts";
import { C, PIXEL } from "../theme";
import { ACCENT, ARRIVAL_FALL, ARRIVAL_FRAMES, DRONE_IN, HERO_LOOK, HERO_NAME, OUTFIT, REAL_HAND, SKIN } from "./config";
import { Footage } from "./Footage";
import { HeroSprite, RealmTitle, track } from "./parts";
import { villageActors } from "./Village";
import { BOOT_FRAMES, HudBoot, START_STATS, Stats, STATS_PANEL, StatsFocus, StatsScreen } from "./hud/Hud";
import { DYSLEXI_COLOR } from "./hud/Dyslexi";
import { HandPose } from "./realm/hands";
import { Cam, LH, Pov } from "./realm/Pov";
import { DRAIN, SCORCH, SHEETS } from "./realm/world";

// Act 3. Hero falls through the portal Rowan tore open and tumbles out of the
// sky into the realm, the morning after the Dark Wizard's attack. She lands
// hard on the road where the fight happened, opens her eyes as the portal
// closes overhead, sits up into a realm drained of colour (scorched road,
// worried townsfolk), raises one blocky hand, then the other, pulls out her
// phone and sees herself 8-bit on the front camera. Then she starts walking.
// She is the only thing in full colour.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// The fall, before she opens her eyes.
const FALL = ARRIVAL_FALL;
const IMPACT = 92;
// The rest of the act, from the moment she's on the ground.
const WAKE_FRAMES = ARRIVAL_FRAMES - FALL;

// Townsfolk who notice her as she sits up.
const NOTICE = { from: 220, to: 330, who: ["guard", "farmer", "merchant"] };

// Eyelids: 0 = shut, 1 = open.
const lids = (f: number) =>
  track(f, [
    [18, 0],
    [48, 0.55],
    [60, 0.55],
    [68, 0],
    [76, 0],
    [100, 1],
  ]);

// Out of focus as she comes round, sharpening once her eyes are properly open.
const groggy = (f: number) =>
  track(f, [
    [18, 16],
    [60, 9],
    [100, 3],
    [130, 0],
  ]);

const horizon = (f: number) =>
  track(f, [
    [0, 620],
    [110, 620],
    [190, 128],
    [520, 120],
  ]);

const HAND_IN = 200;
const HANDS_DOWN = 500;

// She pulls out her phone, flips to the front camera and sees herself 8-bit.
export const PHONE = { up: 525, rest: 560, flip: 588, snap: 655, down: 700, gone: 728 };
// The world finds her: once the phone is away and she's had a beat, the
// system scans her view and a voice greets her ("Welcome, hero!"). She reacts,
// and as the greeting fades her status window opens for the first time on its
// own. With it comes the voice's owner, Dyslexi, her guide: she tells Hero
// where she is and what the window means, lighting up each part as she goes,
// and sends her off to find Rowan. Dyslexi's lines are timed to her takes
// (Whisper word timings, in frames from each line's start).
const BOOT = 740;
const OPEN = BOOT + BOOT_FRAMES - 8;
type Line = {
  from: number;
  dur: number;
  text: string;
  guide?: boolean;
  focus?: StatsFocus;
  voice?: string;
  speak?: number;
  reveal?: [number, number][];
};
// Heard, not seen: it lands as "Welcome, Hero" types out on the boot screen.
const WELCOME = { at: BOOT + 60, voice: "voice/dyslexi-voiceline1.mp3", len: 45 };
// She jumps on this one.
const SQUARES: Line = { from: 682, dur: 50, text: "I'm made of squares!" };
const G0 = OPEN + 16;
const LINES: Line[] = [
  // Puzzling over her hands: the left one up, turned to the palm, the right
  // one up, the fingers flexing in jumpy steps, then reaching for her phone.
  { from: 242, dur: 52, text: "Huh? My hand looks... weird." },
  { from: 298, dur: 46, text: "It's all blocky!" },
  { from: 376, dur: 46, text: "This one too?!" },
  { from: 426, dur: 58, text: "Why do my fingers move like that?" },
  { from: 488, dur: 44, text: "I need to see my face..." },
  { from: 605, dur: 75, text: "Wait... is that me?" },
  SQUARES,
  { from: WELCOME.at + 44, dur: 50, text: "Huh?! Who said that?" },
  {
    from: G0,
    dur: 166,
    guide: true,
    text: "Don't worry, Hero! I'm your guide. You're inside a game world now.",
    voice: "voice/dyslexi-voiceline2.mp3",
    speak: 145,
    reveal: [
      [0, 0],
      [37, 18],
      [54, 18],
      [77, 34],
      [95, 34],
      [145, 66],
    ],
  },
  {
    from: G0 + 170,
    dur: 150,
    guide: true,
    focus: "xp",
    text: "Play word games to earn XP. Fill the bar to level up!",
    voice: "voice/dyslexi-voiceline3.mp3",
    speak: 124,
    reveal: [
      [0, 0],
      [60, 27],
      [75, 27],
      [124, 53],
    ],
  },
  {
    from: G0 + 324,
    dur: 134,
    guide: true,
    focus: "words",
    text: "Every word you get right brings a word back to this world.",
    voice: "voice/dyslexi-voiceline4.mp3",
    speak: 107,
    reveal: [
      [0, 0],
      [107, 58],
    ],
  },
  {
    from: G0 + 462,
    dur: 112,
    guide: true,
    text: "Now go and find Elder Rowan! He needs your help!",
    voice: "voice/dyslexi-voiceline5.mp3",
    speak: 87,
    reveal: [
      [0, 0],
      [49, 28],
      [59, 28],
      [87, 48],
    ],
  },
];
const STATUS = { at: OPEN, dur: G0 + 462 + 112 + 6 - OPEN };
const during = (f: number, l: Line) => f >= l.from && f < l.from + l.dur;
const focusAt = (f: number) => LINES.find((l) => l.focus && during(f, l))?.focus;

// Dyslexi shows what she means as she says it: the XP bar fills on "Fill the
// bar" and she levels up on "up!", then the word count ticks up on "brings a
// word back". Both are only previews and reset after their line, so the
// Village still starts her at level 1. The colour coming back is saved for
// Rowan's demo in the Village.
const XP_LINE = LINES.find((l) => l.focus === "xp")!;
const WORDS_LINE = LINES.find((l) => l.focus === "words")!;
const XP_FILL = XP_LINE.from + 75;
const XP_FULL = XP_LINE.from + 114;
const WORD_BACK = WORDS_LINE.from + 68;
const demoStats = (f: number): Stats => ({
  ...START_STATS,
  xp: during(f, XP_LINE) ? interpolate(f, [XP_FILL, XP_FULL], [0, START_STATS.xpMax], clamp) : 0,
  level: during(f, XP_LINE) && f >= XP_FULL ? 2 : START_STATS.level,
  words: during(f, WORDS_LINE) && f >= WORD_BACK ? 1 : 0,
});

// Dyslexi on her perch: she hops up onto the status panel's top-left corner
// as she introduces herself and sits with her paws over its border, so she
// and the window read as one thing. Her dialogue box points down at her. She
// faces the viewer the whole time (a gold arrow marks the row she's
// explaining), bounces while she talks, and hops off before the panel closes.
const PANEL_OFFSET = 140;
const PANEL_TOP = 540 - STATS_PANEL.h / 2 + PANEL_OFFSET;
const PANEL_LEFT = 960 - STATS_PANEL.w / 2;
// Where her feet rest: just inside the corner, over the border.
const PERCH = { x: PANEL_LEFT + 92, y: PANEL_TOP + 30 };
const DYS_PX = 6;
// Her idle loop without its eyes-shut frame (column 4 of the sheet), so she
// keeps looking out at the viewer; that frame only comes back as a quick
// blink every few seconds.
const dyslexiCol = (f: number, talking: boolean) => (f % 97 < 3 ? 4 : Math.floor((f / 30) * (talking ? 10 : 6)) % 4);
const Guide: React.FC<{ f: number }> = ({ f }) => {
  const end = STATUS.at + STATUS.dur;
  const inT = interpolate(f, [G0 - 6, G0 + 10], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const outT = interpolate(f, [end - 28, end - 14], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  if (inT <= 0 || outT >= 1) return null;
  const talking = LINES.some((l) => l.guide && l.speak && f >= l.from && f < l.from + l.speak);
  // Up onto the corner from the left in an arc, and off it the same way.
  const x = PERCH.x - (1 - inT) * 170 - outT * 170;
  const lift = Math.sin(inT * Math.PI) * 80 + Math.sin(outT * Math.PI) * 80 - outT * 60;
  const bounce = talking ? Math.abs(Math.sin(f / 3.2)) * 8 : 0;
  const seated = inT >= 1 && outT <= 0;
  return (
    <>
      {/* Her shadow on the panel's top edge, so she sits rather than floats */}
      <div
        style={{
          position: "absolute",
          left: PERCH.x - 62,
          top: PERCH.y - 12,
          width: 124,
          height: 18,
          borderRadius: "50%",
          background: "rgba(0,0,0,0.45)",
          opacity: seated ? 1 : Math.max(0, 1 - lift / 60),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: x - 25.5 * DYS_PX,
          top: PERCH.y - 43 * DYS_PX - lift - bounce,
          opacity: Math.min(1, inT * 2, 1 - outT),
          filter: "drop-shadow(0 6px 0 rgba(0,0,0,0.35))",
        }}
      >
        <Sprite src={SHEETS.dyslexi} row={0} col={dyslexiCol(f, talking)} scale={DYS_PX} />
      </div>
    </>
  );
};
// Sets off walking as the window closes, at the Village's pace by the end.
const WALK = { from: STATUS.at + STATUS.dur - 30, to: WAKE_FRAMES };

const leftHand = (f: number): HandPose | null => {
  if (f < HAND_IN || f > HANDS_DOWN + 32) return null;
  const y = track(f, [
    [HAND_IN, LH + 230],
    [HAND_IN + 40, LH + 48],
    [HANDS_DOWN, LH + 54],
    [HANDS_DOWN + 30, LH + 240],
  ]);
  // Turn to the palm and back: cos sweep from back (1) to palm (-1).
  const turnT = track(f, [
    [255, 0],
    [280, 1],
    [315, 1],
    [340, 0],
  ]);
  return { x: 200 + Math.sin(f / 22) * 4, y: y + Math.sin(f / 17) * 4, curl: 0, turn: Math.cos(turnT * Math.PI) };
};

const rightHand = (f: number): HandPose | null => {
  if (f < 335 || f > HANDS_DOWN + 32) return null;
  const y = track(f, [
    [335, LH + 230],
    [372, LH + 48],
    [HANDS_DOWN, LH + 54],
    [HANDS_DOWN + 30, LH + 240],
  ]);
  // Choppy finger flex, sprite style: open, half, fist, half, open.
  const steps: (0 | 1 | 2)[] = [0, 1, 2, 2, 1, 0, 1, 2, 1, 0];
  const i = Math.floor((f - 390) / 9);
  const curl = f >= 390 && i < steps.length ? steps[i] : 0;
  return { x: 440 + Math.sin(f / 19) * 4, y: y + Math.sin(f / 15) * 4, curl, turn: 1, mirror: true };
};

// Pixel leaf clusters overhead while she's looking up through the trees.
const LEAF = 24;
const Canopy: React.FC<{ lift: number }> = ({ lift }) => {
  const f = useCurrentFrame();
  const clusters = Array.from({ length: 14 }, (_, i) => ({
    cx: (i < 7 ? 60 : 1500) + random(`cx${i}`) * 420,
    cy: -60 + random(`cy${i}`) * 300,
    r: 120 + random(`cs${i}`) * 110,
  }));
  return (
    <AbsoluteFill style={{ transform: `translateY(${-lift}px)`, filter: `saturate(${1 - DRAIN})` }}>
      <svg width={1920} height={1080} shapeRendering="crispEdges">
        {clusters.map((c, i) => {
          const sway = Math.round(Math.sin(f / 25 + i) * 1) * LEAF;
          const cells: React.ReactNode[] = [];
          for (let y = -c.r; y <= c.r; y += LEAF)
            for (let x = -c.r; x <= c.r; x += LEAF) {
              const e = (x / c.r) ** 2 + (y / (c.r * 0.8)) ** 2;
              if (e > 1 - 0.25 * random(`lf-${i}-${x}-${y}`)) continue;
              const light = x + y < -c.r * 0.6;
              const dark = x + y > c.r * 0.5 || e > 0.8;
              cells.push(
                <rect
                  key={`${x},${y}`}
                  x={Math.round((c.cx + x) / LEAF) * LEAF + sway}
                  y={Math.round((c.cy + y) / LEAF) * LEAF}
                  width={LEAF}
                  height={LEAF}
                  fill={dark ? "#1d4632" : light ? C.tuftLight : C.tuft}
                />,
              );
            }
          return <g key={i}>{cells}</g>;
        })}
      </svg>
    </AbsoluteFill>
  );
};

const Waking: React.FC = () => {
  const f = useCurrentFrame();
  const open = lids(f);
  const hz = horizon(f);
  // She sets off and is up to the Village's walking pace (1.2 texels a
  // frame) exactly when the Village act takes over at y = 140.
  const posY = track(
    f,
    [
      [WALK.from, 176],
      [WALK.to, 140],
    ],
    Easing.in(Easing.quad),
  );
  const stride = interpolate(f, [WALK.from, WALK.to], [0, 1], clamp);
  const walk = Math.sin((f / 30) * Math.PI * 4) * stride;
  // Idle head sway settles to dead ahead, where the Village starts.
  const sway = Math.sin(f / 40) * 0.02 * interpolate(f, [WALK.from - 20, WALK.to], [1, 0], clamp);
  const hands = [leftHand(f), rightHand(f)].filter((h): h is HandPose => h !== null);
  const phone = phoneLift(f);
  // Fades in once the status window closes and out in the Village, so it
  // carries across the join.
  const title = interpolate(f, [STATUS.at + STATUS.dur, WAKE_FRAMES], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <AbsoluteFill style={{ filter: groggy(f) > 0 ? `blur(${groggy(f)}px)` : undefined }}>
        <Pov
          cam={{
            x: 0,
            y: posY,
            heading: sway,
            eye: 26 + walk * 0.7,
            horizon: hz + walk * 2,
          }}
          actors={worried(f)}
          hands={hands}
          sky="dawn"
          drain={DRAIN}
          scorch={SCORCH}
        >
          <Canopy lift={interpolate(hz, [128, 620], [900, 0], clamp)} />
          <ClosingPortal f={f} hz={hz} />
          <RealmTitle opacity={title} />
          <HudBoot t={f - BOOT} stats={START_STATS} />
          {/* Low enough for Dyslexi to sit on top, under her dialogue box. */}
          <StatsScreen
            offsetY={PANEL_OFFSET}
            focus={focusAt(f)}
            t={f - STATUS.at}
            dur={STATUS.dur}
            stats={demoStats(f)}
            badges={[]}
            locked={["beginner", "spelling-star", "vowel-team-whiz", "comeback-kid", "grandmaster"]}
            skills={[]}
          />
          {phone > 0 && <Phone lift={phone} cam={{ x: 0, y: posY, heading: sway }} />}
          {LINES.map((l) => (
            <Dialogue
              key={l.from}
              speaker={l.guide ? "Dyslexi" : HERO_NAME}
              text={l.text}
              t={f - l.from}
              dur={l.dur}
              color={l.guide ? DYSLEXI_COLOR : C.lilac}
              at="top"
              reveal={l.reveal}
              readable
              tail={l.guide ? PERCH.x : undefined}
            />
          ))}
          <Guide f={f} />
        </Pov>
      </AbsoluteFill>

      {REAL_HAND.src && (
        <Sequence from={HAND_IN - 20} durationInFrames={REAL_HAND.frames} name="Real hand → pixels">
          <RealHandDissolve />
        </Sequence>
      )}

      <Eyelids open={open} />
    </AbsoluteFill>
  );
};

// Her eyelids from the inside: black with an almond-shaped gap that is widest
// in the middle and pinched at the corners. The upper lid travels further than
// the lower one, and both are soft-edged (they're right against the lens).
const Eyelids: React.FC<{ open: number }> = ({ open }) => {
  if (open >= 1) return null;
  const W = 1920;
  const cy = 560;
  // The corners show while she's squinting, then spread off-screen so at full
  // open the gap clears the whole frame.
  const l = interpolate(open, [0, 1], [120, -700]);
  const r = W - l;
  const up = 1100 * open + 1400 * open ** 4;
  const down = 0.7 * up;
  // Rounded lids: a cubic with its handles a fifth in from each corner peaks at
  // three quarters of the handles' offset.
  const hx = (r - l) * 0.2;
  const k = 4 / 3;
  const gap =
    open > 0
      ? `M${l},${cy} C${l + hx},${cy - k * up} ${r - hx},${cy - k * up} ${r},${cy} C${r - hx},${cy + k * down} ${l + hx},${cy + k * down} ${l},${cy} Z`
      : "";
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id="lid-soft" x="-0.1" y="-0.1" width="1.2" height="1.2">
            <feGaussianBlur stdDeviation={10 + 30 * open} />
          </filter>
        </defs>
        <path d={`M-300,-300 H2220 V1380 H-300 Z ${gap}`} fillRule="evenodd" fill="#000" filter="url(#lid-soft)" />
      </svg>
    </AbsoluteFill>
  );
};

// The townsfolk, a few of them startled by her.
const worried = (f: number) =>
  villageActors(f - WAKE_FRAMES).map((a) => (f >= NOTICE.from && f < NOTICE.to && NOTICE.who.includes(a.sheet) ? { ...a, bubble: true } : a));

// The portal she fell out of, still open in the sky overhead as she comes to,
// then pinching shut. Pinned to the sky, so it slides away as she sits up.
const ClosingPortal: React.FC<{ f: number; hz: number }> = ({ f, hz }) => {
  const open = interpolate(f, [0, 60, 100, 118], [1, 1, 0.12, 0], { ...clamp, easing: Easing.in(Easing.quad) });
  if (open <= 0 && f > 130) return null;
  const pop = interpolate(f, [116, 120, 134], [0, 1, 0], clamp);
  const cy = (hz - 440) * 3;
  const w = 230 * open;
  const h = 340 * Math.max(open, 0.6);
  const stepF = Math.floor(f / 3) * 3;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: 960 - w / 2,
          top: cy - h / 2,
          width: w,
          height: h,
          overflow: "hidden",
          border: open > 0 ? `8px solid ${ACCENT.mint}` : undefined,
          boxShadow: `0 0 50px 12px ${ACCENT.mint}99`,
          background: `radial-gradient(ellipse, ${C.cream} 12%, ${ACCENT.mint} 50%, #1d5a4c 100%)`,
          opacity: open > 0 ? 1 : 0,
        }}
      >
        {Array.from({ length: 5 }, (_, i) => {
          const t = (stepF / 30 + i / 5) % 1;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${50 - (10 + t * 55)}%`,
                top: `${50 - (10 + t * 55)}%`,
                width: `${(10 + t * 55) * 2}%`,
                height: `${(10 + t * 55) * 2}%`,
                border: `${8 - t * 4}px solid ${[ACCENT.mint, ACCENT.lavender, ACCENT.peach][i % 3]}`,
                opacity: (1 - t) * 0.7,
              }}
            />
          );
        })}
      </div>
      {/* A last spark as it shuts */}
      <div
        style={{
          position: "absolute",
          left: 960 - 160,
          top: cy - 160,
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: `radial-gradient(${C.cream}, ${ACCENT.mint}88 35%, transparent 70%)`,
          opacity: pop,
        }}
      />
    </AbsoluteFill>
  );
};

// ---- The fall ----------------------------------------------------------------

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Straight down the portal: rings and letters rushing past.
const Tunnel: React.FC<{ f: number }> = ({ f }) => {
  const speed = 1 + f / 20;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(${C.cream} 0%, ${ACCENT.mint} 30%, #1d5a4c 75%, #0d2b25 100%)`, overflow: "hidden" }}>
      {Array.from({ length: 12 }, (_, i) => {
        const t = ((f * 0.03 * speed + i / 12) % 1) ** 2;
        const s = 60 + t * 2600;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 960 - s / 2,
              top: 540 - (s * 0.6) / 2,
              width: s,
              height: s * 0.6,
              border: `${4 + t * 30}px solid ${[ACCENT.mint, ACCENT.lavender, ACCENT.peach][i % 3]}`,
              opacity: 0.25 + t * 0.6,
            }}
          />
        );
      })}
      {Array.from({ length: 30 }, (_, i) => {
        const life = 26;
        const t = ((f + i * 7) % life) / life;
        const a = random(`tl-a${i}`) * Math.PI * 2;
        const r = 40 + t * t * 1300;
        return (
          <div
            key={`l${i}`}
            style={{
              position: "absolute",
              left: 960 + Math.cos(a) * r,
              top: 540 + Math.sin(a) * r * 0.6,
              fontFamily: PIXEL,
              fontSize: 14 + t * 90,
              color: i % 3 ? C.gold : C.cream,
              textShadow: `0 0 16px ${ACCENT.mint}`,
              opacity: Math.min(1, t * 3),
              transform: "translate(-50%, -50%)",
            }}
          >
            {LETTERS[i % 26]}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// Out of the portal and tumbling down on her back: the dawn sky spinning, the
// portal shrinking above her, wind streaking past.
const Tumble: React.FC<{ f: number }> = ({ f }) => {
  const t = (f - 40) / (IMPACT - 40);
  const roll = t * 7.5 + Math.sin(f / 3) * 0.05;
  const portal = 1500 * (1 - t) ** 1.6 + 220;
  return (
    <AbsoluteFill>
      {/* Blown up so the spinning view always covers the frame */}
      <AbsoluteFill style={{ transform: "scale(2.2)" }}>
        <Pov cam={{ x: 0, y: 150, heading: t * 1.2, eye: 26, horizon: 700, roll }} sky="dawn" drain={DRAIN} />
      </AbsoluteFill>
      <AbsoluteFill style={{ transform: `rotate(${roll}rad)` }}>
        <div
          style={{
            position: "absolute",
            left: 960 - portal / 2,
            top: 540 - (portal * 1.45) / 2,
            width: portal,
            height: portal * 1.45,
            border: `${Math.max(6, portal / 30)}px solid ${ACCENT.mint}`,
            boxShadow: `0 0 60px 16px ${ACCENT.mint}99`,
            background: `radial-gradient(ellipse, ${C.cream} 12%, ${ACCENT.mint} 50%, #1d5a4c 100%)`,
          }}
        />
      </AbsoluteFill>
      {/* Wind */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, mixBlendMode: "screen" }}>
        {Array.from({ length: 36 }, (_, i) => {
          const a = random(`wd${i}-${Math.floor(f / 2)}`) * Math.PI * 2;
          const r0 = 300 + random(`wr${i}-${Math.floor(f / 2)}`) * 300;
          return (
            <line
              key={i}
              x1={960 + Math.cos(a) * r0}
              y1={540 + Math.sin(a) * r0}
              x2={960 + Math.cos(a) * 1500}
              y2={540 + Math.sin(a) * 1500}
              stroke="#ffffff"
              strokeWidth={2 + (i % 3) * 2}
              opacity={0.3 * t}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

const Fall: React.FC = () => {
  const f = useCurrentFrame();
  // Out of the real world's white, a burst of white as she leaves the portal,
  // and black on impact (eyes squeezed shut).
  const white = Math.max(interpolate(f, [0, 10], [1, 0], clamp), interpolate(f, [34, 40, 48], [0, 1, 0], clamp));
  const shake = f >= IMPACT ? 0 : interpolate(f, [IMPACT - 12, IMPACT], [0, 14], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${Math.sin(f * 2.7) * shake}px, ${Math.cos(f * 3.3) * shake}px)` }}>
        {f < 40 ? <Tunnel f={f} /> : f < IMPACT ? <Tumble f={f} /> : null}
      </AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: "#fff", opacity: white }} />
    </AbsoluteFill>
  );
};

// The realm theme, from 0:00, the moment she comes round: it fades in slowly
// and carries on unbroken into the Village (from DRONE_CARRY frames in),
// building all the way to Rowan explaining everything. Dips under Dyslexi.
const themeVolume = (f: number) => {
  const voiced = [{ from: WELCOME.at, dur: WELCOME.len }, ...LINES.filter((l) => l.voice)];
  const duck = Math.min(...voiced.map((l) => interpolate(f, [l.from - 6, l.from, l.from + l.dur, l.from + l.dur + 12], [1, 0.65, 0.65, 1], clamp)));
  return interpolate(f, [DRONE_IN, DRONE_IN + 600], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) }) * duck;
};

export const Arrival: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <Sequence durationInFrames={FALL} name="Fall through the portal">
      <Fall />
    </Sequence>
    <Sequence from={FALL} durationInFrames={WAKE_FRAMES} name="Waking in the aftermath">
      <Waking />
    </Sequence>

    {/* Sound: the portal, the wind of the fall, the hit, then the cold morning. */}
    <Sequence durationInFrames={45} name="🔊 portal">
      <Audio src={staticFile("sfx/summon.mp3")} volume={0.7} />
    </Sequence>
    <Sequence from={38} durationInFrames={IMPACT - 38} name="🔊 wind">
      <Audio src={staticFile("sfx/jump-whoosh.mp3")} volume={(t) => interpolate(t, [0, 6, IMPACT - 44, IMPACT - 38], [0.2, 0.6, 0.6, 0], clamp)} />
    </Sequence>
    <Sequence from={IMPACT - 3} durationInFrames={40} name="🔊 impact">
      <Audio src={staticFile("sfx/body-hit.mp3")} volume={1} />
    </Sequence>
    <Sequence from={IMPACT - 1} durationInFrames={60} name="🔊 impact boom">
      <Audio src={staticFile("sfx/staff-slam.mp3")} volume={(t) => interpolate(t, [0, 30, 60], [0.5, 0.5, 0], clamp)} />
    </Sequence>
    <Sequence from={FALL + DRONE_IN} durationInFrames={WAKE_FRAMES - DRONE_IN} name="♪ realm theme">
      <Audio src={staticFile("music/realm-theme.mp3")} volume={(t) => themeVolume(t + DRONE_IN)} />
    </Sequence>
    <Sequence from={FALL + BOOT} durationInFrames={50} name="🔊 reader detected">
      <Audio src={staticFile("sfx/ui-boot.mp3")} volume={0.45} />
    </Sequence>
    <Sequence from={FALL + STATUS.at} durationInFrames={50} name="🔊 status window">
      <Audio src={staticFile("sfx/ui-boot.mp3")} volume={0.55} />
    </Sequence>
    <Sequence from={FALL + WELCOME.at} durationInFrames={WELCOME.len} name="🗣 Dyslexi (unseen)">
      <Audio src={staticFile(WELCOME.voice)} volume={1} />
    </Sequence>
    {LINES.filter((l) => l.voice).map((l) => (
      <Sequence key={l.from} from={FALL + l.from} durationInFrames={l.dur} name="🗣 Dyslexi">
        <Audio src={staticFile(l.voice!)} volume={1} />
      </Sequence>
    ))}
    <Sequence from={FALL + XP_FULL} durationInFrames={30} name="🔊 level up (preview)">
      <Audio src={staticFile("sfx/ui-blip.mp3")} volume={0.6} />
    </Sequence>
    <Sequence from={FALL + WORD_BACK} durationInFrames={30} name="🔊 +1 word (preview)">
      <Audio src={staticFile("sfx/ui-blip.mp3")} volume={0.6} />
    </Sequence>
    <Sequence from={FALL} durationInFrames={WAKE_FRAMES} name="🔊 morning wind">
      <Audio src={staticFile("sfx/ambience.mp3")} volume={(t) => interpolate(t, [0, 40, WAKE_FRAMES - 30, WAKE_FRAMES], [0, 0.35, 0.35, 0.2], clamp)} />
    </Sequence>
  </AbsoluteFill>
);

// ---- The phone ------------------------------------------------------------

// 0 = out of sight below the frame, 1 = held up in front of her face.
const phoneLift = (f: number) =>
  track(
    f,
    [
      [PHONE.up, 0],
      [PHONE.rest, 1],
      [PHONE.down, 1],
      [PHONE.gone, 0],
    ],
    Easing.inOut(Easing.cubic),
  );

// She holds the phone out at arm's length for a selfie: the phone sits up
// and to the right, her right arm reaching to it from the bottom-right
// corner of the frame, her hand gripping its lower edge.
const U = 12; // one phone art pixel, same as a hand pixel at arm's length
const PH = { w: 20, h: 36, left: 1050, top: 290 };
const phoneTop = (lift: number) => PH.top + (1 - lift) * 960;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// A sleeve on a pixel grid, drawn row by row between a narrow end (wrist or
// shoulder, at y0) and a wide end nearer the camera (at y1). Both edges are
// straight lines, so the arm keeps its shape as it slants toward the lens.
const Arm: React.FC<{ y0: number; y1: number; l0: number; r0: number; l1: number; r1: number; g: number }> = ({ y0, y1, l0, r0, l1, r1, g }) => {
  const [sleeve, sleeveShade] = OUTFIT[HERO_LOOK.outfit];
  const snap = (v: number) => Math.round(v / g) * g;
  const rows: React.ReactNode[] = [];
  const steps = Math.max(2, Math.round((y1 - y0) / g));
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const y = snap(y0) + i * g;
    const x0 = snap(lerp(l0, l1, t));
    const x1 = snap(lerp(r0, r1, t));
    const shadeAt = snap(lerp(x0, x1, 0.7));
    rows.push(
      <rect key={`o${i}`} x={x0} y={y} width={x1 - x0} height={g} fill={OUTLINE} />,
      <rect key={`l${i}`} x={x0 + g} y={y} width={g} height={g} fill={SLEEVE_LIGHT} />,
      <rect key={`b${i}`} x={x0 + 2 * g} y={y} width={Math.max(0, shadeAt - x0 - 2 * g)} height={g} fill={sleeve} />,
      <rect key={`s${i}`} x={shadeAt} y={y} width={Math.max(0, x1 - g - shadeAt)} height={g} fill={sleeveShade} />,
    );
  }
  return (
    <svg width={1} height={1} overflow="visible" shapeRendering="crispEdges" style={{ position: "absolute", left: 0, top: 0 }}>
      {rows}
    </svg>
  );
};

const OUTLINE = "#21110d";
const SLEEVE_LIGHT = "#a37ad6";

const px = (x: number, y: number, w: number, h: number, fill: string) => <rect key={`${x},${y},${fill}`} x={x} y={y} width={w} height={h} fill={fill} />;

// Her right hand round the phone, the way a phone is held out for a selfie:
// palm flat against the back, so from her side only the edges show.
// Behind the phone: the heel of the hand and the hoodie cuff under its
// bottom edge. In front: three fingertips curling round the left edge and the
// thumb resting on the right edge. Drawn in phone art pixels.
const GripBehind: React.FC = () => {
  const [light, base, shade] = SKIN[HERO_LOOK.skin];
  return (
    <svg width={PH.w * U} height={PH.h * U} viewBox={`0 0 ${PH.w} ${PH.h}`} overflow="visible" shapeRendering="crispEdges" style={{ position: "absolute", inset: 0 }}>
      {/* Heel of the hand, peeking under the phone. */}
      {px(2, 33, 16, 6, OUTLINE)}
      {px(3, 33, 14, 5, base)}
      {px(3, 33, 2, 5, light)}
      {px(13, 33, 4, 5, shade)}
      {px(6, 37, 7, 1, shade)}
      {/* Wrist, then the ribbed cuff. */}
      {px(4, 38, 12, 2, OUTLINE)}
      {px(5, 38, 10, 2, base)}
      {px(12, 38, 3, 2, shade)}
      {px(3, 40, 14, 2, OUTLINE)}
      {[4, 6, 8, 10, 12, 14].map((x) => (
        <React.Fragment key={x}>
          {px(x, 40, 1, 2, SLEEVE_LIGHT)}
          {px(x + 1, 40, 1, 2, OUTFIT[HERO_LOOK.outfit][0])}
        </React.Fragment>
      ))}
    </svg>
  );
};

const GripFront: React.FC = () => {
  const [light, base, shade] = SKIN[HERO_LOOK.skin];
  const nail = "#f2cfc4";
  const fingertip = (y: number) => (
    <React.Fragment key={y}>
      {px(-3, y, 4, 4, OUTLINE)}
      {px(-2, y + 1, 3, 2, base)}
      {px(-2, y + 1, 1, 2, light)}
      {px(0, y + 1, 1, 2, shade)}
    </React.Fragment>
  );
  return (
    <svg width={PH.w * U} height={PH.h * U} viewBox={`0 0 ${PH.w} ${PH.h}`} overflow="visible" shapeRendering="crispEdges" style={{ position: "absolute", inset: 0 }}>
      {[17, 21, 25].map(fingertip)}
      {/* Thumb along the right edge, nail up. */}
      {px(17, 19, 5, 12, OUTLINE)}
      {px(18, 20, 3, 10, base)}
      {px(18, 20, 1, 10, light)}
      {px(20, 22, 1, 8, shade)}
      {px(18, 20, 2, 2, nail)}
      {px(18, 26, 2, 1, shade)}
    </svg>
  );
};

const Phone: React.FC<{ lift: number; cam: Cam }> = ({ lift, cam }) => {
  const f = useCurrentFrame();
  const top = phoneTop(lift) + Math.round(Math.sin(f / 15)) * U;
  const left = PH.left + Math.round(Math.sin(f / 23)) * U;
  const screen = { x: 2 * U, y: 3 * U, w: 16 * U, h: 29 * U };
  // Flip to the front camera: the screen squashes shut and opens on her.
  const flipK = interpolate(f, [PHONE.flip, PHONE.flip + 4, PHONE.flip + 8], [1, 0, 1], clamp);
  const selfie = f >= PHONE.flip + 4;
  const flash = f >= PHONE.snap ? interpolate(f, [PHONE.snap, PHONE.snap + 8], [1, 0], clamp) : 0;
  const pressFlip = f >= PHONE.flip - 4 && f < PHONE.flip + 2;
  const pressShutter = f >= PHONE.snap - 3 && f < PHONE.snap + 3;
  // On "I'm... 8-bit?!" she jumps, sprite style.
  const hopT = f - SQUARES.from;
  const hop = hopT >= 0 && hopT < 16 ? (Math.floor(hopT / 4) % 2 === 0 ? -2 : -1) * 7 : 0;
  // For the big reveal she pulls the phone in close, so her 8-bit face fills
  // the middle of the frame, then lets it drift back as she lowers it.
  const push = interpolate(f, [SQUARES.from - 40, SQUARES.from - 4, PHONE.down - 6, PHONE.gone - 8], [0, 1, 1, 0], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const mid = { x: PH.left + (PH.w * U) / 2, y: PH.top + (PH.h * U) / 2 };
  const closer = `translate(${(960 - mid.x) * push}px, ${(640 - mid.y) * push}px) scale(${1 + 0.75 * push})`;
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: PH.w * U,
        height: PH.h * U,
        transform: closer,
        transformOrigin: `${(PH.w * U) / 2}px ${(PH.h * U) / 2}px`,
      }}
    >
      {/* Forearm, foreshortened: it points almost straight at her, so it drops
          steeply from the wrist and widens fast toward the camera. */}
      <Arm y0={42 * U} y1={1180 - PH.top} l0={3 * U} r0={17 * U} l1={3 * U + 50} r1={17 * U + 400} g={U} />
      <GripBehind />
      <svg width={PH.w * U} height={PH.h * U} viewBox={`0 0 ${PH.w} ${PH.h}`} shapeRendering="crispEdges" style={{ position: "absolute", inset: 0 }}>
        <rect x={1} y={0} width={18} height={36} fill="#0c0e19" />
        <rect x={0} y={1} width={20} height={34} fill="#0c0e19" />
        <rect x={1} y={1} width={18} height={34} fill="#3b3456" />
        <rect x={1} y={1} width={1} height={33} fill="#5b5384" />
        <rect x={18} y={2} width={1} height={33} fill="#2a2440" />
        <rect x={8} y={1} width={4} height={1} fill="#0c0e19" />
        <rect x={13} y={1} width={1} height={1} fill="#4d7cc4" />
        <rect x={7} y={33} width={6} height={1} fill="#5b5384" />
      </svg>
      <GripFront />
      <div
        style={{
          position: "absolute",
          left: screen.x,
          top: screen.y,
          width: screen.w,
          height: screen.h,
          overflow: "hidden",
          background: "#000",
          transform: `scaleX(${Math.max(0.02, flipK)})`,
        }}
      >
        {selfie ? (
          <SelfieView hop={hop} cam={cam} w={screen.w} h={screen.h} />
        ) : (
          // Back camera: what she's looking at.
          <CameraFeed cam={cam} w={screen.w} h={screen.h} />
        )}
        {/* Camera UI */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: U * 1.5,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ fontFamily: PIXEL, fontSize: 11, color: C.gold }}>{selfie ? "SELFIE" : "PHOTO"}</div>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: U * 4, background: "rgba(0,0,0,0.35)" }}>
          <div
            style={{
              position: "absolute",
              left: screen.w / 2 - U * 1.5,
              top: U * 0.5,
              width: U * 3,
              height: U * 3,
              borderRadius: U * 1.5,
              background: pressShutter ? "#ccc" : "#fff",
              boxShadow: `0 0 0 ${U / 3}px #000, 0 0 0 ${(U * 2) / 3}px #fff`,
              transform: pressShutter ? "scale(0.85)" : undefined,
            }}
          />
          <div
            style={{
              position: "absolute",
              right: U,
              top: U * 1.1,
              fontFamily: PIXEL,
              fontSize: 18,
              color: pressFlip ? C.gold : "#fff",
              transform: pressFlip ? "scale(0.8)" : undefined,
            }}
          >
            ⟲
          </div>
        </div>
        <AbsoluteFill style={{ backgroundColor: "#fff", opacity: flash }} />
      </div>
    </div>
  );
};

// A live view of the realm from where Hero stands, cropped to the phone's
// portrait screen.
const CameraFeed: React.FC<{ cam: Cam; w: number; h: number }> = ({ cam, w, h }) => {
  const f = useCurrentFrame();
  const k = h / 1080;
  return (
    <div style={{ position: "absolute", left: (w - 1920 * k) / 2, top: 0, width: 1920, height: 1080, transform: `scale(${k})`, transformOrigin: "0 0" }}>
      <Pov cam={{ ...cam, horizon: 150 }} actors={worried(f)} sky="dawn" drain={DRAIN} scorch={SCORCH} />
    </div>
  );
};

// Front camera: the camera turns round, so behind her is the realm she
// woke up in, and in front of it is Hero's face in a tight selfie close-up.
// The arm holding the phone is out of frame; all that shows of it is her
// right shoulder lifting into the bottom-right corner (the preview is
// mirrored, like every front camera).
//
// Drawn in the sprite's own 48px cell coordinates over her sprite, in the
// outfit layer's colours. Her sprite fills x 16-32, y 22-42 of the cell.
const SELFIE_ARM: [number, number, number][] = [
  // [x, top, bottom] per column, outline rows included. The shoulder rises
  // toward the corner and runs off the bottom of the screen.
  [27, 37, 52],
  [28, 36, 52],
  [29, 36, 52],
  [30, 35, 52],
  [31, 35, 52],
  [32, 34, 52],
  [33, 34, 52],
];
const SPRITE_OUTFIT = { base: "#6e4aa4", shade: "#4e327c", light: "#a094ba", outline: "#000000" };

const SelfieArm: React.FC<{ scale: number }> = ({ scale }) => (
  <svg width={48 * scale} height={48 * scale} viewBox="0 0 48 48" overflow="visible" shapeRendering="crispEdges" style={{ position: "absolute", left: 0, top: 0 }}>
    {SELFIE_ARM.map(([x, t, b]) => (
      <React.Fragment key={x}>
        <rect x={x} y={t} width={1} height={b - t + 1} fill={SPRITE_OUTFIT.outline} />
        <rect x={x} y={t + 1} width={1} height={b - t - 1} fill={SPRITE_OUTFIT.base} />
        <rect x={x} y={t + 1} width={1} height={1} fill={SPRITE_OUTFIT.light} />
        <rect x={x} y={b - 2} width={1} height={2} fill={SPRITE_OUTFIT.shade} />
      </React.Fragment>
    ))}
  </svg>
);

// Tight on her face: the sides of her hair crop off the screen edges, her
// chin sits low, and the shoulder fills the bottom-right corner.
const SELFIE_SCALE = 14;
const SelfieView: React.FC<{ hop: number; cam: Cam; w: number; h: number }> = ({ hop, cam, w, h }) => {
  const s = SELFIE_SCALE;
  const left = Math.round(w * 0.47 - 24.5 * s);
  const top = Math.round(h * 0.03 - 22 * s);
  return (
    <AbsoluteFill>
      <CameraFeed cam={{ ...cam, heading: cam.heading + Math.PI }} w={w} h={h} />
      {/* Slight falloff so she reads in front of the background. */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 47% 35%, transparent 40%, rgba(18,11,28,0.35) 100%)" }} />
      <div style={{ position: "absolute", left, top: top + hop, width: 48 * s, height: 48 * s }}>
        <HeroSprite row={0} scale={s} animFps={5} />
        <SelfieArm scale={s} />
      </div>
    </AbsoluteFill>
  );
};

// Her real hand from the live-action shoot breaks into big pixel blocks and
// falls away, revealing the sprite hand underneath.
const RealHandDissolve: React.FC = () => {
  const f = useCurrentFrame();
  const cols = 16;
  const rows = 9;
  const cut = interpolate(f, [40, 70], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: f < 70 ? 1 : 0 }}>
        <Footage shot={REAL_HAND} volume={0} />
      </AbsoluteFill>
      {f >= 40 &&
        f < 80 &&
        Array.from({ length: cols * rows }, (_, i) => {
          const r = random(`rh${i}`);
          const on = r < cut * 1.2 && r > cut * 1.2 - 0.35;
          if (!on) return null;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: (i % cols) * 120,
                top: Math.floor(i / cols) * 120,
                width: 120,
                height: 120,
                background: [C.gold, C.cream, C.lilac, "#7ff0c4"][i % 4],
                opacity: 0.85,
              }}
            />
          );
        })}
    </AbsoluteFill>
  );
};
