// "Into the Realm": Hero walks through a door and into the Training Realm.
// Everything that's tuned by hand lives here: Hero's look, the AI footage
// slots and the length of every act.

export const HERO_NAME = "Hero";

// Hero's realm avatar, stacked from the female avatar layers the app uses.
// Match these to her AI wardrobe (see docs/AI-SHOTS.md) so the jump into the
// realm reads as the same person.
// The quiet boy from her class (the pilot's ending): built from these avatar
// layers (public/realm/classmate.png, with short hair, no bow and the
// outfit's trim turned red) so he reads as the boy in the red hoodie.
export const CLASSMATE_LOOK = { skin: 7 as SkinTone, hair: "black", outfit: "red" };

export const HERO_LOOK = {
  skin: 3 as SkinTone,
  hair: "brown",
  outfit: "purple",
};

type SkinTone = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

// Sampled from public/realm/hero/skin-tone*.png: [light, base, shade].
export const SKIN: Record<SkinTone, [string, string, string]> = {
  1: ["#dcc8ab", "#c1ac8f", "#ac7b5d"],
  2: ["#c6b096", "#ac957a", "#966a50"],
  3: ["#b29a80", "#987e65", "#815a42"],
  4: ["#9c8268", "#836850", "#6b4935"],
  5: ["#876a52", "#6f513b", "#563927"],
  6: ["#72513a", "#5a3a26", "#40281a"],
  7: ["#f2e0cc", "#e0c8b0", "#c89e80"],
  8: ["#c9b080", "#b29668", "#947048"],
};

export const OUTFIT: Record<string, [string, string]> = {
  purple: ["#8a5cc2", "#5b3a75"],
  blue: ["#4f7fd0", "#2f4f8f"],
  red: ["#d0504a", "#8f2f2a"],
  green: ["#5fae5a", "#2f6d4f"],
};

// AI live-action slots. Drop the generated clip in public/footage/ and set
// `src` (e.g. "footage/s02.mp4"). While `src` is null the shot renders as a
// slate so the edit can be timed before any footage exists.
export type Shot = { id: string; frames: number; title: string; src: string | null };

// The pilot's real-world scenes (docs/SEASON-1.md): a reading lesson in
// class. Hero is asked to read aloud and the letters swim; a quiet boy at the
// back who finds reading hard too watches her. Later, a chime only she hears... and, at the
// back, he looks up too (c05, flashed back in the pilot's ending). Then the
// corridor and the door. c02 is drawn in Remotion (the page's swimming
// letters), so it needs no clip.
export const ACT1_SHOTS: Shot[] = [
  { id: "s02", frames: 180, title: "Wide · Classroom, afternoon: a reading lesson, students at desks with books open; Hero by the window", src: null },
  { id: "c01", frames: 120, title: "MCU · The teacher, kind: \"Would you read the next part for us?\" Hero looks down at her book", src: null },
  { id: "c02", frames: 120, title: "CU · The page, its letters swimming (drawn in Remotion)", src: null },
  { id: "c03", frames: 180, title: "MCU · Hero freezes; a snigger from a nearby desk; the teacher gently moves on; Hero sinks in her seat", src: null },
  { id: "c04", frames: 120, title: "MCU · At the back, a quiet boy in a red hoodie watches her, then looks down at his own book", src: null },
  { id: "s03", frames: 120, title: "MCU · Later: a faint chime; Hero looks up from her book; nobody else seems to hear it", src: null },
  { id: "c05", frames: 90, title: "CU · At the back, the quiet boy looks up at the same moment, toward the door", src: null },
  { id: "s04", frames: 90, title: "OTS · Past Hero toward the classroom door and the dim corridor beyond", src: null },
  { id: "s05", frames: 90, title: "Medium · Hero asks to be excused and slips out", src: null },
  { id: "s06", frames: 120, title: "Tracking · An empty school corridor; the lights flicker", src: null },
  { id: "s07", frames: 90, title: "Insert · Mint light under a storeroom door", src: null },
];
export const ACT2_SHOTS: Shot[] = [
  { id: "s08", frames: 90, title: "CU · Hero's hand on the storeroom door handle", src: null },
  { id: "s09", frames: 90, title: "CU · The door opens, her face lit mint", src: null },
  { id: "s10", frames: 120, title: "POV · The open doorway (portal composited)", src: null },
  { id: "s11", frames: 180, title: "MCU · Hesitation: she looks back down the corridor toward her classroom, then forward", src: null },
  { id: "s12", frames: 210, title: "Wide from behind · Hero steps into the light", src: null },
];

