import React from "react";
import { AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio, Video } from "@remotion/media";
import { Dialogue } from "../lore/parts";
import { C, PIXEL } from "../theme";
import { ACCENT, HERO_NAME } from "./config";
import { LENS, Shot3D, angleTo, dolly, facing, lookAt } from "./cine/Camera3D";
import { ChapterCard } from "./cine/ChapterCard";
import { EmoteIcon } from "./cine/Portrait";
import { Shot, shotAt } from "./cine/Shots";
import { DYSLEXI_COLOR, DyslexiBirth, BIRTH_FRAMES } from "./hud/Dyslexi";
import { HudPopup, LevelUp, Panel, Popup, RIM } from "./hud/Hud";
import { linear } from "./parts";
import { Actor, Cam, Pov, idleCol, toScreen, towerWindow, walkCol } from "./realm/Pov";
import { DRAIN, HOUSE_Y, SCORCH, SPOTS } from "./realm/world";

// Chapter 2 · First Words. Hero walks up to the Rhyme Time house and steps
// into its ring; the game opens in the air in front of her (the real Rhyme
// Time, played: one wrong pick, then three right). The house blazes, colour
// floods back around it, and the first word she won hangs in the air, spins,
// and bursts into Dyslexi. Level up. Far off on the horizon, a window in the
// Dark Wizard's tower lights purple: he felt it.
//
// Lines are timed placeholders until Hero's and Dyslexi's takes are recorded.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const FIRST_WORDS_FRAMES = 1650;

// ---- Beats ------------------------------------------------------------------------

const ROW_AT = 200; // cut: she's on the row of houses, heading for Rhyme Time
const IN_RING = 272;
const WINDOW_OPEN = 318;
// The game clip plays in two parts: the first question (and her wrong pick),
// then, after a cut to her face, the rest of the clip from where it stopped.
const CLIP_A = { from: 330, dur: 45 };
const CLIP_B = { from: 420, dur: 303 };
const FUMBLE = 352;
// "Correct!" in the clip, in Chapter frames.
const CORRECT = [447, 573, 690];
const CLEAR = CLIP_B.from + CLIP_B.dur;
const WINDOW_CLOSE = 790;
const POUR = 800;
const BIRTH = 905;
const DYSLEXI_ON = BIRTH + 40;
const LEVEL = 1255;
const TURN = 1450;
const WINDOW_LIT = 1488;

const LINES = [
  { who: "Dyslexi", from: 980, dur: 100, text: "Finally! Do you know how long I've been stuck as a single letter?" },
  { who: HERO_NAME, from: 1090, dur: 50, text: "...You're a cat." },
  { who: "Dyslexi", from: 1150, dur: 90, text: "I'm a READING cat. Big difference." },
  { who: "Dyslexi", from: 1335, dur: 100, text: "See that? Every word you win back makes you stronger." },
];

const POPUPS: Popup[] = [
  { at: POUR + 30, kind: "quest", title: "Bring back the words", sub: "400 / 5,000 words restored", dur: 110 },
  { at: LEVEL + 22, kind: "badge", title: "Beginner", sub: "Your first game cleared", badge: "beginner", dur: 120 },
  { at: LEVEL + 48, kind: "skill", title: "Rhyme Shield", sub: "A ring of rhymes blocks an attack", dur: 100 },
];

// ---- Where everyone is ------------------------------------------------------------

const RX = -200; // the Rhyme Time house, its ring, and where she stands in it
const RY = -676;
const DYS = { x: -200, y: -700 };
const WIN = { x: -200, y: -706, lift: 40 };
const DOOR = { x: -200, y: HOUSE_Y + 2 };
const ROWAN = { x: 30, y: -478 };
// The tower, far off to the north-west, past the end of the row.
const TOWER = -0.6;

const hero = (f: number) => {
  if (f < ROW_AT) return { x: 0, y: linear(f, [[0, -420], [ROW_AT, -612]]), theta: 0, walking: true };
  const x = linear(f, [[ROW_AT, -132], [IN_RING, RX]]);
  return { x, y: RY, theta: f < IN_RING ? -Math.PI / 2 : 0, walking: f < IN_RING };
};

// ---- The camera -------------------------------------------------------------------

type Focus = "target" | "hero" | "dyslexi" | "window";

