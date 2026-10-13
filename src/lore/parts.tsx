import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { loadFont as loadCinzel } from "@remotion/google-fonts/Cinzel";
import { Sprite } from "../components/Sprite";
import { C, PIXEL } from "../theme";

export const EPIC = loadCinzel("normal", { weights: ["400", "700"], subsets: ["latin"] }).fontFamily;

// Same values as lib/realm's water/sand constants.
export const SEA = {
  deep: "#31648f",
  water: "#3f7fb0",
  shallow: "#5aa3cd",
  wetSand: "#c2a877",
  sand: "#e0c894",
  foam: "#e9f6ff",
};

export const ROWAN = "realm/villager.png";

// The realm has no princess sheet, so she's stacked from the avatar layers
// in the same order the app draws them: skin, hair, outfit, hat.
const PRINCESS_LAYERS = [
  "realm/princess/skin-tone2.png",
  "realm/princess/hair-blonde.png",
  "realm/princess/outfit-pink.png",
  "realm/princess/extra-hat-champion-crown.png",
];

export const Princess: React.FC<{ row: number; scale: number; flip?: boolean; animFps?: number }> = ({
  row,
  scale,
  flip,
  animFps = 8,
}) => (
  <div style={{ position: "relative", width: 48 * scale, height: 48 * scale, transform: flip ? "scaleX(-1)" : undefined }}>
    {PRINCESS_LAYERS.map((src) => (
      <Sprite key={src} src={src} row={row} scale={scale} animFps={animFps} style={{ position: "absolute", left: 0, top: 0 }} />
    ))}
  </div>
);

// Pixel sailboat, drawn in "art pixels" so it matches the 48px sprites.
// Passengers render between the sail and the hull so the hull hides their legs.
export const Boat: React.FC<{ px: number; children?: React.ReactNode; lantern?: number }> = ({ px, children, lantern = 0 }) => {
  const frame = useCurrentFrame();
  const W = 46;
  const H = 40;
  const sway = Math.sin(frame / 14) * 1.2;
  const flutter = Math.floor(frame / 6) % 2;
  return (
    <div style={{ position: "relative", width: W * px, height: H * px, transform: `rotate(${sway}deg)` }}>
      {/* Mast + sail + pennant */}
      <svg width={W * px} height={H * px} viewBox={`0 0 ${W} ${H}`} shapeRendering="crispEdges" style={{ position: "absolute", inset: 0 }}>
        <rect x={22} y={1} width={2} height={29} fill="#5c3520" />
        <rect x={24} y={1} width={6 + flutter} height={2} fill={C.gold} />
        <rect x={24} y={3} width={4} height={1} fill="#c99a2e" />
        <path d="M24 5 L24 25 L39 25 Z" fill={C.cream} />
        <path d="M24 5 L24 25 L28 25 L26 9 Z" fill="#e6d9bf" />
        <path d="M21 7 L21 25 L10 25 Z" fill="#f3e8d2" />
        {/* Open-book emblem on the main sail */}
        <rect x={27} y={18} width={3} height={3} fill={C.purple} />
        <rect x={31} y={18} width={3} height={3} fill={C.purple} />
        <rect x={30} y={18} width={1} height={4} fill={C.gold} />
      </svg>
      {children}
      {/* Hull, in front of the passengers */}
      <svg width={W * px} height={H * px} viewBox={`0 0 ${W} ${H}`} shapeRendering="crispEdges" style={{ position: "absolute", inset: 0 }}>
        <rect x={3} y={27} width={40} height={2} fill={C.gold} />
        <rect x={2} y={29} width={42} height={4} fill="#9b6337" />
        <rect x={4} y={33} width={38} height={3} fill="#7a4a2b" />
        <rect x={7} y={36} width={32} height={2} fill="#5c3520" />
        <rect x={0} y={27} width={3} height={3} fill="#9b6337" />
        <rect x={43} y={26} width={3} height={3} fill="#9b6337" />
        <rect x={10} y={31} width={2} height={2} fill="#3a2316" />
        <rect x={34} y={31} width={2} height={2} fill="#3a2316" />
        {/* Lantern on the stern */}
        <rect x={4} y={22} width={1} height={5} fill="#3a2316" />
        <rect x={3} y={20} width={3} height={3} fill="#ffd36b" />
      </svg>
      {lantern > 0 && (
        <div
          style={{
            position: "absolute",
            left: 4.5 * px - 160,
            top: 21.5 * px - 160,
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,214,120,0.55), rgba(255,214,120,0) 70%)",
            opacity: lantern * (0.85 + 0.15 * Math.sin(frame / 4)),
            mixBlendMode: "screen",
          }}
        />
      )}
    </div>
  );
};

