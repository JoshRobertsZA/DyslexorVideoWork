import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Grain } from "../components/Fx";
import { C, TITLE } from "../theme";

// Scene 6: the Marvel "____ WILL RETURN" card, in dead silence.
export const WILL_RETURN_DURATION = 120;

export const WillReturn: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [12, 36, 92, 112], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const spacing = interpolate(frame, [0, WILL_RETURN_DURATION], [18, 34]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
      <div style={{ opacity, textAlign: "center" }}>
        <div style={{ fontFamily: TITLE, fontSize: 150, letterSpacing: spacing, color: C.gold, lineHeight: 1 }}>DYSLEXOR</div>
        <div style={{ fontFamily: TITLE, fontSize: 70, letterSpacing: spacing * 0.8, color: C.cream, marginTop: 24 }}>WILL RETURN</div>
      </div>
      <Grain opacity={0.08} />
    </AbsoluteFill>
  );
};
