import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { At, House, ROW, Sprite, Tree, Bush } from "../components/Sprite";
import { Fireflies, Grain, Grass, Pebble, Vignette } from "../components/Fx";
import { C, HEIGHT, WIDTH } from "../theme";
import { Boat, Dialogue, Dock, Passengers, Princess, ROWAN, SEA, Waves } from "./parts";

// The village gathers at the shore at golden hour. Rowan says goodbye, then
// he and the princess walk the jetty and board the boat.
export const FAREWELL_DURATION = 480;

const PX = 5;
const SHORE = 1180;
const PATH_Y = 600;
const DOCK_X = 1130;
const DOCK_LEN = 400;
const STOP_X = 980;
const BOAT = { x: 1640, y: 548 };

const LINES = [
  { speaker: "ELDER ROWAN", text: "The village is in good hands now.", at: 150, dur: 52 },
  { speaker: "ELDER ROWAN", text: "Everything you learned stays with you.", at: 202, dur: 58 },
  { speaker: "ELDER ROWAN", text: "The princess and I sail for a new island.", at: 260, dur: 60 },
  { speaker: "ELDER ROWAN", text: "Keep reading. I will be watching.", at: 320, dur: 52 },
];

const VILLAGERS: { src: string; x: number; y: number; row: number; flip?: boolean }[] = [
  { src: "realm/character_female.png", x: 760, y: 720, row: ROW.idleSide },
  { src: "realm/npc_farmer.png", x: 600, y: 680, row: ROW.idleSide },
  { src: "realm/npc_town_guard.png", x: 520, y: 760, row: ROW.idleSide },
  { src: "realm/npc_merchant.png", x: 660, y: 820, row: ROW.idleSide },
  { src: "realm/npc_blacksmith.png", x: 820, y: 860, row: ROW.idleUp },
  { src: "realm/npc_fisherman.png", x: 940, y: 790, row: ROW.idleSide },
];

export const Farewell: React.FC = () => {
  const t = useCurrentFrame();

  // Rowan + princess: walk in, stop to talk, walk the jetty, hop aboard.
  const walkIn = interpolate(t, [0, 140], [-160, STOP_X], { extrapolateRight: "clamp" });
  const walkDock = interpolate(t, [372, 430], [STOP_X, DOCK_X + DOCK_LEN - 20], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const x = t < 372 ? walkIn : walkDock;
  const walking = t < 140 || (t >= 372 && t < 430);
  const talking = t >= 150 && t < 372;
  const aboard = t >= 432;
  const hop = interpolate(t, [430, 436, 442], [0, -40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const boatDrift = interpolate(t, [446, FAREWELL_DURATION], [0, 120], { easing: Easing.in(Easing.quad), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bob = Math.sin(t / 12) * 4;

  const fadeIn = interpolate(t, [0, 24], [0, 1], { extrapolateRight: "clamp" });
  const camera = interpolate(t, [0, FAREWELL_DURATION], [1.0, 1.06]);
  const waving = t > 400;

  const foam = Math.sin(t / 16) * 8;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ opacity: fadeIn, transform: `scale(${camera})`, transformOrigin: "1150px 600px" }}>
        <Grass seed="farewell" density={70} />

        {/* Shore: sand, wet sand, foam, then shallow -> deep water */}
        <div style={{ position: "absolute", left: SHORE, top: 0, width: WIDTH, height: HEIGHT, background: SEA.sand }} />
        <div style={{ position: "absolute", left: SHORE + 80, top: 0, width: WIDTH, height: HEIGHT, background: SEA.wetSand }} />
        <div
          style={{
            position: "absolute",
            left: SHORE + 120 + foam,
            top: 0,
            width: WIDTH,
            height: HEIGHT,
            background: `linear-gradient(90deg, ${SEA.foam} 0 10px, ${SEA.shallow} 10px 170px, ${SEA.water} 170px 420px, ${SEA.deep} 420px)`,
          }}
        />
        <Waves seed="fw" count={40} area={{ x: SHORE + 220, y: 0, w: WIDTH - SHORE, h: HEIGHT }} />

        {/* Village path to the jetty */}
        <div style={{ position: "absolute", left: 0, top: PATH_Y - 45, width: DOCK_X + 20, height: 100, background: C.path }} />
        <div style={{ position: "absolute", left: 260, top: 260, width: 100, height: PATH_Y - 260, background: C.path }} />
        {[140, 420, 700, 900].map((px, i) => (
          <At key={px} x={px} y={PATH_Y + (i % 2 ? -18 : 22)} z={1}>
            <Pebble size={44} />
          </At>
        ))}
        <At x={290} y={110} z={2}><House scale={3} /></At>
        <At x={80} y={330}><Tree scale={4.5} /></At>
        <At x={560} y={240}><Tree scale={4.5} /></At>
        <At x={180} y={900}><Tree scale={4.5} /></At>
        <At x={980} y={330}><Bush scale={4} /></At>

        <div style={{ position: "absolute", left: DOCK_X, top: PATH_Y - 40, zIndex: 3 }}>
          <Dock length={DOCK_LEN} px={PX} />
        </div>

        {/* Villagers seeing them off; they hop and wave at the end */}
        {VILLAGERS.map((v, i) => (
          <At key={v.src} x={v.x} y={v.y - (waving ? Math.abs(Math.sin((t + i * 7) / 5)) * 18 : 0)}>
            <Sprite src={v.src} row={v.row} scale={5} animFps={5} />
          </At>
        ))}
        <At x={860} y={700}>
          <Sprite src="realm/dyslexi.png" row={ROW.idleSide} scale={5} animFps={5} />
        </At>

        {/* Boat at the end of the jetty, with passengers once they board */}
        <At x={BOAT.x + boatDrift} y={BOAT.y + bob} z={4}>
          <Boat px={PX}>
            {aboard && <Passengers px={PX} flip={t < 446} />}
          </Boat>
        </At>

        {!aboard && (
          <>
            <At x={x - 70} y={PATH_Y - 20 + hop} z={5}>
              <Princess row={walking ? ROW.walkSide : ROW.idleSide} scale={PX} animFps={walking ? 10 : 5} flip={talking} />
            </At>
            <At x={x} y={PATH_Y - 26 + hop} z={6}>
              <Sprite src={ROWAN} row={walking ? ROW.walkSide : ROW.idleSide} scale={PX} animFps={walking ? 10 : 5} flip={talking} />
            </At>
          </>
        )}

        {/* Golden hour */}
        <AbsoluteFill
          style={{
            background: "linear-gradient(120deg, #ffcf8a 0%, #ff9f6e 50%, #b5577e 100%)",
            mixBlendMode: "multiply",
            opacity: 0.55,
            zIndex: 2000,
          }}
        />
        <div style={{ position: "absolute", inset: 0, zIndex: 2001 }}>
          <Fireflies count={24} seed="farewell" opacity={0.6} />
        </div>
      </AbsoluteFill>

      <Vignette strength={0.55} />
      {LINES.map((l) => (
        <Dialogue key={l.text} speaker={l.speaker} text={l.text} t={t - l.at} dur={l.dur} />
      ))}
      <Grain />
    </AbsoluteFill>
  );
};