const shotsAt = (f: number): Shot<Focus>[] => {
  const h = hero(f);
  // Close on her face from in front (from the house side), on a long lens.
  const face: Shot3D = dolly({ x: -197, y: -712, eye: 17, tx: RX, ty: RY, lift: 14, aim: 105 }, 50);
  // Over her shoulder onto the game window.
  const ots = (dx: number, dy: number): Shot3D => ({ x: RX + dx, y: RY + dy, eye: 24, tx: WIN.x, ty: WIN.y, lift: WIN.lift, aim: 150 });
  // Over her shoulder onto Dyslexi, and the reverse over Dyslexi onto her.
  const onDys: Shot3D = dolly({ x: -180, y: -632, eye: 24, tx: DYS.x, ty: DYS.y, lift: 28, aim: 140 }, 88);
  const onHero: Shot3D = { x: -188, y: -726, eye: 22, tx: RX, ty: RY, lift: 14, aim: 110 };
  return [
    // Wide and high over the grey village, the house row ahead: the chapter card.
    { at: 0, start: { x: 60, y: -300, eye: 90, tx: -70, ty: -700, lift: 0, lens: LENS.wide }, end: { x: 44, y: -350, eye: 104, tx: -80, ty: -710, lift: 0, lens: LENS.wide } },
    // Low behind her as she walks up to the row, the Rhyme Time house ahead left.
    { at: 120, start: { x: 18, y: h.y + 84, eye: 14, tx: -70, ty: h.y - 170, lift: 22 }, end: { x: 16, y: h.y + 76, eye: 14, tx: -70, ty: h.y - 170, lift: 22 }, rack: [[0, "hero"]] },
    // Low at the ring as she walks in from the right; its glow wakes under her.
    { at: ROW_AT, start: { x: -178, y: -606, eye: 10, tx: RX, ty: -700, lift: 26 }, end: { x: -182, y: -614, eye: 10, tx: RX, ty: -700, lift: 26 }, rack: [[0, "hero"]] },
    // Her face, lit from below, as the game opens.
    { at: IN_RING, start: face, end: dolly({ ...face, y: -710 }, 46) },
    // The game, over her shoulder.
    { at: CLIP_A.from - 6, start: ots(30, 46), end: ots(28, 40), rack: [[0, "window"]] },
    // The wrong pick lands on her.
    { at: CLIP_A.from + CLIP_A.dur, start: face, end: dolly({ ...face, y: -710 }, 44) },
    { at: CLIP_B.from, start: ots(28, 42), end: ots(24, 34), rack: [[0, "window"]] },
    // One right: a beat on her face.
    { at: 520, start: dolly({ ...face, x: -195 }, 54), end: dolly({ ...face, x: -195 }, 48) },
    // In tighter for the run of right answers and the clear.
    { at: 560, start: ots(22, 34), end: ots(18, 26), rack: [[0, "window"]] },
    // Low and wide behind her: the door blazes and the colour floods out.
    { at: POUR, start: { x: -150, y: -596, eye: 12, tx: RX, ty: HOUSE_Y, lift: 40 }, end: { x: -156, y: -606, eye: 14, tx: RX, ty: HOUSE_Y, lift: 40 }, rack: [[0, "target"]] },
    // Side on: the first word hangs between her and the door, and bursts.
    { at: BIRTH, start: { x: -118, y: -690, eye: 20, tx: RX, ty: -688, lift: 20 }, end: { x: -126, y: -690, eye: 20, tx: RX, ty: -688, lift: 20 } },
    { at: LINES[0].from - 4, start: onDys, end: dolly({ ...onDys, x: -189 }, 70), rack: [[0, "hero"], [LINES[0].from + 4, "dyslexi"]] },
    { at: LINES[1].from - 4, start: onHero, end: { ...onHero, y: -722 }, rack: [[0, "dyslexi"], [LINES[1].from + 2, "hero"]] },
    { at: LINES[2].from - 4, start: dolly(onDys, 68), end: dolly(onDys, 60), rack: [[0, "dyslexi"]] },
    // Low and wide from the road: the two of them, the house in colour.
    { at: LEVEL, start: { x: -146, y: -612, eye: 10, tx: RX, ty: -690, lift: 26 }, end: { x: -150, y: -620, eye: 10, tx: RX, ty: -690, lift: 26 } },
    { at: LINES[3].from - 4, start: { x: -138, y: -632, eye: 20, tx: RX, ty: -690, lift: 22 }, end: { x: -144, y: -638, eye: 20, tx: RX, ty: -690, lift: 22 }, rack: [[0, "dyslexi"]] },
    // The turn: far off, high over the trees, on the longest lens.
    {
      at: TURN,
      start: { x: RX, y: -650, eye: 70, tx: RX + Math.sin(TOWER) * 1000, ty: -650 - Math.cos(TOWER) * 1000, lift: 70, aim: 250, lens: 1000, focus: 900 },
      end: { x: RX, y: -650, eye: 70, tx: RX + Math.sin(TOWER) * 1000, ty: -650 - Math.cos(TOWER) * 1000, lift: 70, aim: 250, lens: 1260, focus: 900 },
    },
  ];
};

