import React from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { SUMMON_CHIME, Summoning, SUMMONING_FRAMES } from "../hero/Summoning";
import { INTRO_FRAMES, IntroScene } from "./IntroScene";

// Elder Rowan's new intro, then the existing duel (hero/Summoning.tsx, which
// is untouched). IntroScene ends on the exact frame the narrated Opening ends
// on, so the cut into the duel is the same one the film already makes.
export { INTRO_FRAMES };
export const INTRO_DUEL_FRAMES = INTRO_FRAMES + SUMMONING_FRAMES;

export const IntroToDuel: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <Sequence durationInFrames={INTRO_FRAMES} name="1 · Intro: Rowan walks the village">
      <IntroScene />
    </Sequence>
    <Sequence from={INTRO_FRAMES} durationInFrames={SUMMONING_FRAMES} name="2 · The duel (Summoning)">
      <Summoning />
    </Sequence>
    {/* Rowan's spell chimes, the same chime Hero hears later. */}
    <Sequence from={INTRO_FRAMES + SUMMON_CHIME} durationInFrames={90} name="♪ summoning chime">
      <Audio src={staticFile("music/sound_effect.mp3")} volume={0.6} />
    </Sequence>
  </AbsoluteFill>
);
