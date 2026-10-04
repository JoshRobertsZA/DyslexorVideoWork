import React from "react";
import { AbsoluteFill, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Video } from "@remotion/media";
import { Grain, Halftone, Vignette } from "../components/Fx";
import { FEATURES } from "../credits";
import { C, PIXEL, TITLE } from "../theme";

// Scene 4: "...AND FEATURING" a comic-page grid of the app's real screen clips.
export const FEATURING_DURATION = 270;

const PANEL_W = 540;
const PANEL_H = 304;
const GAP = 50;
const LEFT = (1920 - (PANEL_W * 3 + GAP * 2)) / 2;
const TOPS = [300, 670];

export const Featuring: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const head = spring({ frame, fps, config: { damping: 16 } });
  const push = interpolate(frame, [0, FEATURING_DURATION], [1, 1.06]);
  const exit = interpolate(frame, [FEATURING_DURATION - 16, FEATURING_DURATION], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: C.plum, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0 40px, transparent 40px 80px)`,
          backgroundPosition: `${frame * 2}px 0`,
        }}
      />
      <Halftone color="rgba(0,0,0,0.3)" size={18} />

      <AbsoluteFill style={{ transform: `scale(${push * (1 + exit * 0.4)})`, opacity: 1 - exit }}>
        <div
          style={{
            position: "absolute",
            top: 70,
            width: "100%",
            textAlign: "center",
            transform: `scale(${interpolate(head, [0, 1], [1.4, 1])})`,
            opacity: head,
          }}
        >
          <span style={{ fontFamily: PIXEL, fontSize: 30, color: C.gold, letterSpacing: 8, textShadow: "3px 3px 0 #000" }}>
            ...AND FEATURING
          </span>
          <div style={{ fontFamily: TITLE, fontSize: 120, color: C.cream, lineHeight: 1.1, textShadow: `8px 8px 0 ${C.purple}, 14px 14px 0 #000` }}>
            THE DYSLEXOR APP
          </div>
        </div>

        {FEATURES.map((f, i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          const delay = 14 + i * 7;
          const s = spring({ frame: frame - delay, fps, config: { damping: 13, stiffness: 140 } });
          const tilt = (i % 2 ? 1 : -1) * (2 + (i % 3));
          return (
            <div
              key={f.label}
              style={{
                position: "absolute",
                left: LEFT + col * (PANEL_W + GAP),
                top: TOPS[row],
                width: PANEL_W,
                height: PANEL_H,
                transform: `scale(${s}) rotate(${tilt * (2 - s)}deg)`,
                opacity: Math.min(1, s * 2),
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  border: `10px solid ${C.cream}`,
                  outline: "5px solid #000",
                  boxShadow: "16px 16px 0 #000",
                  overflow: "hidden",
                  backgroundColor: "#000",
                }}
              >
                <Sequence from={delay} layout="none">
                  <Video src={staticFile(f.clip)} muted trimBefore={60} objectFit="cover" style={{ width: "100%", height: "100%" }} />
                </Sequence>
              </div>
              <div
                style={{
                  position: "absolute",
                  left: -18,
                  bottom: -26,
                  padding: "12px 18px",
                  background: C.gold,
                  color: C.ink,
                  fontFamily: PIXEL,
                  fontSize: 20,
                  border: "4px solid #000",
                  boxShadow: "6px 6px 0 #000",
                  transform: `rotate(${-tilt}deg)`,
                }}
              >
                {f.label}
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
      <Vignette strength={0.5} />
      <Grain />
    </AbsoluteFill>
  );
};
