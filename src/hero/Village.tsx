import React from "react";
import { interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { Dialogue } from "../lore/parts";
import { C, PIXEL } from "../theme";
import { DRONE_CARRY, HERO_NAME, VILLAGE_FRAMES } from "./config";
import { linear, RealmTitle, track, walking } from "./parts";
import { Actor, Pov, fishingCol, idleCol, toScreen, walkCol } from "./realm/Pov";
import { DRAIN, SCORCH, SPOTS } from "./realm/world";
import { HudPopup, Popup } from "./hud/Hud";

// Act 4. The morning after the attack. Hero walks the scorched, drained main
// path past startled townsfolk; the Blacksmith asks if she's the one Rowan
// called. Elder Rowan, hurt, makes his way down the path to thank her and
// tell her what the Wizard took, and what the games are for.

// A slower walk than before, with room between the townsfolk's lines.
const posY = (f: number) =>
  linear(f, [
    [0, 140],
    [195, -40],
    [390, -230],
    [585, -330],
    [690, -380],
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
    [710, 0],
    [735, 0.3],
    [780, 0.3],
    [810, 0],
    [VILLAGE_FRAMES - 45, 0],
    [VILLAGE_FRAMES, -0.4],
  ]);

const horizon = (f: number) =>
  track(f, [
    [0, 120],
    [710, 120],
    [740, 112],
    [780, 112],
    [815, 122],
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
    from: 915,
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
    from: 1060,
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
    from: 1312,
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
    from: 1505,
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
export const VILLAGE_END = { x: 0, y: -380, heading: -0.4 };

// Everyone is in the world from the very first frame of the Arrival, so
// nobody pops in. Rowan waits by the houses at the top of the path and makes
// his way down to meet Hero, slowly, stopping once to steady himself.
// `f` is a Village frame; the Arrival passes negative frames.
export const ROWAN_WAIT = { x: 0, y: -660 };
// He reaches her at 885 and takes a breath before speaking.
export const ROWAN_WALK: [number, number] = [705, 885];
export const ROWAN_STAGGER: [number, number] = [777, 801];
// Townsfolk startled as she passes (Village frames).
const NOTICE: { who: string; from: number; to: number }[] = [
  { who: "guard", from: 52, to: 169 },
  { who: "farmer", from: 65, to: 182 },
  { who: "merchant", from: 290, to: 420 },
  { who: "fisherman", from: 520, to: 640 },
];

export const villageActors = (f: number): Actor[] => {
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
  return people.map((a) => (noticed(a.sheet) ? { ...a, bubble: true } : a));
};

// The season's quest appears as Rowan says "Let's begin."
export const QUEST: Popup = { at: ROWAN_LINES[3].from + 113, kind: "quest", title: "Bring back the words", sub: "0 / 5,000 words restored", dur: 60 };

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

const droneVolume = (f: number) => {
  const duck = Math.min(
    ...[...NPC_LINES, BLACKSMITH, ...ROWAN_LINES].map((l) =>
      interpolate(f, [l.from - 6, l.from, l.from + l.dur, l.from + l.dur + 12], [1, 0.4, 0.4, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    ),
  );
  return interpolate(f, [VILLAGE_FRAMES - 60, VILLAGE_FRAMES], [0.5, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * duck;
};

// The Village's lines (every take, with its word-by-word typing) and its
// sound bed, shared by the first-person Village and the anime re-cut.
export const VillageDialogue: React.FC<{ f: number }> = ({ f }) => (
  <>
    {NPC_LINES.map((l) => (
      <Dialogue key={l.from} speaker={l.who} text={l.text} t={f - l.from} dur={l.dur} color={l.color} reveal={l.reveal} />
    ))}
    <HudPopup t={f - QUEST.at} p={QUEST} />
    <Dialogue speaker="Blacksmith" text={BLACKSMITH.text} t={f - BLACKSMITH.from} dur={BLACKSMITH.dur} color={C.peach} reveal={BLACKSMITH.reveal} />
    {ROWAN_LINES.map((l) => (
      <Dialogue key={l.from} speaker="Elder Rowan" text={l.text} t={f - l.from} dur={l.dur} reveal={l.reveal} />
    ))}
  </>
);

export const VillageSound: React.FC = () => (
  <>
    {/* The Arrival's mystery drone carries on, dipping under every line. */}
    <Sequence durationInFrames={VILLAGE_FRAMES} name="♪ mystery">
      <Audio src={staticFile("music/mystery-drone.mp3")} trimBefore={DRONE_CARRY} volume={droneVolume} />
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

export const Village: React.FC = () => {
  const f = useCurrentFrame();
  const w = walking(f, posY);
  const step = Math.sin((f / 30) * Math.PI * 4);
  const cam = {
    x: 0,
    y: posY(f),
    heading: heading(f) + Math.sin(f / 18) * 0.01 * w,
    eye: 26 + step * 0.7 * w,
    horizon: horizon(f) + step * 2 * w,
  };
  return (
    <Pov cam={cam} actors={villageActors(f)} sky="dawn" drain={DRAIN} scorch={SCORCH} bloom={{ x: SPOTS.rowan.x, y: SPOTS.rowan.y, r: 80, k: bloomK(f) }}>
      <ReturningLetters f={f} cam={cam} />
      <RealmTitle opacity={interpolate(f, [40, 70], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      <VillageDialogue f={f} />
      <VillageSound />
    </Pov>
  );
};
