import React from "react";
import { AbsoluteFill, Easing, interpolate, random, Sequence, useCurrentFrame } from "remotion";
import { Grain, Vignette } from "../components/Fx";
import { EPIC } from "../lore/parts";
import { C } from "../theme";
import { ACCENT, ACT1_SHOTS, ACT2_SHOTS, CROSSFADE, DOORWAY, Shot, TITLE_FRAMES } from "./config";
import { Footage } from "./Footage";
import { RealPage } from "./realm/swim";
import { Letterbox } from "./parts";
import { Pov } from "./realm/Pov";

// Acts 1 and 2: the real world. AI live-action shots, letterboxed and graded
// cool, with the realm leaking in: a chime, pixel dust under the door, mint
// light, and finally the portal itself.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const starts = (shots: Shot[], offset: number) => {
  let at = offset;
  return shots.map((s) => {
    const from = at;
    at += s.frames;
    return { shot: s, from };
  });
};

// Pixel squares drifting up from a source area, stepped for an 8-bit feel.
const PixelDust: React.FC<{ area: { x: number; y: number; w: number }; count?: number; rise?: number }> = ({ area, count = 40, rise = 500 }) => {
  const f = Math.floor(useCurrentFrame() / 2) * 2;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen" }}>
      {Array.from({ length: count }, (_, i) => {
        const life = 50 + random(`pd-l${i}`) * 40;
        const t = ((f + random(`pd-o${i}`) * life) % life) / life;
        const x = area.x + random(`pd-x${i}`) * area.w + Math.sin(t * 6 + i) * 20;
        const y = area.y - t * rise * (0.5 + random(`pd-r${i}`));
        const s = [8, 12, 16][i % 3];
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: Math.round(x / 4) * 4,
              top: Math.round(y / 4) * 4,
              width: s,
              height: s,
              background: [ACCENT.mint, C.cream, ACCENT.lavender][i % 3],
              opacity: (1 - t) * 0.9,
              boxShadow: `0 0 ${s * 2}px ${ACCENT.mint}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// Mint/lavender light washing over a face from one side.
const PortalLight: React.FC<{ from: "left" | "right" | "center"; strength?: number }> = ({ from, strength = 1 }) => {
  const f = useCurrentFrame();
  const pulse = 0.75 + 0.25 * Math.sin(f / 5) + 0.1 * Math.sin(f / 1.7);
  const at = from === "left" ? "0% 55%" : from === "right" ? "100% 55%" : "50% 50%";
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at ${at}, ${ACCENT.mint}aa, ${ACCENT.lavender}44 40%, transparent 75%)`,
        mixBlendMode: "screen",
        opacity: pulse * strength,
        pointerEvents: "none",
      }}
    />
  );
};

