import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { loadFont as loadCinzel } from "@remotion/google-fonts/Cinzel";
import { WORDMARK_PATHS } from "../components/DyslexorLogo";

// Mock-ups of the studio mark on the library's stone panel, for choosing a
// treatment. Not part of the episode. The panel (clean, no lettering) is
// cropped from keyframe 5 and scaled up like the end of the ident's zoom.

const CINZEL = loadCinzel("normal", { weights: ["500", "600", "700"], subsets: ["latin"] }).fontFamily;

// Panel rect in 1920-wide coords of kf5-library.png, and the zoom.
const P = { x: 742, y: 279, w: 420, h: 126 };
const Z = 3.9;
const K = 2720 / 1920;

type Variant = "current" | "carved" | "bronze" | "serif-bronze" | "serif-carved";

// Uplit from below, so raised letters throw their shadow upward and catch
// light on their lower edges; cut letters are dark at the bottom of the cut
// and lit on their upper inside edge.
const Mark: React.FC<{ v: Variant }> = ({ v }) => {
  const word = (style: React.CSSProperties, fill: string, extra?: React.ReactNode) => (
    <svg width={760} height={(760 * 53) / 230} viewBox="0 0 230 53" style={{ overflow: "visible", ...style }}>
      {extra}
      {WORDMARK_PATHS.map((d) => (
        <path key={d} d={d} fill={fill} />
      ))}
    </svg>
  );
  const bronze = "linear-gradient(0deg, #f0c98a 0%, #b88446 35%, #6e4a26 100%)";
  if (v === "current") {
    return (
      <>
        {word({ filter: "drop-shadow(0 4px 3px rgba(30,12,2,0.9)) drop-shadow(0 0 16px rgba(255,190,110,0.45))" }, "url(#g)", (
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="0" y2="53" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#fff0c8" />
              <stop offset="0.5" stopColor="#eab866" />
              <stop offset="1" stopColor="#9c5f26" />
            </linearGradient>
          </defs>
        ))}
        <div style={{ fontFamily: "Lexend", fontSize: 70, letterSpacing: "0.55em", color: "#f3cf92", marginTop: 24 }}>STUDIOS</div>
      </>
    );
  }
  if (v === "carved") {
    // The wordmark cut into the stone: same stone inside, dark lower lip, lit upper lip.
    return word({ filter: "drop-shadow(0 -3px 0 rgba(255,225,170,0.55)) drop-shadow(0 4px 2px rgba(20,8,0,0.75))", mixBlendMode: "multiply" }, "rgba(90,52,20,0.55)");
  }
  if (v === "bronze") {
    // Cast, aged-bronze letters pinned off the wall: lit from below, shadow cast upward.
    return word({ filter: "drop-shadow(0 -10px 6px rgba(20,8,0,0.55)) drop-shadow(0 2px 0 #ffe2a8)" }, "url(#b)", (
      <defs>
        <linearGradient id="b" x1="0" y1="53" x2="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f2cc8c" />
          <stop offset="0.4" stopColor="#b58247" />
          <stop offset="1" stopColor="#5e3d1e" />
        </linearGradient>
      </defs>
    ));
  }
  const serif = (style: React.CSSProperties) => (
    <>
      <div style={{ fontFamily: CINZEL, fontWeight: 600, fontSize: 168, letterSpacing: "0.08em", lineHeight: 1, ...style }}>DYSLEXOR</div>
      <div style={{ display: "flex", alignItems: "center", gap: 28, marginTop: 22 }}>
        <div style={{ width: 120, height: 4, ...style, background: style.background ?? "rgba(90,52,20,0.6)" }} />
        <div style={{ fontFamily: CINZEL, fontWeight: 600, fontSize: 64, letterSpacing: "0.5em", paddingLeft: "0.5em", lineHeight: 1, ...style }}>STUDIOS</div>
        <div style={{ width: 120, height: 4, ...style, background: style.background ?? "rgba(90,52,20,0.6)" }} />
      </div>
    </>
  );
  if (v === "serif-bronze") {
    return serif({ background: bronze, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", filter: "drop-shadow(0 -9px 6px rgba(20,8,0,0.55)) drop-shadow(0 2px 0 #ffe2a8)" });
  }
  return serif({ color: "rgba(90,52,20,0.6)", mixBlendMode: "multiply", textShadow: "0 -3px 0 rgba(255,225,170,0.55), 0 4px 2px rgba(20,8,0,0.7)" });
};

export const LogoMock: React.FC<{ v: Variant }> = ({ v }) => {
  const cx = (P.x + P.w / 2) * K;
  const cy = (P.y + P.h / 2) * K;
  const s = Z / K;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <Img
        src={staticFile("ident/keyframes/kf5-library.png")}
        style={{ position: "absolute", left: 960 - cx * s, top: 540 - cy * s, width: 2720 * s, height: 1536 * s, filter: "blur(1.2px)" }}
      />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 45% at 50% 50%, transparent 40%, rgba(0,0,0,0.35) 100%)" }} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column" }}>
        <Mark v={v} />
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 40, top: 30, fontFamily: "Lexend", fontSize: 30, color: "#fff", background: "rgba(0,0,0,0.6)", padding: "6px 16px", borderRadius: 8 }}>{v}</div>
    </AbsoluteFill>
  );
};
