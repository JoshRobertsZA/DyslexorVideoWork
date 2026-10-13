import React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { C, PIXEL } from "../../theme";

// Each chapter opens on its number and name over the first shot, like an
// anime episode's title: a gold rule draws out, the words rise onto it, and
// it all fades before the action starts.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const CHAPTER_CARD_FRAMES = 120;

export const ChapterCard: React.FC<{ t: number; n: number; title: string }> = ({ t, n, title }) => {
  if (t < 0 || t > CHAPTER_CARD_FRAMES) return null;
  const rule = interpolate(t, [4, 26], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const words = interpolate(t, [14, 34], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const out = interpolate(t, [CHAPTER_CARD_FRAMES - 22, CHAPTER_CARD_FRAMES], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", justifyContent: "center", alignItems: "center", opacity: out }}>
      {/* A dark band behind the words so they read over any shot */}
      <AbsoluteFill style={{ background: "linear-gradient(transparent 30%, rgba(5,4,12,0.62) 42%, rgba(5,4,12,0.62) 58%, transparent 70%)", opacity: rule }} />
      <div style={{ position: "relative", textAlign: "center", fontFamily: PIXEL }}>
        <div style={{ fontSize: 26, letterSpacing: 10, color: C.gold, textShadow: "4px 4px 0 #000", opacity: words, transform: `translateY(${(1 - words) * 16}px)` }}>
          CHAPTER {n}
        </div>
        <div style={{ width: 760 * rule, height: 4, background: C.gold, margin: "22px auto", boxShadow: `0 0 16px ${C.gold}` }} />
        <div style={{ fontSize: 72, letterSpacing: 4, color: C.cream, textShadow: "6px 6px 0 #000", opacity: words, transform: `translateY(${(1 - words) * -16}px)` }}>
          {title.toUpperCase()}
        </div>
      </div>
    </AbsoluteFill>
  );
};
