import React from "react";
import { AbsoluteFill, Easing, interpolate, random, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { Dialogue } from "../lore/parts";
import { BODY, C } from "../theme";
import { ACCENT, HERO_NAME, VILLAGE_FRAMES } from "./config";
import { linear } from "./parts";
import { DYSLEXI_COLOR, DyslexiBuddy } from "./hud/Dyslexi";
import { Cam, Pov, idleCol, toScreen, towerWindow, walkCol } from "./realm/Pov";
import { DRAIN, HOUSE_Y, HOUSES, LAMPS, SCORCH } from "./realm/world";
import { Hand } from "./Tower";
import { THEME_CARRY, VILLAGE_END, villageActors } from "./Village";

// The pilot's game (docs/SEASON-1.md). First person, straight on from the
// Village. Hero walks up to the Rhyme Time house with Dyslexi back at her
// shoulder. "Go on, open the door!" The moment she steps through it, it
// teleports her into the cockpit seat of a spaceship in a launch bay under
// the house. The shutters slide open on the
// bay wall; it launches up the silo and out through the glowing ring in
// front of the house, and out of the windshield is Rhyme Time as it is in
// the app (the purple night sky, the stars, the planet), with the game on
// the glass ("Which word rhymes with…", the four answers, the three dots).
// She gets CAT wrong first, Dyslexi shows her how to listen to the end of a
// word, and she gets the rest (BALL, BEE). The stars gather into the word
// she won, LIGHT; she sounds it out, it bursts, and she flies it home: in
// low over the village as the colour floods back, down the silo, docked.
// She steps back out of the front door as the dead lamps down the path
// relight one by one and everyone cheers.
//
// Dyslexi's, Hero's and the farmer's lines here are text only for now, timed
// to be read comfortably, until they're recorded.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ---- Where things are ----------------------------------------------------------

const RHYME = HOUSES.find((h) => h.id === "rhyme-time")!;
// The 3D house's door (house3d.ts: front texture columns 34–48, rows 30–54).
const HS = 1.35;
const DOOR_X0 = RHYME.x - 30 * HS + 34 * HS;
const DOOR_X1 = RHYME.x - 30 * HS + 49 * HS;
const DOOR_H = 25 * HS;
// The door leaf itself, inside its frame and under its lintel (texture
// columns 37–46, rows 37–53): the part that swings open.
const LEAF_X0 = DOOR_X0 + 3 * HS;
const LEAF_X1 = DOOR_X0 + 13 * HS;
const LEAF_Z0 = 1 * HS;
const LEAF_Z1 = 18 * HS;
const DOOR_MID = (DOOR_X0 + DOOR_X1) / 2;
// The ring in front of the house, and right up at the door.
const RING = { x: RHYME.x, y: -664 };
// Where she stops on the way up: back on the path at an angle, so the whole
// house (roof and all) is in a three-quarter view while Dyslexi talks.
const STOP = { x: -96, y: -636 };
// Far enough back to see the whole door, looking down a little at the handle.
const AT_DOOR = { x: DOOR_MID, y: HOUSE_Y + 40 };
const AT_DOOR_HORIZON = 64;
// Right at the threshold: never through the wall into what's behind the house.
const INTO = { x: DOOR_MID, y: HOUSE_Y + 4 };
const aimAt = (x: number, y: number, tx: number, ty: number) => Math.atan2(tx - x, -(ty - y));

// ---- Beats -------------------------------------------------------------------

const WALK = { from: 40, to: 220 };
// Up to the door on "Go on, open the door!"
const APPROACH = { from: 396, to: 496 };
const OPEN = { from: 540, to: 568 };
// She steps through the doorway, and the moment she's over the threshold the
// door teleports her: a flash, and she's in the cockpit seat.
const STEP = { from: 568, to: 610 };
const TELEPORT = { from: STEP.to - 6, to: STEP.to + 20 };
// The cockpit, in a launch bay under the house: the lights come on, the
// shutters slide open on the bay wall, and it launches. The glowing ring on
// the ground in front of the house is the top of the silo: the bay doors
// open above, the ship climbs the shaft (the wall rushing down past the
// windshield), and bursts out through the ring into the dawn.
const LAND = TELEPORT.to;
const BOOT = { from: LAND + 6, to: LAND + 42 };
const SHUTTERS = { from: BOOT.to, to: BOOT.to + 40 };
const LAUNCH = { from: SHUTTERS.to + 178, to: SHUTTERS.to + 278 };
const BAY_OPEN = { from: LAUNCH.from, to: LAUNCH.from + 24 };
const RISE = { from: LAUNCH.from + 20, to: LAUNCH.from + 56 };
const BREAK = RISE.to;
// Space. Everything from here on is the old timeline, `D` frames later.
const SPACE = LAUNCH.to;
const D = SPACE - 676;
const ARRIVE = { from: 680 + D, to: 760 + D };
const UI_IN = 830 + D;

type Round = { at: number; word: string; answers: string[]; right: number; wrong?: number; reach: number; reachWrong?: number; next: number };
// The app's own rounds. Relative to `at`: the answers come in at +20, her
// hand reaches at `reach` and touches 30 frames later. The first round has a
// long pause to guess along and a wrong pick.
const ROUNDS: Round[] = [
  { at: 840 + D, word: "CAT", answers: ["HAT", "CUP", "DOG", "SUN"], right: 0, wrong: 2, reachWrong: 120, reach: 330, next: 460 },
  { at: 1300 + D, word: "BALL", answers: ["BED", "WALL", "KITE", "RAIN"], right: 1, reach: 100, next: 210 },
  { at: 1510 + D, word: "BEE", answers: ["TREE", "FISH", "PEN", "BAG"], right: 0, reach: 60, next: 150 },
];
const touchAt = (r: Round) => r.at + r.reach + 30;
const endAt = (r: Round) => r.at + r.next;
const WRONG = ROUNDS[0].at + ROUNDS[0].reachWrong! + 30;
// "c-AT… h-AT": the matching endings light up as Dyslexi says them.
const RIME_PROMPT = ROUNDS[0].at + 252;
const RIME_ANSWER = ROUNDS[0].at + 292;

// The word she won: the stars gather into it, she sounds it out, it bursts.
const SPELL = 1790 + D;
const SOUND = 1850 + D;
const CHUNKS = [
  { letters: [0], at: SOUND },
  { letters: [1, 2, 3], at: SOUND + 45 },
  { letters: [4], at: SOUND + 90 },
];
const WHOLE = SOUND + 136;
const BURST = 2030 + D;
// The flight home: the stars streak, the dawn comes up, and the ship swoops
// in low over the village (colour already flooding out from the house) and
// drops back down the silo through the ring. The bay goes quiet.
const HOMEWARD = { from: BURST + 20, to: BURST + 120 };
const DESCENT = { from: HOMEWARD.to, to: HOMEWARD.to + 170 };
const SHAFT = { from: DESCENT.to, to: DESCENT.to + 60 };
const DOCK = SHAFT.to;
// She climbs out and steps back out of the front door, walks to the top of
// the path and looks down it as the lamps relight from the nearest to the
// farthest.
// A quiet moment in the docked bay before the lights go down.
const BACK = DOCK + 100;
// A beat on the doorstep, then a slow walk to the top of the path.
const DOORSTEP = 36;
const OUT = { from: BACK, to: BACK + 170 };
const TOP = { x: 0, y: -648 };
// The village ending, timed from `AFTER` (the lamps start 20 frames in).
const AFTER = OUT.to - 10;
const LAMP_ON = (i: number) => AFTER + 20 + (LAMPS.length - 1 - i) * 18;
const CHEER = AFTER + 60;
// After "One down!" every townsperson turns to Hero and hops, cheering, and
// they each have their say (Rowan, still hurt, stays put).
const CELEBRATE = { from: AFTER + 300, to: AFTER + 760 };
// Then they head back down the path to their places, each at a walk, while
// Rowan steps up to her: it's her destiny to face the Wizard. Then she turns
// to the tower.
const DISPERSE = AFTER + 860;
const ROWAN_CLOSE = { from: AFTER + 870, to: AFTER + 940, y: -566 };
const WALK_SPEED = 1.1; // world units a frame, about Rowan's pace in the Village
// Once the lamps are lit they come up the path and gather round her, in a
// half-circle a few steps in front of her (she's at the top of the path).
const GATHER = { from: AFTER + 196, to: AFTER + 292 };
const CIRCLE: Record<string, { x: number; y: number }> = {
  fisherman: { x: -82, y: -510 },
  guard: { x: -44, y: -530 },
  farmer: { x: -22, y: -518 },
  merchant: { x: 22, y: -518 },
  blacksmith: { x: 44, y: -530 },
  // Rowan, in the middle and a step behind, where she can see him.
  rowan: { x: 0, y: -500 },
};
// The coda, so the episode ends on a hook rather than a cut: as the cheering
// settles she turns from the path to the horizon, the lens pushing in, and
// far off the Dark Wizard's tower window lights purple. He felt it. Hold,
// then fade to black into the Lair, which opens on him watching her in his orb.
// After "One down!" Dyslexi pops away in a puff of sparkles (cats don't do
// goodbyes), so Hero faces the tower alone.
const LEAVE = { from: AFTER + 368, to: AFTER + 384 };
const TOWER = -0.6;
const TOWARD_TOWER = Math.PI * 2 + TOWER;
const TURN = { from: AFTER + 1450, to: AFTER + 1520 };
const WINDOW_LIT = TURN.to + 16;
const FADE = { from: WINDOW_LIT + 74, to: WINDOW_LIT + 114 };
export const TRIAL_FRAMES = FADE.to + 12;

// Dyslexi's lines play their recorded takes (public/voice); `dur` covers the take.
type Who = "dyslexi" | "hero" | "farmer" | "guard" | "blacksmith" | "fisherman" | "rowan";
type Line = { from: number; dur: number; who: Who; text: string; at?: "top"; voice?: string; reveal?: [number, number][] };
const LINES: Line[] = [
  { from: 80, dur: 70, who: "dyslexi", text: "Psst! Did you miss me?", voice: "voice/dyslexi-voiceline6.mp3" },
  { from: 152, dur: 56, who: "hero", text: "Dyslexi! Where did you go?" },
  { from: 210, dur: 94, who: "dyslexi", text: "Cats don't do goodbyes. Come on!", voice: "voice/dyslexi-voiceline7.mp3" },
  { from: 304, dur: 126, who: "dyslexi", text: "This is the Rhyme Time house. Go on, open the door!", voice: "voice/dyslexi-voiceline8.mp3" },
  { from: 498, dur: 42, who: "hero", text: "...Here goes." },
  { from: BOOT.from + 6, dur: 48, who: "hero", text: "Whoa... where am I?", at: "top" },
  { from: SHUTTERS.to - 6, dur: 110, who: "dyslexi", text: "Surprise! The house is just the front door.",
    // The take said "door" for "house"; public/voice/dyslexi-voiceline9.mp3 has
    // "house" spliced in from take 8 (the original is in the dialogue folder).
    voice: "voice/dyslexi-voiceline9.mp3",
    reveal: [[0, 0], [20, 9], [39, 9], [54, 19], [66, 22], [78, 31], [94, 43]],
  },
  { from: SHUTTERS.to + 102, dur: 44, who: "hero", text: "There's a SPACESHIP under the house?!", at: "top" },
  { from: SHUTTERS.to + 146, dur: 70, who: "dyslexi", text: "Hold on to your whiskers!", voice: "voice/dyslexi-voiceline10.mp3" },
  { from: ARRIVE.to - 16, dur: 84, who: "dyslexi", text: "Welcome to Rhyme Time!", voice: "voice/dyslexi-voiceline11.mp3" },
  { from: WRONG + 12, dur: 45, who: "hero", text: "Oops...", at: "top" },
  {
    from: ROUNDS[0].at + 200,
    dur: 120,
    who: "dyslexi",
    text: "Listen to the end. C-at... h-at!",
    voice: "voice/dyslexi-voiceline12.mp3",
    // Typed with the take: "Listen to the end." / "C-at..." / "h-at!"
    reveal: [
      [0, 0],
      [35, 18],
      [46, 18],
      [77, 26],
      [89, 26],
      [105, 32],
    ],
  },
  { from: ROUNDS[0].at + 335, dur: 40, who: "hero", text: "HAT!", at: "top" },
  { from: ROUNDS[1].at + 50, dur: 60, who: "hero", text: "Ball... wall...", at: "top" },
  { from: endAt(ROUNDS[2]) + 10, dur: 150, who: "dyslexi", text: "See? I told you. I'm a READING cat, I know talent.", voice: "voice/dyslexi-voiceline13.mp3" },
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
  { from: HOMEWARD.from + 4, dur: 70, who: "dyslexi", text: "Next stop: home!", voice: "voice/dyslexi-voiceline14.mp3" },
  { from: DOCK + 2, dur: 68, who: "dyslexi", text: "Home sweet home.", voice: "voice/dyslexi-voiceline15.mp3" },
  { from: CHEER + 70, dur: 80, who: "farmer", text: "Light! Real light!" },
  { from: AFTER + 300, dur: 60, who: "dyslexi", text: "One down!", voice: "voice/dyslexi-voiceline16.mp3" },
  // The townsfolk's turn (text only until recorded).
  { from: AFTER + 380, dur: 80, who: "guard", text: "Three cheers for the Reader!" },
  { from: AFTER + 466, dur: 92, who: "blacksmith", text: "I knew it! I knew she was the one!" },
  { from: AFTER + 564, dur: 92, who: "fisherman", text: "Look! Even the fish are jumping!" },
  // Rowan's lines here are recorded (public/voice/elder-rowan-new1-3, Fish Audio).
  { from: AFTER + 662, dur: 120, who: "rowan", text: "Well done, child. Well done.", voice: "voice/elder-rowan-new1.mp3", reveal: [[0, 0], [56, 17], [67, 17], [109, 28]] },
  { from: AFTER + 786, dur: 86, who: "hero", text: "I... I actually did it!" },
  { from: AFTER + 950, dur: 240, who: "rowan", text: "You brought the light back, Hero. I haven't seen this village smile in a long time.", voice: "voice/elder-rowan-new2.mp3", reveal: [[0, 0], [49, 27], [62, 27], [74, 33], [103, 33], [172, 67], [183, 67], [226, 83]] },
  { from: AFTER + 1200, dur: 232, who: "rowan", text: "My call reached you for a reason, Hero. It's your destiny to face the Dark Wizard.", voice: "voice/elder-rowan-new3.mp3", reveal: [[0, 0], [72, 33], [80, 33], [89, 39], [121, 39], [216, 82]] },
];
const SPEAKER: Record<Who, string> = { dyslexi: "Dyslexi", hero: HERO_NAME, farmer: "Farmer", guard: "Guard", blacksmith: "Blacksmith", fisherman: "Fisherman", rowan: "Elder Rowan" };
const TAG: Record<Who, string> = { dyslexi: DYSLEXI_COLOR, hero: C.lilac, farmer: "#9fd47a", guard: "#9fb4ff", blacksmith: C.peach, fisherman: "#7fd4e8", rowan: C.gold };


// ---- The village: the walk, the door, the pull ------------------------------------

// Rowan steps off the path to let her by, and she walks up the middle of it
// (between the lamps at x = ±24), along the row to the Rhyme Time house, then
// right up to its door, and is pulled through it.
const ROWAN_ASIDE = { from: 0, to: 36, x: -40 };
const ROUTE: [number, number, number][] = [
  [WALK.from, VILLAGE_END.x, VILLAGE_END.y],
  [WALK.from + 30, 6, -470],
  [WALK.from + 98, 4, -590],
  [WALK.to, STOP.x, STOP.y],
  [APPROACH.from, STOP.x, STOP.y],
  [APPROACH.to, AT_DOOR.x, AT_DOOR.y],
  [STEP.from, AT_DOOR.x, AT_DOOR.y],
  [STEP.to, INTO.x, INTO.y],
];
// Bursting up out of the ring in front of the house, facing out across the
// village, and climbing away with the nose tipping up to the sky.
const launchCam = (f: number): Cam => {
  const up = interpolate(f, [BREAK, LAUNCH.to], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  return {
    x: RING.x + Math.sin(f * 2.1) * 0.6,
    y: RING.y,
    heading: Math.PI,
    eye: 14 + 900 * up,
    horizon: 140 + 260 * up + Math.cos(f * 2.7) * 3,
    roll: Math.sin(f * 1.3) * 0.02,
  };
};
// Home: swooping in low from the south over the village toward the ring,
// tipping down into it.
const descentCam = (f: number): Cam => {
  const k = interpolate(f, [DESCENT.from, DESCENT.to], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const dive = interpolate(f, [DESCENT.to - 24, DESCENT.to], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  return {
    x: RING.x + Math.sin(f / 9) * 6 * (1 - k),
    y: RING.y + 560 * (1 - k) + 30,
    heading: 0,
    eye: 14 + 300 * (1 - k) ** 1.5,
    horizon: 70 + 60 * k - 120 * dive,
    roll: Math.sin(f / 11) * 0.06 * (1 - k),
  };
};
// Stepping back out of the front door and up to the top of the path, turning
// to look down it.
const outCam = (f: number): Cam => {
  const k = interpolate(f, [OUT.from + DOORSTEP, OUT.to], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const walking = f > OUT.from + DOORSTEP && f < OUT.to;
  const step = walking ? Math.sin((f / 30) * Math.PI * 4) : 0;
  // The way to the path, kept on the near side of π so she turns the short way.
  const aim = aimAt(AT_DOOR.x, AT_DOOR.y, TOP.x, TOP.y);
  const toPath = aim < 0 ? aim + Math.PI * 2 : aim;
  return {
    x: AT_DOOR.x + (TOP.x - AT_DOOR.x) * k,
    y: AT_DOOR.y + (TOP.y - AT_DOOR.y) * k,
    // Out of the door, then she turns to where she's going and faces it the
    // whole way up, turning to look down the path only as she arrives.
    heading:
      f >= TURN.from
        ? interpolate(f, [TURN.from, TURN.to], [Math.PI, TOWARD_TOWER], { ...clamp, easing: Easing.inOut(Easing.cubic) })
        : f < OUT.from + DOORSTEP + 30
          ? interpolate(f, [OUT.from + DOORSTEP - 6, OUT.from + DOORSTEP + 30], [Math.PI, toPath], { ...clamp, easing: Easing.inOut(Easing.sin) })
          : interpolate(k, [0.78, 1], [toPath, Math.PI], { ...clamp, easing: Easing.inOut(Easing.sin) }),
    eye: 26 + step * 0.7,
    horizon: 120 + step * 2 + interpolate(f, [TURN.from + 20, TURN.to + 20], [0, 60], { ...clamp, easing: Easing.inOut(Easing.quad) }),
    focal: interpolate(f, [TURN.from + 20, FADE.to], [457, 780], { ...clamp, easing: Easing.inOut(Easing.quad) }),
  };
};
const villageCam = (f: number): Cam => {
  if (f >= BACK) return outCam(f);
  if (f >= DESCENT.from) return descentCam(f);
  if (f >= LAND) return launchCam(f);
  const x = linear(f, ROUTE.map(([t, px]) => [t, px] as [number, number]));
  const y = linear(f, ROUTE.map(([t, , py]) => [t, py] as [number, number]));
  // Where she looks from the stop; the walk up to the door eases from it.
  const fromStop = aimAt(STOP.x, STOP.y, DOOR_MID, HOUSE_Y);
  const toDoor = f < WALK.to ? aimAt(x, y, DOOR_MID, HOUSE_Y) : fromStop;
  const heading = f < WALK.from + 20 ? interpolate(f, [0, WALK.from + 20], [VILLAGE_END.heading, toDoor], clamp) : f < APPROACH.to ? interpolate(f, [APPROACH.from, APPROACH.to], [toDoor, 0], { ...clamp, easing: Easing.inOut(Easing.sin) }) : 0;
  const walking = (f > WALK.from && f < WALK.to) || (f > APPROACH.from && f < APPROACH.to);
  const step = walking ? Math.sin((f / 30) * Math.PI * 4) : 0;
  // A wobble as she steps over the threshold, and a long lens punching into
  // the dark doorway.
  const shake = interpolate(f, [STEP.from, STEP.to], [0, 0.6], clamp);
  const rush = interpolate(f, [STEP.from, STEP.to], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  return {
    x,
    y,
    heading: heading + Math.sin(f * 1.7) * 0.01 * shake,
    eye: 26 + step * 0.7 - 4 * rush,
    horizon: interpolate(f, [APPROACH.from, APPROACH.to], [120, AT_DOOR_HORIZON], { ...clamp, easing: Easing.inOut(Easing.quad) }) + step * 2 + Math.cos(f * 2.3) * 3 * shake,
    roll: Math.sin(f * 0.9) * 0.03 * shake,
    focal: 457 + 500 * rush,
  };
};

// The door: its four corners on screen.
const doorQuad = (cam: Cam) => {
  const a = toScreen(cam, LEAF_X0, HOUSE_Y, LEAF_Z0);
  const b = toScreen(cam, LEAF_X1, HOUSE_Y, LEAF_Z0);
  const c = toScreen(cam, LEAF_X1, HOUSE_Y, LEAF_Z1);
  const d = toScreen(cam, LEAF_X0, HOUSE_Y, LEAF_Z1);
  return { a, b, c, d, ok: a.d > 1 && b.d > 1 };
};

// The door leaf, pixel for pixel as it is in the house texture (front.png,
// columns 37–46, rows 37–53), so nothing changes the moment it starts to
// move: l jamb-light, k dark, h highlight, m mid, n shadow, g/y the handle.
const LEAF_ART = [
  "lllllllllm",
  "lkkkkkkkkm",
  "lkhhhhhmnm",
  "lklmmmmnnm",
  "lklmmmmnnm",
  "lkmnnnnnnm",
  "lkkkkkkkkm",
  "lmmmmmmmgy",
  "lmmmmmmmyg",
  "lkkkkkkkkm",
  "lkhhhhhmnm",
  "lklmmmmnnm",
  "lklmmmmnnm",
  "lklmmmmnnm",
  "lkmnnnnnnm",
  "lkkkkkkkkm",
  "mnnnnnnnnn",
];
const LEAF_INK: Record<string, string> = { l: "#b0623e", k: "#261014", h: "#d08a5a", m: "#8c422c", n: "#642c24", g: "#a67428", y: "#f6ca5c" };
const Leaf: React.FC = () => (
  <svg width="100%" height="100%" viewBox={`0 0 ${LEAF_ART[0].length} ${LEAF_ART.length}`} preserveAspectRatio="none" shapeRendering="crispEdges" style={{ display: "block" }}>
    {LEAF_ART.flatMap((row, y) => [...row].map((ch, x) => <rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={LEAF_INK[ch]} />))}
  </svg>
);

// The dark inside the doorway, and the door swinging open into it on its
// left-hand hinge, in true perspective (the camera's own lens) and seen only
// through the opening, as a real door swinging behind the wall would be. No
// cottage in there: a glow from a hatch in the floor, and the blink of
// console lights.
const Doorway: React.FC<{ f: number; cam: Cam }> = ({ f, cam }) => {
  const open = interpolate(f, [OPEN.from, OPEN.to], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  if (open <= 0) return null;
  const q = doorQuad(cam);
  if (!q.ok) return null;
  const x0 = Math.min(q.a.x, q.d.x);
  const x1 = Math.max(q.b.x, q.c.x);
  const y0 = Math.min(q.c.y, q.d.y);
  const y1 = Math.max(q.a.y, q.b.y);
  const w = x1 - x0;
  const h = y1 - y0;
  // The lens in screen pixels, and where the camera looks, for the swing.
  const lens = (cam.focal ?? 457) * 3;
  const eyeX = 960 - x0;
  const eyeY = (cam.horizon ?? 120) * 3 - y0;
  // The light behind it catching the leaf's edge as it turns.
  const shade = 0.55 * Math.sin(open * Math.PI * 0.55);
  return (
    <>
      <div style={{ position: "absolute", left: x0, top: y0, width: w, height: h, overflow: "hidden", background: "linear-gradient(#07050e, #120b22 70%, #1d1240)" }}>
        {/* The hatch's glow on the floor */}
        <div style={{ position: "absolute", left: "10%", top: "72%", width: "80%", height: "22%", borderRadius: "50%", background: `radial-gradient(ellipse, ${LILAC}cc, #6d28d944 55%, transparent 72%)`, opacity: 0.6 + 0.3 * Math.sin(f / 5) }} />
        {/* Console lights blinking in the dark */}
        {Array.from({ length: 9 }, (_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${14 + i * 9}%`,
              top: `${38 + (i % 3) * 5}%`,
              width: Math.max(2, w * 0.03),
              height: Math.max(2, w * 0.03),
              background: [ACCENT.mint, LILAC, C.gold][i % 3],
              opacity: Math.sin(f / (4 + (i % 4)) + i) > 0 ? 0.9 : 0.2,
            }}
          />
        ))}
        {/* The door itself, drained like the rest of the village */}
        <div style={{ position: "absolute", inset: 0, perspective: lens, perspectiveOrigin: `${eyeX}px ${eyeY}px` }}>
          <div style={{ position: "absolute", inset: 0, transformOrigin: "0 50%", transform: `rotateY(${open * 96}deg)`, filter: `saturate(${1 - DRAIN})` }}>
            <Leaf />
            <div style={{ position: "absolute", inset: 0, background: "#000", opacity: shade }} />
          </div>
        </div>
      </div>
      {/* Purple light spilling out of the doorway */}
      <div
        style={{
          position: "absolute",
          left: x0 - w,
          top: y0 - h * 0.4,
          width: w * 3,
          height: h * 1.8,
          background: "radial-gradient(ellipse, #a78bfa44, transparent 60%)",
          mixBlendMode: "screen",
          opacity: open,
          pointerEvents: "none",
        }}
      />
    </>
  );
};

// The teleport: the dark of the doorway bursts into lilac light, rings
// rushing out and loose letters spinning in, and clears on the cockpit.
const Teleport: React.FC<{ f: number }> = ({ f }) => {
  if (f < TELEPORT.from || f >= LAND + 12) return null;
  const t = f - TELEPORT.from;
  const flash = interpolate(f, [TELEPORT.from, TELEPORT.from + 5, LAND - 6, LAND + 12], [0, 1, 0.85, 0], clamp);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle, #fff 0%, #e8d8ff 30%, ${LILAC} 65%, #6d28d9 100%)`, opacity: flash }} />
      {f < LAND &&
        Array.from({ length: 5 }, (_, i) => {
          const k = Math.min(1, Math.max(0, (t - i * 4) / 18));
          if (k <= 0 || k >= 1) return null;
          const r = 60 + 1300 * k ** 0.8;
          return <div key={i} style={{ position: "absolute", left: 960 - r, top: 540 - r, width: r * 2, height: r * 2, borderRadius: "50%", border: `${8 + 22 * (1 - k)}px solid ${i % 2 ? "#fff" : ACCENT.mint}`, opacity: 1 - k }} />;
        })}
      {f < LAND &&
        Array.from({ length: 14 }, (_, i) => {
          const a = random(`tp-a${i}`) * Math.PI * 2;
          const k = Math.min(1, t / (LAND - TELEPORT.from));
          const r = 900 * (1 - k) ** 1.4;
          return (
            <div
              key={`l${i}`}
              style={{
                position: "absolute",
                left: 960 + Math.cos(a + k * 4) * r,
                top: 540 + Math.sin(a + k * 4) * r * 0.7,
                transform: `translate(-50%, -50%) rotate(${k * 540}deg) scale(${0.5 + 1.2 * (1 - k)})`,
                fontFamily: BODY,
                fontWeight: 700,
                fontSize: 54,
                color: i % 3 ? C.gold : "#fff",
                textShadow: `0 0 14px ${C.gold}`,
                opacity: Math.min(1, t / 4) * (1 - k),
              }}
            >
              {String.fromCharCode(65 + Math.floor(random(`tp-c${i}`) * 26))}
            </div>
          );
        })}
    </AbsoluteFill>
  );
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

// Out of the windshield: the app's night sky, streaking past as she arrives
// and settling, and streaking again as she heads home into the dawn.
const Space: React.FC<{ f: number }> = ({ f }) => {
  if (f < SPACE || f >= DESCENT.from) return null;
  const settle = interpolate(f, [ARRIVE.from, ARRIVE.to], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const home = interpolate(f, [HOMEWARD.from, HOMEWARD.to], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const roll = (1 - settle) * 12;
  const streak = (1 - settle) * 1.2 + home * 1.4;
  const drift = Math.sin(f / 60) * 1.2;
  return (
    <AbsoluteFill style={{ background: SKY, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `rotate(${roll + drift}deg) scale(${1.25 - 0.2 * settle})` }}>
        <Stars f={f} streak={streak} />
        {/* The planet, top right, and a small far one */}
        <div style={{ position: "absolute", top: -140, right: -120, width: 480, height: 480, borderRadius: 999, background: "radial-gradient(circle at 38% 34%, rgba(255,190,130,0.95) 0%, rgba(230,110,90,0.7) 45%, rgba(90,40,90,0) 72%)" }} />
        <div style={{ position: "absolute", left: 180, top: 640, width: 110, height: 110, borderRadius: 999, background: "radial-gradient(circle at 38% 34%, rgba(127,240,196,0.7) 0%, rgba(40,120,110,0.4) 50%, transparent 72%)" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: DAWN, opacity: interpolate(f, [HOMEWARD.to - 16, HOMEWARD.to], [0, 1], clamp) }} />
    </AbsoluteFill>
  );
};

// ---- The cockpit -----------------------------------------------------------------

// The house's front window is the windshield; its walls are the hull, still
// in cottage wood with brass fittings bolted on.
const WINDSHIELD: [number, number][] = [
  [300, 56],
  [1620, 56],
  [1830, 300],
  [1860, 850],
  [60, 850],
  [90, 300],
];
const WS_PATH = `M${WINDSHIELD.map(([x, y]) => `${x},${y}`).join(" L")} Z`;
const CONSOLE_Y = 850;
const BUTTONS = 26;
const DAWN = "#e9b8a8";

// The launch bay out of the windshield: the silo wall, ribbed steel bolted
// onto the rock under the village, with warning lamps and the bay's name
// stencilled on it. `rise` is how far the ship has climbed (or, coming home,
// how far it still has to drop); `light` is the dawn pouring in from the bay
// doors above.
const BAY_TEXT_Y = 330;
const Bay: React.FC<{ f: number; rise: number; light: number }> = ({ f, rise, light }) => {
  const band = 260;
  const off = rise % band;
  return (
    <AbsoluteFill style={{ background: "#16111d", overflow: "hidden" }}>
      {/* Steel bands and ribs, scrolling with the climb */}
      <AbsoluteFill
        style={{
          backgroundImage: "repeating-linear-gradient(180deg, #2a2233 0px, #2a2233 18px, transparent 18px, transparent 260px), repeating-linear-gradient(90deg, #211a2a 0px, #211a2a 26px, transparent 26px, transparent 320px)",
          backgroundPosition: `0px ${off}px, 0px 0px`,
        }}
      />
      {/* Warning lamps along the bands, blinking amber */}
      {Array.from({ length: 6 }, (_, row) =>
        Array.from({ length: 7 }, (_, col) => {
          const y = row * band - band + off + 9;
          const on = Math.sin(f / 6 + row + col * 0.7) > 0;
          return <div key={`${row}-${col}`} style={{ position: "absolute", left: 120 + col * 280, top: y - 10, width: 20, height: 20, background: on ? "#ffb24a" : "#5a3a12", boxShadow: on ? "0 0 24px #ffb24a" : undefined }} />;
        }),
      )}
      {/* Hazard stripes and the bay's name, at the foot of the shaft */}
      <div style={{ position: "absolute", left: 0, right: 0, top: BAY_TEXT_Y + 150 + rise, height: 40, backgroundImage: "repeating-linear-gradient(45deg, #e7c063 0 30px, #1a1420 30px 60px)", opacity: 0.85 }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: BAY_TEXT_Y + rise, textAlign: "center", fontFamily: BODY, fontWeight: 800, fontSize: 96, letterSpacing: 18, color: "#e7c06366" }}>RHYME TIME · BAY 1</div>
      {/* Dawn light pouring down the shaft */}
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${DAWN} 0%, #e9b8a866 30%, transparent 70%)`, opacity: light }} />
    </AbsoluteFill>
  );
};

// The throttle, pushed forward at launch.
const Throttle: React.FC<{ f: number }> = ({ f }) => {
  const push = interpolate(f, [LAUNCH.from - 6, LAUNCH.from + 6], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
  const a = (-20 + 40 * push) * (Math.PI / 180);
  const tx = 1490 + Math.sin(a) * 110;
  const ty = 1000 - Math.cos(a) * 110;
  return (
    <g>
      <rect x={1430} y={985} width={120} height={40} rx={8} fill="#2a1810" stroke="#e7c063" strokeWidth={4} />
      <line x1={1490} y1={1000} x2={tx} y2={ty} stroke="#e7c063" strokeWidth={12} strokeLinecap="round" />
      <circle cx={tx} cy={ty} r={20} fill={RED} stroke="#6b4a17" strokeWidth={4} />
    </g>
  );
};

const Cockpit: React.FC<{ f: number }> = ({ f }) => {
  if (f < LAND || f >= BACK) return null;
  const shutters = interpolate(f, [SHUTTERS.from, SHUTTERS.to], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  // Dim when she arrives, the lights coming on; and dimming again once the
  // ship is docked, as she climbs out.
  const dark = Math.max(interpolate(f, [LAND, BOOT.from + 6, BOOT.to], [0.85, 0.6, 0], clamp), interpolate(f, [DOCK + 64, BACK], [0, 1], clamp));
  const booted = (i: number) => f >= BOOT.from + i * 1.3;
  const rumble = interpolate(f, [LAUNCH.from, LAUNCH.from + 20, LAUNCH.to, SPACE + 30], [0, 1, 1.4, 0], clamp) + interpolate(f, [HOMEWARD.from, DESCENT.from, SHAFT.to, DOCK + 8], [0, 0.6, 1, 0], clamp);
  const landing = interpolate(f, [DOCK, DOCK + 4, DOCK + 14], [0, 0.8, 0], clamp);
  const sx = Math.sin(f * 2.3) * 7 * rumble;
  const sy = Math.cos(f * 3.1) * 6 * rumble + 26 * landing;
  // The screen frame on the windshield, once the game boots.
  const hud = interpolate(f, [UI_IN - 20, UI_IN], [0, 1], clamp) * interpolate(f, [SPELL - 30, SPELL], [1, 0], clamp);
  const sweep = (f / 40) * Math.PI * 2;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", transform: `translate(${sx}px, ${sy}px) scale(1.02)` }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <clipPath id="ws">
            <path d={WS_PATH} />
          </clipPath>
          <linearGradient id="hull" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2a1a12" />
            <stop offset="1" stopColor="#140c08" />
          </linearGradient>
          <linearGradient id="deck" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2b1c56" />
            <stop offset="1" stopColor="#120b2a" />
          </linearGradient>
        </defs>
        {/* The window shutters, sliding apart */}
        <g clipPath="url(#ws)">
          {[0, 1].map((side) => {
            const x = side === 0 ? 60 - 900 * shutters : 960 + 900 * shutters;
            return (
              <g key={side}>
                {Array.from({ length: 9 }, (_, i) => (
                  <rect key={i} x={x + i * 100} y={56} width={100} height={800} fill={i % 2 ? "#5a3a2a" : "#4e3224"} stroke="#2a1810" strokeWidth={6} />
                ))}
                <rect x={x} y={420} width={900} height={22} fill="#2a1810" />
              </g>
            );
          })}
        </g>
        {/* The hull around the windshield: cottage wood, brass rim */}
        <path d={`M0,0 H1920 V1080 H0 Z ${WS_PATH}`} fill="url(#hull)" fillRule="evenodd" />
        {/* The old roof beams, crossing the top corners */}
        <polygon points="0,140 0,80 330,0 420,0" fill="#5a3a2a" stroke="#2a1810" strokeWidth={6} />
        <polygon points="1920,140 1920,80 1590,0 1500,0" fill="#5a3a2a" stroke="#2a1810" strokeWidth={6} />
        <path d={WS_PATH} fill="none" stroke="#6b4a17" strokeWidth={22} />
        <path d={WS_PATH} fill="none" stroke="#e7c063" strokeWidth={6} />
        {WINDSHIELD.map(([x, y], i) => {
          const [nx, ny] = WINDSHIELD[(i + 1) % WINDSHIELD.length];
          return Array.from({ length: 6 }, (_, k) => <circle key={`${i}-${k}`} cx={x + ((nx - x) * (k + 0.5)) / 6} cy={y + ((ny - y) * (k + 0.5)) / 6} r={6} fill="#e7c063" stroke="#6b4a17" strokeWidth={2} />);
        })}
        {/* The screen frame, on the glass */}
        {hud > 0 && (
          <g opacity={hud} stroke={LILAC} fill="none">
            <path d="M400,150 V110 H460 M1460,110 H1520 V150 M1520,790 V830 H1460 M460,830 H400 V790" strokeWidth={5} />
            <rect x={400} y={110} width={1120} height={720} strokeWidth={1.5} opacity={0.35} />
          </g>
        )}
        {/* The console */}
        <rect x={0} y={CONSOLE_Y} width={1920} height={1080 - CONSOLE_Y} fill="url(#deck)" />
        <rect x={0} y={CONSOLE_Y} width={1920} height={10} fill="#e7c063" opacity={0.8} />
        <rect x={0} y={CONSOLE_Y + 10} width={1920} height={70} fill="#00000044" />
        {Array.from({ length: BUTTONS }, (_, i) => {
          const on = booted(i);
          const blink = on && Math.sin(f / (5 + (i % 5)) + i * 1.7) > -0.4;
          const color = [ACCENT.mint, LILAC, C.gold, GREEN, RED][i % 5];
          return <rect key={i} x={560 + i * 32} y={CONSOLE_Y + 28} width={20} height={20} fill={color} opacity={on ? (blink ? 1 : 0.45) : 0.12} />;
        })}
        {/* Radar, left */}
        <circle cx={300} cy={970} r={80} fill="#0b2a22" stroke="#e7c063" strokeWidth={6} />
        <circle cx={300} cy={970} r={50} fill="none" stroke={ACCENT.mint} strokeWidth={2} opacity={0.4} />
        {booted(0) && <line x1={300} y1={970} x2={300 + Math.cos(sweep) * 76} y2={970 + Math.sin(sweep) * 76} stroke={ACCENT.mint} strokeWidth={4} />}
        <Throttle f={f} />
        {/* The house sign, now the ship's nameplate */}
        <rect x={760} y={950} width={400} height={84} rx={14} fill="#5a3a2a" stroke="#e7c063" strokeWidth={5} />
        <text x={960} y={1006} textAnchor="middle" fontFamily={BODY} fontWeight={800} fontSize={40} letterSpacing={4} fill={C.gold}>
          RHYME TIME
        </text>
      </svg>
      {/* Lights off when she lands, coming on as the ship boots */}
      <AbsoluteFill style={{ background: "#000", opacity: dark }} />
    </AbsoluteFill>
  );
};

// The game on the windshield, and her hand reaching up to it.
const Screen: React.FC<{ f: number }> = ({ f }) => {
  if (f < SPACE || f >= DESCENT.from) return null;
  const hand = answerHand(f);
  return (
    <>
      <GameCard f={f} />
      <StarWord f={f} />
      {hand && <Hand x={hand.x} y={hand.y} mirror />}
    </>
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

// Colour floods out from the house as the ship comes home with the word, and stays.
const bloomR = (f: number) => interpolate(f, [DESCENT.from, DESCENT.to], [0, 180], { ...clamp, easing: Easing.out(Easing.cubic) });

// ---- The celebration ---------------------------------------------------------------

// Little hops, a beat apart per person, easing in and out with the celebration.
const hop = (f: number, who: string) => {
  const phase = (who.charCodeAt(0) * 7 + who.length * 5) % 18;
  const t = ((f - CELEBRATE.from + phase) % 18) / 18;
  const k = interpolate(f, [CELEBRATE.from, CELEBRATE.from + 12, CELEBRATE.to - 20, CELEBRATE.to], [0, 1, 1, 0], clamp);
  return Math.sin(t * Math.PI) * 7 * k;
};

// ---- Dyslexi leaves ---------------------------------------------------------------

const LeavePuff: React.FC<{ f: number; x: number; y: number }> = ({ f, x, y }) => {
  const t = f - (LEAVE.to - 4);
  if (t < 0 || t > 24) return null;
  const k = t / 24;
  return (
    <>
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2 + random(`puff-${i}`) * 0.5;
        const r = 20 + 110 * Easing.out(Easing.quad)(k) * (0.7 + 0.5 * random(`puffr-${i}`));
        const size = 12 * (1 - k) + 4;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x + Math.cos(a) * r - size / 2,
              top: y + Math.sin(a) * r - size / 2 - 30 * k,
              width: size,
              height: size,
              background: i % 3 === 0 ? DYSLEXI_COLOR : ACCENT.mint,
              opacity: 1 - k,
              boxShadow: `0 0 12px ${ACCENT.mint}`,
            }}
          />
        );
      })}
    </>
  );
};

// ---- The coda: the tower window ------------------------------------------------------

const TowerLight: React.FC<{ f: number; cam: Cam }> = ({ f, cam }) => {
  const tw = towerWindow(cam, TOWER);
  const lamp = interpolate(f, [WINDOW_LIT, WINDOW_LIT + 6, WINDOW_LIT + 14, WINDOW_LIT + 40], [0, 1, 0.75, 0.9], clamp) * (0.9 + 0.1 * Math.sin(f / 5));
  if (!tw || lamp <= 0) return null;
  return (
    <div style={{ position: "absolute", left: tw.x, top: tw.y, opacity: lamp, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: -tw.px * 14, top: -tw.px * 14, width: tw.px * 28, height: tw.px * 28, borderRadius: "50%", background: "radial-gradient(#c77dffaa, #7b2cbf33 45%, transparent 70%)" }} />
      <div style={{ position: "absolute", left: -tw.px * 1.5, top: -tw.px * 2, width: tw.px * 3, height: tw.px * 4, background: "#e6b3ff", boxShadow: `0 0 ${tw.px * 3}px #c77dff` }} />
    </div>
  );
};

// ---- Sound -----------------------------------------------------------------------

const TrialSound: React.FC = () => {
  const sfx = (name: string, from: number, volume: number, dur = 40) => (
    <Sequence key={`${name}-${from}`} from={from} durationInFrames={dur} name={`🔊 ${name}`}>
      <Audio src={staticFile(`sfx/${name}.mp3`)} volume={volume} />
    </Sequence>
  );
  return (
    <>
      {/* Rowan's theme carries on from the Village under the walk to the
          house, dipping under Dyslexi, and fades as the door opens. */}
      <Sequence durationInFrames={OPEN.from + 30} name="♪ Rowan's theme">
        <Audio
          src={staticFile("music/rebirth-background-music.mp3")}
          trimBefore={THEME_CARRY}
          volume={(t) =>
            interpolate(t, [0, APPROACH.from, OPEN.from + 30], [1, 0.85, 0], clamp) *
            Math.min(1, ...LINES.filter((l) => l.voice && l.from < OPEN.from).map((l) => interpolate(t, [l.from - 6, l.from, l.from + l.dur, l.from + l.dur + 12], [1, 0.8, 0.8, 1], clamp)))
          }
        />
      </Sequence>
      <Sequence durationInFrames={TELEPORT.from + 6} name="🔊 morning wind">
        <Audio src={staticFile("sfx/ambience.mp3")} loop volume={(t) => interpolate(t, [0, STEP.from, TELEPORT.from + 6], [0.2, 0.2, 0.05], clamp)} />
      </Sequence>
      {sfx("summon", OPEN.from, 0.45, 60)}
      {/* Over the threshold, and teleported */}
      {sfx("charge-up", STEP.from + 10, 0.3, 40)}
      {sfx("teleport", TELEPORT.from, 0.55, 60)}
      {/* The ship waking up */}
      {sfx("ui-boot", BOOT.from, 0.4, 40)}
      {sfx("staff-slam", BAY_OPEN.from, 0.3, 40)}
      <Sequence from={BREAK} durationInFrames={LAUNCH.to - BREAK} name="🔊 morning wind">
        <Audio src={staticFile("sfx/ambience.mp3")} loop volume={0.12} />
      </Sequence>
      {sfx("jump-whoosh", SHUTTERS.from, 0.2, 30)}
      {sfx("jump-whoosh", RISE.from, 0.4, 40)}
      {/* Lift-off */}
      {sfx("charge-up", LAUNCH.from - 10, 0.4, 60)}
      <Sequence from={LAUNCH.from} durationInFrames={SPACE + 30 - LAUNCH.from} name="🔊 engines">
        <Audio src={staticFile("sfx/beam-loop.mp3")} loop volume={(t) => interpolate(t, [0, 20, SPACE - LAUNCH.from, SPACE + 30 - LAUNCH.from], [0, 0.4, 0.4, 0], clamp)} />
      </Sequence>
      {sfx("shockwave", BREAK, 0.45, 60)}
      {sfx("teleport", SPACE - 10, 0.5, 60)}
      {/* Rhyme Time's own music: it starts softly as she's teleported through
          the door, filling the cockpit and the launch, and comes up full as she
          reaches space. */}
      <Sequence from={TELEPORT.from} durationInFrames={BURST - TELEPORT.from + 20} name="♪ rhyme time">
        <Audio
          src={staticFile("music/rhymetime_music.mp3")}
          volume={(t) =>
            interpolate(t, [0, 24, SPACE - TELEPORT.from - 10, SPACE - TELEPORT.from + 30, BURST - TELEPORT.from - 10, BURST - TELEPORT.from + 20], [0, 0.1, 0.1, 0.55, 0.55, 0], clamp) *
            // ...dipping under Dyslexi once it's up, so she's still clear.
            Math.min(1, ...LINES.filter((l) => l.voice && l.from >= SPACE).map((l) => interpolate(t + TELEPORT.from, [l.from - 6, l.from, l.from + l.dur, l.from + l.dur + 12], [1, 0.55, 0.55, 1], clamp)))
          }
        />
      </Sequence>
      {ROUNDS.map((r) => sfx("ui-boot", r.at, 0.25, 30))}
      {sfx("shield-hit", WRONG, 0.35, 30)}
      {ROUNDS.map((r) => sfx("ui-blip", touchAt(r), 0.6, 20))}
      {sfx("charge-up", SPELL, 0.35, 60)}
      {CHUNKS.map((c) => sfx("ui-blip", c.at, 0.45, 15))}
      {sfx("final-blast", BURST, 0.45, 60)}
      {sfx("summon", BURST + 4, 0.5, 70)}
      {/* The flight home, down the silo, and docked */}
      {sfx("teleport", HOMEWARD.from + 10, 0.5, 60)}
      <Sequence from={HOMEWARD.from} durationInFrames={DOCK + 10 - HOMEWARD.from} name="🔊 engines">
        <Audio src={staticFile("sfx/beam-loop.mp3")} loop volume={(t) => interpolate(t, [0, 20, DOCK - HOMEWARD.from - 10, DOCK + 10 - HOMEWARD.from], [0, 0.35, 0.35, 0], clamp)} />
      </Sequence>
      <Sequence from={DESCENT.from} durationInFrames={SHAFT.from - DESCENT.from} name="🔊 morning wind">
        <Audio src={staticFile("sfx/ambience.mp3")} loop volume={0.25} />
      </Sequence>
      {sfx("jump-whoosh", SHAFT.from - 6, 0.45, 40)}
      {sfx("staff-slam", DOCK, 0.4, 40)}
      {/* The win: the realm theme comes in on the burst, carries the flight
          home over the colour flooding back, and swells as the lamps relight
          and everyone cheers. It fades under the turn to the tower. */}
      <Sequence from={BURST} durationInFrames={TRIAL_FRAMES - BURST} name="♪ realm theme">
        {/* The realm's own theme (from the app), from 2:00 in. It creeps in
            under the flight home and the dark of the silo, held back, and only
            blooms once she steps out of the door and the lamps relight. */}
        <Audio
          src={staticFile("music/realm-theme.mp3")}
          trimBefore={120 * 30}
          volume={(t) =>
            t < BACK - BURST
              ? interpolate(t, [0, DOCK - BURST], [0, 0.14], { ...clamp, easing: Easing.in(Easing.quad) })
              : interpolate(t, [BACK - BURST, CHEER - BURST, CELEBRATE.to - BURST, DISPERSE + 60 - BURST, TURN.from - BURST, TURN.to + 10 - BURST], [0.14, 0.6, 0.6, 0.35, 0.35, 0], { ...clamp, easing: Easing.inOut(Easing.cubic) }) *
                // ...dipping under Rowan (and Dyslexi) back in the village.
                Math.min(1, ...LINES.filter((l) => l.voice && l.from >= BACK).map((l) => interpolate(t + BURST, [l.from - 6, l.from, l.from + l.dur, l.from + l.dur + 12], [1, 0.55, 0.55, 1], clamp)))
          }
        />
      </Sequence>
      <Sequence from={BACK} durationInFrames={TRIAL_FRAMES - BACK} name="🔊 morning wind">
        <Audio src={staticFile("sfx/ambience.mp3")} loop volume={0.2} />
      </Sequence>
      {LAMPS.map((_, i) => sfx("ui-blip", LAMP_ON(i), 0.25, 12))}
      {sfx("jump-whoosh", LEAVE.from, 0.3, 30)}
      {sfx("ui-blip", LEAVE.to - 4, 0.45, 15)}
      {/* The coda: the drone creeps in under the turn, a far-off rumble as the window lights */}
      <Sequence from={TURN.from} durationInFrames={TRIAL_FRAMES - TURN.from} name="♪ mystery drone">
        <Audio src={staticFile("music/mystery-drone.mp3")} volume={(t) => interpolate(t, [0, 50, FADE.from - TURN.from, TRIAL_FRAMES - TURN.from], [0, 0.3, 0.3, 0], clamp)} />
      </Sequence>
      {sfx("thunder-strike", WINDOW_LIT, 0.18, 90)}
      {LINES.filter((l) => l.voice).map((l) => (
        <Sequence key={`voice-${l.from}`} from={l.from} durationInFrames={l.dur + 15} name="🗣 voice">
          <Audio src={staticFile(l.voice!)} volume={1} />
        </Sequence>
      ))}
    </>
  );
};

// ---- The scene -------------------------------------------------------------------

export const Trial: React.FC = () => {
  const f = useCurrentFrame();
  // The village, outside: on the walk, out of the cockpit window, and after.
  // The village: on the walk in, bursting up out of the ring, swooping home,
  // and walking back out of the door.
  const inVillage = f < LAND || (f >= BREAK && f < SPACE) || (f >= DESCENT.from && f < SHAFT.from) || f >= BACK;
  // The launch bay, before the climb and after the drop home.
  const bay = f >= SHUTTERS.from - 1 && f < BREAK ? { rise: interpolate(f, [RISE.from, RISE.to], [0, 2600], { ...clamp, easing: Easing.in(Easing.cubic) }), light: interpolate(f, [BAY_OPEN.from, BAY_OPEN.to], [0, 1], clamp) } : f >= SHAFT.from && f < BACK ? { rise: interpolate(f, [SHAFT.from, DOCK], [2600, 0], { ...clamp, easing: Easing.out(Easing.cubic) }), light: interpolate(f, [SHAFT.from, DOCK], [1, 0], clamp) } : null;
  const cam = villageCam(f);
  // No ring on the walk to the house: it only shows once she's in the ship,
  // as the top of the silo it launches out of.
  const ring = f < LAND ? 0 : interpolate(f, [OPEN.from, BURST], [1, 0.8], clamp) * (0.9 + 0.1 * Math.sin(f / 4));
  const dysIn = interpolate(f, [LINES[0].from - 6, LINES[0].from + 8], [0, 1], clamp);
  const talking = LINES.some((l) => l.who === "dyslexi" && f >= l.from && f < l.from + l.dur - 16);
  // Dyslexi follows her in through the door, tumbles down the chute beside
  // her, and takes the co-pilot's spot on the console.
  // She's gone in the flash with Hero, and is there on the console after.
  const pulled = f < LAND ? interpolate(f, [STEP.from + 6, STEP.to], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) }) : 0;
  const seated = f >= LAND && f < BACK;
  const dysX = seated ? 1660 : 1640 - 700 * pulled;
  const dysY = seated ? 760 : 560 - 40 * pulled + Math.sin(f / 2) * 10 * pulled;
  const dysScale = seated ? 5 : 6 * (1 - 0.7 * pulled);
  const dysGone = (f >= TELEPORT.from + 4 && f < LAND ? 0 : 1) * interpolate(f, [LEAVE.from, LEAVE.to], [1, 0], clamp);
  const dysLift = interpolate(f, [LEAVE.from, LEAVE.to], [0, -70], { ...clamp, easing: Easing.in(Easing.quad) });
  const cheering = f >= CHEER && f < CELEBRATE.to;
  const celebrating = f >= CELEBRATE.from && f < CELEBRATE.to;
  const aside = interpolate(f, [ROWAN_ASIDE.from, ROWAN_ASIDE.to], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const actors = villageActors(VILLAGE_FRAMES + f, (i) => lampLit(i, f)).map((a) =>
    a.sheet === "rowan" && f >= GATHER.from
      ? (() => {
          // He comes up slowly behind the others (still hurt), and doesn't hop.
          const k = interpolate(f, [GATHER.from, GATHER.to + 30], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
          const from = { x: a.x + ROWAN_ASIDE.x, y: a.y };
          const close = interpolate(f, [ROWAN_CLOSE.from, ROWAN_CLOSE.to], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
          const moving = (k > 0 && k < 1) || (close > 0 && close < 1);
          const x = from.x + (CIRCLE.rowan.x - from.x) * k;
          const y = from.y + (CIRCLE.rowan.y - from.y) * k + (ROWAN_CLOSE.y - CIRCLE.rowan.y) * close;
          return { ...a, x, y, row: moving ? 3 : 0, col: moving ? walkCol(f) : idleCol(f), flip: false };
        })()
      : a.sheet === "rowan"
      ? { ...a, x: a.x + ROWAN_ASIDE.x * aside, row: aside > 0 && aside < 1 ? 3 : 0, col: aside > 0 && aside < 1 ? walkCol(f) : idleCol(f), flip: false }
      : a.sheet === "lamp"
        ? a
        : f >= CELEBRATE.to && CIRCLE[a.sheet]
          ? // Back down the path to their places, at a walk (facing away).
            (() => {
              const to = CIRCLE[a.sheet];
              const wait = f < DISPERSE;
              const dist = Math.hypot(a.x - to.x, a.y - to.y);
              const k = wait ? 0 : Math.min(1, ((f - DISPERSE) * WALK_SPEED) / dist);
              const moving = !wait && k < 1;
              return { ...a, x: to.x + (a.x - to.x) * k, y: to.y + (a.y - to.y) * k, row: wait ? 0 : moving ? 5 : 1, col: moving ? walkCol(f) : idleCol(f), flip: a.flip };
            })()
        : f >= GATHER.from && f < CELEBRATE.from && CIRCLE[a.sheet]
          ? // Walking up to her
            (() => {
              const k = interpolate(f, [GATHER.from, GATHER.to], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
              const to = CIRCLE[a.sheet];
              const moving = f < GATHER.to;
              return { ...a, x: a.x + (to.x - a.x) * k, y: a.y + (to.y - a.y) * k, row: moving ? 3 : 0, col: moving ? walkCol(f) : idleCol(f), flip: false, bubble: false };
            })()
        : celebrating
          ? // Facing her (row 0) and hopping, each on their own beat.
            { ...a, ...(CIRCLE[a.sheet] ?? {}), row: 0, col: idleCol(f), flip: false, bubble: false, lift: hop(f, a.sheet) }
          : cheering
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
          hands={[]}
          sky="dawn"
          drain={DRAIN}
          scorch={SCORCH}
          glow={{ "rhyme-time": ring }}
          tower={f >= TURN.from ? TOWER : undefined}
          bloom={{ x: RHYME.x, y: -700, r: bloomR(f), k: bloomR(f) > 0 ? 1 : 0 }}
        >
          {f < LAND && <Doorway f={f} cam={cam} />}
          <LampGlows f={f} cam={cam} />
          {f >= TURN.from && <TowerLight f={f} cam={cam} />}
          {/* The dark of the doorway swallowing the frame */}
          <AbsoluteFill style={{ background: "#07050e", opacity: f < LAND ? interpolate(f, [STEP.to - 16, STEP.to - 4], [0, 1], clamp) : 0, pointerEvents: "none" }} />
          {/* Climbing out of the dawn into the night sky */}
          <AbsoluteFill style={{ background: "#1d1240", opacity: f >= BREAK && f < SPACE ? interpolate(f, [BREAK + 10, SPACE], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) }) : 0, pointerEvents: "none" }} />
          {/* Out of the shaft into the dawn, going and coming home */}
          <AbsoluteFill style={{ background: DAWN, opacity: f >= BREAK && f < SPACE ? interpolate(f, [BREAK, BREAK + 10], [1, 0], clamp) : f >= DESCENT.from && f < SHAFT.from ? interpolate(f, [DESCENT.from, DESCENT.from + 14], [1, 0], clamp) : 0, pointerEvents: "none" }} />
          {/* Down into the ring */}
          <AbsoluteFill style={{ background: "#16111d", opacity: f >= DESCENT.from && f < SHAFT.from ? interpolate(f, [SHAFT.from - 8, SHAFT.from], [0, 1], clamp) : 0, pointerEvents: "none" }} />
          {/* Out of the dark of the house: the door opens and the dawn floods in */}
          <AbsoluteFill style={{ background: C.cream, opacity: f >= BACK ? interpolate(f, [BACK, BACK + 6, BACK + 50], [0, 0.85, 0], { ...clamp, easing: Easing.out(Easing.quad) }) : 0, pointerEvents: "none" }} />
          <AbsoluteFill style={{ background: "#000", opacity: f >= BACK ? interpolate(f, [BACK, BACK + 8], [1, 0], clamp) : 0, pointerEvents: "none" }} />
          {/* The coda's fade, into the Lair */}
          <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [FADE.from, FADE.to], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) }), pointerEvents: "none" }} />
        </Pov>
      )}
      {bay && <Bay f={f} rise={bay.rise} light={bay.light} />}
      <Teleport f={f} />
      <Space f={f} />
      <Cockpit f={f} />
      <Screen f={f} />
      {/* The word bursts into light */}
      <AbsoluteFill style={{ background: C.cream, opacity: f >= BURST && f < HOMEWARD.to ? interpolate(f, [BURST, BURST + 4, BURST + 30], [0, 0.9, 0], clamp) : 0, pointerEvents: "none" }} />
      <DyslexiBuddy f={f} x={dysX} y={dysY + dysLift} scale={dysScale} appear={dysIn * dysGone} talking={talking} />
      <LeavePuff f={f} x={dysX} y={dysY - 70} />
      {dialogue}
      <TrialSound />
    </AbsoluteFill>
  );
};
