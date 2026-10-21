import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { WORDMARK_PATHS } from "../components/DyslexorLogo";
import { BODY } from "../theme";

// Bakes the real wordmark into a Kling keyframe's library panel (gilt letters
// raised on the stone, STUDIOS beneath), so it's in the footage Kling animates.
// Rendered as stills at the keyframes' own size (2720 x 1536); the panel rect
// is given in 1920-wide coordinates.
export type PlateProps = { img: string; x: number; y: number; w: number; h: number };
export const PLATE_W = 2720;
export const PLATE_H = 1536;
const K = PLATE_W / 1920;

export const IdentPlate: React.FC<PlateProps> = ({ img, x, y, w, h }) => {
  const X = x * K, Y = y * K, W = w * K, H = h * K;
  const wordH = H * 0.42;
  const wordW = (wordH * 230) / 53;
  const blur = Math.max(0.4, H / 260);
  return (
    <AbsoluteFill>
      <Img src={staticFile(img)} style={{ width: "100%", height: "100%" }} />
      <div style={{ position: "absolute", left: X, top: Y, width: W, height: H, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: H * 0.07, filter: `blur(${blur * 0.35}px)` }}>
        <svg width={wordW} height={wordH} viewBox="0 0 230 53" style={{ overflow: "visible", filter: `drop-shadow(0 ${H * 0.012}px ${H * 0.01}px rgba(30,12,2,0.9)) drop-shadow(0 0 ${H * 0.06}px rgba(255,190,110,0.45))` }}>
          <defs>
            <linearGradient id="gilt" x1="0" y1="0" x2="0" y2="53" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#fff0c8" />
              <stop offset="0.5" stopColor="#eab866" />
              <stop offset="1" stopColor="#9c5f26" />
            </linearGradient>
          </defs>
          {WORDMARK_PATHS.map((d) => (
            <path key={d} d={d} fill="url(#gilt)" />
          ))}
        </svg>
        <div style={{ fontFamily: BODY, fontWeight: 500, fontSize: H * 0.15, letterSpacing: "0.55em", paddingLeft: "0.55em", color: "#f3cf92", textShadow: `0 ${H * 0.01}px ${H * 0.008}px rgba(30,12,2,0.85), 0 0 ${H * 0.05}px rgba(255,190,110,0.45)` }}>
          STUDIOS
        </div>
      </div>
    </AbsoluteFill>
  );
};
