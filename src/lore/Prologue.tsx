import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Fireflies, Grain } from "../components/Fx";
import { C } from "../theme";
import { EPIC } from "./parts";

// Storybook opening lines over black.
export const PROLOGUE_DURATION = 165;

const LINES = [
  { text: "Every realm has a keeper.", at: 10 },
  { text: "Ours was Elder Rowan.", at: 62 },
];

export const Prologue: React.FC = () => {
  const frame = useCurrentFrame();
  const out = interpolate(frame, [PROLOGUE_DURATION - 25, PROLOGUE_DURATION], [1, 0], { extrapolateLeft: "clamp" });
  return (
    <AbsoluteFill style={{ backgroundColor: "#050308", justifyContent: "center", alignItems: "center", opacity: out }}>
      <Fireflies count={18} seed="prologue" opacity={0.5} />
      <div style={{ textAlign: "center" }}>
        {LINES.map((l, i) => {
          const a = interpolate(frame, [l.at, l.at + 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div
              key={l.text}
              style={{
                fontFamily: EPIC,
                fontWeight: i === 1 ? 700 : 400,
                fontSize: i === 1 ? 84 : 56,
                color: i === 1 ? C.gold : C.cream,
                letterSpacing: 4,
                marginTop: i === 1 ? 26 : 0,
                opacity: a,
                transform: `translateY(${(1 - a) * 16}px)`,
                filter: `blur(${(1 - a) * 6}px)`,
                textShadow: i === 1 ? "0 0 30px rgba(246,201,69,0.35)" : undefined,
              }}
            >
              {l.text}
            </div>
          );
        })}
      </div>
      <Grain opacity={0.08} />
    </AbsoluteFill>
  );
};