// Rowan behind the mast, the princess at the bow, feet hidden by the hull.
export const Passengers: React.FC<{ px: number; flip?: boolean }> = ({ px, flip }) => (
  <>
    <div style={{ position: "absolute", left: -11 * px, top: -6 * px }}>
      <Sprite src={ROWAN} row={1} scale={px} animFps={5} flip={flip} />
    </div>
    <div style={{ position: "absolute", left: 7 * px, top: -5 * px }}>
      <Princess row={1} scale={px} animFps={5} flip={flip} />
    </div>
  </>
);

// Little light dashes drifting across the water.
export const Waves: React.FC<{ seed: string; count: number; area: { x: number; y: number; w: number; h: number }; px?: number }> = ({
  seed,
  count,
  area,
  px = 4,
}) => {
  const frame = useCurrentFrame();
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const x = area.x + random(`${seed}x${i}`) * area.w + Math.sin(frame / 25 + i) * 12;
        const y = area.y + random(`${seed}y${i}`) * area.h;
        const on = Math.sin(frame / 18 + i * 1.7) > -0.3;
        const len = 3 + Math.floor(random(`${seed}l${i}`) * 4);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: Math.round(x),
              top: Math.round(y),
              width: len * px,
              height: px,
              background: "rgba(220,240,255,0.55)",
              opacity: on ? 1 : 0,
              boxShadow: `${px}px ${px}px 0 rgba(20,50,90,0.25)`,
            }}
          />
        );
      })}
    </>
  );
};

// Realm-style dialogue box with a speaker tag and typewriter text.
export const Dialogue: React.FC<{ speaker: string; text: string; t: number; dur: number; color?: string; at?: "top" | "bottom" }> = ({
  speaker,
  text,
  t,
  dur,
  color = C.gold,
  at = "bottom",
}) => {
  if (t < 0 || t >= dur) return null;
  const shown = text.slice(0, Math.floor(t * 1.4));
  const pop = Math.min(1, t / 6);
  const out = Math.min(1, (dur - t) / 6);
  return (
    <AbsoluteFill
      style={
        at === "top"
          ? { justifyContent: "flex-start", alignItems: "center", paddingTop: 70 }
          : { justifyContent: "flex-end", alignItems: "center", paddingBottom: 60 }
      }
    >
      <div
        style={{
          width: 1400,
          minHeight: 190,
          background: "rgba(18,11,28,0.92)",
          border: `6px solid ${C.cream}`,
          outline: "6px solid #000",
          borderRadius: 14,
          padding: "46px 48px 34px",
          position: "relative",
          opacity: Math.min(pop, out),
          transform: `translateY(${(1 - pop) * 20}px)`,
          boxShadow: "12px 12px 0 rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -30,
            left: 36,
            background: color,
            color: C.ink,
            fontFamily: PIXEL,
            fontSize: 22,
            padding: "12px 18px",
            border: "4px solid #000",
          }}
        >
          {speaker}
        </div>
        <div style={{ fontFamily: PIXEL, fontSize: 30, lineHeight: 1.7, color: C.cream }}>{shown}</div>
        {shown.length === text.length && Math.floor(t / 8) % 2 === 0 && (
          <div style={{ position: "absolute", right: 30, bottom: 22, fontFamily: PIXEL, fontSize: 22, color: C.gold }}>▼</div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// Wooden jetty, horizontal, drawn in art pixels.
export const Dock: React.FC<{ length: number; px: number }> = ({ length, px }) => {
  const planks = Math.ceil(length / (6 * px));
  return (
    <div style={{ position: "relative", width: length, height: 18 * px }}>
      {Array.from({ length: planks }, (_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: i * 6 * px,
            top: 0,
            width: 6 * px - px,
            height: 16 * px,
            background: i % 2 ? "#a06a3c" : "#ad7646",
            boxShadow: `inset 0 ${px}px 0 #c48a55, inset 0 -${px}px 0 #6e4325`,
          }}
        />
      ))}
      {[0, 0.33, 0.66, 1].map((f) => (
        <div
          key={f}
          style={{
            position: "absolute",
            left: Math.min(length - 3 * px, f * length),
            top: 14 * px,
            width: 3 * px,
            height: 6 * px,
            background: "#5c3520",
          }}
        />
      ))}
    </div>
  );
};

// Pixel seagull, flapping.
export const Gull: React.FC<{ px: number }> = ({ px }) => {
  const frame = useCurrentFrame();
  const up = Math.floor(frame / 6) % 2 === 0;
  return (
    <svg width={9 * px} height={4 * px} viewBox="0 0 9 4" shapeRendering="crispEdges">
      {up ? (
        <path d="M0 0h2v1h1v1h3V1h1V0h2v1H8v1H7v1H2V2H1V1H0z" fill="#fff" />
      ) : (
        <path d="M0 2h2v1h5V2h2v1H8v1H1V3H0z" fill="#fff" />
      )}
      <rect x={4} y={2} width={1} height={1} fill="#333" />
    </svg>
  );
};
