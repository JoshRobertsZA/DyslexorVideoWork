import React from "react";
import { AbsoluteFill, Easing, interpolate, random } from "remotion";
import { Sprite } from "../../components/Sprite";
import { C, PIXEL } from "../../theme";
import { ACCENT } from "../config";

// Dyslexi, Hero's companion: the app's guide (the cat with glasses), here a
// little creature made of the realm's first restored word. She floats at
// Hero's shoulder in first person, bobbing, and bounces when she talks.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const SHEET = "realm/dyslexi.png";
export const DYSLEXI_COLOR = "#f4a259";

// Rows of her sheet: 0 idle facing us, 1 idle side (facing right),
// 4 walk side. Column 4 of row 0 has her eyes closed.
type Pose = "front" | "side" | "blink";

// Floating beside Hero's view. (x, y) = the centre of her body on screen.
// `talking` makes her bounce; `appear` 0..1 pops her in.
export const DyslexiBuddy: React.FC<{ f: number; x?: number; y?: number; scale?: number; talking?: boolean; appear?: number; pose?: Pose; flip?: boolean }> = ({
  f,
  x = 1560,
  y = 560,
  scale = 7,
  talking = false,
  appear = 1,
  pose = "front",
  flip = false,
}) => {
  if (appear <= 0) return null;
  const bob = Math.sin(f / 14) * 10;
  const bounce = talking ? -Math.abs(Math.sin(f / 3.2)) * 10 : 0;
  const pop = interpolate(appear, [0, 0.7, 1], [0.2, 1.15, 1], clamp);
  const row = pose === "side" ? 1 : 0;
  const col = pose === "blink" ? 4 : undefined;
  return (
    <div
      style={{
        position: "absolute",
        // Her body sits at about (25, 31) of the 48px cell.
        left: x - 25 * scale,
        top: y - 31 * scale + bob + bounce,
        transform: `scale(${pop})`,
        transformOrigin: `${25 * scale}px ${31 * scale}px`,
        opacity: Math.min(1, appear * 2),
        filter: `drop-shadow(0 0 ${10 + 6 * Math.sin(f / 9)}px ${ACCENT.mint}aa)`,
      }}
    >
      {/* A soft glow underneath, since she floats */}
      <div
        style={{
          position: "absolute",
          left: 25 * scale - 70,
          top: 46 * scale - bob - bounce,
          width: 140,
          height: 26,
          borderRadius: "50%",
          background: `radial-gradient(${ACCENT.mint}66, transparent 70%)`,
        }}
      />
      <Sprite src={SHEET} row={row} col={col} scale={scale} flip={flip} animFps={talking ? 10 : 6} />
    </div>
  );
};

// Her birth: the first restored word hangs glowing in the air, spins, bursts,
// and she's there. `t` = frames since it began; (x, y) = where it happens.
export const BIRTH_FRAMES = 60;
export const DyslexiBirth: React.FC<{ t: number; f: number; x: number; y: number; scale?: number; letter?: string }> = ({ t, f, x, y, scale = 6, letter = "D" }) => {
  if (t < 0) return null;
  const glow = interpolate(t, [0, 24], [0.4, 1], clamp);
  const spin = interpolate(t, [10, 34], [0, 720], { ...clamp, easing: Easing.in(Easing.quad) });
  const letterOn = t < 36;
  const burst = interpolate(t, [34, 54], [0, 1], clamp);
  const appear = interpolate(t, [36, 48], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {letterOn && (
        <div
          style={{
            position: "absolute",
            left: x,
            top: y,
            transform: `translate(-50%, -50%) rotateY(${spin}deg) scale(${1 + glow * 0.4})`,
            fontFamily: PIXEL,
            fontSize: 110,
            color: C.gold,
            textShadow: `0 0 ${30 * glow}px ${C.gold}, 0 0 ${60 * glow}px #ffb24a, 8px 8px 0 #000`,
          }}
        >
          {letter}
        </div>
      )}
      {burst > 0 && burst < 1 && (
        <>
          <div
            style={{
              position: "absolute",
              left: x - 260 * burst,
              top: y - 260 * burst,
              width: 520 * burst,
              height: 520 * burst,
              borderRadius: "50%",
              background: `radial-gradient(${C.cream}, ${ACCENT.mint}88 40%, transparent 70%)`,
              opacity: 1 - burst,
            }}
          />
          {Array.from({ length: 22 }, (_, i) => {
            const a = random(`db-a${i}`) * Math.PI * 2;
            const v = 120 + random(`db-v${i}`) * 260;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: Math.round((x + Math.cos(a) * v * burst) / 6) * 6,
                  top: Math.round((y + Math.sin(a) * v * burst) / 6) * 6,
                  width: i % 3 ? 10 : 16,
                  height: i % 3 ? 10 : 16,
                  background: i % 2 ? C.gold : ACCENT.mint,
                  opacity: 1 - burst,
                }}
              />
            );
          })}
        </>
      )}
      <DyslexiBuddy f={f} x={x} y={y} scale={scale} appear={appear} />
    </AbsoluteFill>
  );
};
