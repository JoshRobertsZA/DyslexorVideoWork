import React from "react";
import { AbsoluteFill, Easing, interpolate, random, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { Dialogue } from "../lore/parts";
import { BODY, C } from "../theme";
import { ACT1_SHOTS } from "./config";
import { DarkWizard, WIZ } from "./DarkWizard";
import { Footage } from "./Footage";
import { AvatarSprite } from "./parts";
import { Actor, Cam, idleCol, Pov } from "./realm/Pov";
import { DRAIN, HOUSES, SCORCH } from "./realm/world";
import { Bricks } from "./Tower";
import { villageActors } from "./Village";

// The pilot's ending (docs/SEASON-1.md): suspense. Far away, at the top of
// his tower, the Dark Wizard watches Hero's first win in his orb. A voice in
// the shadows says it knows her. A hooded figure steps into the torchlight:
// a boy from her own class, the quiet one at the back who struggles to read
// too and heard the chime at the same moment she did. The Wizard got to him
// first. The hood comes down; a flash of the classroom; "my apprentice".
// To be continued.
//
// The lines are text only for now, timed to be read comfortably, until
// they're recorded.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const LAIR_FRAMES = 900;

// ---- Beats -----------------------------------------------------------------------

const IN = 24;
const VISION = { from: 34, open: 64 };
const VOICE = 214;
const STEP = { from: 250, to: 330 };
const HOOD = 566;
const FLASH = { from: 576, to: 606 };
const CLOSE = { from: 720, to: 820 };
const END = 830;

type Who = "wizard" | "boy";
type Line = { from: number; dur: number; who: Who; text: string };
const LINES: Line[] = [
  { from: 76, dur: 120, who: "wizard", text: "So. Rowan found himself a reader." },
  { from: VOICE, dur: 64, who: "boy", text: "...I know her." },
  { from: 306, dur: 110, who: "wizard", text: "Of course you do. She sits in your class." },
  { from: 430, dur: 120, who: "boy", text: "She can't read either. Everyone laughed." },
  { from: 612, dur: 112, who: "wizard", text: "Then she won't last long. Not like you... my apprentice." },
];
const SPEAKER: Record<Who, string> = { wizard: "Dark Wizard", boy: "???" };
const TAG: Record<Who, string> = { wizard: "#ff6b78", boy: "#c9a8ff" };

// ---- The room --------------------------------------------------------------------

const P = 8;
const GW = 1920 / P;
const GH = 1080 / P;
const WIN = { x: 1260, y: 90, w: 400, h: 500 };
const WIZ_PX = 14;
const WIZ_FEET = { x: 1480, y: 930 };
const BOY_SCALE = 18;
const BOY_FEET = (f: number) => ({ x: interpolate(f, [STEP.from, STEP.to], [330, 720], { ...clamp, easing: Easing.out(Easing.quad) }), y: 900 });
// His sheet: the avatar layers in CLASSMATE_LOOK (config.ts), with short hair,
// no bow and an all-red hoodie (public/realm/classmate.png).
const CLASSMATE = ["realm/classmate.png"];

// The vision in his orb: the village from down the path, the lamps lit, the
// townsfolk cheering, and her at the top of it with Dyslexi.
const VISION_C = { x: 1080, y: 380, r: 230 };
const visionCam: Cam = { x: 14, y: -560, heading: Math.atan2(-14, 88), eye: 30, horizon: 150 };
const visionActors = (f: number): Actor[] => [
  ...villageActors(99999, () => 1).map((a) => (a.sheet === "lamp" || a.sheet === "rowan" ? a : { ...a, bubble: true })),
  { sheet: "hero", x: 0, y: -648, row: 0, col: idleCol(f), keep: true },
  { sheet: "dyslexi", x: 10, y: -640, row: 0, col: idleCol(f), lift: 16, size: 0.7, keep: true },
];

const Vision: React.FC<{ f: number }> = ({ f }) => {
  const open = interpolate(f, [VISION.from, VISION.open], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.3)) });
  if (open <= 0) return null;
  const r = VISION_C.r * open;
  const k = (r * 2) / 1080;
  return (
    <div
      style={{
        position: "absolute",
        left: VISION_C.x - r,
        top: VISION_C.y - r,
        width: r * 2,
        height: r * 2,
        borderRadius: "50%",
        overflow: "hidden",
        boxShadow: "0 0 60px 20px #7a3cffaa, inset 0 0 50px 20px #2a1445",
        border: "6px solid #b78cff",
      }}
    >
      <div style={{ position: "absolute", left: r - 960 * k, top: 0, width: 1920, height: 1080, transform: `scale(${k})`, transformOrigin: "0 0" }}>
        <Pov cam={visionCam} actors={visionActors(f)} sky="dawn" drain={DRAIN} scorch={SCORCH} bloom={{ x: HOUSES[0].x, y: -700, r: 180, k: 1 }} />
      </div>
      {/* The orb's purple, swirling over the picture */}
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `radial-gradient(transparent 50%, #7a3cff66 100%)`, transform: `rotate(${f}deg)` }} />
    </div>
  );
};

