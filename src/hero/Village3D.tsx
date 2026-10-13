import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, PIXEL } from "../theme";
import { VILLAGE_FRAMES } from "./config";
import { LENS, Shot3D, angleTo, dolly, facing, lookAt, orbit } from "./cine/Camera3D";
import { Shot, shotAt as runShots } from "./cine/Shots";
import { Emote, EmoteIcon } from "./cine/Portrait";
import { RealmTitle, linear } from "./parts";
import { Actor, Cam, Pov, fishingCol, idleCol, toScreen, walkCol } from "./realm/Pov";
import { DRAIN, SCORCH, SPOTS } from "./realm/world";
import { BLACKSMITH, DEMO_LETTERS, NPC_LINES, QUEST, RESTORE, ROWAN_LINES, ROWAN_STAGGER, ROWAN_WAIT, ROWAN_WALK, VillageDialogue, VillageSound, bloomK } from "./Village";

// Chapter 1's Village in HD-2D: the realm's real 3D world (the one Hero woke
// up in) seen from outside, with every character a pixel cut-out standing in
// it. It opens in her eyes and pulls up and out behind her, then is cut like
// an anime: three-quarter angles on the townsfolk, a low tracking shot,
// over-the-shoulder shots, a low angle as Rowan comes, a slow orbit round the
// pair, a crane up over the grey village, and a final push into Hero's face.
// Same lines, takes, music and timing as the first-person Village.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const [GUARD, FARMER, FISHER] = NPC_LINES;
const [R1, R2, R3, R4] = ROWAN_LINES;

// ---- Where everyone is (world texels, the same map as the Arrival) -------------

// Hero walks up the main path, as in the first-person Village.
const heroY = (f: number) =>
  linear(f, [
    [0, 140],
    [195, -40],
    [390, -230],
    [585, -330],
    [690, -380],
  ]);
const heroWalking = (f: number) => f < 690;

const rowanY = (f: number) => {
  const half = (ROWAN_WAIT.y + SPOTS.rowan.y) / 2;
  return linear(f, [
    [ROWAN_WALK[0], ROWAN_WAIT.y],
    [ROWAN_STAGGER[0], half],
    [ROWAN_STAGGER[1], half],
    [ROWAN_WALK[1], SPOTS.rowan.y],
  ]);
};

// ---- The camera ------------------------------------------------------------------
// A camera position and what it looks at, per shot. `hero` / `rowan` targets
// follow them.

// Shot by shot, like an anime edit: each set-up starts with a clean cut and
// holds until the next one, moving only slowly within itself (a push-in, an
// orbit, a crane, tracking alongside her). Conversations keep to one side of
// the two people talking, so nobody swaps sides of the screen. The one
// continuous move is the opening, out of her eyes and up behind her.
type Focus = "target" | "hero" | "rowan" | keyof typeof SPOTS;
const H = (f: number) => heroY(f);

