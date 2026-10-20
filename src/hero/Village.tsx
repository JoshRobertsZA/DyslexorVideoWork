import React from "react";
import { Easing, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { Dialogue } from "../lore/parts";
import { BODY, C, PIXEL } from "../theme";
import { DRONE_CARRY, HERO_NAME, VILLAGE_FRAMES } from "./config";
import { linear, RealmTitle, track, walking } from "./parts";
import { Actor, Pov, fishingCol, idleCol, toScreen, walkCol } from "./realm/Pov";
import { DRAIN, HOUSE_Y, HOUSES, LAMPS, SCORCH, SPOTS } from "./realm/world";
import { HudPopup, Popup } from "./hud/Hud";

// Act 4. The morning after the attack. Hero walks the scorched, drained main
// path past startled townsfolk; the Blacksmith asks if she's the one Rowan
// called. Elder Rowan, hurt, makes his way down the path and Hero steps up to
// meet him. He thanks her and tells her what the Wizard took, the camera
// pushing in on him as he talks and looking at what he's talking about (the
// grey village, the row of game houses), and Hero answers him. It ends on the
// Rhyme Time house with her first quest.

// Where the Rhyme Time house is from where she stops, for the last look.
const RHYME = HOUSES.find((h) => h.id === "rhyme-time")!;
const MEET_Y = -405;
const HOUSE_HEADING = Math.atan2(RHYME.x, -(HOUSE_Y - MEET_Y));

// Rowan sets off down the path during the fisherman's line, so he's halfway
// to her by the time she turns back. Everything from his arrival on is
// `TIGHTEN` frames earlier than it used to be.
const TIGHTEN = 160;
// A slower walk than before, with room between the townsfolk's lines. She
// stops to let Rowan come down, then steps up to meet him as he arrives.
const posY = (f: number) =>
  linear(f, [
    [0, 140],
    [195, -40],
    [390, -230],
    [585, -330],
    [690, -380],
    [862 - TIGHTEN, -380],
    [900 - TIGHTEN, MEET_Y],
  ]);

const heading = (f: number) =>
  track(f, [
    [0, 0],
    [90, 0],
    [143, -0.6],
    [225, -0.6],
    [262, 0],
    [290, 0],
    [325, 0.6],
    [470, 0.6],
    [505, 0],
    [520, 0],
    [553, -0.75],
    [625, -0.75],
    [660, 0],
    // "...our colour and our stories fade.": she eases out of his close-up
    // and looks off across the grey village to the right, then back to him
    // for "So how can I help?". One way only, so he never sweeps across.
    [STORIES - 15, 0],
    [STORIES + 25, 0.85],
    [STORIES + 60, 0.85],
    [STORIES + 97, 0],
    // "These houses are training grounds.": the other way, to the Rhyme Time
    // house on the left, and back to him before the letters rise.
    [HOUSES_LOOK, 0],
    [HOUSES_LOOK + 35, -0.72],
    [HOUSES_LOOK + 70, -0.72],
    [HOUSES_LOOK + 100, 0],
    // After "Let's begin.", round to the Rhyme Time house.
    [QUEST_CARD.at - 30, 0],
    [QUEST_CARD.at + 8, HOUSE_HEADING],
  ]);

const horizon = (f: number) =>
  track(f, [
    [0, 120],
    [680, 120],
    [720, 122],
  ]);

// Each line plays its recorded take (public/voice); `reveal` types the text
// word by word with it ([frame, chars], from the Whisper word timings).
type Line = { from: number; dur: number; text: string; voice?: string; reveal?: [number, number][] };
export const BLACKSMITH: Line = {
  from: 330,
  dur: 172,
  text: "You... you fell out of the sky! Are you the one Elder Rowan called for?",
  // Panned right: he stands to the right of the path.
  voice: "voice/blacksmithvoiceline-right.mp3",
  reveal: [
    [0, 0],
    [25, 7],
    [33, 11],
    [41, 16],
    [49, 20],
    [52, 23],
    [56, 27],
    [69, 31],
    [93, 32],
    [97, 36],
    [102, 40],
    [107, 44],
    [113, 48],
    [125, 54],
    [138, 60],
    [146, 67],
    [159, 71],
  ],
};
// The townsfolk she passes, each spoken while she's turned toward them.
// Their takes are panned to the side they stand on (`pan`).
type NpcLine = Line & { who: string; color: string; pan: "left" | "right" };
export const NPC_LINES: NpcLine[] = [
  {
    from: 85,
    dur: 82,
    who: "Guard",
    color: "#9fb4ff",
    pan: "left",
    text: "Halt! Who... what are you?",
    voice: "voice/guard-line-left.mp3",
    reveal: [
      [0, 0],
      [13, 5],
      [29, 6],
      [32, 12],
      [47, 13],
      [57, 18],
      [64, 22],
      [73, 26],
    ],
  },
  {
    from: 200,
    dur: 80,
    who: "Farmer",
    color: "#9fd47a",
    pan: "left",
    text: "Look at her. She's still in colour!",
    voice: "voice/farmer-line-left.mp3",
    reveal: [
      [0, 0],
      [9, 5],
      [15, 8],
      [23, 12],
      [36, 13],
      [46, 19],
      [52, 25],
      [59, 28],
      [70, 35],
    ],
  },
  {
    from: 545,
    dur: 95,
    who: "Fisherman",
    color: "#7fd4e8",
    pan: "left",
    text: "Even the fish have gone quiet since last night.",
    voice: "voice/fisherman-line-left.mp3",
    reveal: [
      [0, 0],
      [10, 5],
      [15, 9],
      [26, 14],
      [33, 19],
      [40, 24],
      [52, 30],
      [61, 36],
      [71, 41],
      [83, 47],
    ],
  },
];

export const ROWAN_LINES: Line[] = [
  {
    from: 915 - TIGHTEN,
    dur: 118,
    // The reveal counts characters for HERO_NAME = "Hero".
    text: `You heard my call. Thank you for coming, ${HERO_NAME}.`,
    voice: "voice/rowan-village1.mp3",
    reveal: [
      [0, 0],
      [5, 4],
      [14, 10],
      [23, 13],
      [38, 18],
      [65, 19],
      [73, 25],
      [80, 29],
      [85, 33],
      [96, 40],
      [104, 41],
      [106, 46],
    ],
  },
  {
    from: 1060 - TIGHTEN,
    dur: 222,
    text: "The Dark Wizard stole every word in this realm. Without words, our colour and our stories fade.",
    voice: "voice/rowan-village2.mp3",
    reveal: [
      [0, 0],
      [4, 4],
      [13, 9],
      [24, 16],
      [38, 22],
      [50, 28],
      [62, 33],
      [70, 36],
      [75, 41],
      [86, 47],
      [123, 48],
      [125, 56],
      [142, 62],
      [158, 63],
      [162, 67],
      [172, 74],
      [181, 78],
      [187, 82],
      [201, 90],
      [214, 95],
    ],
  },
  {
    from: 1312 - TIGHTEN,
    dur: 166,
    text: "These houses are training grounds. Every game you clear brings words back.",
    voice: "voice/rowan-village3.mp3",
    reveal: [
      [0, 0],
      [9, 6],
      [23, 13],
      [32, 17],
      [43, 26],
      [63, 34],
      [85, 35],
      [92, 41],
      [102, 46],
      [109, 50],
      [120, 56],
      [131, 63],
      [143, 69],
      [158, 74],
    ],
  },
  {
    from: 1505 - TIGHTEN,
    dur: 148,
    text: "Walk up to a house, then press Play. Let's begin.",
    voice: "voice/rowan-village4.mp3",
    reveal: [
      [0, 0],
      [9, 5],
      [16, 8],
      [22, 11],
      [26, 13],
      [38, 19],
      [54, 20],
      [62, 25],
      [73, 31],
      [88, 36],
      [113, 37],
      [126, 43],
      [136, 49],
    ],
  },
];

// Where Village leaves the camera, so the next act starts from the same view.
export const VILLAGE_END = { x: 0, y: MEET_Y, heading: HOUSE_HEADING };

// Everyone is in the world from the very first frame of the Arrival, so
// nobody pops in. Rowan waits by the houses at the top of the path and makes
// his way down to meet Hero, slowly, stopping once to steady himself.
// `f` is a Village frame; the Arrival passes negative frames.
export const ROWAN_WAIT = { x: 0, y: -660 };
// He sets off as she passes the fisherman, reaches her at 725 and takes a
// breath before speaking. He stops to steady himself once she's looking.
export const ROWAN_WALK: [number, number] = [545, 885 - TIGHTEN];
export const ROWAN_STAGGER: [number, number] = [662, 686];
// Townsfolk startled as she passes (Village frames).
const NOTICE: { who: string; from: number; to: number }[] = [
  { who: "guard", from: 52, to: 169 },
  { who: "farmer", from: 65, to: 182 },
  { who: "merchant", from: 290, to: 420 },
  { who: "fisherman", from: 520, to: 640 },
];

// The path's lamps, `lit(i)` 0..1 for each (dark by default). A lit lamp keeps
// its colour through the drain.
export const lampActors = (lit: (i: number) => number = () => 0): Actor[] =>
  LAMPS.map((p, i) => ({ sheet: "lamp", x: p.x, y: p.y, row: 0, col: lit(i) > 0.5 ? 1 : 0, keep: lit(i) > 0.5 }));

export const villageActors = (f: number, lit?: (i: number) => number): Actor[] => {
  const half = (ROWAN_WAIT.y + SPOTS.rowan.y) / 2;
  const rowanY = linear(f, [
    [ROWAN_WALK[0], ROWAN_WAIT.y],
    [ROWAN_STAGGER[0], half],
    [ROWAN_STAGGER[1], half],
    [ROWAN_WALK[1], SPOTS.rowan.y],
  ]);
  const staggering = f >= ROWAN_STAGGER[0] && f < ROWAN_STAGGER[1];
  const rowanWalking = f >= ROWAN_WALK[0] && f < ROWAN_WALK[1] && !staggering;
  const turnedLeft = f >= VILLAGE_FRAMES - 40;
  const noticed = (who: string) => NOTICE.some((n) => n.who === who && f >= n.from && f < n.to);
  const people: Actor[] = [
    { sheet: "guard", ...SPOTS.guard, row: 1, col: idleCol(f) },
    { sheet: "farmer", ...SPOTS.farmer, row: 1, col: idleCol(f + 3), flip: true },
    { sheet: "merchant", ...SPOTS.merchant, row: 1, col: idleCol(f + 1) },
    { sheet: "blacksmith", ...SPOTS.blacksmith, row: 1, col: idleCol(f + 5), flip: true },
    { sheet: "fisherman", ...SPOTS.fisherman, row: 8, col: fishingCol(f), flip: true },
    {
      sheet: "rowan",
      x: ROWAN_WAIT.x,
      y: rowanY,
      row: staggering ? 9 : rowanWalking ? 3 : turnedLeft ? 1 : 0,
      col: staggering ? 0 : rowanWalking ? walkCol(f) : idleCol(f),
      flip: turnedLeft,
    },
  ];
  return [...people.map((a) => (noticed(a.sheet) ? { ...a, bubble: true } : a)), ...lampActors(lit)];
};

// The season's quest appears as Rowan says "Let's begin."
export const QUEST: Popup = { at: ROWAN_LINES[3].from + 113, kind: "quest", title: "Bring back the words", sub: "0 / 10 words restored", dur: 60 };

// ---- Rowan's demo -------------------------------------------------------------
// On "...brings words back.", a few golden letters rise out of Rowan's hands,
// circle once and burst, and colour floods back around him for a moment
// before the grey creeps back: a preview of what the games will do.

export const DEMO_LETTERS = "WORDS";
export const RESTORE = { from: ROWAN_LINES[2].from + 104, stagger: 6, rise: 30 };
export const burstAt = (n: number) => RESTORE.from + n * RESTORE.stagger + RESTORE.rise;

export const bloomK = (f: number) => {
  const done = burstAt(DEMO_LETTERS.length - 1);
  return interpolate(f, [done - 6, done + 10, done + 50, done + 100], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
};

const ReturningLetters: React.FC<{ f: number; cam: Parameters<typeof toScreen>[0] }> = ({ f, cam }) => {
  const hands = toScreen(cam, SPOTS.rowan.x, SPOTS.rowan.y, 14);
  return (
    <>
      {[...DEMO_LETTERS].map((ch, n) => {
        const t = (f - (RESTORE.from + n * RESTORE.stagger)) / RESTORE.rise;
        if (t < 0 || t > 1.5) return null;
        const p = Math.min(1, t);
        const a = (n / DEMO_LETTERS.length) * Math.PI * 2 + p * Math.PI * 1.5;
        const r = 30 + p * 110;
        const burst = t >= 1;
        return (
          <div
            key={n}
            style={{
              position: "absolute",
              left: hands.x + Math.cos(a) * r,
              top: hands.y - p * 170 + Math.sin(a) * r * 0.4,
              transform: `translate(-50%, -50%) scale(${burst ? 1 + (t - 1) * 5 : 0.6 + p * 0.4})`,
              fontFamily: PIXEL,
              fontSize: 38,
              color: C.gold,
              textShadow: `0 0 18px ${C.gold}, 0 0 36px #ffb24a`,
              opacity: burst ? 1 - (t - 1) / 0.5 : Math.min(1, t * 4),
            }}
          >
            {ch}
          </div>
        );
      })}
    </>
  );
};

// Rowan's theme: the soft, tender track comes in under his first line as the
// eerie drone fades out, dips under each line, swells with the colour bloom
// and with "I'll do it!", and carries on into the walk to the Rhyme Time
// house (Trial picks it up `THEME_CARRY` frames in).
export const THEME_IN = ROWAN_LINES[3].from - 30;
export const THEME_CARRY = VILLAGE_FRAMES - THEME_IN;
const themeVolume = (f: number) => {
  const duck = Math.min(
    ...ROWAN_LINES.map((l) => interpolate(f, [l.from - 6, l.from, l.from + l.dur, l.from + l.dur + 12], [1, 0.75, 0.75, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })),
  );
  const base = interpolate(f, [THEME_IN, THEME_IN + 75], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ending = interpolate(f, [ROWAN_LINES[3].from + ROWAN_LINES[3].dur, VILLAGE_FRAMES - 40], [0, 0.25], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // The track is mastered soft, so it runs near full volume to sit about
  // 10 dB under the voices.
  return Math.min(1, base * duck + 0.25 * bloomK(f) + ending);
};

// The realm theme, carried on unbroken from the Arrival (it started as she
// came round), still building: under the townsfolk, Rowan coming down the
// path and Rowan explaining everything, dipping under each line, and the
// colour bloom. It hands over to Rowan's theme on his last line.
const realmVolume = (f: number) => {
  const duck = Math.min(
    ...[...NPC_LINES, BLACKSMITH].map((l) =>
      interpolate(f, [l.from - 6, l.from, l.from + l.dur, l.from + l.dur + 12], [1, 0.75, 0.75, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    ),
    ...ROWAN_LINES.map((l) =>
      interpolate(f, [l.from - 6, l.from, l.from + l.dur, l.from + l.dur + 12], [1, 0.55, 0.55, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    ),
  );
  return interpolate(f, [THEME_IN, THEME_IN + 90], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * duck;
};

// The Village's lines (every take, with its word-by-word typing) and its
// sound bed, shared by the first-person Village and the anime re-cut.
// `quest` shows the small quest pop-up (the first-person Village has its own
// big quest card instead).
export const VillageDialogue: React.FC<{ f: number; quest?: boolean }> = ({ f, quest = true }) => (
  <>
    {NPC_LINES.map((l) => (
      <Dialogue key={l.from} speaker={l.who} text={l.text} t={f - l.from} dur={l.dur} color={l.color} reveal={l.reveal} readable />
    ))}
    {quest && <HudPopup t={f - QUEST.at} p={QUEST} />}
    <Dialogue speaker="Blacksmith" text={BLACKSMITH.text} t={f - BLACKSMITH.from} dur={BLACKSMITH.dur} color={C.peach} reveal={BLACKSMITH.reveal} readable />
    {ROWAN_LINES.map((l) => (
      <Dialogue key={l.from} speaker="Elder Rowan" text={l.text} t={f - l.from} dur={l.dur} reveal={l.reveal} readable />
    ))}
  </>
);

export const VillageSound: React.FC = () => (
  <>
    {/* The realm theme's quiet opening (from 0:00) under her walk in, the
        townsfolk's questions and Rowan coming down the path; it hands over to
        Rowan's theme as he speaks. */}
    <Sequence durationInFrames={THEME_IN + 90} name="♪ realm theme">
      <Audio src={staticFile("music/realm-theme.mp3")} trimBefore={DRONE_CARRY} volume={realmVolume} />
    </Sequence>
    <Sequence from={THEME_IN} durationInFrames={THEME_CARRY} name="♪ Rowan's theme">
      <Audio src={staticFile("music/rebirth-background-music.mp3")} volume={(t) => themeVolume(t + THEME_IN)} />
    </Sequence>
    {/* The Arrival's morning wind carries on underneath. */}
    <Sequence durationInFrames={VILLAGE_FRAMES} name="🔊 morning wind">
      <Audio src={staticFile("sfx/ambience.mp3")} loop volume={0.2} />
    </Sequence>
    <Sequence from={QUEST.at} durationInFrames={12} name="🔊 quest">
      <Audio src={staticFile("sfx/ui-blip.mp3")} volume={0.5} />
    </Sequence>
    <Sequence from={RESTORE.from - 6} durationInFrames={60} name="🔊 words return">
      <Audio src={staticFile("sfx/summon.mp3")} volume={0.45} />
    </Sequence>
    {[...NPC_LINES, BLACKSMITH, ...ROWAN_LINES]
      .filter((l) => l.voice)
      .map((l) => (
        <Sequence key={l.from} from={l.from} durationInFrames={l.dur + 15} name="🗣 voice">
          <Audio src={staticFile(l.voice!)} volume={1} />
        </Sequence>
      ))}
  </>
);

// ---- Staging Rowan (first-person Village only) ---------------------------------

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const [R1, R2, R3, R4] = ROWAN_LINES;
// "...our colour and our stories fade." in his second line.
const STORIES = R2.from + 125;
// "These houses are training grounds." is the start of his third.
const HOUSES_LOOK = R3.from;

// Hero answers, in her own box at the top, like in the Arrival.
const HERO_LINES: Line[] = [
  { from: NPC_LINES[0].from + NPC_LINES[0].dur + 1, dur: 40, text: "Um... hi?" },
  { from: BLACKSMITH.from + BLACKSMITH.dur, dur: 46, text: "Me? I... think so?" },
  { from: R1.from + R1.dur + 2, dur: 40, text: "Where... am I?" },
  { from: R2.from + R2.dur + 2, dur: 44, text: "So how can I help?" },
  { from: R3.from + R3.dur, dur: 40, text: "Whoa...!" },
  { from: R4.from + R4.dur + 2, dur: 50, text: "I'll do it!" },
];

// The lens: her eyes stay on Rowan and the view pushes in on him while he
// talks (higher focal = tighter), easing back out to look around the village
// and for the turn to the houses. 457 is the normal lens.
const WIDE = 457;
const lens = (f: number) =>
  track(f, [
    [R1.from - 10, WIDE],
    [R1.from + R1.dur, 650],
    [R2.from + 60, 690],
    // Easing wide for each look away, and partway back in on the way back.
    [STORIES - 15, 700],
    [STORIES + 25, WIDE],
    [STORIES + 60, WIDE],
    [STORIES + 97, 620],
    [HOUSES_LOOK, 620],
    [HOUSES_LOOK + 35, WIDE],
    [HOUSES_LOOK + 70, WIDE],
    [HOUSES_LOOK + 100, WIDE],
    [R4.from, WIDE],
    [R4.from + 100, 660],
    // Back out over "Let's begin." for the turn to the houses.
    [QUEST_CARD.at - 30, WIDE],
  ]);

// ---- The first quest -----------------------------------------------------------
// After "Let's begin." she says she'll do it, the camera turns to the Rhyme
// Time house and a quest marker bobs over it.
const QUEST_CARD = { at: R4.from + R4.dur + 30 };

const QuestMarker: React.FC<{ f: number; cam: Parameters<typeof toScreen>[0] }> = ({ f, cam }) => {
  const k = interpolate(f, [QUEST_CARD.at - 4, QUEST_CARD.at + 8], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
  if (k <= 0) return null;
  const s = toScreen(cam, RHYME.x, HOUSE_Y, 70);
  // Big enough to spot from down the path.
  const size = Math.max(110, Math.min(150, s.px * 12));
  return (
    <div
      style={{
        position: "absolute",
        left: s.x,
        top: s.y - Math.abs(Math.sin(f / 7)) * 16,
        transform: `translate(-50%, -100%) scale(${k})`,
        fontFamily: BODY,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1,
        color: C.gold,
        textShadow: `0 0 18px ${C.gold}, 0 0 40px #ffb24a, 4px 4px 0 #000`,
      }}
    >
      !
    </div>
  );
};

export const Village: React.FC = () => {
  const f = useCurrentFrame();
  const w = walking(f, posY);
  const step = Math.sin((f / 30) * Math.PI * 4);
  // Pushing in, she also bends down to his level (a lower eye), so his face
  // sits mid-frame above the dialogue box with the houses behind him.
  const push = (lens(f) - WIDE) / 300;
  const cam = {
    x: 0,
    y: posY(f),
    heading: heading(f) + Math.sin(f / 18) * 0.01 * w,
    eye: 26 - 12 * push + step * 0.7 * w,
    // ...and the view drops a little so his hat stays in frame.
    horizon: horizon(f) + 40 * push + step * 2 * w,
    focal: lens(f),
  };
  return (
    <Pov cam={cam} actors={villageActors(f)} sky="dawn" drain={DRAIN} scorch={SCORCH} glow={{ "rhyme-time": 0 }} bloom={{ x: SPOTS.rowan.x, y: SPOTS.rowan.y, r: 80, k: bloomK(f) }}>
      <ReturningLetters f={f} cam={cam} />
      <QuestMarker f={f} cam={cam} />
      <RealmTitle opacity={interpolate(f, [40, 70], [1, 0], clamp)} />
      <VillageDialogue f={f} quest={false} />
      {HERO_LINES.map((l) => (
        <Dialogue key={l.from} speaker={HERO_NAME} text={l.text} t={f - l.from} dur={l.dur} color={C.lilac} at="top" readable />
      ))}
      <VillageSound />
    </Pov>
  );
};