// The boy in his cloak, the hood up until he lowers it.
const Boy: React.FC<{ f: number }> = ({ f }) => {
  const feet = BOY_FEET(f);
  const walking = f >= STEP.from && f < STEP.to;
  const lit = interpolate(f, [STEP.from + 20, STEP.to], [0.04, 0.95], clamp);
  const hood = interpolate(f, [HOOD, HOOD + 14], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const s = BOY_SCALE;
  const bob = walking ? -Math.abs(Math.sin(f / 4)) * 8 : 0;
  return (
    <div style={{ position: "absolute", left: feet.x - 24.5 * s, top: feet.y - 42 * s + bob, filter: `brightness(${lit}) drop-shadow(0 0 ${30 * lit}px #7a3cff66)` }}>
      {/* His cape, hanging behind him from the shoulders */}
      <svg width={48 * s} height={48 * s} viewBox="0 0 48 48" shapeRendering="crispEdges" style={{ position: "absolute", left: 0, top: 0 }}>
        <path d="M17 32 H32 V34 H33 V37 H34 V40 H35 V43 H14 V40 H15 V37 H16 V34 H17 Z" fill="#1d1426" />
        <path d="M14 43 H35 V44 H14 Z" fill="#3b2a55" />
      </svg>
      <div style={{ position: "absolute", left: 0, top: 0 }}>
        <AvatarSprite layers={CLASSMATE} row={0} scale={s} animFps={walking ? 10 : 5} />
      </div>
      <svg width={48 * s} height={48 * s} viewBox="0 0 48 48" shapeRendering="crispEdges" style={{ position: "absolute", left: 0, top: 0 }}>
        {/* The hood, a pointed cowl, sliding back off his head */}
        <g opacity={1 - hood} transform={`translate(0 ${hood * -6})`}>
          <path d="M15 35 V27 H16 V25 H17 V23 H19 V22 H21 V21 H23 V19 H26 V21 H28 V22 H30 V23 H32 V25 H33 V27 H34 V35 Z" fill="#1d1426" />
          <path d="M23 19 H26 V20 H23 Z M19 22 H21 V23 H19 Z M28 22 H30 V23 H28 Z" fill="#3b2a55" />
          {/* His face in the hood's shadow */}
          <path d="M19 26 H30 V34 H19 Z" fill="#0d0816" opacity={0.9} />
          <rect x={21} y={29} width={2} height={1} fill="#c9a8ff" opacity={0.7} />
          <rect x={26} y={29} width={2} height={1} fill="#c9a8ff" opacity={0.7} />
        </g>
      </svg>
    </div>
  );
};

const Room: React.FC<{ f: number }> = ({ f }) => {
  const lightning = interpolate((f % 190) - 150, [0, 2, 10], [0, 1, 0], clamp);
  return (
    <>
      <svg width={1920} height={1080} viewBox={`0 0 ${GW} ${GH}`} shapeRendering="crispEdges" style={{ position: "absolute", inset: 0 }}>
        <Bricks x={0} y={0} w={GW} h={100} base="#2b2438" mortar="#15101f" light="#3a3149" seed="lair-wall" />
        <rect x={0} y={100} width={GW} height={GH - 100} fill="#1c1626" />
        <rect x={0} y={99} width={GW} height={2} fill="#0b0712" />
        <rect x={WIN.x / P - 3} y={WIN.y / P - 3} width={WIN.w / P + 6} height={WIN.h / P + 3} fill="#0b0712" />
      </svg>
      <div style={{ position: "absolute", left: WIN.x, top: WIN.y, width: WIN.w, height: WIN.h, background: "linear-gradient(#1a0d2e, #3b1f5f)" }} />
      <div style={{ position: "absolute", left: WIN.x, top: WIN.y, width: WIN.w, height: WIN.h, background: "#e8d8ff", opacity: lightning * 0.7 }} />
      {/* Purple torchlight, and the dark corner he steps out of */}
      {[700, 1800].map((tx, i) => (
        <div key={tx} style={{ position: "absolute", left: tx - 180, top: 200, width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(#c77dff77, transparent 65%)", opacity: 0.8 + 0.2 * Math.sin(f / 3 + i) }} />
      ))}
      <div style={{ position: "absolute", left: -200, top: 0, width: 760, height: 1080, background: "linear-gradient(90deg, #000000ee, #00000088 60%, transparent)" }} />
      {/* The pit of stolen words */}
      <div style={{ position: "absolute", left: 760, top: 950, width: 560, height: 120, borderRadius: "50%", background: "radial-gradient(#000 40%, #2a1445 75%, #15101f 100%)", boxShadow: "0 0 40px #7a3cff66" }} />
      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2 + f / 30;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 1040 + Math.cos(a) * 230,
              top: 1010 + Math.sin(a) * 40,
              transform: "translate(-50%, -50%)",
              fontFamily: BODY,
              fontWeight: 700,
              fontSize: 26,
              color: C.gold,
              textShadow: `0 0 12px ${C.gold}`,
              opacity: 0.4 + 0.4 * Math.sin(a),
            }}
          >
            {String.fromCharCode(65 + Math.floor(random(`lp${i}`) * 26))}
          </div>
        );
      })}
    </>
  );
};

