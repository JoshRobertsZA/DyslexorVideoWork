import React from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import { At, House, Tree } from "../components/Sprite";
import { Grain, Vignette } from "../components/Fx";
import { TEAM } from "../credits";
import { C, HEIGHT, WIDTH } from "../theme";
import { Boat, Dialogue, EPIC, Gull, Passengers, SEA } from "./parts";

// Out at sea. The camera pulls back so the realm island shrinks behind the
// boat, the sun goes down, and the credits drift past like an old epic.
export const VOYAGE_DURATION = 600;

const PX = 5;
const SPEED = 5;
const START = { x: 1500, y: 540 };
const ISLAND = { x: -1500, y: -420, w: 2650, h: 1900 };

const CARDS: { lines: string[]; at: number; side: "left" | "right"; title?: boolean }[] = [
  { lines: ["THE VOYAGE OF", "ELDER ROWAN"], at: 30, side: "left", title: true },
  { lines: ["Created by", ...TEAM.slice(0, 3)], at: 160, side: "right" },
  { lines: ["Created by", ...TEAM.slice(3, 6)], at: 262, side: "left" },
  { lines: ["Created by", ...TEAM.slice(6, 9)], at: 364, side: "right" },
];
const CARD_DUR = 96;

const LINES = [
  { speaker: "THE PRINCESS", text: "Will they be alright without you?", at: 468, dur: 54, color: "#f7a8c8" },
  { speaker: "ELDER ROWAN", text: "They have each other. And now, they can read anything.", at: 524, dur: 76, color: C.gold },
];

const Card: React.FC<{ card: (typeof CARDS)[number]; t: number }> = ({ card, t }) => {
  const local = t - card.at;
  if (local < 0 || local > CARD_DUR) return null;
  const a = interpolate(local, [0, 20, CARD_DUR - 20, CARD_DUR], [0, 1, 1, 0]);
  return (
    <div
      style={{
        position: "absolute",
        top: 90,
        [card.side]: 110,
        textAlign: card.side,
        opacity: a,
        filter: `blur(${(1 - a) * 4}px)`,
        textShadow: "0 2px 18px rgba(0,0,0,0.8)",
      }}
    >
      {card.lines.map((line, i) => (
        <div
          key={line + i}
          style={{
            fontFamily: EPIC,
            fontWeight: card.title || i > 0 ? 700 : 400,
            fontSize: card.title ? 76 : i === 0 ? 30 : 50,
            letterSpacing: card.title ? 6 : 3,
            color: card.title ? C.gold : i === 0 ? C.lilac : C.cream,
            lineHeight: card.title ? 1.1 : 1.45,
            fontStyle: !card.title && i === 0 ? "italic" : undefined,
          }}
        >
          {line}
        </div>
      ))}
    </div>
  );
};

