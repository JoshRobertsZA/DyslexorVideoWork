import React from "react";
import { AbsoluteFill, Easing, interpolate, random, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { Dialogue } from "../lore/parts";
import { BODY, C, PIXEL } from "../theme";
import { Actor, Cam, idleCol, Pov, toScreen, walkCol } from "./realm/Pov";
import { lampActors } from "./Village";

// "Next time": the Episode 2 preview, after the pilot's end credits. Night in
// the realm. Hero sits by a campfire with Rowan and the townsfolk, on logs,
// the fire's sparks rising as letters while Rowan tells the old stories. Then
// everything stops: the fire turns purple and hangs still, the lamps die,
// the colour drains and everyone freezes mid-laugh, everyone but her. A voice
// behind her, one she knows: the boy from her class, in his red hoodie, at
// the edge of the firelight (the Wizard's apprentice, from the Lair). He
// tells her to go home while she still can (what the Wizard told him). Three knocks,
// the Wizard's, as on the night of the attack, and black.
//
// The lines are text only for now, timed to be read comfortably, until
// they're recorded.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ---- Beats -----------------------------------------------------------------------

const UP = { from: 0, to: 40 };
const LAUGH = { from: 1050, to: 1090 };
const FREEZE = 1110;
const LAMPS_OUT = FREEZE + 24;
const LOOK = { from: FREEZE + 50, to: FREEZE + 150 };
// The voice behind her (a laugh, then her name), then the turn: a glance over
// her shoulder, a frozen beat, and the slow rest of the way round, her heart
// going. He's out in the dark at first and only steps into the light once
// she's looking.
const WHISPER = FREEZE + 170;
const GLANCE = { from: WHISPER + 108, to: WHISPER + 150, to_: 0.45 };
const TURN = { from: WHISPER + 210, to: WHISPER + 345 };
const STEP = { from: WHISPER + 375, to: WHISPER + 455 };
const KNOCKS = [WHISPER + 745, WHISPER + 777, WHISPER + 809];
const BLACK = KNOCKS[2] + 2;
export const NEXT_TIME_FRAMES = BLACK + 45;

// The recorded takes (public/voice, from voice/newvoices, loudness-matched);
// `reveal` types each line with its take ([frame, chars], from the Whisper
// word timings). Hero's line is text only until it's recorded.
type Who = "rowan" | "farmer" | "hero" | "boy";
type Line = { from: number; dur: number; who: Who; text: string; voice?: string; reveal?: [number, number][] };
const LINES: Line[] = [
  { from: 100, dur: 275, who: "rowan", text: "...and every night, before the evil Wizard came, we'd sit right here and tell the old stories.", voice: "voice/campfire-rowan1.mp3", reveal: [[0, 0], [43, 7], [54, 13], [67, 20], [76, 20], [86, 27], [92, 31], [104, 36], [113, 43], [128, 49], [146, 49], [152, 54], [158, 58], [169, 64], [185, 69], [200, 73], [212, 78], [220, 82], [233, 86], [256, 94]] },
  { from: 390, dur: 90, who: "farmer", text: "Tell her about the three houses, Elder Rowan!", voice: "voice/campfire-farmer.mp3", reveal: [[0, 0], [10, 5], [16, 9], [22, 15], [28, 19], [34, 25], [48, 33], [59, 39], [73, 45]] },
  { from: 495, dur: 225, who: "rowan", text: "Three houses. Three lessons. One is awake again... thanks to you.", voice: "voice/campfire-rowan2.mp3", reveal: [[0, 0], [13, 6], [28, 14], [52, 14], [62, 20], [79, 29], [108, 29], [118, 33], [131, 36], [143, 42], [160, 51], [172, 51], [185, 58], [198, 61], [208, 65]] },
  { from: 735, dur: 165, who: "rowan", text: "Bring the words back, child, and the door home will open.", voice: "voice/campfire-rowan3.mp3", reveal: [[0, 0], [8, 6], [15, 10], [26, 16], [39, 22], [52, 22], [56, 29], [77, 29], [83, 33], [88, 37], [97, 42], [115, 47], [131, 52], [146, 57]] },
  { from: 915, dur: 135, who: "rowan", text: "Nothing worth doing is ever easy, little one.", voice: "voice/campfire-rowan4.mp3", reveal: [[0, 0], [13, 8], [23, 14], [40, 20], [50, 23], [64, 28], [85, 34], [101, 34], [103, 41], [116, 45]] },
  { from: FREEZE + 70, dur: 80, who: "hero", text: "Rowan...? Everyone?" },
  { from: WHISPER, dur: 125, who: "boy", text: "Ha ha ha ha ha! Hey, Hero!", voice: "voice/apprentice-hey.mp3", reveal: [[0, 0], [71, 15], [78, 16], [92, 21], [101, 21], [106, 26]] },
  { from: WHISPER + 465, dur: 125, who: "boy", text: "I know you. Second row. By the window.", voice: "voice/apprentice-know-you.mp3", reveal: [[0, 0], [14, 2], [25, 7], [44, 12], [58, 12], [70, 19], [81, 24], [93, 27], [97, 31], [106, 38]] },
  { from: WHISPER + 605, dur: 120, who: "boy", text: "Go home while you still can. He's coming.", voice: "voice/apprentice-go-home.mp3", reveal: [[0, 0], [14, 3], [26, 8], [34, 14], [41, 18], [49, 24], [66, 29], [83, 29], [91, 34], [101, 41]] },
];
const SPEAKER: Record<Who, string> = { rowan: "Elder Rowan", farmer: "Farmer", hero: "Hero", boy: "???" };
const TAG: Record<Who, string> = { rowan: C.gold, farmer: C.grass, hero: C.lilac, boy: "#c9a8ff" };
const speaking = (f: number, who: Who) => LINES.some((l) => l.who === who && f >= l.from && f < l.from + l.dur - 20);

// Time in the realm stops at FREEZE (the fire, the sparks, everyone).
const still = (f: number) => Math.min(f, FREEZE);

// ---- Where things are ----------------------------------------------------------

// On the grass to the right of the main path (inside the open corridor the
// trees keep clear of it). Hero sits facing north across the fire; the
// townsfolk sit in pairs on three logs round its far side.
const HERO = { x: 82, y: -4 };
const FIRE = { x: 82, y: -60 };
const AROUND: Record<string, { x: number; y: number }> = {
  fisherman: { x: 35, y: -96 },
  farmer: { x: 52, y: -96 },
  rowan: { x: 72, y: -114 },
  merchant: { x: 94, y: -114 },
  blacksmith: { x: 112, y: -96 },
  guard: { x: 129, y: -96 },
};
// The logs, one per pair, just behind them. The sheets have no sitting pose,
// so they're raised to perch on top, feet dangling in front.
const LOGS = [
  { x: 44, y: -98 },
  { x: 83, y: -116 },
  { x: 120, y: -98 },
];
const SEAT = 4;
// The boy, behind her: out in the dark, then stepping to the edge of the firelight.
const BOY = { x: 86, from: 120, to: 72 };

// ---- The camera ------------------------------------------------------------------

const camAt = (f: number): Cam => {
  const glance = interpolate(f, [GLANCE.from, GLANCE.to], [0, GLANCE.to_], { ...clamp, easing: Easing.out(Easing.quad) });
  const turn = glance + interpolate(f, [TURN.from, TURN.to], [0, Math.PI - GLANCE.to_], { ...clamp, easing: Easing.inOut(Easing.sin) });
  // Frozen with fear from the whisper until she's round: a held-breath
  // tremble, eyes dropping as she turns, lifting once she's facing him.
  const afraid = interpolate(f, [WHISPER, WHISPER + 20, STEP.to, STEP.to + 40], [0, 1, 1, 0.3], clamp);
  const tremble = afraid * (Math.sin(f * 0.9) * 0.004 + Math.sin(f * 2.3) * 0.002);
  const drop = interpolate(f, [TURN.from, TURN.from + 60, TURN.to, TURN.to + 50], [0, 14, 14, 0], { ...clamp, easing: Easing.inOut(Easing.sin) });
  // Looking about for the others (left, right) once they've frozen.
  const look = interpolate(f, [LOOK.from, LOOK.from + 25, LOOK.from + 55, LOOK.to], [0, -0.16, 0.14, 0], { ...clamp, easing: Easing.inOut(Easing.sin) });
  // A slow push into the circle, and later on the boy.
  const push = interpolate(f, [UP.from, FREEZE], [457, 500], clamp) + interpolate(f, [STEP.from, KNOCKS[0]], [0, 70], { ...clamp, easing: Easing.inOut(Easing.quad) });
  // Breathing, until everything stops; then quick and shallow once she's afraid.
  const breath = f < FREEZE ? Math.sin(f / 40) * 1.5 : Math.sin(f / 9) * 1.2 * afraid;
  let shake = 0;
  for (const k of KNOCKS) if (f >= k && f < k + 12) shake += (1 - (f - k) / 12) * (k === KNOCKS[2] ? 6 : 4);
  return {
    x: HERO.x + Math.sin(f * 2.3) * shake * 0.4,
    y: HERO.y,
    heading: turn + look + tremble,
    eye: 14,
    horizon: 128 + breath + drop + Math.cos(f * 3.1) * shake,
    focal: push,
  };
};

// ---- People ------------------------------------------------------------------------

const boyY = (f: number) => interpolate(f, [STEP.from, STEP.to], [BOY.from, BOY.to], { ...clamp, easing: Easing.inOut(Easing.quad) });

const actorsAt = (f: number): Actor[] => {
  const t = still(f);
  const laughing = f >= LAUGH.from && f < FREEZE;
  const people: Actor[] = Object.entries(AROUND).map(([who, at], i) => ({
    sheet: who as Actor["sheet"],
    ...at,
    row: 0,
    col: idleCol(t + i * 3),
    // Whoever's talking; everyone laughs at the end, and freezes mid-laugh.
    bubble: (["rowan", "farmer"].includes(who) && speaking(f, who as Who)) || laughing,
    lift: SEAT,
  }));
  // The boy, in colour when the rest has drained.
  const boy: Actor[] =
    f >= FREEZE
      ? [{ sheet: "classmate", x: BOY.x, y: boyY(f), row: 0, col: f >= STEP.from && f < STEP.to ? walkCol(f) : idleCol(f), keep: true }]
      : [];
  const logs: Actor[] = LOGS.map((l) => ({ sheet: "log", ...l, row: 0, col: 0 }));
  const lamps = lampActors((i) => (f < LAMPS_OUT + (9 - i) * 5 ? 1 : 0));
  return [...logs, ...people, ...boy, ...lamps];
};

// ---- The fire ----------------------------------------------------------------------

const WARM = ["#fff3b0", "#f6c945", "#f4a259", "#e2572e"];
const COLD = ["#f3e6ff", "#c77dff", "#7a3cff", "#3b1f5f"];
// 0 warm, 1 purple: it turns as everything stops.
const purple = (f: number) => (f >= FREEZE ? 1 : 0);
// How big the flames burn: down to a gutter at the freeze, flaring at each knock.
const burn = (f: number) => {
  let k = interpolate(f, [FREEZE - 6, FREEZE + 10], [1, 0.6], clamp);
  for (const n of KNOCKS) k += interpolate(f - n, [0, 3, 22], [0, 0.6, 0], clamp);
  return k;
};

// Flames in art pixels (16 wide), from a bell-shaped profile that flickers at
// 8 fps (pixel art), on a few logs.
const Fire: React.FC<{ f: number; cam: Cam }> = ({ f, cam }) => {
  const s = toScreen(cam, FIRE.x, FIRE.y);
  if (s.d < 6) return null;
  const t = Math.floor(still(f) / 4);
  const pal = purple(f) ? COLD : WARM;
  const k = burn(f);
  const cols = Array.from({ length: 16 }, (_, c) => {
    const bell = Math.exp(-(((c - 7.5) / 4.2) ** 2));
    return Math.round(bell * 18 * k * (0.7 + 0.3 * random(`fl${c}-${t}`)));
  });
  return (
    <svg
      width={16 * s.px}
      height={24 * s.px}
      viewBox="0 0 16 24"
      shapeRendering="crispEdges"
      style={{ position: "absolute", left: s.x - 8 * s.px, top: s.y - 22 * s.px, filter: `drop-shadow(0 0 ${s.px * 3}px ${pal[1]})` }}
    >
      {cols.map((h, c) =>
        Array.from({ length: h }, (_, y) => {
          const u = y / Math.max(1, h);
          const color = u < 0.35 ? pal[0] : u < 0.6 ? pal[1] : u < 0.85 ? pal[2] : pal[3];
          return <rect key={`${c}-${y}`} x={c} y={21 - y} width={1} height={1} fill={color} />;
        }),
      )}
      {/* Logs */}
      <rect x={1} y={21} width={14} height={2} fill="#4a2e1c" />
      <rect x={3} y={20} width={4} height={1} fill="#6b4329" />
      <rect x={9} y={22} width={5} height={1} fill="#2e1c12" />
    </svg>
  );
};

// Sparks rising off the fire as letters (the realm's words); they hang in the
// air when time stops.
const Embers: React.FC<{ f: number; cam: Cam }> = ({ f, cam }) => {
  const s = toScreen(cam, FIRE.x, FIRE.y);
  if (s.d < 6) return null;
  const t = still(f);
  const pal = purple(f) ? COLD : WARM;
  return (
    <>
      {Array.from({ length: 16 }, (_, i) => {
        const period = 70 + random(`ep${i}`) * 60;
        const u = ((t + random(`eo${i}`) * period) % period) / period;
        const x = s.x + (random(`ex${i}`) - 0.5) * 10 * s.px + Math.sin(u * 6 + i) * 3 * s.px;
        const y = s.y - (6 + u * 46) * s.px;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: "translate(-50%, -50%)",
              fontFamily: PIXEL,
              fontSize: Math.max(10, s.px * 2.4),
              color: pal[1],
              textShadow: `0 0 ${s.px * 1.5}px ${pal[2]}`,
              opacity: Math.sin(u * Math.PI) * 0.9,
            }}
          >
            {String.fromCharCode(65 + Math.floor(random(`el${i}`) * 26))}
          </div>
        );
      })}
    </>
  );
};