// The open doorway in s10: the realm visible through it, framed by stepped
// pixel rings that keep pushing outward.
const Portal: React.FC = () => {
  const f = useCurrentFrame();
  const open = interpolate(f, [0, 22], [0, 1], clamp);
  const stepF = Math.floor(f / 3) * 3;
  const D = DOORWAY;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* Spill light onto the hallway */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at ${D.x + D.w / 2}px ${D.y + D.h / 2}px, ${ACCENT.mint}66, transparent 60%)`,
          mixBlendMode: "screen",
          opacity: open,
        }}
      />
      <div style={{ position: "absolute", left: D.x, top: D.y, width: D.w, height: D.h, overflow: "hidden", transform: `scaleY(${open})` }}>
        {/* The realm, glimpsed */}
        <div style={{ position: "absolute", left: D.w / 2 - 720, top: D.h / 2 - 405, width: 1920, height: 1080, transform: "scale(0.75)", transformOrigin: "0 0" }}>
          <Pov cam={{ x: 0, y: 200, heading: Math.sin(f / 50) * 0.05, horizon: 140 }} />
        </div>
        <AbsoluteFill style={{ background: `radial-gradient(ellipse, transparent 45%, ${ACCENT.mint}88 100%)` }} />
        {/* Rings */}
        {Array.from({ length: 6 }, (_, i) => {
          const t = ((stepF / 40 + i / 6) % 1);
          const w = D.w * (0.2 + t * 1.1);
          const h = D.h * (0.2 + t * 1.1);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: D.w / 2 - w / 2,
                top: D.h / 2 - h / 2,
                width: w,
                height: h,
                border: `${12 - t * 6}px solid ${[ACCENT.mint, ACCENT.lavender, ACCENT.peach][i % 3]}`,
                opacity: (1 - t) * 0.55,
              }}
            />
          );
        })}
      </div>
      <PixelDust area={{ x: D.x, y: D.y + D.h, w: D.w }} count={50} rise={900} />
    </AbsoluteFill>
  );
};

// c02: the page she's asked to read, close, its letters swimming. Drawn
// here, so the shot needs no clip.
const CardSwim: React.FC = () => {
  const f = useCurrentFrame();
  return <RealPage f={f} />;
};

const overlayFor = (id: string, frames: number) => {
  switch (id) {
    case "c02":
      return <CardSwim />;
    case "s07":
      return <PixelDust area={{ x: 760, y: 900, w: 400 }} count={34} rise={260} />;
    case "s09":
      return <PortalLight from="right" />;
    case "s10":
      return <Portal />;
    case "s11":
      return (
        <>
          <PortalLight from="right" strength={0.8} />
          <PixelDust area={{ x: 1300, y: 1000, w: 600 }} count={24} rise={700} />
        </>
      );
    case "s12":
      return (
        <>
          <PortalLight from="center" strength={0.7} />
          <PixelDust area={{ x: 560, y: 1080, w: 800 }} count={60} rise={1000} />
          <FlashOut frames={frames} />
        </>
      );
    default:
      return null;
  }
};

const FlashOut: React.FC<{ frames: number }> = ({ frames }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ backgroundColor: "#fff", opacity: interpolate(f, [frames - 50, frames - 8], [0, 1], clamp) }} />;
};

// The first shot fades up under the title, and the words dissolve over it.
const TITLE_LEAD = CROSSFADE * 2;

const TitleCard: React.FC = () => {
  const f = useCurrentFrame();
  const words = interpolate(f, [10, 40, TITLE_FRAMES - CROSSFADE, TITLE_FRAMES], [0, 1, 1, 0], clamp);
  const black = interpolate(f, [TITLE_FRAMES - TITLE_LEAD, TITLE_FRAMES], [1, 0], { ...clamp, easing: Easing.inOut(Easing.quad) });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: black }} />
      <div style={{ fontFamily: EPIC, fontSize: 64, color: C.cream, letterSpacing: 6, opacity: words, textShadow: "0 4px 30px #000" }}>
        Every reader starts somewhere.
      </div>
    </AbsoluteFill>
  );
};

export const RealWorld: React.FC = () => {
  const f = useCurrentFrame();
  const a1 = starts(ACT1_SHOTS, TITLE_FRAMES);
  const a2 = starts(ACT2_SHOTS, a1[a1.length - 1].from + ACT1_SHOTS[ACT1_SHOTS.length - 1].frames);
  const last = a2[a2.length - 1];
  // Bars open as Hero steps through.
  const open = interpolate(f, [last.from + 110, last.from + 190], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {[...a1, ...a2].map(({ shot, from }, i) => {
        // The first shot starts early so it can fade up under the title.
        const lead = i === 0 ? TITLE_LEAD : 0;
        return (
          <Sequence key={shot.id} from={from - lead} durationInFrames={shot.frames + lead} name={`${shot.id} · ${shot.title}`}>
            <Footage shot={{ ...shot, frames: shot.frames + lead }} />
            {overlayFor(shot.id, shot.frames + lead)}
          </Sequence>
        );
      })}
      <Sequence from={TITLE_FRAMES - TITLE_LEAD}>
        <Grain opacity={0.07} />
        <Vignette strength={0.55} />
        <Letterbox open={open} />
      </Sequence>
      <Sequence durationInFrames={TITLE_FRAMES} name="s01 · Title">
        <TitleCard />
      </Sequence>
    </AbsoluteFill>
  );
};
