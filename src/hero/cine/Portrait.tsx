import React from "react";
import { AbsoluteFill, Img, interpolate, random, staticFile } from "remotion";
import { Crop } from "../../components/Sprite";
import { C } from "../../theme";
import { HERO_LAYERS } from "../parts";
import { SHEETS } from "../realm/world";

// Anime close-ups. Each is a full-screen shot of one face against a coloured
// backdrop, with an optional emotion icon. Until the AI pixel portraits exist
// (docs/PORTRAITS.md), the face is the character's own sprite head blown up
// with hard pixels; list a portrait in PORTRAITS once its file is in
// public/portraits/ and it's used instead.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export type Who = "hero" | "rowan" | "guard" | "farmer" | "merchant" | "blacksmith" | "fisherman";
export type Mood = "neutral" | "shocked" | "worried" | "determined" | "warm" | "sad";
export type Emote = "sweat" | "!" | "?" | "anger" | "sparkle";

// Portraits that exist as files: public/portraits/<who>-<mood>.png.
export const PORTRAITS: Partial<Record<Who, Mood[]>> = {};

const SHEET_OF: Record<Exclude<Who, "hero">, keyof typeof SHEETS> = {
  rowan: "rowan",
  guard: "guard",
  farmer: "farmer",
  merchant: "merchant",
  blacksmith: "blacksmith",
  fisherman: "fisherman",
};

// Each character's colour for their close-up backdrop.
export const TINT: Record<Who, string> = {
  hero: "#8a5cc2",
  rowan: "#5b4a9c",
  guard: "#4f6fb0",
  farmer: "#5f9e4a",
  merchant: "#b07a3f",
  blacksmith: "#b0503f",
  fisherman: "#3f8fa8",
};

// Each sprite's head (and hat) in its 48px idle-down frame, measured from
// the sheets: the heads sit at different heights and sizes.
const HEAD: Record<Who, { x: number; y: number; w: number; h: number }> = {
  hero: { x: 15, y: 21, w: 19, h: 16 },
  rowan: { x: 13, y: 10, w: 23, h: 24 },
  guard: { x: 16, y: 20, w: 17, h: 14 },
  farmer: { x: 11, y: 17, w: 27, h: 17 },
  merchant: { x: 16, y: 21, w: 17, h: 14 },
  blacksmith: { x: 16, y: 21, w: 17, h: 14 },
  fisherman: { x: 13, y: 17, w: 23, h: 17 },
};
// Where the eyes sit in each crop (0 = top, 1 = bottom), so every face is
// placed by its eye line, clear of the dialogue box.
const EYES: Record<Who, number> = { hero: 0.62, rowan: 0.71, guard: 0.57, farmer: 0.65, merchant: 0.57, blacksmith: 0.57, fisherman: 0.65 };
const EYE_LINE = 560;
// Every face fills the close-up to about this height.
const FACE_H = 560;
const headScale = (who: Who, k = 1) => Math.round((FACE_H * k) / HEAD[who].h);

const SpriteHead: React.FC<{ who: Who; k?: number }> = ({ who, k = 1 }) => {
  const layers = who === "hero" ? HERO_LAYERS : [SHEETS[SHEET_OF[who]]];
  const h = HEAD[who];
  const scale = headScale(who, k);
  return (
    <div style={{ position: "relative", width: h.w * scale, height: h.h * scale }}>
      {layers.map((src) => (
        <Crop key={src} src={src} sheetW={288} sheetH={480} x={h.x} y={h.y} w={h.w} h={h.h} scale={scale} style={{ position: "absolute", inset: 0 }} />
      ))}
    </div>
  );
};

// ---- Emotion icons ------------------------------------------------------------------