// The night, and the firelight it's lit by: a pool of light round the fire,
// following it round as she turns (from behind her, it lights what's in front).
const Light: React.FC<{ f: number; cam: Cam }> = ({ f, cam }) => {
  const rel = Math.atan2(FIRE.x - cam.x, -(FIRE.y - cam.y)) - cam.heading;
  const ahead = toScreen({ ...cam, heading: Math.atan2(FIRE.x - cam.x, -(FIRE.y - cam.y)) }, FIRE.x, FIRE.y);
  const x = 960 + Math.sin(rel) * 1500;
  const y = ahead.y - 120 + (1 - Math.cos(rel)) * 300;
  const flick = still(f) < FREEZE ? 1 + 0.04 * Math.sin(f / 2.3) + 0.03 * Math.sin(f / 1.3) : 1;
  // Wider when its behind her, so it reaches what she turns to.
  const r = 1000 * flick * (0.75 + 0.25 * burn(f)) * (1 + 0.2 * (1 - Math.cos(rel)));
  const glow = purple(f) ? "150,80,255" : "255,160,70";
  return (
    <>
      <AbsoluteFill style={{ background: `radial-gradient(circle ${r}px at ${x}px ${y}px, rgba(4,6,20,0) 0%, rgba(6,8,26,0.45) 45%, rgba(3,4,14,0.9) 100%)` }} />
      <AbsoluteFill style={{ mixBlendMode: "screen", background: `radial-gradient(circle ${r * 0.6}px at ${x}px ${y}px, rgba(${glow},0.32), transparent 100%)` }} />
    </>
  );
};

