import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Fireflies } from "../components/Fx";
import { EPIC } from "../lore/parts";
import { C, PIXEL, TITLE } from "../theme";
import { CROSSFADE } from "./config";
import { track } from "./parts";
import { Pov, idleCol } from "./realm/Pov";
import { SPOTS } from "./realm/world";

// Dusk in the village. Rowan and Dyslexi wait on the path, the camera lifts
// to the sky and the title lands.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const hz = track(f, [
    [0, 122],
    [110, 122],
    [190, 470],
  ]);
  // Dissolves in over the level-up screen, which keeps playing underneath.
  const fadeIn = interpolate(f, [0, CROSSFADE], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const title = interpolate(f, [170, 200], [0, 1], clamp);
  const line = interpolate(f, [205, 230], [0, 1], clamp);
  const out = interpolate(f, [252, 280], [1, 0], clamp);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: fadeIn }}>
        <Pov
          sky="dusk"
          cam={{ x: 0, y: -390, heading: Math.sin(f / 60) * 0.02, horizon: hz }}
          actors={[
            { sheet: "rowan", ...SPOTS.rowan, row: 0, col: idleCol(f) },
            { sheet: "dyslexi", x: 38, y: -462, row: 0, col: idleCol(f + 2), size: 0.77 },
          ]}
        >
          <AbsoluteFill style={{ background: "rgba(42,24,56,0.25)" }} />
          <Fireflies count={30} opacity={0.8} seed="end" />
          <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 26 }}>
            <div
              style={{
                fontFamily: TITLE,
                fontSize: 220,
                color: C.gold,
                letterSpacing: 10,
                textShadow: "10px 10px 0 #000",
                opacity: title,
                transform: `scale(${1.15 - title * 0.15})`,
              }}
            >
              DYSLEXOR
            </div>
            <div style={{ fontFamily: EPIC, fontSize: 44, color: C.cream, opacity: line, textShadow: "0 4px 20px #000" }}>
              Every reader starts somewhere.
            </div>
            <div style={{ fontFamily: PIXEL, fontSize: 26, color: C.lilac, opacity: line, marginTop: 20 }}>dyslexor.com</div>
          </AbsoluteFill>
        </Pov>
      </AbsoluteFill>
      {/* The film's last fade, to black. */}
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: 1 - out }} />
    </AbsoluteFill>
  );
};