const shotsAt = (f: number): Shot<Focus>[] => {
  const hy = H(f);
  const ry = rowanY(f);
  // Hero's sprite is short (her face is ~14 texels up), so close shots aim there.
  const onHero = (dx: number, dy: number, eye: number, aim = 110): Shot3D => ({ x: dx, y: hy + dy, eye, tx: 0, ty: hy, lift: 16, aim });
  const fp: Shot3D = { x: 0, y: hy + 1, eye: 26, tx: 0, ty: hy - 200, lift: 26, aim: 120 };
  const high: Shot3D = { x: 0, y: hy + 150, eye: 120, tx: 0, ty: hy - 40, lift: 10 };
  const ots: Shot3D = { x: 22, y: hy + 60, eye: 32, tx: 0, ty: hy - 50, lift: 18 };
  const stumble = (roll: number): Shot3D => ({ x: 20, y: ry + 62, eye: 14, tx: 0, ty: ry, lift: 22, roll, aim: 120 });
  return [
    // Out of her eyes (where the Arrival ends), up and back, then over her shoulder.
    { at: 0, start: fp, path: [[0, fp], [8, fp], [52, high], [GUARD.from - 4, ots]] },
    // The guard and the farmer, held from a fixed spot in the clear road
    // corridor (the trees start ~110 texels either side): Hero walks in on the right.
    { at: GUARD.from, start: { x: -55, y: -10, eye: 22, tx: -82, ty: -118, lift: 18 }, end: { x: -52, y: -18, eye: 22, tx: -82, ty: -118, lift: 18 } },
    // Her one startled reaction.
    // On a long lens from further off: her face held flat against a soft wash.
    { at: GUARD.from + 62, start: dolly(onHero(10, -48, 24), 100), end: dolly(onHero(8, -42, 24), 96) },
    // In on the farmer as she speaks.
    { at: FARMER.from, start: { x: -150, y: -78, eye: 20, tx: -66, ty: -120, lift: 18 }, end: { x: -140, y: -84, eye: 20, tx: -66, ty: -120, lift: 18 } },
    // Held on the road ahead: she walks away from us up it.
    // Focused up the road: she walks out of the blur into it.
    { at: FARMER.from + FARMER.dur, start: { x: 42, y: -110, eye: 26, tx: 0, ty: -300, lift: 14 } },
    // The Blacksmith and the merchant, held as she arrives on the left.
    { at: BLACKSMITH.from, start: { x: 42, y: -238, eye: 20, tx: 86, ty: -338, lift: 18 }, end: { x: 44, y: -246, eye: 20, tx: 86, ty: -338, lift: 18 } },
    // In on the Blacksmith: "Are you the one…".
    { at: BLACKSMITH.from + 90, start: { x: 150, y: -300, eye: 24, tx: 99, ty: -340, lift: 20, aim: 115 }, end: { x: 138, y: -312, eye: 24, tx: 99, ty: -340, lift: 20, aim: 115 } },
    // Held on the road as she walks on toward the pond.
    { at: BLACKSMITH.from + BLACKSMITH.dur, start: { x: -40, y: -240, eye: 30, tx: 0, ty: -420, lift: 12, lens: LENS.wide }, rack: [[0, "hero"]] },
    // The fisherman at his line, held: she passes behind him.
    { at: FISHER.from, start: { x: -185, y: -378, eye: 20, tx: -92, ty: -418, lift: 16 }, end: { x: -178, y: -384, eye: 20, tx: -92, ty: -418, lift: 16 } },
    // Low in the road as Rowan comes down it toward us.
    // On a long lens, so he comes out of the haze compressed against the road.
    { at: FISHER.from + FISHER.dur, start: { x: 24, y: -420, eye: 7, tx: 0, ty: ry, lift: 26, lens: LENS.tele } },
    // He stumbles: a dolly zoom, the camera pulling back as the lens closes
    // in, so he holds still while the road behind him rushes up.
    { at: ROWAN_STAGGER[0], start: dolly(stumble(-0.08), 50), end: dolly(stumble(-0.05), 150) },
    // Side-on two-shot as he reaches her. Every conversation shot from here
    // stays on this (east) side of them.
    { at: ROWAN_STAGGER[1] + 10, start: { x: 100, y: -425, eye: 26, tx: 0, ty: -425, lift: 18 }, end: { x: 92, y: -425, eye: 26, tx: 0, ty: -425, lift: 18 } },
    // Over her shoulder onto him: "You heard my call".
    // A longer lens; focus pulls off her shoulder onto him as he speaks.
    { at: R1.from, start: dolly({ x: 38, y: -320, eye: 34, tx: 0, ty: -470, lift: 26, aim: 125 }, 210), end: dolly({ x: 34, y: -327, eye: 34, tx: 0, ty: -470, lift: 26, aim: 125 }, 205), rack: [[0, "hero"], [R1.from + 6, "rowan"]] },
    // A slow orbit round the pair: what the Wizard stole.
    { at: R2.from, start: { ...orbit(0, -425, 100, 1.75), eye: 22, tx: 0, ty: -425, lift: 18 }, end: { ...orbit(0, -425, 90, 1.05), eye: 22, tx: 0, ty: -425, lift: 18 } },
    // Crane up over the grey village: "our colour and our stories fade".
    { at: R2.from + 150, start: { x: 140, y: -200, eye: 140, tx: 0, ty: -520, lift: 0, lens: LENS.wide }, end: { x: 115, y: -195, eye: 170, tx: 0, ty: -540, lift: 0, lens: LENS.wide } },
    // Low and wide at their side as the letters rise from his hands.
    { at: R3.from, start: { x: 110, y: -410, eye: 15, tx: 0, ty: -425, lift: 24 }, end: { x: 102, y: -414, eye: 15, tx: 0, ty: -425, lift: 24 } },
    // Up to watch the colour spread.
    { at: RESTORE.from + 60, start: { x: 70, y: -350, eye: 70, tx: 0, ty: -470, lift: 0, lens: LENS.wide }, end: { x: 66, y: -346, eye: 82, tx: 0, ty: -470, lift: 0, lens: LENS.wide } },
    // Over his shoulder onto her: "Walk up to a house…".
    { at: R4.from, start: dolly({ x: 40, y: -530, eye: 30, tx: 0, ty: -380, lift: 24, aim: 125 }, 200), end: dolly({ x: 38, y: -524, eye: 30, tx: 0, ty: -380, lift: 24, aim: 125 }, 195), rack: [[0, "rowan"], [R4.from + 6, "hero"]] },
    // And slowly into her face: "Let's begin."
    // On the longest lens: just her, the world melted away behind.
    { at: QUEST.at - 8, start: dolly({ x: 4, y: -432, eye: 18, tx: 0, ty: -380, lift: 14, aim: 105 }, 82), end: dolly({ x: 3, y: -424, eye: 17, tx: 0, ty: -380, lift: 14, aim: 105 }, 74) },
  ];
};