// ---- The scene -------------------------------------------------------------------

export const Lair: React.FC = () => {
  const f = useCurrentFrame();
  const fadeIn = interpolate(f, [0, IN], [0, 1], clamp);
  // A slow push on the room, then right in on the boy's face once the hood is
  // down, and back.
  const push = interpolate(f, [0, HOOD], [1, 1.06], clamp);
  const close = interpolate(f, [CLOSE.from, CLOSE.to], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const feet = BOY_FEET(f);
  // His face (the cell's rows ~26-32), brought to the middle of the frame.
  const face = { x: feet.x, y: feet.y - 13 * BOY_SCALE };
  const zoom = push * (1 + close * 1.2);
  const flash = f >= FLASH.from && f < FLASH.to;
  const toBlack = interpolate(f, [END - 10, END + 6], [0, 1], clamp);
  const cont = interpolate(f, [END + 10, END + 30], [0, 1], clamp);
  const orbRaise = interpolate(f, [VISION.from - 10, VISION.from], [0, 0.6], clamp) * interpolate(f, [VOICE - 10, VOICE + 10], [1, 0.3], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          opacity: fadeIn,
          transform: `translate(${(960 - face.x) * close}px, ${(440 - face.y) * close}px) scale(${zoom})`,
          transformOrigin: `${close > 0 ? face.x : 1100}px ${close > 0 ? face.y : 520}px`,
        }}
      >
        <Room f={f} />
        <div style={{ position: "absolute", left: WIZ_FEET.x - WIZ.cx * WIZ_PX, top: WIZ_FEET.y - WIZ.feet * WIZ_PX, filter: "drop-shadow(0 0 30px #7a3cffaa)" }}>
          <DarkWizard px={WIZ_PX} raise={orbRaise} orb={1.5 + orbRaise} eyes={1} />
        </div>
        <Vision f={f} />
        <Boy f={f} />
      </AbsoluteFill>
      {/* The classroom, for a moment: the same boy, looking up at the chime */}
      {flash && (
        <AbsoluteFill style={{ filter: "grayscale(0.6) contrast(1.1)" }}>
          <Sequence from={FLASH.from} durationInFrames={FLASH.to - FLASH.from} layout="none">
            <Footage shot={ACT1_SHOTS.find((s) => s.id === "c05")!} />
          </Sequence>
          <AbsoluteFill style={{ background: "#fff", opacity: interpolate(f, [FLASH.from, FLASH.from + 4], [0.8, 0], clamp) }} />
        </AbsoluteFill>
      )}
      {LINES.map((l) => (
        <Dialogue key={l.from} speaker={SPEAKER[l.who]} text={l.text} t={f - l.from} dur={l.dur} color={TAG[l.who]} readable />
      ))}
      <AbsoluteFill style={{ background: "#000", opacity: toBlack }} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: cont }}>
        <div style={{ fontFamily: BODY, fontStyle: "italic", fontWeight: 500, fontSize: 64, color: C.cream, letterSpacing: 2 }}>To be continued...</div>
      </AbsoluteFill>

      {/* Sound: thunder and the drone; a sting as the hood comes down */}
      <Sequence durationInFrames={LAIR_FRAMES} name="♪ mystery">
        <Audio src={staticFile("music/mystery-drone.mp3")} volume={(t) => interpolate(t, [0, 30, END, LAIR_FRAMES], [0, 0.5, 0.5, 0], clamp)} />
      </Sequence>
      <Sequence durationInFrames={90} name="🔊 thunder">
        <Audio src={staticFile("sfx/thunder-strike.mp3")} volume={0.4} />
      </Sequence>
      <Sequence from={VISION.from} durationInFrames={60} name="🔊 the vision">
        <Audio src={staticFile("sfx/summon.mp3")} volume={0.35} />
      </Sequence>
      <Sequence from={HOOD - 4} durationInFrames={60} name="🔊 reveal">
        <Audio src={staticFile("sfx/staff-slam.mp3")} volume={0.5} />
      </Sequence>
      <Sequence from={END} durationInFrames={70} name="🔊 to be continued">
        <Audio src={staticFile("sfx/charge-up.mp3")} volume={0.25} />
      </Sequence>
    </AbsoluteFill>
  );
};
