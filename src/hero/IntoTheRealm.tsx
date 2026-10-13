import React from "react";
import { AbsoluteFill, interpolate, Sequence, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { Arrival } from "./Arrival";
import {
  ACT1_FRAMES,
  ACT1_SHOTS,
  ACT2_FRAMES,
  CROSSFADE,
  ARRIVAL_FRAMES,
  DOOR_FRAMES,
  END_FRAMES,
  SHOWCASE_FRAMES,
  TITLE_FRAMES,
  VILLAGE_FRAMES,
} from "./config";
import { EndCard } from "./EndCard";
import { RealWorld } from "./RealWorld";
import { RhymeDoor } from "./RhymeDoor";
import { GAMES, LEVEL_UP, Showcase } from "./Showcase";
import { Village } from "./Village";

// "Into the Realm" (2:45). Hero hears something behind a door, steps through
// it and wakes up 8-bit in the Training Realm. Acts and their lengths are in
// config.ts; AI shot prompts are in docs/AI-SHOTS.md.

const A_REAL = 0;
const A_ARRIVAL = A_REAL + ACT1_FRAMES + ACT2_FRAMES;
const A_VILLAGE = A_ARRIVAL + ARRIVAL_FRAMES;
const A_DOOR = A_VILLAGE + VILLAGE_FRAMES;
const A_SHOW = A_DOOR + DOOR_FRAMES;
const A_END = A_SHOW + SHOWCASE_FRAMES;
export const INTO_THE_REALM_DURATION = A_END + END_FRAMES;

// When the chime is heard behind the door (start of s03).
const CHIME = TITLE_FRAMES + ACT1_SHOTS[0].frames + 6;
// Rhyme Time screen inside RhymeDoor.
const RHYME_SCREEN = A_DOOR + 365;

const fade = (len: number, inF: number, outF: number, vol: number) => (f: number) =>
  interpolate(f, [0, inF, len - outF, len], [0, vol, vol, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

export const IntoTheRealm: React.FC = () => {
  const realmMusic = A_DOOR + 300 - (A_ARRIVAL + 40);
  const rhymeLen = A_SHOW + GAMES[0].dur - RHYME_SCREEN;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Sequence from={A_REAL} durationInFrames={A_ARRIVAL} name="Acts 1–2 · Real world">
        <RealWorld />
      </Sequence>
      <Sequence from={A_ARRIVAL} durationInFrames={ARRIVAL_FRAMES} name="Act 3 · Arrival (POV)">
        <Arrival />
      </Sequence>
      <Sequence from={A_VILLAGE} durationInFrames={VILLAGE_FRAMES} name="Act 4 · Village (POV)">
        <Village />
      </Sequence>
      <Sequence from={A_DOOR} durationInFrames={DOOR_FRAMES} name="Act 5 · Rhyme Time door">
        <RhymeDoor />
      </Sequence>
      <Sequence from={A_SHOW} durationInFrames={SHOWCASE_FRAMES + CROSSFADE} name="Act 6 · Games showcase">
        <Showcase />
      </Sequence>
      <Sequence from={A_END} durationInFrames={END_FRAMES} name="End card">
        <EndCard />
      </Sequence>

      {/* Sound: the realm leaks in, then takes over. */}
      <Sequence from={CHIME} durationInFrames={90} name="♪ chime behind the door">
        <Audio src={staticFile("music/sound_effect.mp3")} volume={0.35} />
      </Sequence>
      <Sequence from={A_ARRIVAL + 40} durationInFrames={realmMusic} name="♪ realm theme">
        <Audio src={staticFile("music/background-music.mp3")} volume={fade(realmMusic, 90, 40, 0.55)} />
      </Sequence>
      <Sequence from={RHYME_SCREEN} durationInFrames={rhymeLen} name="♪ Rhyme Time">
        <Audio src={staticFile("music/rhymetime_music.mp3")} volume={fade(rhymeLen, 6, 6, 0.6)} />
      </Sequence>
      <Sequence from={A_SHOW + GAMES[1].from} durationInFrames={GAMES[1].dur} name="♪ Spelling Sprint">
        <Audio src={staticFile("music/spellingsprint_music.mp3")} volume={fade(GAMES[1].dur, 4, 6, 0.6)} />
      </Sequence>
      <Sequence from={A_SHOW + GAMES[2].from} durationInFrames={GAMES[2].dur} name="♪ Word Match">
        <Audio src={staticFile("music/wordmatch_music.mp3")} volume={fade(GAMES[2].dur, 4, 6, 0.6)} />
      </Sequence>
      <Sequence from={A_SHOW + LEVEL_UP.from + 38} durationInFrames={120} name="♪ level up">
        <Audio src={staticFile("music/levelup-sound.mp3")} volume={0.8} />
      </Sequence>
      <Sequence from={A_END} durationInFrames={END_FRAMES} name="♪ end theme">
        <Audio src={staticFile("music/rebirth-background-music.mp3")} volume={fade(END_FRAMES, 20, 40, 0.55)} />
      </Sequence>
    </AbsoluteFill>
  );
};
