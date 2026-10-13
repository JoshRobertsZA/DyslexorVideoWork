import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Video } from "@remotion/media";
import { Grain, Vignette } from "../components/Fx";
import { BODY, C, PIXEL } from "../theme";
import { ACCENT, CROSSFADE, HERO_NAME } from "./config";
import { HeroSprite } from "./parts";

// Act 6. Each training game gets a title slam and then its real gameplay
// clip, with the three how-to-play steps from lib/realm/games.ts. Ends on a
// level-up beat.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const GAMES = [
  {
    id: "rhyme-time",
    title: "RHYME TIME",
    subtitle: "Find the word that rhymes",
    steps: ["Listen to the word", "Pick the word that rhymes", "Get it right to move on"],
    accent: ACCENT.mint,
    from: 0,
    dur: 230,
    trim: 0,
  },
  {
    id: "spelling-sprint",
    title: "SPELLING SPRINT",
    subtitle: "Spell the word before the timer runs out",
    steps: ["Hear the word", "Type the letters to spell it", "Cross the line before time runs out"],
    accent: ACCENT.peach,
    from: 230,
    dur: 230,
    trim: 90,
  },
  {
    id: "word-match",
    title: "WORD MATCH",
    subtitle: "Match each word to its picture",
    steps: ["Look at the picture", "Find the correct spelling", "Drag it onto the card"],
    accent: ACCENT.lavender,
    from: 460,
    dur: 220,
    trim: 0,
  },
];
export const LEVEL_UP = { from: 680, dur: 90 };

const SLAM = 34;

const GameSegment: React.FC<{ game: (typeof GAMES)[number] }> = ({ game }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slam = spring({ frame: f, fps, config: { damping: 11, mass: 0.6 } });
  const shake = f < 10 ? (random(`sh${f}`) - 0.5) * 24 : 0;
  const clipIn = interpolate(f, [SLAM - 6, SLAM + 8], [0, 1], clamp);
  const flash = interpolate(f, [0, 5], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: C.ink, overflow: "hidden" }}>
      {/* Cover blurred behind */}
      <Img
        src={staticFile(`games/${game.id}.webp`)}
        style={{ position: "absolute", inset: -60, width: "calc(100% + 120px)", height: "calc(100% + 120px)", objectFit: "cover", filter: "blur(30px) brightness(0.45)" }}
      />
      {/* Gameplay clip, 1920x800 */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: clipIn }}>
        <div
          style={{
            width: 1920 * 0.86,
            height: 800 * 0.86,
            border: `6px solid ${game.accent}`,
            outline: "6px solid #000",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: `0 0 90px ${game.accent}55`,
            transform: `scale(${0.96 + clipIn * 0.04}) translateY(-30px)`,
          }}
        >
          <Sequence from={SLAM - 6} layout="none">
            <Video src={staticFile(`games/${game.id}.mp4`)} muted trimBefore={game.trim} objectFit="cover" style={{ width: "100%", height: "100%" }} />
          </Sequence>
        </div>
      </AbsoluteFill>
      {/* Small title top-left once the clip is up */}
      <div style={{ position: "absolute", left: 136, top: 46, fontFamily: PIXEL, fontSize: 30, color: game.accent, textShadow: "4px 4px 0 #000", opacity: clipIn }}>
        {game.title}
      </div>
      {/* How to play */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 46, display: "flex", justifyContent: "center", gap: 26 }}>
        {game.steps.map((s, i) => {
          const at = SLAM + 20 + i * 34;
          const p = interpolate(f, [at, at + 10], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.8)) });
          return (
            <div
              key={s}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                background: "rgba(18,11,28,0.92)",
                border: `4px solid ${C.cream}`,
                outline: "4px solid #000",
                borderRadius: 10,
                padding: "14px 22px",
                opacity: p,
                transform: `translateY(${(1 - p) * 30}px)`,
              }}
            >
              <div style={{ fontFamily: PIXEL, fontSize: 22, color: C.ink, background: game.accent, border: "3px solid #000", width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {i + 1}
              </div>
              <div style={{ fontFamily: BODY, fontWeight: 500, fontSize: 28, color: C.cream }}>{s}</div>
            </div>
          );
        })}
      </div>
      {/* Title slam */}
      {f < SLAM + 8 && (
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            background: `radial-gradient(circle, ${game.accent}33, ${C.ink} 70%)`,
            opacity: interpolate(f, [SLAM, SLAM + 8], [1, 0], clamp),
          }}
        >
          <div
            style={{
              fontFamily: PIXEL,
              fontSize: 120,
              color: game.accent,
              textShadow: "10px 10px 0 #000",
              transform: `translate(${shake}px, ${shake / 2}px) scale(${interpolate(slam, [0, 1], [3, 1])})`,
              whiteSpace: "nowrap",
            }}
          >
            {game.title}
          </div>
          <div style={{ fontFamily: BODY, fontSize: 36, color: C.cream, marginTop: 30, opacity: slam }}>{game.subtitle}</div>
        </AbsoluteFill>
      )}
      <Vignette strength={0.5} />
      <AbsoluteFill style={{ backgroundColor: "#fff", opacity: flash }} />
    </AbsoluteFill>
  );
};

const LevelUp: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fill = interpolate(f, [8, 40], [0.12, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const burst = spring({ frame: f - 40, fps, config: { damping: 9 } });
  const hop = f > 40 ? -Math.abs(Math.sin(((f - 40) / 12) * Math.PI)) * 40 : 0;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle, ${C.plum}, ${C.ink} 75%)`, justifyContent: "center", alignItems: "center", gap: 36 }}>
      {Array.from({ length: 28 }, (_, i) => {
        const a = (i / 28) * Math.PI * 2;
        const r = burst * 620;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 960 + Math.cos(a) * r,
              top: 470 + Math.sin(a) * r,
              width: 14,
              height: 14,
              background: [C.gold, ACCENT.mint, ACCENT.peach, ACCENT.lavender][i % 4],
              opacity: f > 40 ? 1 - burst * 0.6 : 0,
            }}
          />
        );
      })}
      <div style={{ transform: `translateY(${hop}px)` }}>
        <HeroSprite row={0} scale={10} />
      </div>
      <div style={{ fontFamily: PIXEL, fontSize: 84, color: C.gold, textShadow: "8px 8px 0 #000", transform: `scale(${f > 40 ? 0.6 + burst * 0.4 : 0})` }}>
        LEVEL UP!
      </div>
      <div style={{ width: 760, height: 34, background: "#000", border: "5px solid #000", outline: `5px solid ${C.cream}` }}>
        <div style={{ width: `${fill * 100}%`, height: "100%", background: C.gold, boxShadow: "inset 0 -8px 0 #c99a2e" }} />
      </div>
      <div style={{ fontFamily: PIXEL, fontSize: 30, color: C.cream, opacity: f > 40 ? 1 : 0 }}>
        {HERO_NAME} · Explorer 2
      </div>
    </AbsoluteFill>
  );
};

export const Showcase: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.ink }}>
    {GAMES.map((g) => (
      <Sequence key={g.id} from={g.from} durationInFrames={g.dur} name={g.title}>
        <GameSegment game={g} />
      </Sequence>
    ))}
    <Sequence from={LEVEL_UP.from} durationInFrames={LEVEL_UP.dur + CROSSFADE} name="Level up">
      <LevelUp />
    </Sequence>
    <Grain opacity={0.04} />
  </AbsoluteFill>
);
