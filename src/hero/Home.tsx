import React from "react";
import { AbsoluteFill, Easing, interpolate, random, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { Sprite } from "../components/Sprite";
import { Dialogue } from "../lore/parts";
import { BODY, C, TITLE } from "../theme";
import { ACCENT, HOME_SHOTS, VILLAGE_FRAMES } from "./config";
import { Footage } from "./Footage";
import { DYSLEXI_COLOR, DyslexiBuddy } from "./hud/Dyslexi";
import { linear } from "./parts";
import { Cam, Pov, idleCol, toScreen, towerWindow } from "./realm/Pov";
import { RealCard } from "./realm/swim";
import { DRAIN, LAMPS, SCORCH, SHEETS } from "./realm/world";
import { villageActors } from "./Village";

// Scenes 10 and 11 of Episode 1 (docs/EPISODE-1.md): home again, and the
// sting. The stolen words fly home over the realm like a flock of golden
// birds: every lamp relights, the colour floods back, the townsfolk cheer.
// Hero walks up the path to Rowan, whole and in colour again. A portal home
// opens; she says goodbye to Dyslexi and steps through. Back at game night,
// her friends hand her the card, and she reads it out loud, slowly, all the
// way through. Then her phone buzzes (Dyslexi, waving), far off the tower's
// window glows, and the title.
//
// The realm lines are text only for now; the home scenes are AI live-action
// slots (HOME_SHOTS in config.ts, prompts in docs/AI-SHOTS.md) until the
// clips exist.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ---- Beats -----------------------------------------------------------------------

// The village saved (first person).
const FLOCK = { from: 10, to: 170 };
const LAMP_ON = (i: number) => 76 + i * 11;
const COLOUR = { from: 96, to: 220 };
const CHEER = { from: 120, to: 340 };
const WALK = { from: 150, to: 330 };
const PORTAL = { open: 650, turn: 690, step: 880, white: 940 };
// Home (live action), then the sting.
const HOME = 960;
const SHOT_AT: number[] = [];
{
  let t = HOME;
  for (const s of HOME_SHOTS) {
    SHOT_AT.push(t);
    t += s.frames;
  }
}
const SHOTS_END = SHOT_AT[SHOT_AT.length - 1] + HOME_SHOTS[HOME_SHOTS.length - 1].frames;
// The card, close: she reads it a chunk at a time and the letters settle.
const CARD = { from: SHOT_AT[2] + 90, dur: 220 };
const READ_AT = [CARD.from + 40, CARD.from + 90, CARD.from + 140, CARD.from + 178];
const CHEERS_AT = CARD.from + CARD.dur;
const PHONE = { from: SHOTS_END, dur: 110 };
const TOWER_SHOT = { from: PHONE.from + PHONE.dur, dur: 120 };
const TITLE_CARD = { from: TOWER_SHOT.from + TOWER_SHOT.dur, dur: 150 };
export const HOME_FRAMES = TITLE_CARD.from + TITLE_CARD.dur;

type Who = "hero" | "rowan" | "dyslexi" | "guard" | "wizard";
type Line = { from: number; dur: number; who: Who; text: string };
const LINES: Line[] = [
  { from: 200, dur: 84, who: "guard", text: "Three cheers for the Reader!" },
  { from: 344, dur: 84, who: "rowan", text: "You saved us all." },
  { from: 436, dur: 92, who: "hero", text: "I just read one word at a time." },
  { from: 536, dur: 104, who: "rowan", text: "That's all reading ever is." },
  { from: 708, dur: 92, who: "dyslexi", text: "You'll come back... right?" },
  { from: 806, dur: 72, who: "hero", text: "Try and stop me." },
];
const SPEAKER: Record<Who, string> = { hero: "Hero", rowan: "Elder Rowan", dyslexi: "Dyslexi", guard: "Guard", wizard: "Dark Wizard" };
const TAG: Record<Who, string> = { hero: C.lilac, rowan: C.gold, dyslexi: DYSLEXI_COLOR, guard: "#9fb4ff", wizard: "#ff6b78" };

// ---- The village saved -------------------------------------------------------------

const MEET_Y = -405;
const PORTAL_AT = { x: 34, y: -440 };
const camAt = (f: number): Cam => {
  const y = linear(f, [
    [WALK.from, 120],
    [WALK.to, MEET_Y],
    [PORTAL.step, MEET_Y],
    [PORTAL.white, -432],
  ]);
  const x = linear(f, [
    [PORTAL.step, 0],
    [PORTAL.white, PORTAL_AT.x - 6],
  ]);
  const walking = (f > WALK.from && f < WALK.to) || (f > PORTAL.step && f < PORTAL.white);
  const step = walking ? Math.sin((f / 30) * Math.PI * 4) : 0;
  // Looking up at the flock crossing the sky, then down the path.
  const up = interpolate(f, [0, FLOCK.to, FLOCK.to + 40], [1, 1, 0], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const toPortal = Math.atan2(PORTAL_AT.x - 0, -(PORTAL_AT.y - MEET_Y));
  const heading = interpolate(f, [PORTAL.turn, PORTAL.turn + 40], [0, toPortal], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  // Pushing in on Rowan while they talk, at his level.
  const push = Math.min(interpolate(f, [340, 420], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) }), interpolate(f, [PORTAL.open - 20, PORTAL.turn], [1, 0], clamp));
  return { x, y, heading, eye: 26 - 10 * push + step * 0.7, horizon: 120 + 120 * up + step * 2, focal: 457 + 230 * push };
};

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

// The stolen words coming home: a flock of golden letters across the sky.
const Flock: React.FC<{ f: number }> = ({ f }) => (
  <>
    {Array.from({ length: 70 }, (_, i) => {
      const t = (f - FLOCK.from - (i % 14) * 6) / 90;
      if (t < 0 || t > 1) return null;
      const lane = random(`hf-l${i}`);
      const x = -100 + t * 2200;
      const y = 120 + lane * 380 + Math.sin(t * 6 + i) * 30 + t * 120;
      const ch = String.fromCharCode(65 + Math.floor(random(`hf-c${i}`) * 26));
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: x,
            top: y,
            transform: `translate(-50%, -50%) rotate(${Math.sin(t * 8 + i) * 18}deg)`,
            fontFamily: BODY,
            fontWeight: 700,
            fontSize: 28 + lane * 34,
            color: C.gold,
            textShadow: `0 0 16px ${C.gold}`,
            opacity: Math.sin(t * Math.PI),
          }}
        >
          {ch}
        </div>
      );
    })}
  </>
);

