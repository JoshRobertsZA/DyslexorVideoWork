import React from "react";
import { AbsoluteFill, Easing, interpolate, random, Sequence, useCurrentFrame } from "remotion";
import { Dialogue } from "../lore/parts";
import { C, PIXEL } from "../theme";
import { ARRIVAL_FRAMES, HERO_LOOK, HERO_NAME, OUTFIT, REAL_HAND, SKIN } from "./config";
import { Footage } from "./Footage";
import { HeroSprite, RealmTitle, track } from "./parts";
import { villageActors } from "./Village";
import { HandPose } from "./realm/hands";
import { Cam, LH, Pov } from "./realm/Pov";

// Act 3. Out of the white, Hero opens her eyes under the trees, looks down
// into the realm, raises one blocky hand, then the other, pulls out her phone
// and sees herself 8-bit on the front camera. Then she starts walking.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

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
const LINES = [
  { from: 605, dur: 75, text: "Wait... is that me?" },
  { from: 682, dur: 63, text: "I'm... 8-bit?!" },
];
// Sets off walking, and is at the Village's pace when the act ends.
const WALK = { from: 690, to: ARRIVAL_FRAMES };

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
    <AbsoluteFill style={{ transform: `translateY(${-lift}px)` }}>
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

export const Arrival: React.FC = () => {
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
  const white = interpolate(f, [0, 30], [1, 0], clamp);
  const hands = [leftHand(f), rightHand(f)].filter((h): h is HandPose => h !== null);
  const phone = phoneLift(f);
  // Fades in here and out in the Village, so it carries across the join.
  const title = interpolate(f, [PHONE.down + 12, PHONE.down + 32], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Pov
        cam={{
          x: 0,
          y: posY,
          heading: sway,
          eye: 26 + walk * 0.7,
          horizon: hz + walk * 2,
        }}
        actors={villageActors(f - ARRIVAL_FRAMES)}
        hands={hands}
      >
        <Canopy lift={interpolate(hz, [128, 620], [900, 0], clamp)} />
        <RealmTitle opacity={title} />
        {phone > 0 && <Phone lift={phone} cam={{ x: 0, y: posY, heading: sway }} />}
        {LINES.map((l) => (
          <Dialogue key={l.from} speaker={HERO_NAME} text={l.text} t={f - l.from} dur={l.dur} color={C.lilac} at="top" />
        ))}
      </Pov>

      {REAL_HAND.src && (
        <Sequence from={HAND_IN - 20} durationInFrames={REAL_HAND.frames} name="Real hand → pixels">
          <RealHandDissolve />
        </Sequence>
      )}

      {/* Eyelids */}
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: `${(1 - open) * 52}%`, background: "#000", borderRadius: "0 0 50% 50% / 0 0 30% 30%" }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: `${(1 - open) * 52}%`, background: "#000", borderRadius: "50% 50% 0 0 / 30% 30% 0 0" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: "#fff", opacity: white }} />
    </AbsoluteFill>
  );
};

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
  const hopT = f - LINES[1].from;
  const hop = hopT >= 0 && hopT < 16 ? (Math.floor(hopT / 4) % 2 === 0 ? -2 : -1) * 7 : 0;
  return (
    <div style={{ position: "absolute", left, top, width: PH.w * U, height: PH.h * U }}>
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
      <Pov cam={{ ...cam, horizon: 150 }} actors={villageActors(f - ARRIVAL_FRAMES)} />
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