// Where each focus subject stands.
const focusPoint = (who: Focus, f: number) =>
  who === "hero" ? { x: 0, y: H(f) } : who === "rowan" ? { x: 0, y: rowanY(f) } : who === "target" ? null : SPOTS[who];

const shotAt = (f: number) => runShots(shotsAt(f), f, VILLAGE_FRAMES, focusPoint);

// ---- Who's where, facing the camera the right way ----------------------------------

const actorsAt = (f: number, cam: Cam): Actor[] => {
  const hy = H(f);
  const ry = rowanY(f);
  const at = (x: number, y: number, theta: number, walking: boolean, sheet: Actor["sheet"], phase = 0): Actor => {
    const { row, flip } = facing(theta, cam.heading, walking);
    return { sheet, x, y, row, flip, col: walking ? walkCol(f + phase) : idleCol(f + phase) };
  };
  const toHero = (x: number, y: number) => angleTo(x, y, 0, hy);
  const staggering = f >= ROWAN_STAGGER[0] && f < ROWAN_STAGGER[1];
  const rowanWalking = f >= ROWAN_WALK[0] && f < ROWAN_WALK[1] && !staggering;
  const rowan = staggering ? { sheet: "rowan" as const, x: 0, y: ry, row: 9, col: 0 } : at(0, ry, f < ROWAN_WALK[0] ? Math.PI : angleTo(0, ry, 0, hy), rowanWalking, "rowan");
  return [
    { ...at(0, hy, heroWalking(f) ? 0 : angleTo(0, hy, 0, ry), heroWalking(f), "hero"), keep: true },
    at(SPOTS.guard.x, SPOTS.guard.y, toHero(SPOTS.guard.x, SPOTS.guard.y), false, "guard"),
    at(SPOTS.farmer.x, SPOTS.farmer.y, toHero(SPOTS.farmer.x, SPOTS.farmer.y), false, "farmer", 3),
    at(SPOTS.merchant.x, SPOTS.merchant.y, toHero(SPOTS.merchant.x, SPOTS.merchant.y), false, "merchant", 1),
    at(SPOTS.blacksmith.x, SPOTS.blacksmith.y, toHero(SPOTS.blacksmith.x, SPOTS.blacksmith.y), false, "blacksmith", 5),
    { sheet: "fisherman", ...SPOTS.fisherman, row: 8, col: fishingCol(f), flip: true },
    rowan,
  ];
};