export const Voyage: React.FC = () => {
  const t = useCurrentFrame();

  const boatX = START.x + t * SPEED;
  const boatY = START.y + Math.sin(t / 40) * 30;
  const s = interpolate(t, [0, 150], [1.05, 0.66], { easing: Easing.inOut(Easing.cubic), extrapolateRight: "clamp" });
  const camX = boatX + 120;
  const camY = START.y;
  const viewL = camX - WIDTH / 2 / s;
  const viewR = camX + WIDTH / 2 / s;

  const dusk = interpolate(t, [0, 160, 340], [0.5, 0.45, 0], { extrapolateRight: "clamp" });
  const night = interpolate(t, [160, 340], [0, 0.78], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const moon = interpolate(t, [260, 360], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeIn = interpolate(t, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(t, [VOYAGE_DURATION - 20, VOYAGE_DURATION], [1, 0], { extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: SEA.deep, overflow: "hidden", opacity: fadeIn * fadeOut }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          transformOrigin: "0 0",
          transform: `translate(${WIDTH / 2 - camX * s}px, ${HEIGHT / 2 - camY * s}px) scale(${s})`,
        }}
      >
        {/* The realm island, left behind */}
        {viewL < ISLAND.x + ISLAND.w + 300 && (
          <div style={{ position: "absolute", left: ISLAND.x, top: ISLAND.y, width: ISLAND.w, height: ISLAND.h }}>
            <div style={{ position: "absolute", inset: -260, background: SEA.water, borderRadius: 220 }} />
            <div style={{ position: "absolute", inset: -130, background: SEA.shallow, borderRadius: 180 }} />
            <div style={{ position: "absolute", inset: -40, background: SEA.wetSand, borderRadius: 140 }} />
            <div style={{ position: "absolute", inset: 0, background: SEA.sand, borderRadius: 120 }} />
            <div style={{ position: "absolute", inset: 70, background: C.grass, borderRadius: 90 }} />
            <div style={{ position: "absolute", left: 260, top: 950, width: ISLAND.w - 200, height: 90, background: C.path }} />
            {[700, 1150, 1600].map((hx, i) => (
              <React.Fragment key={hx}>
                <div style={{ position: "absolute", left: hx - 40, top: 700, width: 90, height: 280, background: C.path }} />
                <At x={hx} y={520} z={2}><House scale={3.4} phase={i * 3} /></At>
              </React.Fragment>
            ))}
            {[[300, 400], [2200, 520], [480, 1500], [1900, 1450], [1250, 1350], [2400, 1100]].map(([tx, ty]) => (
              <At key={`${tx}-${ty}`} x={tx} y={ty}><Tree scale={5} /></At>
            ))}
            {/* The jetty they left from */}
            <div style={{ position: "absolute", left: ISLAND.w - 80, top: 960, width: 420, height: 80, background: "#a06a3c", boxShadow: "inset 0 -5px 0 #6e4325" }} />
          </div>
        )}

        {/* Waves, only the ones in view */}
        {Array.from({ length: 420 }, (_, i) => {
          const wx = 1000 + random(`vx${i}`) * 5600 + Math.sin(t / 25 + i) * 14;
          const wy = -900 + random(`vy${i}`) * 2900;
          if (wx < viewL - 100 || wx > viewR + 100) return null;
          const on = Math.sin(t / 18 + i * 1.7) > -0.3;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: wx,
                top: wy,
                width: 24 + (i % 4) * 8,
                height: 6,
                background: "rgba(220,240,255,0.5)",
                opacity: on ? 1 : 0,
              }}
            />
          );
        })}

        {/* Wake */}
        {Array.from({ length: 16 }, (_, k) => {
          const age = k + ((t / 3) % 1);
          return [-1, 1].map((side) => (
            <div
              key={`${k}${side}`}
              style={{
                position: "absolute",
                left: boatX - 90 - age * 34,
                top: boatY + 75 + side * age * 9,
                width: 22,
                height: 8,
                background: SEA.foam,
                opacity: 0.75 * (1 - age / 16),
              }}
            />
          ));
        })}

        <At x={boatX} y={boatY} z={10}>
          <Boat px={PX} lantern={night}>
            <Passengers px={PX} />
          </Boat>
        </At>
      </div>

      {/* Gulls see them off, then it gets dark */}
      {[0, 1, 2].map((g) => {
        const gx = interpolate(t, [0, 260], [WIDTH * 0.25 + g * 120, WIDTH + 200 + g * 60]);
        const gy = 260 + g * 70 + Math.sin(t / 20 + g) * 20;
        return (
          <div key={g} style={{ position: "absolute", left: gx, top: gy, opacity: 1 - night }}>
            <Gull px={5} />
          </div>
        );
      })}

      <AbsoluteFill style={{ background: "linear-gradient(120deg, #ffcf8a, #ff9f6e 50%, #b5577e)", mixBlendMode: "multiply", opacity: dusk }} />
      <AbsoluteFill style={{ backgroundColor: "#1b2560", mixBlendMode: "multiply", opacity: night }} />

      {/* Moonlight on the water */}
      <AbsoluteFill style={{ opacity: moon, mixBlendMode: "screen" }}>
        <div
          style={{
            position: "absolute",
            right: 160,
            top: -120,
            width: 520,
            height: 520,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(220,230,255,0.55), rgba(220,230,255,0) 65%)",
          }}
        />
        {Array.from({ length: 14 }, (_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              right: 340 - Math.sin(t / 10 + i) * 40 - (i % 3) * 30,
              top: 120 + i * 22,
              width: 120 - i * 5,
              height: 5,
              background: "rgba(230,238,255,0.7)",
              opacity: Math.sin(t / 7 + i * 2) > 0 ? 0.9 : 0.3,
            }}
          />
        ))}
        {Array.from({ length: 40 }, (_, i) => {
          const tw = Math.sin(t / 9 + i * 3.1);
          return (
            <div
              key={`s${i}`}
              style={{
                position: "absolute",
                left: random(`glint-x${i}`) * WIDTH,
                top: random(`glint-y${i}`) * HEIGHT,
                width: 4,
                height: 4,
                background: "#fff",
                opacity: tw > 0.6 ? tw : 0,
              }}
            />
          );
        })}
      </AbsoluteFill>

      <Vignette strength={0.6} />
      {CARDS.map((c) => (
        <Card key={c.at} card={c} t={t} />
      ))}
      {LINES.map((l) => (
        <Dialogue key={l.text} speaker={l.speaker} text={l.text} t={t - l.at} dur={l.dur} color={l.color} />
      ))}
      <Grain />
    </AbsoluteFill>
  );
};
