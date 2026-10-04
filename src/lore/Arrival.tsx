import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { At, ROW, Sprite, Tree, Bush } from "../components/Sprite";
import { Grain, Vignette } from "../components/Fx";
import { C, PIXEL, WIDTH } from "../theme";
import { Boat, Dialogue, Dock, Passengers, Princess, ROWAN, SEA, Waves } from "./parts";

// Dawn. The fog parts on a new island ringed with standing stones, one for
// each maths symbol, which wake up as Rowan arrives.
export const ARRIVAL_DURATION = 480;
export const STONES_WAKE = 250;

const PX = 5;
const DOCK_Y = 560;
const ISLE = { x: 980, y: 70, w: 1200, h: 960 };
const CIRCLE = { x: 1500, y: 520 };
const SYMBOLS = [
  "maths/special-addition.svg",
  "maths/special-subtraction.svg",
  "maths/special-multiplication.svg",
  "maths/special-division.svg",
];

const Stone: React.FC = () => (
  <svg width={14 * PX} height={20 * PX} viewBox="0 0 14 20" shapeRendering="crispEdges">
    <rect x={2} y={1} width={10} height={17} fill="#9a9488" />
    <rect x={1} y={3} width={12} height={15} fill="#9a9488" />
    <rect x={3} y={0} width={8} height={1} fill="#b6b0a3" />
    <rect x={2} y={2} width={3} height={14} fill="#b6b0a3" />
    <rect x={10} y={4} width={2} height={14} fill="#6f6a60" />
    <rect x={1} y={18} width={12} height={2} fill="#4f4b44" />
  </svg>
);