const focusPoint = (who: Focus, f: number) => (who === "hero" ? hero(f) : who === "dyslexi" ? DYS : who === "window" ? WIN : null);
const camAt = (f: number) => shotAt(shotsAt(f), f, FIRST_WORDS_FRAMES, focusPoint);

// The game window shows only in the over-the-shoulder shots.
const windowShot = (f: number) => (f >= CLIP_A.from - 6 && f < CLIP_A.from + CLIP_A.dur) || (f >= CLIP_B.from && f < 520) || (f >= 560 && f < POUR);

// ---- The world --------------------------------------------------------------------

const ringGlow = (f: number) => interpolate(f, [ROW_AT, IN_RING, WINDOW_OPEN, POUR, POUR + 40], [0.35, 0.8, 1, 1, 0.85], clamp) * (0.9 + 0.1 * Math.sin(f / 4));
// Colour floods out from the house and stays.
const bloomR = (f: number) => interpolate(f, [POUR + 14, POUR + 100], [0, 260], { ...clamp, easing: Easing.out(Easing.cubic) });

const actorsAt = (f: number, cam: Cam): Actor[] => {
  const h = hero(f);
  const at = (x: number, y: number, theta: number, walking: boolean, sheet: Actor["sheet"], phase = 0): Actor => {
    const { row, flip } = facing(theta, cam.heading, walking);
    return { sheet, x, y, row, flip, col: walking ? walkCol(f + phase) : idleCol(f + phase) };
  };
  const toHero = (x: number, y: number) => angleTo(x, y, h.x, h.y);
  const list: Actor[] = [
    { ...at(h.x, h.y, h.theta, h.walking, "hero"), keep: true },
    at(ROWAN.x, ROWAN.y, toHero(ROWAN.x, ROWAN.y), false, "rowan"),
    at(SPOTS.merchant.x, SPOTS.merchant.y, toHero(SPOTS.merchant.x, SPOTS.merchant.y), false, "merchant", 1),
    at(SPOTS.blacksmith.x, SPOTS.blacksmith.y, toHero(SPOTS.blacksmith.x, SPOTS.blacksmith.y), false, "blacksmith", 5),
  ];
  if (f >= DYSLEXI_ON) {
    // She floats, bobbing, facing Hero; a little bounce while she talks.
    const talking = LINES.some((l) => l.who === "Dyslexi" && f >= l.from && f < l.from + l.dur - 20);
    const pop = interpolate(f, [DYSLEXI_ON, DYSLEXI_ON + 8], [0.4, 1], clamp);
    list.push({ ...at(DYS.x, DYS.y, toHero(DYS.x, DYS.y), false, "dyslexi"), lift: 20 + Math.sin(f / 14) * 1.5 + (talking ? Math.abs(Math.sin(f / 3.2)) * 1.5 : 0), size: 0.75 * pop });
  }
  return list;
};

// ---- The game window --------------------------------------------------------------
// The real Rhyme Time, cropped to its board, in a frame of the stats layer's
// glass, standing in the air in front of the door and facing her.

// The board's area of the 1920x800 recording.
const CROP = { x: 420, y: 120, w: 1080, h: 670 };
// The DOG button (her wrong pick), in the recording.
const DOG = { x: 519, y: 600, w: 432, h: 84 };
const WIN_W = 60; // texels

