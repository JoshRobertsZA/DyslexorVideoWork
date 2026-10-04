import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { At, Bush, Chest, ROW, Sprite, Tree } from "../components/Sprite";
import { Exclaim, Fireflies, Grain, Grass, Pebble, Vignette } from "../components/Fx";
import { WEBSITE } from "../credits";
import { C, PIXEL, TITLE } from "../theme";

// Scene 7: post-credits. Night in the realm. Dyslexi finds the chest from the
// opening scene, it bursts open, and out fly the four maths symbols: a tease
// for Dyslexor Maths.
export const STINGER_DURATION = 420;
export const CHEST_OPEN = 150;

const CHEST = { x: 960, y: 640 };
const CAT_STOP = 770;
const BLACKOUT = 332;

const SYMBOLS = [
  "maths/special-addition.svg",
  "maths/special-subtraction.svg",
  "maths/special-multiplication.svg",
  "maths/special-division.svg",
];

const Symbols: React.FC<{ t: number }> = ({ t }) => {
  const { fps } = useVideoConfig();
  return (
    <>
      {SYMBOLS.map((src, i) => {
        const s = spring({ frame: t - CHEST_OPEN - 4 - i * 7, fps, config: { damping: 12, stiffness: 70 } });
        const angle = (-90 + (i - 1.5) * 38) * (Math.PI / 180) + Math.max(0, t - 210) * 0.012;
        const radius = 330 * s;
        const x = CHEST.x + Math.cos(angle) * radius;
        const y = CHEST.y - 30 + Math.sin(angle) * radius * 0.8 + Math.sin(t / 10 + i) * 8;
        return (
          <div
            key={src}
            style={{
              position: "absolute",
              left: x - 80,
              top: y - 80,
              width: 160,
              height: 160,
              opacity: Math.min(1, s * 2),
              transform: `scale(${0.3 + s * 0.7}) rotate(${(1 - s) * 180}deg)`,
              filter: "drop-shadow(0 0 24px rgba(255,214,110,0.9))",
              zIndex: 2000,
            }}
          >
            <Img src={staticFile(src)} style={{ width: "100%", height: "100%" }} />
          </div>
        );
      })}
    </>
  );
};

