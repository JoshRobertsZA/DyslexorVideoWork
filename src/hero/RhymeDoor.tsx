import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, Sequence, staticFile, useCurrentFrame } from "remotion";
import { BODY, C, PIXEL } from "../theme";
import { ACCENT } from "./config";
import { linear, track } from "./parts";
import { Pov } from "./realm/Pov";
import { villageActors, VILLAGE_END } from "./Village";
import { VILLAGE_FRAMES } from "./config";

// Act 5. Hero turns off the path toward the Rhyme Time house, its mint portal
// ring wakes under her feet, she presses Play, and the door swallows the
// camera into a rush of letters that lands on the real Rhyme Time screen.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const AIM = Math.atan2(-200, 230);
export const PLAY_IN = 215;
const PRESS = 255;
const ENTER = 275;
const TUNNEL = 325;
// The tunnel dissolves in over the last steps through the door, no black.
const TUNNEL_IN = ENTER + 15;
const GAME = 365;

const camX = (f: number) =>
  linear(f, [
    [30, VILLAGE_END.x],
    [190, -200],
  ]);
const camY = (f: number) =>
  track(
    f,
    [
      [30, VILLAGE_END.y],
      [190, -600],
      [ENTER, -600],
      [TUNNEL, -712],
    ],
    Easing.inOut(Easing.quad),
  );
const heading = (f: number) =>
  track(f, [
    [0, VILLAGE_END.heading],
    [40, AIM],
    [165, AIM],
    [210, 0],
  ]);

export const RhymeDoor: React.FC = () => {
  const f = useCurrentFrame();
  const moving = (f > 30 && f < 190) || (f > ENTER && f < TUNNEL);
  const step = moving ? Math.sin((f / 30) * Math.PI * 4) : 0;
  const glow = interpolate(f, [150, 230], [0.35, 1], clamp) * (0.85 + 0.15 * Math.sin(f / 4));

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {f < TUNNEL && (
        <Pov
          cam={{ x: camX(f), y: camY(f), heading: heading(f), eye: 26 + step * 0.7, horizon: 120 + step * 2 }}
          actors={villageActors(VILLAGE_FRAMES + f)}
          glow={{ "rhyme-time": glow }}
        >
          <Sequence from={PLAY_IN} durationInFrames={ENTER + 10 - PLAY_IN} layout="none">
            <PlayCard />
          </Sequence>
          <AbsoluteFill
            style={{
              background: `radial-gradient(circle at 50% 60%, ${ACCENT.mint}00 20%, ${ACCENT.mint}55 70%)`,
              opacity: interpolate(f, [150, 230, ENTER], [0, 0.5, 0.9], clamp),
            }}
          />
        </Pov>
      )}
      <Sequence from={TUNNEL_IN} durationInFrames={GAME - TUNNEL_IN + 8}>
        <LetterTunnel len={GAME - TUNNEL_IN} />
      </Sequence>
      <Sequence from={GAME}>
        <RhymeTimeScreen />
      </Sequence>
    </AbsoluteFill>
  );
};

// The realm's game entry card: cover, title, how to play, Play.
const PlayCard: React.FC = () => {
  const f = useCurrentFrame();
  const pop = interpolate(f, [0, 10], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
  const out = interpolate(f, [ENTER - PLAY_IN, ENTER - PLAY_IN + 10], [1, 0], clamp);
  const press = f >= PRESS - PLAY_IN && f < PRESS - PLAY_IN + 6;
  const pressed = f >= PRESS - PLAY_IN;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: out }}>
      <div
        style={{
          width: 760,
          background: "rgba(18,11,28,0.95)",
          border: `6px solid ${C.cream}`,
          outline: "6px solid #000",
          borderRadius: 16,
          overflow: "hidden",
          transform: `scale(${pop})`,
          boxShadow: `0 0 80px ${ACCENT.mint}66, 14px 14px 0 rgba(0,0,0,0.5)`,
        }}
      >
        <Img src={staticFile("games/rhyme-time.webp")} style={{ width: "100%", height: 300, objectFit: "cover", display: "block" }} />
        <div style={{ padding: "28px 36px 34px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontFamily: PIXEL, fontSize: 38, color: ACCENT.mint }}>RHYME TIME</div>
          <div style={{ fontFamily: BODY, fontSize: 28, color: C.cream }}>Find the word that rhymes</div>
          <div
            style={{
              alignSelf: "flex-end",
              fontFamily: PIXEL,
              fontSize: 26,
              color: C.ink,
              background: pressed ? "#5fe0a8" : ACCENT.mint,
              border: "4px solid #000",
              padding: "16px 28px",
              transform: press ? "translateY(6px)" : undefined,
              boxShadow: press ? "none" : "0 6px 0 #000",
            }}
          >
            ▶ PLAY
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const LETTERS = "RHYMETIMESUNFUNRUNBUNCATHATBATMAT";

// Letters rush past the camera, out of the dark doorway.
const LetterTunnel: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  const fadeIn = interpolate(f, [0, TUNNEL - TUNNEL_IN], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  // The doorway's mint glow is the first thing we see, then it deepens to night.
  const glowR = interpolate(f, [0, len], [70, 25], clamp);
  const flash = interpolate(f, [len - 8, len], [0, 1], clamp);
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle, ${ACCENT.mint}88 0%, #2a1838 ${glowR}%, #09060d 100%)`,
        overflow: "hidden",
        opacity: fadeIn,
      }}
    >
      {Array.from({ length: 100 }, (_, i) => {
        const delay = random(`lt-d${i}`) * (len - 16);
        const p = (f - delay) / 16;
        if (p <= 0 || p > 1.2) return null;
        const a = random(`lt-a${i}`) * Math.PI * 2;
        const r = p * p * 1300;
        const size = 18 + p * p * 220;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 960 + Math.cos(a) * r,
              top: 540 + Math.sin(a) * r,
              transform: "translate(-50%, -50%)",
              fontFamily: PIXEL,
              fontSize: size,
              color: [ACCENT.mint, C.cream, C.lilac][i % 3],
              opacity: Math.min(1, p * 3),
              textShadow: `0 0 ${size / 4}px ${ACCENT.mint}`,
            }}
          >
            {LETTERS[i % LETTERS.length]}
          </div>
        );
      })}
      <AbsoluteFill style={{ backgroundColor: "#fff", opacity: flash }} />
    </AbsoluteFill>
  );
};