export const EmoteIcon: React.FC<{ kind: Emote; px?: number; t?: number }> = ({ kind, px = 10, t = 0 }) => {
  const pop = interpolate(t, [0, 5, 9], [0.3, 1.2, 1], clamp);
  const drip = kind === "sweat" ? Math.min(t, 30) * 1.2 : 0;
  const pix = (x: number, y: number, w: number, h: number, fill: string, k?: string) => <rect key={k ?? `${x}-${y}-${fill}`} x={x} y={y} width={w} height={h} fill={fill} />;
  let art: React.ReactNode;
  if (kind === "sweat")
    art = [pix(3, 0, 2, 2, "#cfe8ff"), pix(2, 2, 4, 2, "#8cc4ff"), pix(1, 4, 6, 3, "#5aa0f0"), pix(2, 7, 4, 1, "#3a78c8"), pix(2, 3, 1, 2, "#ffffff")];
  else if (kind === "anger")
    art = [pix(1, 1, 2, 3, "#ff4a4a"), pix(1, 1, 3, 2, "#ff4a4a"), pix(5, 1, 2, 3, "#ff4a4a"), pix(4, 1, 3, 2, "#ff4a4a"), pix(1, 5, 2, 3, "#ff4a4a"), pix(1, 6, 3, 2, "#ff4a4a"), pix(5, 5, 2, 3, "#ff4a4a"), pix(4, 6, 3, 2, "#ff4a4a")];
  else if (kind === "sparkle")
    art = [pix(3, 0, 2, 8, C.gold), pix(0, 3, 8, 2, C.gold), pix(3, 3, 2, 2, "#ffffff"), pix(9, 6, 1, 3, C.gold), pix(8, 7, 3, 1, C.gold)];
  else
    art = [
      pix(1, 0, 7, 9, "#ffffff"),
      pix(0, 1, 9, 7, "#ffffff"),
      pix(3, 9, 3, 1, "#ffffff"),
      pix(4, 10, 1, 1, "#ffffff"),
      ...(kind === "!" ? [pix(4, 2, 1, 4, C.ink), pix(4, 7, 1, 1, C.ink)] : [pix(3, 2, 3, 1, C.ink), pix(5, 3, 1, 2, C.ink), pix(4, 5, 1, 1, C.ink), pix(4, 7, 1, 1, C.ink)]),
    ];
  return (
    <svg width={11 * px} height={11 * px} viewBox="0 0 11 11" shapeRendering="crispEdges" style={{ transform: `translateY(${drip}px) scale(${pop})`, overflow: "visible" }}>
      {art}
    </svg>
  );
};

// ---- The close-up ------------------------------------------------------------------

export const CloseUp: React.FC<{
  who: Who;
  t: number;
  mood?: Mood;
  // "center" for a manga panel.
  side?: "left" | "right" | "center";
  talking?: boolean;
  emote?: Emote;
  emoteAt?: number;
  // Drained like the realm (everyone but Hero, for now).
  drained?: boolean;
  // Anime speed lines behind, for a dramatic beat.
  lines?: boolean;
}> = ({ who, t, mood = "neutral", side = "right", talking = false, emote, emoteAt = 6, drained = who !== "hero", lines = false }) => {
  const tint = TINT[who];
  const push = interpolate(t, [0, 90], [1, 1.06], clamp);
  const bob = talking ? Math.abs(Math.sin(t / 3.2)) * -8 : 0;
  const portrait = PORTRAITS[who]?.includes(mood);
  // Smaller inside a manga panel.
  const k = side === "center" ? 0.62 : 1;
  const faceW = portrait ? FACE_H * k : HEAD[who].w * headScale(who, k);
  const faceH = portrait ? FACE_H * k : HEAD[who].h * headScale(who, k);
  const left = side === "right" ? 1920 - faceW - 160 : side === "left" ? 160 : 960 - faceW / 2;
  const art = portrait ? (
    <Img src={staticFile(`portraits/${who}-${mood}.png`)} style={{ width: faceW, height: faceH, imageRendering: "pixelated" }} />
  ) : (
    <SpriteHead who={who} k={k} />
  );
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#0d0a18" }}>
      {/* Diagonal colour band, anime close-up style */}
      <AbsoluteFill
        style={{
          background:
            side === "center"
              ? `radial-gradient(ellipse at 50% 45%, ${tint}, ${tint}99 60%, #0d0a18 100%)`
              : `linear-gradient(${side === "left" ? 65 : 115}deg, #0d0a18 0%, #0d0a18 30%, ${tint} 30%, ${tint}cc 70%, ${tint}88 100%)`,
          filter: drained ? "saturate(0.45)" : undefined,
        }}
      />
      {lines && (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, mixBlendMode: "screen" }}>
          {Array.from({ length: 40 }, (_, k) => {
            const y = random(`cl-y${k}-${Math.floor(t / 2)}`) * 1080;
            return <line key={k} x1={0} x2={1920} y1={y} y2={y + (side === "right" ? -60 : 60)} stroke="#ffffff" strokeWidth={1 + (k % 3) * 2} opacity={0.18} />;
          })}
        </svg>
      )}
      <div
        style={{
          position: "absolute",
          left,
          // Placed by the eyes, clear of the dialogue box (its top edge is ~830).
          top: EYE_LINE - faceH * (portrait ? 0.5 : EYES[who]) + bob,
          transform: `scale(${push})`,
          transformOrigin: "50% 100%",
          filter: drained ? "saturate(0.45)" : `drop-shadow(0 0 30px ${tint})`,
        }}
      >
        {art}
        {emote && t >= emoteAt && (
          <div style={{ position: "absolute", left: side === "right" ? -40 : faceW - 70, top: 20 }}>
            <EmoteIcon kind={emote} t={t - emoteAt} />
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
