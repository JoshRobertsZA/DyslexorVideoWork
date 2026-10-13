import React from "react";
import { AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { Dialogue } from "../../lore/parts";
import { Pov } from "../realm/Pov";
import { DRAIN, SCORCH } from "../realm/world";
import { villageActors } from "../Village";
import { DYSLEXI_COLOR, DyslexiBirth, DyslexiBuddy } from "./Dyslexi";
import { HudPopup, LevelUp, Popup, Stats, StatsScreen } from "./Hud";

// The status window (on demand), system notices and Dyslexi in one run, over the drained
// village, for reviewing them before they go into the chapters.

export const HUD_DEMO_FRAMES = 820;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const POPUPS: Popup[] = [
  { at: 130, kind: "quest", title: "Bring back the words", sub: "0 / 5,000 words restored", dur: 100 },
  { at: 236, kind: "xp", title: "+400 WORDS", dur: 70 },
  { at: 312, kind: "badge", title: "Beginner", sub: "Clear your first game", badge: "beginner", dur: 100 },
  { at: 340, kind: "skill", title: "Rhyme Shield", sub: "Rhyming words block an attack", dur: 100 },
];
const LEVEL_AT = 250;
const BIRTH_AT = 430;
const STATS_AT = 670;

const statsAt = (f: number): Stats => ({
  level: f >= LEVEL_AT + 10 ? 2 : 1,
  xp: f >= LEVEL_AT + 10 ? interpolate(f, [LEVEL_AT + 10, LEVEL_AT + 40], [0, 40], clamp) : interpolate(f, [230, LEVEL_AT], [0, 100], clamp),
  xpMax: f >= LEVEL_AT + 10 ? 250 : 100,
  words: interpolate(f, [236, 266], [0, 400], clamp),
  wordsMax: 5000,
});

export const HudDemo: React.FC = () => {
  const f = useCurrentFrame();
  const stats = statsAt(f);
  // After her birth she drifts to her place at Hero's shoulder.
  const settle = interpolate(f, [BIRTH_AT + 70, BIRTH_AT + 100], [0, 1], clamp);
  const born = f >= BIRTH_AT + 70;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Pov cam={{ x: 0, y: 120, heading: Math.sin(f / 90) * 0.04 }} actors={villageActors(0)} sky="dawn" drain={DRAIN} scorch={SCORCH}>
        {/* Status window on demand, like an isekai: no always-on HUD. */}
        <StatsScreen t={f - 20} dur={90} stats={statsAt(0)} badges={[]} locked={["beginner", "spelling-star", "comeback-kid"]} skills={["None yet"]} />
        {POPUPS.map((p, i) => (
          <HudPopup key={p.at} t={f - p.at} p={p} slot={i === 3 ? 1 : 0} />
        ))}
        <LevelUp t={f - LEVEL_AT} level={2} />
        {!born && <DyslexiBirth t={f - BIRTH_AT} f={f} x={960} y={520} />}
        {born && (
          <DyslexiBuddy
            f={f}
            x={interpolate(settle, [0, 1], [960, 1560])}
            y={interpolate(settle, [0, 1], [520, 600])}
            talking={f >= 560 && f < 650}
          />
        )}
        <Dialogue speaker="Dyslexi" text="Finally! Do you know how long I've been stuck as a single letter?" t={f - 560} dur={95} color={DYSLEXI_COLOR} />
        <StatsScreen t={f - STATS_AT} dur={140} stats={stats} badges={["beginner"]} locked={["spelling-star", "vowel-team-whiz", "comeback-kid", "grandmaster"]} skills={["Rhyme Shield"]} />
      </Pov>

      <Sequence from={20} durationInFrames={50} name="🔊 status window">
        <Audio src={staticFile("sfx/ui-boot.mp3")} volume={0.6} />
      </Sequence>
      {POPUPS.map((p) => (
        <Sequence key={p.at} from={p.at} durationInFrames={12} name="🔊 blip">
          <Audio src={staticFile("sfx/ui-blip.mp3")} volume={0.5} />
        </Sequence>
      ))}
      <Sequence from={LEVEL_AT} durationInFrames={100} name="🔊 level up">
        <Audio src={staticFile("music/levelup-sound.mp3")} volume={0.7} />
      </Sequence>
      <Sequence from={BIRTH_AT + 30} durationInFrames={50} name="🔊 birth">
        <Audio src={staticFile("sfx/summon.mp3")} volume={0.6} />
      </Sequence>
      <Sequence from={STATS_AT} durationInFrames={12} name="🔊 menu">
        <Audio src={staticFile("sfx/ui-blip.mp3")} volume={0.6} />
      </Sequence>
    </AbsoluteFill>
  );
};
