import React from "react";
import { AbsoluteFill, interpolate, Sequence, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { Prologue, PROLOGUE_DURATION } from "./Prologue";
import { Farewell, FAREWELL_DURATION } from "./Farewell";
import { Voyage, VOYAGE_DURATION } from "./Voyage";
import { Arrival, ARRIVAL_DURATION, STONES_WAKE } from "./Arrival";
import { MapEnd, MAP_END_DURATION } from "./MapEnd";

// "The Voyage of Elder Rowan": the lore version of the outro. Rowan leaves
// the realm with the princess and sails to a new island.
const S1 = 0;
const S2 = S1 + PROLOGUE_DURATION;
const S3 = S2 + FAREWELL_DURATION;
const S4 = S3 + VOYAGE_DURATION;
const S5 = S4 + ARRIVAL_DURATION;
export const LORE_DURATION = S5 + MAP_END_DURATION;

export const LoreOutro: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <Sequence from={S1} durationInFrames={PROLOGUE_DURATION} name="1 · Prologue">
      <Prologue />
    </Sequence>
    <Sequence from={S2} durationInFrames={FAREWELL_DURATION} name="2 · Farewell at the shore">
      <Farewell />
    </Sequence>
    <Sequence from={S3} durationInFrames={VOYAGE_DURATION} name="3 · The voyage">
      <Voyage />
    </Sequence>
    <Sequence from={S4} durationInFrames={ARRIVAL_DURATION} name="4 · Isle of Numbers">
      <Arrival />
    </Sequence>
    <Sequence from={S5} durationInFrames={MAP_END_DURATION} name="5 · The map">
      <MapEnd />
    </Sequence>

    <Audio
      src={staticFile("music/rebirth-background-music.mp3")}
      volume={(f) =>
        interpolate(f, [0, 60, LORE_DURATION - 60, LORE_DURATION], [0, 0.55, 0.55, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      }
    />
    <Sequence from={S4 + STONES_WAKE} durationInFrames={120} name="♪ stones wake">
      <Audio src={staticFile("music/levelup-sound.mp3")} volume={0.8} />
    </Sequence>
  </AbsoluteFill>
);
