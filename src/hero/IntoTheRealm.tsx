import React from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { Arrival } from "./Arrival";
import { Credits, CREDITS_FRAMES } from "./Credits";
import { Ident, IDENT_FRAMES } from "./Ident";
import { ACT1_FRAMES, ACT1_SHOTS, ACT2_FRAMES, ARRIVAL_FRAMES, TITLE_FRAMES, VILLAGE_FRAMES } from "./config";
import { Lair, LAIR_FRAMES } from "./Lair";
import { NextTime, NEXT_TIME_FRAMES } from "./NextTime";
import { OpeningTitles, OPENING_TITLES_FRAMES, TITLES_OVERLAP } from "./OpeningTitles";
import { BRIDGE_FRAMES, BRIDGE_IN, StoryBridge } from "./StoryBridge";
import { RealWorld } from "./RealWorld";
import { Opening, OPENING_FRAMES } from "./Opening";
import { IntroScene, INTRO_FRAMES } from "../intro/IntroScene";
import { SUMMON_CHIME, Summoning, SUMMONING_FRAMES } from "./Summoning";
import { Trial, TRIAL_FRAMES } from "./Trial";
import { Village } from "./Village";

// Running order (2026-10-21): the Dyslexor Studios ident; the opening titles
// over cinematics of the realm; the Wizard's story (Opening + Summoning);
// real life (the classroom); then back to the realm for the rest.
//
// Season 1, Episode 1: the pilot (docs/SEASON-1.md). The Wizard's story: long
// ago, Elder Rowan spends his last spell calling for help against him. Then
// real life: in a reading lesson Hero is asked to read aloud and the letters
// swim, and a quiet boy at the back who finds reading hard too watches her. She hears the call (and, at the
// back, so does he), steps through a door and wakes up 8-bit in the realm.
// Dyslexi, the grey village, Rowan, and her first game: she wins it, and the
// lamps relight. Then, far off at the top of his tower, the Wizard watches,
// and steps out of the shadows beside him... the boy from her class.
// To be continued.
//
// The Wizard's attack, the tower and the way home are later episodes
// (Strike.tsx, Tower.tsx, Home.tsx).
//
// While PROLOGUE_ONLY is on, the film ends on the narrator's last line over
// the portal's white (~1:10) and the scenes after it are left out.
const PROLOGUE_ONLY = false;
// While the classroom scenes (shot in real life) aren't filmed yet, leave them
// out: the summoning's white goes straight into the fall. Set back to false
// once the footage is in public/footage/.
const SKIP_REAL_LIFE = true;
// The Wizard's story, straight after the titles.
const WIZARD_STORY = true;
// Rowan's story opens with the new narrated intro (src/intro) instead of the
// old Opening. Set to false to go back to the old one.
const NEW_INTRO = true;
const STORY_FRAMES = NEW_INTRO ? INTRO_FRAMES : OPENING_FRAMES;

// The Dyslexor Studios ident, the opening titles, then the episode.
const S_TITLES = IDENT_FRAMES;
// Rowan's story starts under the end of the titles, which dissolve into it.
const S_OPEN = S_TITLES + OPENING_TITLES_FRAMES - (WIZARD_STORY ? TITLES_OVERLAP : 0);
const S_SUMMON = S_OPEN + STORY_FRAMES;
const S_CLASS = WIZARD_STORY ? S_SUMMON + SUMMONING_FRAMES : S_OPEN;
const S_ARRIVAL = S_CLASS + (SKIP_REAL_LIFE ? 0 : ACT1_FRAMES + ACT2_FRAMES);
const S_VILLAGE = S_ARRIVAL + ARRIVAL_FRAMES;
const S_GAME = S_VILLAGE + VILLAGE_FRAMES;
const S_LAIR = S_GAME + TRIAL_FRAMES;
const S_CREDITS = S_LAIR + LAIR_FRAMES;
// "Next time": the Episode 2 preview, after the Dyslexor end card.
const S_NEXT = S_CREDITS + CREDITS_FRAMES;
export const INTO_THE_REALM_DURATION = PROLOGUE_ONLY ? S_CLASS : S_NEXT + NEXT_TIME_FRAMES;

// When she hears the chime in class (the start of s03).
const BEFORE_CHIME = ACT1_SHOTS.slice(0, ACT1_SHOTS.findIndex((s) => s.id === "s03")).reduce((t, s) => t + s.frames, 0);
const CHIME = S_CLASS + TITLE_FRAMES + BEFORE_CHIME + 6;

export const IntoTheRealm: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Sequence durationInFrames={IDENT_FRAMES} name="0 · Dyslexor Studios">
        <Ident carryMusic />
      </Sequence>
      {WIZARD_STORY && (
        <Sequence from={S_OPEN} durationInFrames={STORY_FRAMES} name="1 · The Wizard: the realm of words">
          {NEW_INTRO ? <IntroScene /> : <Opening />}
        </Sequence>
      )}
      {/* On top of the story's start, so they dissolve into it */}
      <Sequence from={S_TITLES} durationInFrames={OPENING_TITLES_FRAMES} name="0 · Opening titles">
        <OpeningTitles />
      </Sequence>
      {WIZARD_STORY && (
        <>
          <Sequence from={S_OPEN - BRIDGE_IN} durationInFrames={BRIDGE_FRAMES} name="0 · Bridge into Rowan's story">
            <StoryBridge />
          </Sequence>
          <Sequence from={S_SUMMON} durationInFrames={SUMMONING_FRAMES} name="1 · The Wizard: the summoning">
            <Summoning />
          </Sequence>
          {/* Rowan's spell chimes, the same chime Hero hears later. */}
          <Sequence from={S_SUMMON + SUMMON_CHIME} durationInFrames={90} name="♪ summoning chime">
            <Audio src={staticFile("music/sound_effect.mp3")} volume={0.6} />
          </Sequence>
        </>
      )}
      {!PROLOGUE_ONLY && <ThePilot />}
    </AbsoluteFill>
  );
};

// Everything after the Wizard's story.
const ThePilot: React.FC = () => (
  <>
    {!SKIP_REAL_LIFE && (
      <>
        <Sequence from={S_CLASS} durationInFrames={S_ARRIVAL - S_CLASS} name="2 · Real life: the reading lesson, the door">
          <RealWorld />
        </Sequence>
        <Sequence from={CHIME} durationInFrames={90} name="♪ the chime, in class">
          <Audio src={staticFile("music/sound_effect.mp3")} volume={0.35} />
        </Sequence>
      </>
    )}
    <Sequence from={S_ARRIVAL} durationInFrames={ARRIVAL_FRAMES} name="3 · Arrival">
      <Arrival />
    </Sequence>
    <Sequence from={S_VILLAGE} durationInFrames={VILLAGE_FRAMES} name="4 · The village">
      <Village />
    </Sequence>
    <Sequence from={S_GAME} durationInFrames={TRIAL_FRAMES} name="5 · The game: Rhyme Time, LIGHT">
      <Trial />
    </Sequence>
    <Sequence from={S_LAIR} durationInFrames={LAIR_FRAMES} name="6 · Ending: the Wizard's apprentice">
      <Lair />
    </Sequence>
    <Sequence from={S_CREDITS} durationInFrames={CREDITS_FRAMES} name="7 · End credits">
      <Credits />
    </Sequence>
    <Sequence from={S_NEXT} durationInFrames={NEXT_TIME_FRAMES} name="8 · Next time: Episode 2 preview">
      <NextTime />
    </Sequence>
  </>
);
