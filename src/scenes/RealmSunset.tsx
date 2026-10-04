import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { At, Bush, Chest, Fence, House, ROW, Sprite, Tree } from "../components/Sprite";
import { Fireflies, Grain, Grass, Pebble, Vignette } from "../components/Fx";
import { C, PIXEL, WIDTH } from "../theme";

// Scene 1: Sushi and Dyslexi walk through the realm as the sun goes down,
// stop, look at the camera... and a cartoon iris closes on them.
export const REALM_SUNSET_DURATION = 210;

const HOUSE_SCALE = 3.5;
const HOUSE_XS = [480, 960, 1440];
const PATH_Y = 700;
const STOP_X = 960;
const LINE_1 = "THANKS FOR EXPLORING";
const LINE_2 = "THE REALM WITH US.";

export const RealmSunset: React.FC = () => {
  const frame = useCurrentFrame();

  const sushiX = interpolate(frame, [0, 140], [-120, STOP_X], { extrapolateRight: "clamp" });
  const sushiWalking = frame < 140;
  const catX = interpolate(frame, [12, 152], [-300, STOP_X - 150], { extrapolateRight: "clamp" });
  const catWalking = frame >= 12 && frame < 152;

  const camera = interpolate(frame, [0, 175], [1, 1.14], { easing: Easing.inOut(Easing.cubic) });
  const dusk = interpolate(frame, [20, 165], [0, 0.85], { extrapolateRight: "clamp" });
  const fireflies = interpolate(frame, [90, 160], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const typed = Math.max(0, Math.floor((frame - 40) / 1.6));
  const textOpacity = interpolate(frame, [150, 168], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const iris = interpolate(frame, [168, 204], [1400, 0], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: C.ink, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${camera})`, transformOrigin: `${STOP_X}px ${PATH_Y}px` }}>
        <Grass seed="sunset" />

        {/* Main road + a lane from each house door */}
        <div style={{ position: "absolute", left: 0, top: PATH_Y - 50, width: WIDTH, height: 110, background: C.path }} />
        {HOUSE_XS.map((x) => (
          <div key={x} style={{ position: "absolute", left: x - 30, top: 400, width: 110, height: 320, background: C.path }} />
        ))}
        {[120, 300, 620, 1180, 1290, 1600, 1780].map((x, i) => (
          <At key={x} x={x} y={PATH_Y + (i % 2 ? -20 : 25)} z={1}>
            <Pebble size={46} />
          </At>
        ))}

        {HOUSE_XS.map((x, i) => (
          <At key={x} x={x} y={238} z={2}>
            <House scale={HOUSE_SCALE} phase={i * 4} />
          </At>
        ))}

        <At x={170} y={470}><Tree scale={4.5} /></At>
        <At x={1760} y={430}><Tree scale={4.5} /></At>
        <At x={280} y={930}><Tree scale={4.5} /></At>
        <At x={1640} y={950}><Tree scale={4.5} /></At>
        <At x={1180} y={540}><Bush scale={4} /></At>
        <At x={760} y={930}><Bush scale={4} /></At>
        <At x={1250} y={900}><Fence scale={4} /></At>

        {/* Foreshadowing: the chest from the post-credits scene */}
        <At x={560} y={860}><Chest scale={4} open={false} /></At>

        <At x={300} y={PATH_Y - 20}>
          <Sprite src="realm/villager.png" row={ROW.idleSide} scale={5} animFps={5} />
        </At>

        <At x={catX} y={PATH_Y + 10}>
          <Sprite src="realm/dyslexi.png" row={catWalking ? ROW.walkSide : ROW.idleSide} scale={5} animFps={catWalking ? 10 : 5} />
        </At>
        <At x={sushiX} y={PATH_Y}>
          <Sprite src="realm/character_female.png" row={sushiWalking ? ROW.walkSide : ROW.idleDown} scale={5} animFps={sushiWalking ? 10 : 5} />
        </At>

        {/* Day -> dusk grade */}
        <AbsoluteFill
          style={{
            background: "linear-gradient(180deg, #ff9a5c 0%, #c2557a 45%, #3b2266 100%)",
            mixBlendMode: "multiply",
            opacity: dusk,
          }}
        />
        <Fireflies opacity={fireflies} seed="sunset" />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background: "linear-gradient(180deg, transparent 68%, rgba(10,5,20,0.85) 100%)",
          opacity: interpolate(frame, [30, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * textOpacity,
        }}
      />
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 90, opacity: textOpacity }}>
        <div style={{ fontFamily: PIXEL, color: C.cream, fontSize: 40, lineHeight: 1.7, textAlign: "center", textShadow: "4px 4px 0 #000" }}>
          <div>{LINE_1.slice(0, typed)}</div>
          <div style={{ color: C.gold }}>{LINE_2.slice(0, Math.max(0, typed - LINE_1.length))}</div>
        </div>
      </AbsoluteFill>

      <Vignette strength={0.55} />
      <Grain />

      {/* Cartoon iris-out on Sushi */}
      {frame >= 168 && (
        <div
          style={{
            position: "absolute",
            left: STOP_X - iris,
            top: PATH_Y - 10 - iris,
            width: iris * 2,
            height: iris * 2,
            borderRadius: "50%",
            boxShadow: "0 0 0 4000px #000",
          }}
        />
      )}
    </AbsoluteFill>
  );
};