// The real Rhyme Time round (public/games/rhyme-time.html), rebuilt so the
// pick can be animated: "Which word rhymes with... SUN" and Hero picks FUN.
export const RhymeTimeScreen: React.FC = () => {
  const f = useCurrentFrame();
  const settle = interpolate(f, [0, 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const fromWhite = interpolate(f, [0, 12], [1, 0], clamp);
  const pick = 50;
  const picked = f >= pick;
  const cursor = {
    x: interpolate(f, [12, pick - 6], [1500, 1310], { ...clamp, easing: Easing.inOut(Easing.cubic) }),
    y: interpolate(f, [12, pick - 6], [980, 640], { ...clamp, easing: Easing.inOut(Easing.cubic) }),
  };
  const answers = ["FOG", "FUN", "FIG", "HAT"];
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #1c1233 0%, #241640 100%)", overflow: "hidden" }}>
      {Array.from({ length: 80 }, (_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: random(`rs-x${i}`) * 1920,
            top: random(`rs-y${i}`) * 1080,
            width: 3,
            height: 3,
            background: "#fff",
            opacity: 0.2 + 0.5 * Math.abs(Math.sin(f / 15 + i)),
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          right: -120,
          top: -160,
          width: 420,
          height: 420,
          borderRadius: "50%",
          background: "radial-gradient(circle at 35% 70%, #ffc28a, #e07a4f 55%, #8a3a4a)",
          boxShadow: "0 0 120px #e07a4f55",
        }}
      />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 200, transform: `scale(${0.94 + settle * 0.06})`, opacity: settle }}>
        <div style={{ display: "flex", gap: 14, marginBottom: 40 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{ width: 20, height: 20, borderRadius: 10, background: i === 0 ? "#a78bfa" : "#4b3a6e" }} />
          ))}
        </div>
        <div
          style={{
            width: 1340,
            padding: "40px 0 46px",
            borderRadius: 26,
            background: "rgba(255,255,255,0.04)",
            border: "2px solid rgba(255,255,255,0.12)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 26,
          }}
        >
          <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 26, letterSpacing: 3, color: "#b9a9d9" }}>WHICH WORD RHYMES WITH…</div>
          <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
            <div
              style={{
                fontFamily: BODY,
                fontWeight: 700,
                fontSize: 64,
                color: "#fff",
                padding: "14px 72px",
                borderRadius: 60,
                background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
                boxShadow: "0 0 40px #7c3aed88",
              }}
            >
              SUN
            </div>
            <div style={{ width: 56, height: 56, borderRadius: 28, border: "2px solid rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ddd", fontSize: 26 }}>
              🔊
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, width: 1340, marginTop: 30 }}>
          {answers.map((a) => {
            const right = a === "FUN";
            const lit = picked && right;
            return (
              <div
                key={a}
                style={{
                  height: 92,
                  borderRadius: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: BODY,
                  fontWeight: 700,
                  fontSize: 34,
                  color: lit ? "#0b2a1c" : "#fff",
                  background: lit ? "#4ade80" : "rgba(255,255,255,0.04)",
                  border: `2px solid ${lit ? "#86efac" : "rgba(255,255,255,0.12)"}`,
                  opacity: picked && !right ? 0.35 : 1,
                  transform: lit ? `scale(${1 + 0.04 * Math.max(0, 1 - (f - pick) / 8)})` : undefined,
                  boxShadow: lit ? "0 0 50px #4ade8088" : undefined,
                }}
              >
                {lit ? "✓ " : ""}
                {a}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      {/* Cursor */}
      <svg
        width={44}
        height={60}
        viewBox="0 0 11 15"
        shapeRendering="crispEdges"
        style={{ position: "absolute", left: cursor.x, top: cursor.y, opacity: f > 8 ? 1 : 0, transform: f >= pick && f < pick + 5 ? "scale(0.85)" : undefined }}
      >
        <path d="M0 0h1v1h1v1h1v1h1v1h1v1h1v1h1v1h1v1h1v1h1v1H6v1h1v1h1v2H6v-1H5v-2H4v1H3v1H2v1H1v1H0z" fill="#000" />
        <path d="M1 2h1v1h1v1h1v1h1v1h1v1h1v1h1v1h1v1H5v1h1v1h1v1H6v-1H5v-1H4v1H3v1H2v1H1z" fill="#fff" />
      </svg>
      <AbsoluteFill style={{ backgroundColor: "#fff", opacity: fromWhite }} />
    </AbsoluteFill>
  );
};