// Hero's real hand rising into frame (POV), pixelated into the sprite hand.
// Optional: with no clip the Arrival goes straight to the pixel hands.
export const REAL_HAND: Shot = { id: "h01", frames: 90, title: "POV · Hero's real hand rises into frame", src: null };

// Episode 6's ending, back in class. The page close-up in e03 is drawn in
// Remotion over the clip (Home.tsx), so e03 only needs her face and hands.
export const HOME_SHOTS: Shot[] = [
  { id: "e01", frames: 150, title: "Corridor · The storeroom door's light fades; Hero, back, a little dazed", src: null },
  { id: "e02", frames: 120, title: "Classroom · She sits down; the teacher smiles: \"Would you like to try again?\"", src: null },
  { id: "e03", frames: 330, title: "MCU · Hero takes a breath and reads the page aloud, slowly", src: null },
  { id: "e04", frames: 150, title: "Wide · The class claps; Hero grins. At the back, the quiet boy's seat is empty", src: null },
];

export const TITLE_FRAMES = 120;
export const ACT1_FRAMES = TITLE_FRAMES + ACT1_SHOTS.reduce((s, x) => s + x.frames, 0);
export const ACT2_FRAMES = ACT2_SHOTS.reduce((s, x) => s + x.frames, 0);
// 100 frames falling through the portal, then 1494 waking up (including the
// system finding her and Dyslexi explaining her first status window).
export const ARRIVAL_FALL = 100;
export const ARRIVAL_FRAMES = 1594;
// The Arrival's mystery drone starts this many frames after she lands; the
// Village picks the same track up DRONE_CARRY frames in, so it plays on.
export const DRONE_IN = 20;
export const DRONE_CARRY = ARRIVAL_FRAMES - ARRIVAL_FALL - DRONE_IN;
// Timed to the recorded takes, with room between lines: Rowan's last line
// ends at ~1493, Hero answers, then she turns toward the Rhyme Time house and
// the quest marker pops up over it (~1523). A short hold, and on.
export const VILLAGE_FRAMES = 1575;
export const DOOR_FRAMES = 450;
export const SHOWCASE_FRAMES = 770;
export const END_FRAMES = 280;
// Frames where one act dissolves into the next (the earlier act keeps
// playing underneath).
export const CROSSFADE = 24;

// The three portals, accents from lib/realm/portals.ts.
export const ACCENT = { mint: "#7ff0c4", peach: "#ffb27a", lavender: "#c3a6ff" };

// Where the doorway sits in shot s10 (1920x1080 frame). The AI prompt asks for
// a centred doorway; nudge these to line the portal up with the real clip.
export const DOORWAY = { x: 770, y: 150, w: 380, h: 800 };

// The camera on the Summoning's first frame, which the Opening's camera ends
// on, so the cut into the fight is one continuous move. `x` is the world x at
// screen centre.
export const FIGHT_CAM = { x: 1060, zoom: 1.08 };

// The fight music's first ~0.45s is silence; MUSIC_SKIP frames of it are
// skipped so its first hit lands on Rowan's first bolt, which the Opening
// plays MUSIC_PREROLL frames before the Summoning. The Summoning picks the
// track up where the Opening leaves it.
export const MUSIC_SKIP = 13;
export const MUSIC_PREROLL = 14;