// ---- Sound -------------------------------------------------------------------------

// The music dips under each recorded line.
const duck = (f: number) =>
  Math.min(1, ...LINES.filter((l) => l.voice).map((l) => interpolate(f, [l.from - 6, l.from, l.from + l.dur, l.from + l.dur + 12], [1, 0.6, 0.6, 1], clamp)));

const NextTimeSound: React.FC = () => {
  const sfx = (name: string, from: number, volume: number, dur: number) => (
    <Sequence key={`${name}-${from}`} from={from} durationInFrames={dur} name={`🔊 ${name}`}>
      <Audio src={staticFile(`sfx/${name}.mp3`)} volume={volume} />
    </Sequence>
  );
  return (
    <>
      {/* The fire and the realm's theme, both cut dead when time stops */}
      <Sequence durationInFrames={FREEZE} name="🔊 campfire">
        <Audio src={staticFile("sfx/campfire.mp3")} volume={(t) => interpolate(t, [0, 40], [0, 0.2], clamp)} />
      </Sequence>
      <Sequence from={UP.from} durationInFrames={FREEZE - UP.from} name="♪ realm theme (by the fire)">
        <Audio src={staticFile("music/background-music.mp3")} volume={(t) => interpolate(t, [0, 60], [0, 0.32], clamp) * duck(t + UP.from)} />
      </Sequence>
      {sfx("shockwave", FREEZE - 2, 0.35, 60)}
      {Array.from({ length: 10 }, (_, i) => sfx("ui-blip", LAMPS_OUT + i * 5, 0.1, 8))}
      {/* Her heart, from the whisper until he's in the light */}
      <Sequence from={WHISPER + 10} durationInFrames={STEP.to - WHISPER} name="🔊 heartbeat">
        <Audio src={staticFile("sfx/heartbeat.mp3")} volume={(t) => interpolate(t, [0, 30, STEP.to - WHISPER - 50, STEP.to - WHISPER], [0, 0.55, 0.7, 0], clamp)} />
      </Sequence>
      <Sequence from={FREEZE + 10} durationInFrames={BLACK - FREEZE - 10} name="♪ mystery">
        <Audio src={staticFile("music/mystery-drone.mp3")} volume={(t) =>
            interpolate(t + FREEZE + 10, [FREEZE + 10, FREEZE + 100, WHISPER, TURN.from, STEP.from, STEP.to + 30], [0, 0.3, 0.3, 0.12, 0.12, 0.38], clamp)
          }
        />
      </Sequence>
      {LINES.filter((l) => l.voice).map((l) => (
        <Sequence key={`voice-${l.from}`} from={l.from} durationInFrames={l.dur + 15} name="🗣 voice">
          <Audio src={staticFile(l.voice!)} volume={1} />
        </Sequence>
      ))}
      {/* The Wizard's three knocks, as on the night of the attack */}
      {KNOCKS.map((k, i) => sfx("staff-slam", k, i === 2 ? 0.75 : 0.55, i === 2 ? 40 : 24))}
    </>
  );
};

// ---- The scene ---------------------------------------------------------------------

export const NextTime: React.FC = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const up = interpolate(f, [UP.from, UP.to], [0, 1], clamp);
  // The colour drains out of the world as it stops (all but the boy).
  const drain = interpolate(f, [FREEZE, FREEZE + 40], [0, 0.7], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {f >= UP.from && f < BLACK && (
        <AbsoluteFill style={{ opacity: up }}>
          <Pov cam={cam} actors={actorsAt(f)} sky="night" drain={drain} glow={{ "rhyme-time": 0.9 }}>
            <Light f={f} cam={cam} />
            <Fire f={f} cam={cam} />
            <Embers f={f} cam={cam} />
            {LINES.map((l) => (
              <Dialogue key={l.from} speaker={SPEAKER[l.who]} text={l.text} t={f - l.from} dur={l.dur} color={TAG[l.who]} reveal={l.reveal} readable />
            ))}
          </Pov>
        </AbsoluteFill>
      )}
      <NextTimeSound />
    </AbsoluteFill>
  );
};