// The way home: a mint doorway of light, like the one she fell through.
const Portal: React.FC<{ f: number; cam: Cam }> = ({ f, cam }) => {
  const open = interpolate(f, [PORTAL.open, PORTAL.open + 30], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
  if (open <= 0) return null;
  const s = toScreen(cam, PORTAL_AT.x, PORTAL_AT.y, 0);
  if (s.d < 2) return null;
  const w = 26 * s.px * open;
  const h = 46 * s.px;
  const stepF = Math.floor(f / 3) * 3;
  return (
    <div
      style={{
        position: "absolute",
        left: s.x - w / 2,
        top: s.y - h,
        width: w,
        height: h,
        overflow: "hidden",
        border: `${Math.max(4, s.px)}px solid ${ACCENT.mint}`,
        boxShadow: `0 0 60px 16px ${ACCENT.mint}99`,
        background: `radial-gradient(ellipse, ${C.cream} 12%, ${ACCENT.mint} 50%, #1d5a4c 100%)`,
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
              border: `${Math.max(3, s.px * 0.5)}px solid ${[ACCENT.mint, ACCENT.lavender, ACCENT.peach][i % 3]}`,
              opacity: (1 - t) * 0.7,
            }}
          />
        );
      })}
    </div>
  );
};

const Village: React.FC<{ f: number }> = ({ f }) => {
  if (f >= HOME) return null;
  const cam = camAt(f);
  const drain = interpolate(f, [COLOUR.from, COLOUR.to], [DRAIN, 0], clamp);
  const cheering = f >= CHEER.from && f < CHEER.to;
  const actors = villageActors(VILLAGE_FRAMES + 99999, (i) => lampLit(i, f)).map((a) =>
    a.sheet === "rowan" ? { ...a, row: 0, col: idleCol(f), flip: false } : a.sheet === "lamp" ? a : { ...a, bubble: cheering },
  );
  const talking = LINES.some((l) => l.who === "dyslexi" && f >= l.from && f < l.from + l.dur - 16);
  const white = interpolate(f, [PORTAL.step + 30, PORTAL.white], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  return (
    <AbsoluteFill>
      <Pov cam={cam} actors={actors} sky="dawn" drain={drain} scorch={SCORCH}>
        <LampGlows f={f} cam={cam} />
        <Flock f={f} />
        <Portal f={f} cam={cam} />
        <DyslexiBuddy f={f} x={1640} y={560} scale={6} talking={talking} />
        {LINES.map((l) => (
          <Dialogue key={l.from} speaker={SPEAKER[l.who]} text={l.text} t={f - l.from} dur={l.dur} color={TAG[l.who]} at={l.who === "hero" ? "top" : "bottom"} readable />
        ))}
      </Pov>
      <AbsoluteFill style={{ background: "#fff", opacity: white }} />
    </AbsoluteFill>
  );
};

// ---- Home (live action) ----------------------------------------------------------

// Film-style subtitles for the real world (no game boxes here).
const Sub: React.FC<{ f: number; from: number; to: number; text: string }> = ({ f, from, to, text }) => {
  const a = interpolate(f, [from, from + 6, to - 8, to], [0, 1, 1, 0], clamp);
  if (a <= 0) return null;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 80 }}>
      <div style={{ fontFamily: BODY, fontWeight: 500, fontSize: 50, color: C.cream, padding: "12px 34px", borderRadius: 16, background: "rgba(8,6,20,0.55)", textShadow: "0 2px 0 #000", opacity: a }}>{text}</div>
    </AbsoluteFill>
  );
};

