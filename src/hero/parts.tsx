import React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { Sprite } from "../components/Sprite";
import { C, PIXEL } from "../theme";
import { HERO_LOOK, HERO_NAME } from "./config";

// Keyframe track: [frame, value] pairs, eased between each pair.
export const track = (f: number, pts: [number, number][], easing = Easing.inOut(Easing.sin)) =>
  interpolate(
    f,
    pts.map((p) => p[0]),
    pts.map((p) => p[1]),
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing },
  );

export const linear = (f: number, pts: [number, number][]) => track(f, pts, Easing.linear);

// 0..1: how fast the camera is moving, for head bob.
export const walking = (f: number, pos: (f: number) => number) => Math.min(1, Math.abs(pos(f + 1) - pos(f)) / 0.6);

export const HERO_LAYERS = [
  `realm/hero/skin-tone${HERO_LOOK.skin}.png`,
  `realm/hero/hair-${HERO_LOOK.hair}.png`,
  `realm/hero/outfit-${HERO_LOOK.outfit}.png`,
];

// Hero's realm sprite, stacked from avatar layers like the app does.
export const HeroSprite: React.FC<{ row: number; scale: number; flip?: boolean; animFps?: number }> = ({
  row,
  scale,
  flip,
  animFps = 6,
}) => (
  <div style={{ position: "relative", width: 48 * scale, height: 48 * scale, transform: flip ? "scaleX(-1)" : undefined }}>
    {HERO_LAYERS.map((src) => (
      <Sprite key={src} src={src} row={row} scale={scale} animFps={animFps} style={{ position: "absolute", left: 0, top: 0 }} />
    ))}
  </div>
);

// Hard 2.39:1 bars for the real-world acts. `open` 0 = bars in, 1 = gone.
export const Letterbox: React.FC<{ open?: number }> = ({ open = 0 }) => {
  const bar = 138 * (1 - open);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: bar, background: "#000" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: bar, background: "#000" }} />
    </AbsoluteFill>
  );
};

// "THE TRAINING REALM" banner. Fades in at the end of the Arrival and out at
// the start of the Village, so it carries across the join.
export const RealmTitle: React.FC<{ opacity: number }> = ({ opacity }) => (
  <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 150, opacity, pointerEvents: "none" }}>
    <div
      style={{
        fontFamily: PIXEL,
        fontSize: 54,
        color: C.gold,
        textShadow: "6px 6px 0 #000",
        letterSpacing: 4,
        transform: `translateY(${(1 - opacity) * -20}px)`,
      }}
    >
      THE TRAINING REALM
    </div>
  </AbsoluteFill>
);