// ---- Over their heads, and the letters --------------------------------------------

type Pop = { who: "hero" | "guard" | "farmer" | "merchant" | "fisherman"; from: number; to: number; kind: Emote };
const POPS: Pop[] = [
  { who: "guard", from: GUARD.from - 30, to: GUARD.from + 50, kind: "!" },
  { who: "hero", from: GUARD.from + 58, to: FARMER.from + 10, kind: "sweat" },
  { who: "farmer", from: FARMER.from, to: FARMER.from + 70, kind: "!" },
  { who: "merchant", from: BLACKSMITH.from + 20, to: BLACKSMITH.from + 120, kind: "?" },
  { who: "hero", from: BLACKSMITH.from + BLACKSMITH.dur - 10, to: FISHER.from, kind: "?" },
  { who: "fisherman", from: FISHER.from, to: FISHER.from + 60, kind: "!" },
  { who: "hero", from: QUEST.at - 4, to: VILLAGE_FRAMES, kind: "sparkle" },
];

const Overhead: React.FC<{ f: number; cam: Cam }> = ({ f, cam }) => {
  const posOf = (who: Pop["who"]) => (who === "hero" ? { x: 0, y: H(f) } : SPOTS[who]);
  return (
    <>
      {POPS.filter((p) => f >= p.from && f < p.to).map((p, i) => {
        const pos = posOf(p.who);
        const s = toScreen(cam, pos.x, pos.y, 40);
        if (s.d < 6) return null;
        return (
          <div key={i} style={{ position: "absolute", left: s.x + 10, top: s.y - 80 }}>
            <EmoteIcon kind={p.kind} px={Math.max(3, Math.min(10, s.px * 0.9))} t={f - p.from} />
          </div>
        );
      })}
      {[...DEMO_LETTERS].map((ch, n) => {
        const t = (f - (RESTORE.from + n * RESTORE.stagger)) / RESTORE.rise;
        if (t < 0 || t > 1.5) return null;
        const p = Math.min(1, t);
        const a = (n / DEMO_LETTERS.length) * Math.PI * 2 + p * Math.PI * 1.5;
        const s = toScreen(cam, SPOTS.rowan.x + Math.cos(a) * (6 + p * 18), SPOTS.rowan.y + Math.sin(a) * (6 + p * 18), 16 + p * 30);
        const burst = t >= 1;
        return (
          <div
            key={`l${n}`}
            style={{
              position: "absolute",
              left: s.x,
              top: s.y,
              transform: `translate(-50%, -50%) scale(${burst ? 1 + (t - 1) * 5 : 0.7 + p * 0.5})`,
              fontFamily: PIXEL,
              fontSize: Math.max(18, Math.min(70, s.px * 3)),
              color: C.gold,
              textShadow: `0 0 18px ${C.gold}, 0 0 36px #ffb24a`,
              opacity: burst ? 1 - (t - 1) / 0.5 : Math.min(1, t * 4),
            }}
          >
            {ch}
          </div>
        );
      })}
    </>
  );
};

export const Village3D: React.FC = () => {
  const f = useCurrentFrame();
  const cam = lookAt(shotAt(f));
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Pov
        cam={cam}
        actors={actorsAt(f, cam)}
        sky="dawn"
        drain={DRAIN}
        scorch={SCORCH}
        bloom={{ x: SPOTS.rowan.x, y: SPOTS.rowan.y, r: 90, k: bloomK(f) }}
        dof={0.7}
      >
        <Overhead f={f} cam={cam} />
        <RealmTitle opacity={interpolate(f, [40, 70], [1, 0], clamp)} />
        <VillageDialogue f={f} />
        <VillageSound />
      </Pov>
    </AbsoluteFill>
  );
};

export const VILLAGE_3D_FRAMES = VILLAGE_FRAMES;