// The card, close, in her hands: a real card now. The letters swim, then
// settle a chunk at a time as she reads it.
const CardInsert: React.FC<{ f: number }> = ({ f }) => {
  const t = f - CARD.from;
  if (t < 0 || t >= CARD.dur) return null;
  const whole = f >= READ_AT[3];
  const read = READ_AT.slice(0, 3).filter((r) => f >= r).length;
  const fade = interpolate(t, [0, 10, CARD.dur - 10, CARD.dur], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <RealCard f={f} settled={[0, 1, 2].map((i) => f >= READ_AT[i])} mark={!whole && read > 0 ? read - 1 : -1} />
      {whole && <AbsoluteFill style={{ background: `radial-gradient(${C.gold}55, transparent 60%)`, opacity: interpolate(f, [READ_AT[3], READ_AT[3] + 6, READ_AT[3] + 30], [0, 1, 0.4], clamp) }} />}
    </AbsoluteFill>
  );
};

const HomeScenes: React.FC<{ f: number }> = ({ f }) => {
  if (f < HOME || f >= SHOTS_END) return null;
  return (
    <AbsoluteFill>
      {HOME_SHOTS.map((s, i) => (
        <Sequence key={s.id} from={SHOT_AT[i]} durationInFrames={s.frames} layout="none">
          <Footage shot={s} />
        </Sequence>
      ))}
      <CardInsert f={f} />
      <Sub f={f} from={SHOT_AT[1] + 20} to={SHOT_AT[1] + 100} text={'"Welcome back. Would you like to try again?"'} />
      <Sub f={f} from={READ_AT[0]} to={READ_AT[3] + 40} text={["Ad...", "Ad... ven...", "Ad... ven... ture...", "Adventure!"][READ_AT.filter((r) => f >= r).length - 1] ?? ""} />
      {/* Out of the white she came through */}
      <AbsoluteFill style={{ background: "#fff", opacity: interpolate(f, [HOME, HOME + 24], [1, 0], clamp) }} />
    </AbsoluteFill>
  );
};

// ---- The sting -------------------------------------------------------------------

// Her phone on the couch: Dyslexi, waving from the lock screen.
const PhoneSting: React.FC<{ f: number }> = ({ f }) => {
  const t = f - PHONE.from;
  if (t < 0 || t >= PHONE.dur) return null;
  const buzz = t < 30 ? Math.sin(t * 3) * 6 * (1 - t / 30) : 0;
  const on = interpolate(t, [8, 14], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, #3a2f4a, #120c18 80%)" }}>
      <div
        style={{
          position: "absolute",
          left: 960 - 230 + buzz,
          top: 120,
          width: 460,
          height: 860,
          borderRadius: 60,
          background: "#0c0e19",
          boxShadow: "0 30px 80px rgba(0,0,0,0.6), inset 0 0 0 6px #2a2440",
          transform: "rotate(-6deg)",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: 18, borderRadius: 44, background: `linear-gradient(#2a1838, #5b3a75)`, opacity: on, overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 70, width: "100%", textAlign: "center", fontFamily: BODY, fontWeight: 300, fontSize: 96, color: C.cream }}>10:42</div>
          <div style={{ position: "absolute", left: 212 - 25 * 8, top: 470 - 31 * 8 - Math.abs(Math.sin(t / 4)) * 16 }}>
            <Sprite src={SHEETS.dyslexi} row={0} scale={8} animFps={10} />
          </div>
          <div style={{ position: "absolute", top: 600, width: "100%", textAlign: "center", fontFamily: BODY, fontWeight: 700, fontSize: 40, color: C.gold, opacity: interpolate(t, [30, 40], [0, 1], clamp) }}>
            Hi, Hero!
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Far off in the realm, at dusk: the tower's window lights purple.
const TowerSting: React.FC<{ f: number }> = ({ f }) => {
  const t = f - TOWER_SHOT.from;
  if (t < 0 || t >= TOWER_SHOT.dur) return null;
  const cam: Cam = { x: -560, y: -980, heading: Math.PI * 2 - 0.6, eye: 26, horizon: 250, focal: 1150 + t * 2 };
  const tw = towerWindow(cam, -0.6);
  const lamp = interpolate(t, [30, 36, 44, 70], [0, 1, 0.75, 0.9], clamp);
  const fade = interpolate(t, [0, 12, TOWER_SHOT.dur - 16, TOWER_SHOT.dur], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <Pov cam={cam} sky="dusk" tower={-0.6}>
        <AbsoluteFill style={{ background: "linear-gradient(#1a0d2e, #3b1f5f 60%, #2a1445)", mixBlendMode: "multiply", opacity: 0.4 }} />
        {tw && lamp > 0 && (
          <div style={{ position: "absolute", left: tw.x, top: tw.y, opacity: lamp }}>
            <div style={{ position: "absolute", left: -tw.px * 14, top: -tw.px * 14, width: tw.px * 28, height: tw.px * 28, borderRadius: "50%", background: "radial-gradient(#c77dffaa, #7b2cbf33 45%, transparent 70%)" }} />
            <div style={{ position: "absolute", left: -tw.px * 1.5, top: -tw.px * 2, width: tw.px * 3, height: tw.px * 4, background: "#e6b3ff", boxShadow: `0 0 ${tw.px * 3}px #c77dff` }} />
          </div>
        )}
        <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 140 }}>
          <div style={{ fontFamily: BODY, fontStyle: "italic", fontWeight: 500, fontSize: 64, color: "#e8d8ff", textShadow: "0 0 30px #7a3cff, 0 3px 0 #000", opacity: interpolate(t, [50, 62, 104, 116], [0, 1, 1, 0], clamp) }}>
            ...Reader.
          </div>
        </AbsoluteFill>
      </Pov>
    </AbsoluteFill>
  );
};