const GameWindow: React.FC<{ f: number; cam: Cam }> = ({ f, cam }) => {
  const s = toScreen(cam, WIN.x, WIN.y, WIN.lift);
  if (s.d < 6 || !windowShot(f)) return null;
  const open = Math.min(interpolate(f, [WINDOW_OPEN, WINDOW_OPEN + 12], [0.02, 1], { ...clamp, easing: Easing.out(Easing.cubic) }), interpolate(f, [WINDOW_CLOSE - 10, WINDOW_CLOSE], [1, 0.02], clamp));
  const w = WIN_W * s.px;
  const k = w / CROP.w;
  const h = CROP.h * k;
  const bar = 4 * s.px;
  const shake = f >= FUMBLE && f < FUMBLE + 14 ? Math.sin((f - FUMBLE) * 2.4) * 14 * (1 - (f - FUMBLE) / 14) : 0;
  const wrong = interpolate(f, [FUMBLE - 2, FUMBLE, FUMBLE + 18, FUMBLE + 24], [0, 1, 1, 0], clamp);
  const clear = interpolate(f, [CLEAR - 6, CLEAR + 6], [0, 1], clamp);
  const flash = interpolate(f, [CLEAR, CLEAR + 4, CLEAR + 16], [0, 0.8, 0], clamp);
  const video = (from: number, dur: number, trim: number) => (
    <Sequence from={from} durationInFrames={dur} layout="none">
      <Video src={staticFile("games/rhyme-time.mp4")} muted trimBefore={trim} style={{ position: "absolute", left: -CROP.x * k, top: -CROP.y * k, width: 1920 * k, height: 800 * k }} />
    </Sequence>
  );
  return (
    <Panel style={{ left: s.x - w / 2 + shake, top: s.y - (h + bar) / 2, width: w, height: h + bar, padding: 0, transform: `scaleY(${open})`, overflow: "hidden" }}>
      <div style={{ height: bar, display: "flex", alignItems: "center", paddingLeft: bar * 0.6, fontSize: bar * 0.45, letterSpacing: bar * 0.08, color: RIM, borderBottom: `3px solid ${RIM}55` }}>RHYME TIME</div>
      <div style={{ position: "relative", width: w, height: h, overflow: "hidden", background: "#170f2c" }}>
        {video(CLIP_A.from, CLIP_A.dur, 0)}
        {video(CLIP_B.from, CLIP_B.dur, CLIP_A.dur)}
        {wrong > 0 && (
          <div
            style={{
              position: "absolute",
              left: (DOG.x - CROP.x) * k,
              top: (DOG.y - CROP.y) * k,
              width: DOG.w * k,
              height: DOG.h * k,
              background: `rgba(255,90,110,${0.5 * wrong})`,
              border: `3px solid rgba(255,90,110,${wrong})`,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              paddingRight: 18,
              fontFamily: PIXEL,
              fontSize: DOG.h * k * 0.5,
              color: `rgba(255,255,255,${wrong})`,
            }}
          >
            X
          </div>
        )}
        {clear > 0 && (
          <AbsoluteFill style={{ background: `rgba(10,8,22,${0.92 * clear})`, justifyContent: "center", alignItems: "center", flexDirection: "column", fontFamily: PIXEL }}>
            <div style={{ fontSize: w * 0.075, color: C.gold, textShadow: `0 0 30px ${C.gold}, 6px 6px 0 #000`, opacity: clear, transform: `scale(${0.8 + 0.2 * clear})` }}>ROUND CLEAR</div>
            <div style={{ fontSize: w * 0.035, color: ACCENT.mint, marginTop: w * 0.03, opacity: interpolate(f, [CLEAR + 10, CLEAR + 20], [0, 1], clamp) }}>+400 WORDS</div>
          </AbsoluteFill>
        )}
        <AbsoluteFill style={{ background: "#fff", opacity: flash }} />
      </div>
    </Panel>
  );
};

// ---- Light, the first word, the tower ----------------------------------------------

