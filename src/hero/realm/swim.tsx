import React from "react";
import { random } from "remotion";
import { BODY, C } from "../../theme";

// The swimming letters: what words look like to Hero when reading gets hard.
// Letters drift, tilt and now and then swap places with a neighbour. The
// same look everywhere it appears (the card from home, the 8-bit card in the
// realm, the Wizard's storm), so kids connect them. `swim` 0 = still and
// readable, 1 = all over the place.

export const SwimWord: React.FC<{ text: string; f: number; swim: number; size: number; color?: string; seed?: string; style?: React.CSSProperties }> = ({
  text,
  f,
  swim,
  size,
  color = C.ink,
  seed = "sw",
  style,
}) => {
  const letters = [...text];
  // Every so often two neighbours trade places.
  const beat = Math.floor(f / 14);
  const swapAt = swim > 0.5 ? Math.floor(random(`${seed}-${beat}`) * (letters.length - 1)) : -1;
  const shown = letters.map((ch, i) => (i === swapAt ? letters[i + 1] : i === swapAt + 1 && swapAt >= 0 ? letters[i - 1] : ch));
  return (
    <div style={{ display: "flex", fontFamily: BODY, fontWeight: 700, fontSize: size, lineHeight: 1, color, ...style }}>
      {shown.map((ch, i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            transform: `translate(${Math.sin(f / 5 + i * 1.7) * swim * size * 0.22}px, ${Math.cos(f / 6 + i * 2.3) * swim * size * 0.2}px) rotate(${Math.sin(f / 7 + i) * swim * 14}deg)`,
            opacity: 1 - swim * 0.25 * (0.5 + 0.5 * Math.sin(f / 4 + i * 3)),
          }}
        >
          {ch}
        </span>
      ))}
    </div>
  );
};

// The word card from game night, 8-bit since she came through the portal.
export const CARD_WORD = "ADVENTURE";

export const PixelCard: React.FC<{ f: number; swim: number; x: number; y: number; w?: number; tilt?: number }> = ({ f, swim, x, y, w = 460, tilt = 0 }) => (
  <div
    style={{
      position: "absolute",
      left: x - w / 2,
      top: y - w * 0.32,
      width: w,
      height: w * 0.64,
      background: "#f3e6c8",
      border: "8px solid #3a2a1d",
      outline: "6px solid #000",
      boxShadow: "inset -10px -10px 0 #d9c49c, 12px 12px 0 rgba(0,0,0,0.4)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: w * 0.04,
      transform: `rotate(${tilt}deg)`,
    }}
  >
    <div style={{ width: w * 0.3, height: 10, background: "#c9b48c" }} />
    <SwimWord text={CARD_WORD} f={f} swim={swim} size={w * 0.12} seed="card" />
    <div style={{ width: w * 0.5, height: 10, background: "#c9b48c" }} />
  </div>
);

// The same card in the real world, close: a plain paper card. Each of the
// word's three chunks swims until it's `settled`; `mark` underlines the chunk
// just read.
export const CARD_CHUNKS = ["AD", "VEN", "TURE"];

export const RealCard: React.FC<{ f: number; settled: boolean[]; mark?: number }> = ({ f, settled, mark = -1 }) => (
  <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 40%, #6a4a3a, #2a1a14 75%)" }}>
    <div
      style={{
        position: "absolute",
        left: 960 - 520,
        top: 540 - 300,
        width: 1040,
        height: 600,
        background: "linear-gradient(160deg, #fffaf0, #f1e6cf)",
        borderRadius: 28,
        boxShadow: "0 40px 80px rgba(0,0,0,0.5)",
        transform: `rotate(${-2 + Math.sin(f / 30) * 0.6}deg)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ display: "flex" }}>
        {CARD_CHUNKS.map((c, i) => (
          <div key={c} style={{ position: "relative" }}>
            <SwimWord text={c} f={f} swim={settled[i] ? 0 : 1} size={150} color={settled[i] ? "#2a1838" : "#5a4a66"} seed={`real${i}`} />
            {mark === i && <div style={{ position: "absolute", left: 0, right: 0, bottom: -18, height: 10, borderRadius: 5, background: C.gold }} />}
          </div>
        ))}
      </div>
    </div>
  </div>
);

// The page she's asked to read aloud in class, close: an open reading book,
// every word drifting a little and ADVENTURE, the one she gets stuck on,
// swimming hardest.
const PAGE_LINES = [
  ["The", "map", "was", "old", "and", "torn."],
  ["Every", "great", CARD_WORD, "starts"],
  ["with", "one", "small", "step."],
];

export const RealPage: React.FC<{ f: number }> = ({ f }) => (
  <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 40%, #5a6a7a, #1c222a 78%)" }}>
    <div
      style={{
        position: "absolute",
        left: 960 - 760,
        top: 540 - 380,
        width: 1520,
        height: 760,
        background: "linear-gradient(90deg, #efe6d2, #fffaf0 46%, #d9cdb4 50%, #fffaf0 54%, #f1e8d4)",
        borderRadius: 18,
        boxShadow: "0 40px 90px rgba(0,0,0,0.55)",
        transform: `rotate(${-1.5 + Math.sin(f / 40) * 0.4}deg)`,
      }}
    >
      <div style={{ position: "absolute", left: 90, top: 120, width: 600, display: "flex", flexDirection: "column", gap: 28 }}>
        {[0.9, 0.75, 0.95, 0.6, 0.85, 0.7].map((w, i) => (
          <div key={i} style={{ height: 22, width: `${w * 100}%`, borderRadius: 11, background: "#c9bda6" }} />
        ))}
      </div>
      <div style={{ position: "absolute", left: 830, top: 150, width: 620, display: "flex", flexDirection: "column", gap: 54 }}>
        {PAGE_LINES.map((line, r) => (
          <div key={r} style={{ display: "flex", flexWrap: "wrap", gap: 26 }}>
            {line.map((w, k) => (
              <SwimWord key={k} text={w} f={f + r * 13 + k * 7} swim={w === CARD_WORD ? 1 : 0.45} size={w === CARD_WORD ? 70 : 58} color={w === CARD_WORD ? "#2a1838" : "#4a4050"} seed={`page${r}${k}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);