const TitleCard: React.FC<{ f: number }> = ({ f }) => {
  const t = f - TITLE_CARD.from;
  if (t < 0) return null;
  const a = interpolate(t, [10, 40], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const sub = interpolate(t, [44, 64], [0, 1], clamp);
  const out = interpolate(t, [TITLE_CARD.dur - 24, TITLE_CARD.dur], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ background: "#000", justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 30, opacity: out }}>
      <div style={{ fontFamily: TITLE, fontSize: 200, color: C.gold, letterSpacing: 10, textShadow: `10px 10px 0 ${C.plum}`, opacity: a, transform: `scale(${1.1 - a * 0.1})` }}>DYSLEXOR</div>
      <div style={{ fontFamily: BODY, fontWeight: 500, fontSize: 48, color: C.cream, opacity: sub, letterSpacing: 2 }}>Episode 1 · The Stolen Words</div>
    </AbsoluteFill>
  );
};

// ---- Sound -----------------------------------------------------------------------

const HomeSound: React.FC = () => {
  const sfx = (name: string, from: number, volume: number, dur = 40) => (
    <Sequence key={`${name}-${from}`} from={from} durationInFrames={dur} name={`🔊 ${name}`}>
      <Audio src={staticFile(`sfx/${name}.mp3`)} volume={volume} />
    </Sequence>
  );
  return (
    <>
      {/* The realm theme carries on from the tower and swells as the colour comes back. */}
      <Sequence durationInFrames={HOME} name="♪ realm theme">
        <Audio src={staticFile("music/background-music.mp3")} trimBefore={760} volume={(t) => interpolate(t, [0, COLOUR.from, COLOUR.to, PORTAL.step, HOME], [0.35, 0.35, 0.5, 0.4, 0], clamp)} />
      </Sequence>
      {sfx("summon", FLOCK.from + 20, 0.45, 70)}
      {LAMPS.map((_, i) => sfx("ui-blip", LAMP_ON(i), 0.25, 12))}
      {sfx("summon", PORTAL.open, 0.5, 60)}
      {sfx("teleport", PORTAL.step + 30, 0.4, 50)}
      {/* Home: quiet, then the friends' cheer swells into the end theme */}
      {sfx("ui-blip", READ_AT[3], 0.5, 15)}
      <Sequence from={CHEERS_AT - 10} durationInFrames={HOME_FRAMES - CHEERS_AT + 10} name="♪ end theme">
        <Audio src={staticFile("music/rebirth-background-music.mp3")} volume={(t) => interpolate(t, [0, 30, TOWER_SHOT.from - CHEERS_AT, TOWER_SHOT.from - CHEERS_AT + 20, TITLE_CARD.from - CHEERS_AT, HOME_FRAMES - CHEERS_AT], [0, 0.45, 0.45, 0.1, 0.5, 0], clamp)} />
      </Sequence>
      {sfx("ui-boot", PHONE.from, 0.4, 30)}
      {sfx("thunder-strike", TOWER_SHOT.from + 20, 0.3, 80)}
    </>
  );
};

// ---- The scene -------------------------------------------------------------------

export const Home: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Village f={f} />
      <HomeScenes f={f} />
      <PhoneSting f={f} />
      <TowerSting f={f} />
      <TitleCard f={f} />
      <HomeSound />
    </AbsoluteFill>
  );
};
