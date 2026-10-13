import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { Video } from "@remotion/media";
import { C, PIXEL, BODY } from "../theme";
import { Shot } from "./config";

// One AI live-action shot. Real footage gets the real-world grade (cool,
// slightly desaturated); a missing clip shows a slate with the shot's brief
// so the edit can be timed before the footage exists.
export const Footage: React.FC<{ shot: Shot; volume?: number }> = ({ shot, volume = 1 }) => {
  const f = useCurrentFrame();
  if (shot.src) {
    return (
      <AbsoluteFill style={{ backgroundColor: "#000" }}>
        <Video
          src={staticFile(shot.src)}
          volume={volume}
          objectFit="cover"
          style={{ width: "100%", height: "100%", filter: "saturate(0.82) contrast(1.06) brightness(0.97)" }}
        />
        <AbsoluteFill style={{ background: "rgba(40,70,110,0.14)", mixBlendMode: "multiply" }} />
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill
      style={{
        background: `repeating-linear-gradient(135deg, #15111c 0 40px, #1b1624 40px 80px)`,
        justifyContent: "center",
        alignItems: "center",
        gap: 28,
      }}
    >
      <div style={{ fontFamily: PIXEL, fontSize: 26, color: C.gold }}>AI SHOT {shot.id.toUpperCase()}</div>
      <div style={{ fontFamily: BODY, fontWeight: 500, fontSize: 46, color: C.cream, maxWidth: 1300, textAlign: "center" }}>
        {shot.title}
      </div>
      <div style={{ fontFamily: BODY, fontSize: 24, color: C.lilac }}>
        prompt in docs/AI-SHOTS.md · drop clip at public/footage/{shot.id}.mp4
      </div>
      <div style={{ width: 600, height: 8, background: "#000", marginTop: 20 }}>
        <div style={{ width: `${(f / shot.frames) * 100}%`, height: "100%", background: C.gold }} />
      </div>
    </AbsoluteFill>
  );
};
