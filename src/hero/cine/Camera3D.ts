import { Cam, LH } from "../realm/Pov";

// HD-2D camera helpers for the realm's 3D view. A shot is a camera position
// (x, y on the ground, `eye` texels up) looking at a target (x, y, `lift`
// texels up). Characters are flat sprites, so `facing` picks the front, side
// or back row for where the camera is, which sells them as solid figures.

const FOCAL = 457;
// Screen row (in the 640x360 canvas) the target lands on: a little above
// centre, leaving room for dialogue below.
const AIM_ROW = 160;

// `aim`: the canvas row the target lands on (default 160 of 360; ~110 for a
// close-up, so a face sits clear of the dialogue box).
// `lens`: focal length (457 is the normal ~70 degree lens; 300 is wide, 900+
// long). `focus`: the distance kept sharp, by default the target's.
export type Shot3D = { x: number; y: number; eye: number; tx: number; ty: number; lift: number; roll?: number; aim?: number; lens?: number; focus?: number };

export const LENS = { wide: 320, normal: FOCAL, long: 760, tele: 1100 } as const;

// How far the camera is from what it looks at.
export const distOf = (s: Shot3D) => Math.max(4, Math.hypot(s.tx - s.x, s.ty - s.y));

export const lookAt = (s: Shot3D): Cam => {
  const d = distOf(s);
  const focal = s.lens ?? FOCAL;
  // Heading: radians clockwise from north (north is -y).
  const heading = Math.atan2(s.tx - s.x, -(s.ty - s.y));
  // A point `lift` up at distance d lands at horizon + (eye - lift) * focal / d.
  const horizon = (s.aim ?? AIM_ROW) - ((s.eye - s.lift) * focal) / d;
  return { x: s.x, y: s.y, heading, eye: s.eye, horizon: Math.max(-LH * 3, Math.min(LH * 4, horizon)), roll: s.roll, focal, focus: s.focus ?? d };
};

// The same shot from `dist` away along the same line, with the lens changed
// to keep the subject the same size: animate between two of these for a
// dolly zoom (the subject holds still while the world behind stretches or
// crushes). The height stays, so the subject keeps its place on screen.
export const dolly = (s: Shot3D, dist: number): Shot3D => {
  const d = distOf(s);
  const k = dist / d;
  return {
    ...s,
    x: s.tx - (s.tx - s.x) * k,
    y: s.ty - (s.ty - s.y) * k,
    lens: (s.lens ?? FOCAL) * k,
    focus: s.focus === undefined ? undefined : s.focus * k,
  };
};

// A camera on a circle round a point: `angle` radians clockwise from north.
export const orbit = (tx: number, ty: number, dist: number, angle: number) => ({ x: tx + Math.sin(angle) * dist, y: ty - Math.cos(angle) * dist });

// Which sprite row (and flip) shows a character facing `theta` (radians
// clockwise from north) from a camera looking along `heading`.
// Sheet rows: idle 0 front, 1 side (facing right), 2 back; walk 3 / 4 / 5.
export const facing = (theta: number, heading: number, walking = false) => {
  let rel = theta - heading;
  rel = Math.atan2(Math.sin(rel), Math.cos(rel));
  const base = walking ? 3 : 0;
  if (Math.abs(rel) > (Math.PI * 3) / 4) return { row: base, flip: false };
  if (Math.abs(rel) < Math.PI / 4) return { row: base + 2, flip: false };
  return { row: base + 1, flip: rel < 0 };
};

// The angle from one point to another, clockwise from north.
export const angleTo = (x: number, y: number, tx: number, ty: number) => Math.atan2(tx - x, -(ty - y));
