import React from "react";
import { interpolate, useCurrentFrame, CanvasImage, staticFile } from "remotion";
import { Dialogue } from "../lore/parts";
import { C } from "../theme";
import { HERO_NAME } from "./config";
import { linear, RealmTitle, track, walking } from "./parts";
import { Actor, Pov, fishingCol, idleCol, walkCol } from "./realm/Pov";
import { SPOTS } from "./realm/world";

// Act 4. Hero walks the main path past the townsfolk, Dyslexi runs up, and
// Elder Rowan comes down the path to welcome her with the realm's own lines
// (lib/realm/welcomeScript.ts and lib/realm/townsfolk.ts).

const posY = (f: number) =>
  linear(f, [
    [0, 140],
    [150, -40],
    [300, -230],
    [450, -330],
    [530, -380],
  ]);

const heading = (f: number) =>
  track(f, [
    [0, 0],
    [70, 0],
    [110, -0.6],
    [165, -0.6],
    [200, 0],
    [215, 0],
    [245, 0.6],
    [330, 0.6],
    [365, 0],
    [380, 0],
    [410, -0.75],
    [455, -0.75],
    [490, 0],
    [545, 0],
    [570, 0.3],
    [615, 0.3],
    [645, 0],
    [1005, 0],
    [1050, -0.4],
  ]);

const horizon = (f: number) =>
  track(f, [
    [0, 120],
    [545, 120],
    [575, 112],
    [615, 112],
    [650, 122],
  ]);

export const BLACKSMITH = { from: 240, dur: 120 };
export const ROWAN_LINES = [
  { from: 690, dur: 100, text: `Welcome to the realm, ${HERO_NAME}. I look after this village.` },
  { from: 790, dur: 105, text: "The houses along the path are games. Each one gives your reading a workout." },
  { from: 895, dur: 110, text: "Walk up to a house you like. Then press Play to go inside." },
];

// Where Village leaves the camera, so the next act starts from the same view.
export const VILLAGE_END = { x: 0, y: -380, heading: -0.4 };

// Everyone is in the world from the very first frame of the Arrival, so
// nobody pops in. Rowan waits by the houses at the top of the path and walks
// down to meet Hero; Dyslexi lounges off to the right until she spots her.
// `f` is a Village frame; the Arrival passes negative frames.
const ROWAN_WAIT = { x: 0, y: -660 };
const DYSLEXI_WAIT = { x: 260, y: -470 };
const ROWAN_WALK: [number, number] = [560, 685];

export const villageActors = (f: number): Actor[] => {
  const dysX = linear(f, [
    [470, DYSLEXI_WAIT.x],
    [540, 38],
  ]);
  const dysY = linear(f, [
    [470, DYSLEXI_WAIT.y],
    [540, -462],
  ]);
  const dysWalking = f >= 470 && f < 540;
  const rowanY = linear(f, [
    [ROWAN_WALK[0], ROWAN_WAIT.y],
    [ROWAN_WALK[1], SPOTS.rowan.y],
  ]);
  const rowanWalking = f >= ROWAN_WALK[0] && f < ROWAN_WALK[1];
  const turnedLeft = f >= 1010;
  return [
    { sheet: "guard", ...SPOTS.guard, row: 1, col: idleCol(f) },
    { sheet: "farmer", ...SPOTS.farmer, row: 1, col: idleCol(f + 3), flip: true },
    { sheet: "merchant", ...SPOTS.merchant, row: 1, col: idleCol(f + 1) },
    { sheet: "blacksmith", ...SPOTS.blacksmith, row: 1, col: idleCol(f + 5), flip: true },
    { sheet: "fisherman", ...SPOTS.fisherman, row: 8, col: fishingCol(f), flip: true },
    {
      sheet: "dyslexi",
      x: dysX,
      y: dysY,
      // Before she runs over she sits facing the path (side row, flipped = facing left).
      row: dysWalking ? 4 : f < 470 || turnedLeft ? 1 : 0,
      col: dysWalking ? walkCol(f) : idleCol(f),
      flip: dysWalking || f < 470 || turnedLeft,
      size: 0.77,
      bubble: f >= 545 && f < 600,
    },
    {
      sheet: "rowan",
      x: ROWAN_WAIT.x,
      y: rowanY,
      row: rowanWalking ? 3 : turnedLeft ? 1 : 0,
      col: rowanWalking ? walkCol(f) : idleCol(f),
      flip: turnedLeft,
    },
  ];
};

export const Village: React.FC = () => {
  const f = useCurrentFrame();
  const w = walking(f, posY);
  const step = Math.sin((f / 30) * Math.PI * 4);
  return (
    <Pov
      cam={{
        x: 0,
        y: posY(f),
        heading: heading(f) + Math.sin(f / 18) * 0.01 * w,
        eye: 26 + step * 0.7 * w,
        horizon: horizon(f) + step * 2 * w,
      }}
      actors={villageActors(f)}
    >
      <RealmTitle opacity={interpolate(f, [20, 45], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      <Dialogue speaker="Blacksmith" text="Strong readers are forged one word at a time. Keep hammering away!" t={f - BLACKSMITH.from} dur={BLACKSMITH.dur} color={C.peach} />
      {ROWAN_LINES.map((l) => (
        <Dialogue key={l.from} speaker="Elder Rowan" text={l.text} t={f - l.from} dur={l.dur} />
      ))}
    </Pov>
  );
};