export const Stinger: React.FC = () => {
  const t = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(t, [0, 24], [0, 1], { extrapolateRight: "clamp" });
  const catX = interpolate(t, [20, 110], [-120, CAT_STOP], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const catWalking = t >= 20 && t < 110;
  const catLooksAtUs = t >= 196;
  const bubble = spring({ frame: t - 118, fps, config: { damping: 9, stiffness: 220 } });
  const bubbleGone = t > 146;
  const open = t >= CHEST_OPEN;
  const flash = interpolate(t, [CHEST_OPEN, CHEST_OPEN + 3, CHEST_OPEN + 18], [0, 0.9, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const glow = spring({ frame: t - CHEST_OPEN, fps, config: { damping: 20 } });
  const push = interpolate(t, [230, 300], [1, 1.18], { easing: Easing.inOut(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const logo = spring({ frame: t - 258, fps, config: { damping: 11, stiffness: 160 } });
  const soon = interpolate(t, [280, 292], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const blink = Math.floor(t / 10) % 2 === 0 ? 1 : 0.35;

  if (t >= BLACKOUT) {
    const endIn = interpolate(t, [BLACKOUT + 20, BLACKOUT + 40, STINGER_DURATION - 14, STINGER_DURATION], [0, 1, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return (
      <AbsoluteFill style={{ backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
        <div style={{ opacity: endIn, display: "flex", alignItems: "center", gap: 30 }}>
          <Sprite src="realm/dyslexi.png" row={ROW.idleDown} scale={4} animFps={5} />
          <div>
            <div style={{ fontFamily: TITLE, fontSize: 110, color: C.cream, lineHeight: 1, letterSpacing: 8 }}>DYSLEXOR</div>
            <div style={{ fontFamily: PIXEL, fontSize: 30, color: C.gold, marginTop: 18 }}>{WEBSITE}</div>
          </div>
        </div>
        <Grain opacity={0.08} />
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", opacity: fadeIn, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${push})`, transformOrigin: `${CHEST.x}px ${CHEST.y}px` }}>
        <Grass seed="night" density={70} />
        <At x={300} y={300}><Tree scale={5} /></At>
        <At x={1650} y={330}><Tree scale={5} /></At>
        <At x={1500} y={880}><Bush scale={4.5} /></At>
        <At x={360} y={900}><Bush scale={4.5} /></At>
        {[[700, 820], [1230, 790], [1120, 420], [640, 450]].map(([x, y]) => (
          <At key={`${x}-${y}`} x={x} y={y} z={1}><Pebble size={50} /></At>
        ))}

        {/* Night grade, with a pool of light where the chest sits */}
        <AbsoluteFill style={{ backgroundColor: "#1a2350", mixBlendMode: "multiply", opacity: 0.85, zIndex: 1500 }} />
        <AbsoluteFill
          style={{
            zIndex: 1501,
            background: `radial-gradient(circle at ${CHEST.x}px ${CHEST.y}px, rgba(255,210,120,${0.15 + glow * 0.55}) 0%, transparent ${18 + glow * 22}%)`,
            mixBlendMode: "screen",
          }}
        />
        {open && (
          <AbsoluteFill
            style={{
              zIndex: 1502,
              opacity: glow * 0.8,
              background: `repeating-conic-gradient(from ${t * 0.8}deg at ${CHEST.x}px ${CHEST.y - 20}px, rgba(255,226,140,0.35) 0deg 5deg, transparent 5deg 22deg)`,
              WebkitMaskImage: `radial-gradient(circle at ${CHEST.x}px ${CHEST.y - 20}px, #000 0%, transparent ${30 * glow}%)`,
              maskImage: `radial-gradient(circle at ${CHEST.x}px ${CHEST.y - 20}px, #000 0%, transparent ${30 * glow}%)`,
              mixBlendMode: "screen",
            }}
          />
        )}

        <div style={{ position: "absolute", inset: 0, zIndex: 1600 }}>
          <At x={CHEST.x} y={CHEST.y}>
            <Chest scale={7} open={open} />
          </At>
          <At x={catX} y={CHEST.y - 30}>
            <Sprite
              src="realm/dyslexi.png"
              row={catWalking ? ROW.walkSide : catLooksAtUs ? ROW.idleDown : ROW.idleSide}
              scale={6}
              animFps={catWalking ? 10 : 5}
            />
          </At>
          {!bubbleGone && t >= 118 && (
            <div style={{ position: "absolute", left: CAT_STOP - 27, top: CHEST.y - 190, transform: `scale(${bubble})`, transformOrigin: "bottom center" }}>
              <Exclaim px={6} />
            </div>
          )}
          <Symbols t={t} />
        </div>
        <div style={{ position: "absolute", inset: 0, zIndex: 1700 }}>
          <Fireflies count={30} seed="night" opacity={0.9} />
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ backgroundColor: "#fff8e0", opacity: flash }} />
      <Vignette strength={0.75} />

      {/* The tease */}
      <AbsoluteFill
        style={{
          background: "linear-gradient(180deg, transparent 62%, rgba(5,3,12,0.85) 100%)",
          opacity: Math.min(1, logo),
        }}
      />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 90 }}>
        <Img
          src={staticFile("logos/dyslexor-maths.svg")}
          style={{
            width: 900,
            opacity: Math.min(1, logo * 2),
            transform: `scale(${interpolate(logo, [0, 1], [1.8, 1])})`,
            filter: `blur(${(1 - Math.min(1, logo)) * 12}px) drop-shadow(6px 6px 0 #000)`,
          }}
        />
        <div style={{ fontFamily: PIXEL, fontSize: 34, color: C.gold, letterSpacing: 10, marginTop: 40, opacity: soon * blink, textShadow: "4px 4px 0 #000" }}>
          COMING SOON
        </div>
      </AbsoluteFill>
      <Grain />
    </AbsoluteFill>
  );
};
