import React from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import { C, PIXEL } from "../theme";

// The bridge from the opening titles into Rowan's story (Opening.tsx): played
// across the overlap where the titles dissolve into the past. The golden
// letters of the dawn shot gather; one letter, a glowing "A" in the realm's
// pixel lettering, drifts to the centre and blooms into warm light, and the
// past appears through it as Rowan begins "Long ago, in the realm of words...".
// The "A" then rises and fades, handing over to the story's own letters.
// Then the widescreen bars slide away and the film grade lifts.
//
// Frames are relative to the start of the overlap (BRIDGE_IN before the
// story's first frame).

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const BAR = Math.round((1080 - 1920 / 2.39) / 2);

export const BRIDGE_IN = 70; // starts this long before the story's first frame
export const BRIDGE_FRAMES = BRIDGE_IN + 480;
const STORY = BRIDGE_IN; // the story's first frame
const BLOOM = STORY + 45; // the dissolve's midpoint
const BARS_OUT = { from: STORY + 200, to: STORY + 320 };
const GRADE_OUT = { from: STORY + 260, to: STORY + 480 };

// A few letters converging on the centre with the "A".
const Gather: React.FC<{ f: number }> = ({ f }) => {
  const k = interpolate(f, [0, BLOOM], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const fade = interpolate(f, [0, 20, BLOOM - 10, BLOOM + 10], [0, 1, 1, 0], clamp);
  return (
    <>
      {Array.from({ length: 14 }, (_, i) => {
        const a = random(`ga${i}`) * Math.PI * 2;
        const r0 = 500 + random(`gr${i}`) * 500;
        const r = r0 * (1 - k);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 960 + Math.cos(a) * r * 1.4,
              top: 470 + Math.sin(a) * r * 0.6,
              fontFamily: PIXEL,
              fontSize: 22 + (i % 3) * 10,
              color: i % 3 ? C.gold : C.cream,
              textShadow: `0 0 14px ${C.gold}, 0 0 28px #ffb24a`,
              opacity: fade * (0.6 + 0.4 * random(`go${i}`)),
              transform: "translate(-50%, -50%)",
            }}
          >
            {"WORDSREALMSTORY"[i]}
          </div>
        );
      })}
    </>
  );
};

export const StoryBridge: React.FC = () => {
  const f = useCurrentFrame();
  // The "A": in, to the centre, swells with the bloom, then rises and fades.
  const aIn = interpolate(f, [0, 30], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  // It hands over to the story's own "A" just after the bloom (one "A" at a time).
  const aOut = interpolate(f, [BLOOM - 30, BLOOM], [1, 0], { ...clamp, easing: Easing.in(Easing.quad) });
  const aScale = interpolate(f, [0, BLOOM, BLOOM + 110], [0.6, 1.6, 1.0], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const aY = interpolate(f, [0, BLOOM, BLOOM + 110], [560, 470, 330], { ...clamp, easing: Easing.inOut(Easing.quad) });
  // The warm light the past appears through.
  const bloom = interpolate(f, [BLOOM - 35, BLOOM, BLOOM + 40], [0, 0.85, 0], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const bars = interpolate(f, [BARS_OUT.from, BARS_OUT.to], [BAR, 0], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const grade = interpolate(f, [STORY, STORY + 30, GRADE_OUT.from, GRADE_OUT.to], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* The film grade over the story's first shots: vignette and grain */}
      <AbsoluteFill style={{ opacity: grade, background: "radial-gradient(ellipse 75% 70% at 50% 50%, transparent 50%, rgba(10,4,20,0.5) 100%)" }} />
      <AbsoluteFill
        style={{
          opacity: 0.06 * grade,
          mixBlendMode: "overlay",
          backgroundImage: `radial-gradient(circle at ${random(`bg${f}`) * 100}% ${random(`bh${f}`) * 100}%, #fff 0.5px, transparent 1px)`,
          backgroundSize: "3px 3px",
        }}
      />
      <Gather f={f} />
      <AbsoluteFill style={{ opacity: bloom, background: "radial-gradient(circle at 50% 44%, rgba(255,236,190,1) 0%, rgba(255,205,130,0.75) 30%, rgba(255,180,90,0.25) 60%, transparent 80%)", mixBlendMode: "screen" }} />
      <div
        style={{
          position: "absolute",
          left: 960,
          top: aY,
          transform: `translate(-50%, -50%) scale(${aScale})`,
          fontFamily: PIXEL,
          fontSize: 120,
          color: "#fff3cf",
          textShadow: `0 0 24px ${C.gold}, 0 0 60px #ffb24a, 0 0 120px #ff9a3a`,
          opacity: aIn * aOut,
        }}
      >
        A
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: bars, background: "#000" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: bars, background: "#000" }} />
    </AbsoluteFill>
  );
};
