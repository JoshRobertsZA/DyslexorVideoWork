import React from "react";
import { AbsoluteFill, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Grain, Halftone, Vignette } from "../components/Fx";
import { C, PIXEL, TITLE } from "../theme";

// Scene 2: a Marvel-style comic flip-book of the app that accelerates into
// the DYSLEXOR title slam.
export const COMIC_TITLE_DURATION = 210;
export const TITLE_START = 96;
const WORD = "DYSLEXOR";
const LETTER_GAP = 3;
export const TITLE_LAST_LETTER = TITLE_START + (WORD.length - 1) * LETTER_GAP;

const SHOTS = [
  "shots/realm.jpg",
  "shots/spellchecker.jpg",
  "shots/reader.jpg",
  "shots/scan-screen.jpg",
  "shots/ai-summary.jpg",
];
const TINTS = [C.purple, C.peach, "#2c6e6a", C.gold, "#c2557a", "#3b4fa0"];

// Each page shows for less time than the one before it.
const PAGES = (() => {
  const pages: { src: string; tint: string; start: number; dur: number; rot: number }[] = [];
  let t = 0;
  for (let i = 0; t < TITLE_START - 4; i++) {
    const dur = Math.max(3, Math.round(15 * Math.pow(0.84, i)));
    pages.push({
      src: SHOTS[i % SHOTS.length],
      tint: TINTS[(i * 5) % TINTS.length],
      start: t,
      dur,
      rot: (random(`rot${i}`) - 0.5) * 7,
    });
    t += dur;
  }
  return pages;
})();

const Page: React.FC<{ page: (typeof PAGES)[number]; flip: number; zoom: number }> = ({ page, flip, zoom }) => (
  <AbsoluteFill style={{ perspective: 2200, justifyContent: "center", alignItems: "center" }}>
    <div
      style={{
        width: 1500,
        height: 900,
        transformOrigin: "left center",
        transform: `rotate(${page.rot}deg) rotateY(${-flip * 100}deg) scale(${zoom})`,
        border: `16px solid ${C.cream}`,
        outline: "6px solid #000",
        boxShadow: "24px 24px 0 rgba(0,0,0,0.85)",
        overflow: "hidden",
        position: "relative",
        backgroundColor: "#000",
      }}
    >
      <Img src={staticFile(page.src)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.15) saturate(1.2)" }} />
      <AbsoluteFill style={{ backgroundColor: page.tint, mixBlendMode: "multiply", opacity: 0.55 }} />
      <Halftone color="rgba(0,0,0,0.45)" size={12} />
      {/* Darken the page as it turns away from us */}
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: flip * 0.6 }} />
    </div>
  </AbsoluteFill>
);

const FlipBook: React.FC<{ frame: number }> = ({ frame }) => {
  const i = PAGES.findIndex((p) => frame >= p.start && frame < p.start + p.dur);
  if (i === -1) return null;
  const page = PAGES[i];
  const next = PAGES[i + 1];
  const local = (frame - page.start) / page.dur;
  const flip = interpolate(local, [0.45, 1], [0, 1], { extrapolateLeft: "clamp" });
  return (
    <AbsoluteFill style={{ backgroundColor: C.ink }}>
      <Halftone color="rgba(91,58,117,0.6)" size={22} />
      {next && <Page page={next} flip={0} zoom={1} />}
      <Page page={page} flip={flip} zoom={1 + local * 0.04} />
    </AbsoluteFill>
  );
};

const Title: React.FC<{ t: number }> = ({ t }) => {
  const { fps } = useVideoConfig();

  // Small camera shake every time a letter lands.
  let shake = 0;
  for (let i = 0; i < WORD.length; i++) {
    const since = t - i * LETTER_GAP - 4;
    if (since >= 0 && since < 8) shake += (8 - since) * 1.6 * (i % 2 ? 1 : -1);
  }

  const shine = interpolate(t, [36, 70], [120, -20], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sub = spring({ frame: t - 34, fps, config: { damping: 18 } });
  const bar = interpolate(t, [28, 48], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const outro = interpolate(t, [96, 114], [1, 1.25], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const letterStyle: React.CSSProperties = {
    fontFamily: TITLE,
    fontSize: 330,
    lineHeight: 1,
    letterSpacing: 12,
    display: "inline-block",
  };

  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, ${C.purple} 0%, ${C.plum} 45%, ${C.ink} 100%)` }}>
      <AbsoluteFill
        style={{
          background: `repeating-conic-gradient(from ${t * 0.6}deg at 50% 50%, rgba(246,201,69,0.16) 0deg 6deg, transparent 6deg 18deg)`,
        }}
      />
      <Halftone color="rgba(0,0,0,0.35)" size={16} />

      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          transform: `translate(${shake}px, ${-shake * 0.6}px) scale(${outro})`,
        }}
      >
        <div style={{ position: "relative" }}>
          <div style={{ whiteSpace: "nowrap" }}>
            {WORD.split("").map((ch, i) => {
              const s = spring({ frame: t - i * LETTER_GAP, fps, config: { damping: 11, stiffness: 220, mass: 0.8 } });
              return (
                <span
                  key={i}
                  style={{
                    ...letterStyle,
                    color: C.cream,
                    opacity: Math.min(1, s * 2.5),
                    transform: `scale(${interpolate(s, [0, 1], [3, 1])}) rotate(${(1 - s) * (i % 2 ? 14 : -14)}deg)`,
                    filter: `blur(${(1 - Math.min(1, s)) * 18}px)`,
                    textShadow: `10px 10px 0 ${C.purple}, 18px 18px 0 #000`,
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </div>
          {/* Light sweep across the settled word */}
          <div
            style={{
              ...letterStyle,
              position: "absolute",
              inset: 0,
              whiteSpace: "nowrap",
              color: "transparent",
              backgroundImage: "linear-gradient(105deg, transparent 40%, rgba(255,240,190,0.95) 50%, transparent 60%)",
              backgroundSize: "300% 100%",
              backgroundPosition: `${shine}% 0`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              opacity: t > 30 ? 1 : 0,
            }}
          >
            {WORD}
          </div>
        </div>

        <div style={{ width: 1100 * bar, height: 10, background: C.gold, marginTop: 28, boxShadow: "6px 6px 0 #000" }} />
        <div
          style={{
            fontFamily: PIXEL,
            fontSize: 36,
            color: C.gold,
            letterSpacing: 8,
            marginTop: 34,
            opacity: sub,
            transform: `translateY(${(1 - sub) * 30}px)`,
            textShadow: "4px 4px 0 #000",
          }}
        >
          THE REALM CREDITS
        </div>
      </AbsoluteFill>
      <Vignette strength={0.6} />
    </AbsoluteFill>
  );
};

export const ComicTitle: React.FC = () => {
  const frame = useCurrentFrame();
  const flash = interpolate(frame, [TITLE_START - 4, TITLE_START, TITLE_START + 8], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ backgroundColor: C.ink }}>
      {frame < TITLE_START ? <FlipBook frame={frame} /> : <Title t={frame - TITLE_START} />}
      <AbsoluteFill style={{ backgroundColor: "#fff", opacity: flash }} />
      <Grain />
    </AbsoluteFill>
  );
};