const Light: React.FC<{ f: number; cam: Cam }> = ({ f, cam }) => {
  const out: React.ReactNode[] = [];
  // The game's mint light on her face while it's open.
  const lit = interpolate(f, [IN_RING - 10, WINDOW_OPEN, WINDOW_CLOSE, POUR], [0, 1, 1, 0], clamp);
  const face = toScreen(cam, hero(f).x, hero(f).y, 14);
  if (lit > 0 && face.d > 6 && !windowShot(f)) {
    out.push(
      <div
        key="lit"
        style={{
          position: "absolute",
          left: face.x - face.px * 22,
          top: face.y - face.px * 8,
          width: face.px * 44,
          height: face.px * 36,
          borderRadius: "50%",
          background: `radial-gradient(${ACCENT.mint}55, transparent 60%)`,
          mixBlendMode: "screen",
          opacity: lit * 0.45,
        }}
      />,
    );
  }
  // The door blazes when the round clears, then settles to a warm glow.
  const pour = interpolate(f, [POUR, POUR + 16, POUR + 70, POUR + 140], [0, 1, 1, 0.35], clamp);
  const door = toScreen(cam, DOOR.x, DOOR.y, 12);
  if (pour > 0 && door.d > 6) {
    const r = door.px * 70;
    out.push(
      <div key="pour" style={{ position: "absolute", left: door.x, top: door.y, opacity: pour, mixBlendMode: "screen" }}>
        <div style={{ position: "absolute", left: -r, top: -r, width: r * 2, height: r * 2, borderRadius: "50%", background: `radial-gradient(${C.cream}, ${ACCENT.mint}88 30%, transparent 70%)` }} />
        {Array.from({ length: 9 }, (_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: -door.px * 3,
              top: 0,
              width: door.px * 6,
              height: r * 1.8 * (0.7 + 0.3 * Math.sin(f / 7 + i)),
              background: `linear-gradient(${C.cream}cc, transparent)`,
              transformOrigin: "50% 0",
              transform: `rotate(${-70 + i * 17.5 + 180}deg)`,
            }}
          />
        ))}
      </div>,
    );
  }
  // The tower's window lights purple.
  const tw = towerWindow(cam, TOWER);
  const lamp = interpolate(f, [WINDOW_LIT, WINDOW_LIT + 6, WINDOW_LIT + 14, WINDOW_LIT + 40], [0, 1, 0.75, 0.9], clamp) * (0.9 + 0.1 * Math.sin(f / 5));
  if (tw && lamp > 0) {
    out.push(
      <div key="tower" style={{ position: "absolute", left: tw.x, top: tw.y, opacity: lamp }}>
        <div style={{ position: "absolute", left: -tw.px * 14, top: -tw.px * 14, width: tw.px * 28, height: tw.px * 28, borderRadius: "50%", background: "radial-gradient(#c77dffaa, #7b2cbf33 45%, transparent 70%)" }} />
        <div style={{ position: "absolute", left: -tw.px * 1.5, top: -tw.px * 2, width: tw.px * 3, height: tw.px * 4, background: "#e6b3ff", boxShadow: `0 0 ${tw.px * 3}px #c77dff` }} />
      </div>,
    );
  }
  return <>{out}</>;
};

const Overhead: React.FC<{ f: number; cam: Cam }> = ({ f, cam }) => {
  const h = hero(f);
  const pops: { from: number; to: number; kind: "sweat" | "sparkle" | "?" ; x: number; y: number; lift: number }[] = [
    { from: CLIP_A.from + CLIP_A.dur + 6, to: CLIP_B.from, kind: "sweat", x: h.x, y: h.y, lift: 26 },
    { from: 524, to: 560, kind: "sparkle", x: h.x, y: h.y, lift: 26 },
    { from: LINES[1].from - 2, to: LINES[1].from + LINES[1].dur, kind: "?", x: h.x, y: h.y, lift: 26 },
  ];
  const letter = toScreen(cam, DYS.x, DYS.y, 24);
  return (
    <>
      {pops
        .filter((p) => f >= p.from && f < p.to)
        .map((p, i) => {
          const s = toScreen(cam, p.x, p.y, p.lift);
          if (s.d < 6) return null;
          return (
            <div key={i} style={{ position: "absolute", left: s.x + s.px * 8, top: s.y - s.px * 10 }}>
              <EmoteIcon kind={p.kind} px={Math.max(3, Math.min(10, s.px * 0.5))} t={f - p.from} />
            </div>
          );
        })}
      {/* The first word she won, hanging in the air until it bursts into Dyslexi */}
      {letter.d > 6 && f >= BIRTH && f < BIRTH + BIRTH_FRAMES && <DyslexiBirth t={f - BIRTH} f={f} x={letter.x} y={letter.y} />}
    </>
  );
};

// ---- Sound ------------------------------------------------------------------------