export const Arrival: React.FC = () => {
  const t = useCurrentFrame();
  const { fps } = useVideoConfig();

  const boatX = interpolate(t, [0, 170], [-260, 700], { easing: Easing.out(Easing.cubic), extrapolateRight: "clamp" });
  const bob = Math.sin(t / 12) * 4;
  const onShore = t >= 178;
  const hop = interpolate(t, [176, 182, 188], [0, -40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const walkX = interpolate(t, [188, 262], [820, 1210], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const walking = t >= 188 && t < 262;
  const facingUs = t >= 296;

  const fog = interpolate(t, [0, 160], [1, 0], { easing: Easing.in(Easing.quad), extrapolateRight: "clamp" });
  const dawn = interpolate(t, [0, 300], [0.55, 0.2], { extrapolateRight: "clamp" });
  const fadeIn = interpolate(t, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const zoom = interpolate(t, [0, ARRIVAL_DURATION], [1.1, 1.0]);
  const toWhite = interpolate(t, [ARRIVAL_DURATION - 30, ARRIVAL_DURATION], [0, 1], { extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: SEA.deep, overflow: "hidden", opacity: fadeIn }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: "1300px 560px" }}>
        <AbsoluteFill style={{ background: `linear-gradient(90deg, ${SEA.deep}, ${SEA.water} 60%)` }} />
        <Waves seed="arr" count={60} area={{ x: 0, y: 0, w: ISLE.x, h: 1080 }} />

        {/* The new island */}
        <div style={{ position: "absolute", left: ISLE.x, top: ISLE.y, width: ISLE.w, height: ISLE.h }}>
          <div style={{ position: "absolute", inset: -150, background: SEA.shallow, borderRadius: 260 }} />
          <div style={{ position: "absolute", inset: -50, background: SEA.wetSand, borderRadius: 200 }} />
          <div style={{ position: "absolute", inset: 0, background: SEA.sand, borderRadius: 180 }} />
          <div style={{ position: "absolute", inset: 70, background: "#7dc46a", borderRadius: 140 }} />
          {/* Wildflowers */}
          {Array.from({ length: 70 }, (_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 120 + random(`fl-x${i}`) * (ISLE.w - 240),
                top: 120 + random(`fl-y${i}`) * (ISLE.h - 240),
                width: 10,
                height: 10,
                background: ["#f7a8c8", "#c9b2f2", "#fff6c2"][i % 3],
                boxShadow: "0 5px 0 #3f7f4c",
              }}
            />
          ))}
          {/* Path from the jetty to the stone circle */}
          <div style={{ position: "absolute", left: 0, top: DOCK_Y - ISLE.y - 45, width: CIRCLE.x - ISLE.x, height: 100, background: C.path }} />
          <div
            style={{
              position: "absolute",
              left: CIRCLE.x - ISLE.x - 230,
              top: CIRCLE.y - ISLE.y - 230,
              width: 460,
              height: 460,
              borderRadius: "50%",
              background: C.path,
            }}
          />
        </div>

        <At x={1120} y={210}><Tree scale={4.5} /></At>
        <At x={2000} y={300}><Tree scale={4.5} /></At>
        <At x={1180} y={900}><Tree scale={4.5} /></At>
        <At x={1900} y={880}><Bush scale={4} /></At>
        <At x={1800} y={170}><Bush scale={4} /></At>

        {/* Sign at the end of the jetty */}
        <At x={1040} y={420} z={3}>
          <div style={{ background: "#a06a3c", border: "5px solid #5c3520", padding: "10px 14px", fontFamily: PIXEL, fontSize: 16, color: C.cream, textAlign: "center", lineHeight: 1.5 }}>
            ISLE OF
            <br />
            NUMBERS
          </div>
          <div style={{ width: 10, height: 50, background: "#5c3520", margin: "0 auto" }} />
        </At>

        <div style={{ position: "absolute", left: 600, top: DOCK_Y - 40, zIndex: 2 }}>
          <Dock length={420} px={PX} />
        </div>

        {/* Standing stones, each waking with its symbol */}
        {SYMBOLS.map((src, i) => {
          const angle = (-135 + i * 90) * (Math.PI / 180);
          const sx = CIRCLE.x + Math.cos(angle) * 200;
          const sy = CIRCLE.y + Math.sin(angle) * 170;
          const wake = spring({ frame: t - STONES_WAKE - i * 12, fps, config: { damping: 12, stiffness: 120 } });
          const float = Math.sin(t / 14 + i) * 8;
          return (
            <At key={src} x={sx} y={sy}>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    left: -60,
                    top: -40,
                    width: 190,
                    height: 190,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(255,220,120,0.65), rgba(255,220,120,0) 65%)",
                    opacity: wake,
                  }}
                />
                <Stone />
                <Img
                  src={staticFile(src)}
                  style={{
                    position: "absolute",
                    left: 7 * PX - 50,
                    top: -110 + float,
                    width: 100,
                    height: 100,
                    opacity: wake,
                    transform: `scale(${wake})`,
                    filter: "drop-shadow(0 0 18px rgba(255,214,110,0.9))",
                  }}
                />
              </div>
            </At>
          );
        })}

        {/* Boat glides in to the jetty */}
        <At x={boatX} y={DOCK_Y - 52 + bob} z={4}>
          <Boat px={PX}>
            {!onShore && <Passengers px={PX} />}
          </Boat>
        </At>

        {onShore && (
          <>
            <At x={walkX - 80} y={DOCK_Y - 20 + hop} z={6}>
              <Princess row={walking ? ROW.walkSide : facingUs ? ROW.idleDown : ROW.idleSide} scale={PX} animFps={walking ? 10 : 5} />
            </At>
            <At x={walkX} y={DOCK_Y - 26 + hop} z={7}>
              <Sprite src={ROWAN} row={walking ? ROW.walkSide : facingUs ? ROW.idleDown : ROW.idleSide} scale={PX} animFps={walking ? 10 : 5} />
            </At>
          </>
        )}

        {/* Dawn grade */}
        <AbsoluteFill style={{ background: "linear-gradient(200deg, #ffd9a0, #f4a6b8 60%, #8f86c9)", mixBlendMode: "multiply", opacity: dawn, zIndex: 2000 }} />
      </AbsoluteFill>

      {/* Fog bank rolling apart */}
      <AbsoluteFill style={{ opacity: fog, pointerEvents: "none" }}>
        {Array.from({ length: 9 }, (_, i) => {
          const dir = i % 2 ? 1 : -1;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: (i / 9) * WIDTH - 300 + dir * (1 - fog) * 500,
                top: 80 + (i % 3) * 300,
                width: 900,
                height: 500,
                borderRadius: "50%",
                background: "rgba(245,245,255,0.9)",
                filter: "blur(70px)",
              }}
            />
          );
        })}
      </AbsoluteFill>

      <Vignette strength={0.5} />
      <Dialogue speaker="ELDER ROWAN" text="Here, numbers grow the way words do." t={t - 300} dur={64} />
      <Dialogue speaker="THE PRINCESS" text="Then let's begin a new chapter." t={t - 366} dur={70} color="#f7a8c8" />
      <AbsoluteFill style={{ backgroundColor: "#fff8ea", opacity: toWhite }} />
      <Grain />
    </AbsoluteFill>
  );
};