const ChapterSound: React.FC = () => {
  const sfx = (name: string, from: number, volume: number, dur = 60) => (
    <Sequence key={`${name}-${from}`} from={from} durationInFrames={dur} name={`🔊 ${name}`}>
      <Audio src={staticFile(`sfx/${name}.mp3`)} volume={volume} />
    </Sequence>
  );
  return (
    <>
      <Sequence durationInFrames={FIRST_WORDS_FRAMES} name="🔊 morning wind">
        <Audio src={staticFile("sfx/ambience.mp3")} loop volume={(f) => interpolate(f, [0, 20, FIRST_WORDS_FRAMES - 30, FIRST_WORDS_FRAMES], [0, 0.2, 0.2, 0], clamp)} />
      </Sequence>
      {/* Rhyme Time's own music while the game is open */}
      <Sequence from={WINDOW_OPEN - 10} durationInFrames={POUR + 30 - WINDOW_OPEN} name="♪ rhyme time">
        <Audio src={staticFile("music/rhymetime_music.mp3")} volume={(f) => interpolate(f, [0, 20, POUR - WINDOW_OPEN, POUR + 30 - WINDOW_OPEN], [0, 0.35, 0.35, 0], clamp)} />
      </Sequence>
      {sfx("ui-boot", WINDOW_OPEN - 4, 0.5)}
      {sfx("shield-hit", FUMBLE, 0.3, 30)}
      {CORRECT.map((at) => sfx("ui-blip", at, 0.6, 20))}
      {sfx("ui-blip", CLEAR, 0.7, 20)}
      {sfx("summon", POUR, 0.5, 90)}
      {sfx("ui-blip", POPUPS[0].at, 0.5, 15)}
      {sfx("charge-up", BIRTH, 0.35, 45)}
      {sfx("shockwave", BIRTH + 34, 0.3, 45)}
      <Sequence from={LEVEL} durationInFrames={90} name="♪ level up">
        <Audio src={staticFile("music/levelup-sound.mp3")} volume={0.6} />
      </Sequence>
      {POPUPS.slice(1).map((p) => sfx("ui-blip", p.at, 0.45, 15))}
      {/* The Wizard felt it: the mystery drone creeps back in */}
      <Sequence from={TURN - 20} durationInFrames={FIRST_WORDS_FRAMES - TURN + 20} name="♪ mystery">
        <Audio src={staticFile("music/mystery-drone.mp3")} volume={(f) => interpolate(f, [0, 60, FIRST_WORDS_FRAMES - TURN - 10, FIRST_WORDS_FRAMES - TURN + 20], [0, 0.6, 0.6, 0], clamp)} />
      </Sequence>
      {sfx("charge-up", WINDOW_LIT - 8, 0.25, 40)}
    </>
  );
};

// ---- The chapter ------------------------------------------------------------------

export const FirstWords: React.FC = () => {
  const f = useCurrentFrame();
  const cam = lookAt(camAt(f));
  const fade = interpolate(f, [0, 12, FIRST_WORDS_FRAMES - 30, FIRST_WORDS_FRAMES], [1, 0, 0, 1], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Pov
        cam={cam}
        actors={actorsAt(f, cam)}
        sky="dawn"
        drain={DRAIN}
        scorch={SCORCH}
        glow={{ "rhyme-time": ringGlow(f) }}
        bloom={{ x: DOOR.x, y: -700, r: bloomR(f), k: bloomR(f) > 0 ? 1 : 0 }}
        dof={0.7}
        tower={TOWER}
      >
        <Light f={f} cam={cam} />
        <GameWindow f={f} cam={cam} />
        <Overhead f={f} cam={cam} />
        <ChapterCard t={f} n={2} title="First Words" />
        {LINES.map((l) => (
          <Dialogue key={l.from} speaker={l.who} text={l.text} t={f - l.from} dur={l.dur} color={l.who === "Dyslexi" ? DYSLEXI_COLOR : C.lilac} />
        ))}
        {POPUPS.map((p, i) => (
          <HudPopup key={p.at} t={f - p.at} p={p} slot={i === 2 ? 1 : 0} />
        ))}
        <LevelUp t={f - LEVEL} level={2} />
        <ChapterSound />
      </Pov>
      <AbsoluteFill style={{ background: "#000", opacity: fade, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
