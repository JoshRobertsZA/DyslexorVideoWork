import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, OffthreadVideo, random, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { WORDMARK_PATHS } from "../components/DyslexorLogo";
import { BODY } from "../theme";


// The Dyslexor Studios ident, before the episode. Black, and the music creeps
// in. Then one continuous move made with Kling 4.0 from five keyframes
// (public/ident/keyframes): an old book on a desk (THE REALM / DYSLEXOR on its
// spine) opens into a paper pop-up village, the camera dives in, the paper
// turns real, and it glides up a dusk street to a stone library. The real
// wordmark (gilt "dyslexor", STUDIOS beneath) is baked into the library's
// panel in the keyframes (IdentPlate.tsx), so it's in the footage. As the
// camera settles it keeps pushing, straight into the lettering, the stone
// falling out of focus around it while the letters stay sharp (our vector
// wordmark, aligned exactly over the baked one), lands on it with an impact,
// holds; everything else falls away to darkness until only the glowing
// letters are left, then they go out like the lamp, and it's black.
//
// Cinema touches: 2.39:1 letterbox bars; black until the lamp clicks on (with
// a quick rise of light); the clip time-remapped (slow over the desk and the book
// opening, a rush for the dive, easing into the street); the music cut dead
// half a second before the impact (the "suck-out").

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Timeline (30 fps).
const BLACK = 120; // 4 s of black, then the lamp clicks on
// The Kling footage, motion-interpolated to 60 fps (ffmpeg minterpolate) so
// the slow parts of the speed ramp stay smooth. It's two Kling 4.0 clips
// joined with a 0.4 s crossfade (kling-ident-v3.mp4): a 6 s opening
// (kling-ident-head.mp4: the lamp warming, a slow push in on the closed book
// with THE REALM on its cover, the book opening into the pop-up) and the
// original move (kling-ident-v2.mp4) from 3.6 s on, while the pop-up is still.
const CLIP = "ident/kling-ident-v3-60fps.mp4";
export const CLIP_FRAMES = 521; // 17.38 s
// The clip's last frame, rendered through the same video pipeline (the
// IdentClip composition), so the hold matches it.
const LAST = "ident/ident-hold-frame.png";
const LAST_S = (CLIP_FRAMES - 1) / 30;
// Source seconds after the opening are the original clip's + this.
const SHIFT = 2.44;

// The speed ramp: playback rate by source time (seconds into the clip).
// Slow, deliberate over the desk and the book opening; a rush for the dive;
// easing down into the street and the arrival.
const RATE: [number, number][] = [
  // The opening clip already holds on the book; play it a touch slow.
  [0, 0.85],
  [2.0, 0.8],
  [4.0, 0.7],
  [SHIFT + 3.4, 0.65],
  // At the start of the dive Kling splits the paper library in two (6.3-7.4 s
  // in the footage): rush through it so it reads as part of the whoosh.
  [6.1, 1.2],
  [6.35, 2.3],
  [7.4, 2.3],
  [7.8, 1.55],
  [SHIFT + 6.4, 1.55],
  [SHIFT + 7.2, 1.15],
  [SHIFT + 10.0, 1.1],
  [SHIFT + 11.6, 1.0],
  [SHIFT + 12.6, 0.85],
  [SHIFT + 15.1, 0.8],
];
const rateAt = (sec: number) => interpolate(sec, RATE.map((r) => r[0]), RATE.map((r) => r[1]), clamp);
// Played as short segments, each at its own rate (4 frames: the steps are too
// small to see), and where each lands on the output timeline.
type Seg = { out: number; len: number; src: number; rate: number };
const STEP = 4;
const SEGS: Seg[] = (() => {
  const segs: Seg[] = [];
  let src = 0;
  let out = 0;
  while (src < LAST_S - 1e-6) {
    const rate = rateAt(src);
    const len = Math.max(1, Math.min(STEP, Math.ceil(((LAST_S - src) * 30) / rate)));
    segs.push({ out, len, src, rate });
    src += (len * rate) / 30;
    out += len;
  }
  return segs;
})();
const CLIP_OUT = SEGS.reduce((n, sg) => n + sg.len, 0);
// The output frame (from the clip's start) where source second `sec` plays.
const outAt = (sec: number) => {
  const seg = SEGS.find((sg) => sg.src + (sg.len * sg.rate) / 30 > sec) ?? SEGS[SEGS.length - 1];
  return seg.out + Math.round(((sec - seg.src) * 30) / seg.rate);
};
const CLIP_END = BLACK + CLIP_OUT;

// The push into the letters: it starts as the clip's camera eases to a stop,
// so the motion carries on unbroken, and lands on the wordmark.
const ZOOM = { from: CLIP_END - 24, to: CLIP_END + 150 };
const LAND = ZOOM.to;
const SHEEN = { from: LAND - 30, to: LAND + 30 };
// After the impact the world falls away until only the letters glow, then
// they go out like the lamp.
const DARKEN = { from: LAND + 10, to: LAND + 55 };
const LIGHTS_OUT = LAND + 90;
export const IDENT_FRAMES = LIGHTS_OUT + 40;
// The suck-out: the music stops dead this long before the impact.
const SUCK = 15;

// Where the baked lettering sits in the clip's last frame, in composition
// pixels (the 1924 x 1076 clip is drawn object-fit: cover at 1920 x 1080).
const WORD = { x: 837.6, y: 299.1, w: 227.9 };
const WORD_H = (WORD.w * 53) / 230;
const STUDIOS_TOP = 359;
const STUDIOS_SIZE = 18.5;
// What the push centres on, and how far it goes (the wordmark ends up about
// two-thirds of the frame wide).
const FOCUS = { x: WORD.x + WORD.w / 2, y: 338 };
const ZOOM_TO = 5.4;

const zoomK = (f: number) => interpolate(f, [ZOOM.from, ZOOM.to], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
const scaleAt = (f: number) => 1 + (ZOOM_TO - 1) * zoomK(f);
// The focus point eases to the centre of the frame as we push in.
const centreAt = (f: number) => {
  const k = zoomK(f);
  return { x: FOCUS.x + (960 - FOCUS.x) * k, y: FOCUS.y + (540 - FOCUS.y) * k };
};

// The vector lettering, drawn at the zoomed size (so it's always crisp) at the
// spot the zoom moves the baked letters to. It fades in as the footage softens.
const SharpLetters: React.FC<{ f: number }> = ({ f }) => {
  const s = scaleAt(f);
  // Off like a lamp: a flicker, then gone.
  const off = interpolate(f, [LIGHTS_OUT, LIGHTS_OUT + 2, LIGHTS_OUT + 4, LIGHTS_OUT + 6, LIGHTS_OUT + 8], [1, 0.25, 0.7, 0.15, 0], clamp);
  const opacity = interpolate(zoomK(f), [0.08, 0.35], [0, 1], clamp) * off;
  if (opacity <= 0) return null;
  const c = centreAt(f);
  const map = (x: number, y: number) => ({ x: c.x + (x - FOCUS.x) * s, y: c.y + (y - FOCUS.y) * s });
  const w0 = map(WORD.x, WORD.y);
  const studios = map(FOCUS.x, STUDIOS_TOP);
  const sweep = interpolate(f, [SHEEN.from, SHEEN.to], [-60, 290], { ...clamp, easing: Easing.inOut(Easing.quad) });
  return (
    <AbsoluteFill style={{ opacity }}>
      <svg
        width={WORD.w * s}
        height={WORD_H * s}
        viewBox="0 0 230 53"
        style={{ position: "absolute", left: w0.x, top: w0.y, overflow: "visible", filter: `drop-shadow(0 ${0.9 * s}px ${0.7 * s}px rgba(30,12,2,0.9)) drop-shadow(0 0 ${4 * s}px rgba(255,190,110,0.4))` }}
      >
        <defs>
          <linearGradient id="ident-gilt" x1="0" y1="0" x2="0" y2="53" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#fff0c8" />
            <stop offset="0.5" stopColor="#eab866" />
            <stop offset="1" stopColor="#9c5f26" />
          </linearGradient>
          <linearGradient id="ident-sweep" gradientUnits="userSpaceOnUse" x1={sweep - 30} y1="0" x2={sweep + 30} y2="53">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0.85" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {WORDMARK_PATHS.map((d) => (
          <path key={d} d={d} fill="url(#ident-gilt)" />
        ))}
        {f >= SHEEN.from && f <= SHEEN.to && WORDMARK_PATHS.map((d) => <path key={`s${d}`} d={d} fill="url(#ident-sweep)" />)}
      </svg>
      <div
        style={{
          position: "absolute",
          left: studios.x,
          top: studios.y,
          transform: "translateX(-50%)",
          fontFamily: BODY,
          fontWeight: 500,
          fontSize: STUDIOS_SIZE * s,
          lineHeight: 1,
          letterSpacing: "0.55em",
          paddingLeft: "0.55em",
          whiteSpace: "nowrap",
          color: "#f3cf92",
          textShadow: `0 ${0.8 * s}px ${0.6 * s}px rgba(30,12,2,0.85), 0 0 ${3 * s}px rgba(255,190,110,0.4)`,
        }}
      >
        STUDIOS
      </div>
    </AbsoluteFill>
  );
};

const Grain: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill
    style={{
      opacity: 0.07,
      mixBlendMode: "overlay",
      backgroundImage: `radial-gradient(circle at ${random(`gx${f}`) * 100}% ${random(`gy${f}`) * 100}%, #fff 0.5px, transparent 1px)`,
      backgroundSize: "3px 3px",
    }}
  />
);

const fill = { width: "100%", height: "100%", objectFit: "cover" } as const;
export const ClipVideo: React.FC = () => <OffthreadVideo src={staticFile(CLIP)} style={fill} muted />;

// The clip, time-remapped: one short segment after another, each at its rate.
const RampedClip: React.FC = () => (
  <>
    {SEGS.map((sg) => (
      <Sequence key={sg.out} from={BLACK + sg.out} durationInFrames={sg.len} layout="none">
        <OffthreadVideo src={staticFile(CLIP)} style={fill} muted trimBefore={sg.src * 30} playbackRate={sg.rate} />
      </Sequence>
    ))}
  </>
);

// 2.39:1 letterbox.
const BAR = Math.round((1080 - 1920 / 2.39) / 2);
const Letterbox: React.FC = () => (
  <>
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: BAR, background: "#000" }} />
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: BAR, background: "#000" }} />
  </>
);

// `carryMusic`: in the episode the music carries on under the opening titles
// (OpeningTitles.tsx), so instead of fading out it eases down to CARRY_LEVEL.
export const Ident: React.FC<{ carryMusic?: boolean }> = ({ carryMusic = false }) => {
  const f = useCurrentFrame();
  // The lamp clicks on and warms up: it rises, dips softly twice (never to
  // black), and holds.
  const lampOn = interpolate(
    f,
    [BLACK, BLACK + 8, BLACK + 20, BLACK + 23, BLACK + 28, BLACK + 38, BLACK + 40, BLACK + 45],
    [0, 1, 1, 0.5, 1, 1, 0.72, 1],
    clamp,
  );
  // Everything but the letters falls away after the impact.
  const world = interpolate(f, [DARKEN.from, DARKEN.to], [1, 0.06], { ...clamp, easing: Easing.inOut(Easing.quad) }) * interpolate(f, [LIGHTS_OUT, LIGHTS_OUT + 6], [1, 0], clamp);
  const k = zoomK(f);
  const s = scaleAt(f);
  const c = centreAt(f);
  // The stone around the letters falls out of focus as we push in.
  const blur = interpolate(k, [0.15, 1], [0, 2.2], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <AbsoluteFill style={{ opacity: lampOn }}>
        <AbsoluteFill
          style={{
            opacity: world,
            transform: `translate(${c.x - FOCUS.x}px, ${c.y - FOCUS.y}px) scale(${s})`,
            transformOrigin: `${FOCUS.x}px ${FOCUS.y}px`,
            filter: blur > 0.01 ? `blur(${blur}px)` : undefined,
          }}
        >
          <RampedClip />
          {/* The clip's own last frame, so the hold is seamless */}
          {f >= CLIP_END && <Img src={staticFile(LAST)} style={{ width: "100%", height: "100%" }} />}
        </AbsoluteFill>
        {/* Darken the edges more as we close in, so the letters glow */}
        <AbsoluteFill style={{ background: `radial-gradient(ellipse 60% 45% at 50% 50%, transparent 40%, rgba(0,0,0,${0.35 * k}) 100%)` }} />
        <SharpLetters f={f} />
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 70% at 50% 50%, transparent 55%, rgba(0,0,0,0.5) 100%)" }} />
        <Grain f={f} />
      </AbsoluteFill>
      <Letterbox />
      <IdentSound carryMusic={carryMusic} />
    </AbsoluteFill>
  );
};

// cinematic-intro.mp3 (public/music). It creeps in, low, over the black and
// the study and builds through the move. The track has its own suck-out: it
// falls to near silence (73-75 s in the file) and then a huge hit at 75.45 s,
// which lands on LAND, as the push settles on the letters (with the deep
// reverb impact, Pixabay, under it). It rings out over the ending.
// (Kling's own generated audio is muted.)
// The whole ident's level (and the titles'), set so it sits with the story
// that follows (the climax peaks around -3 dBFS).
export const MASTER = 0.8;
const MUSIC_HIT = 75.45;
const MUSIC_FROM = Math.round((MUSIC_HIT - LAND / 30) * 30);
export const IDENT_MUSIC = "music/cinematic-intro.mp3";
// Where the track is (frames into the file) when the ident ends, and the
// level it hands over at, for the opening titles to carry on from.
export const IDENT_MUSIC_END = MUSIC_FROM + IDENT_FRAMES;
export const CARRY_LEVEL = 0.5;
const musicVolume = (t: number, carry: boolean) =>
  interpolate(t, [0, 90, BLACK + 60, ZOOM.from - 60, ZOOM.from, IDENT_FRAMES - 60, IDENT_FRAMES], [0, 0.22, 0.3, 0.85, 1, 0.8, carry ? CARRY_LEVEL : 0], { ...clamp, easing: Easing.inOut(Easing.quad) });

// The sound design, cued to the picture (public/sfx, Pixabay). `at` is the
// frame the sound's own key moment (its `hit`, seconds into the file: a click,
// a creak) lands on; `from` trims the file's start; `len` is how long it plays,
// faded out over its last `fade` frames. Levels set from each file's measured
// loudness.
type Cue = { name: string; file: string; at: number; hit?: number; from?: number; vol: number; len: number; fade?: number };
const CUES: Cue[] = [
  // The black: a slow clock and the room's hush, until the light's been on a moment.
  { name: "clock", file: "sfx/clock-ticking.mp3", at: 0, from: 0.5, vol: 0.35, len: BLACK + 50, fade: 40 },
  { name: "room tone", file: "sfx/room-tone.mp3", at: 0, vol: 1, len: BLACK + 120, fade: 60 },
  // One file, two clicks: on at 1.10 s, off at 3.06 s.
  { name: "lamp on", file: "sfx/lamp-on-lamp-off.mp3", at: BLACK, from: 1.0, hit: 0.1, vol: 0.9, len: 24, fade: 8 },
  { name: "book opens", file: "sfx/book-opening.mp3", at: BLACK + outAt(2.3), hit: 0.44, vol: 1, len: 33 },
  { name: "paper unfolds", file: "sfx/pop-up-unfolding.mp3", at: BLACK + outAt(3.7), hit: 0.34, vol: 0.8, len: 36 },
  { name: "dive", file: "sfx/the-dive.mp3", at: BLACK + outAt(6.4), hit: 0.25, vol: 0.22, len: 90 },
  { name: "becoming real", file: "sfx/becoming-real.mp3", at: BLACK + outAt(SHIFT + 9.0), vol: 1, len: LAND - SUCK - (BLACK + outAt(SHIFT + 9.0)), fade: 45 },
  { name: "birds", file: "sfx/birds-chirping.mp3", at: BLACK + outAt(SHIFT + 9.5), vol: 0.45, len: LAND - SUCK - (BLACK + outAt(SHIFT + 9.5)), fade: 45 },
  { name: "lamp off", file: "sfx/lamp-on-lamp-off.mp3", at: LIGHTS_OUT, from: 2.96, hit: 0.1, vol: 0.9, len: 30, fade: 10 },
];

const IdentSound: React.FC<{ carryMusic: boolean }> = ({ carryMusic }) => (
  <>
    <Sequence durationInFrames={IDENT_FRAMES} name="♪ ident music">
      <Audio src={staticFile(IDENT_MUSIC)} trimBefore={MUSIC_FROM} volume={(t) => MASTER * musicVolume(t, carryMusic)} />
    </Sequence>
    <Sequence from={LAND - 2} durationInFrames={IDENT_FRAMES - LAND + 2} name="🔊 impact">
      <Audio src={staticFile("sfx/cinematic-impact.mp3")} volume={(t) => MASTER * interpolate(t, [0, IDENT_FRAMES - LAND - 30, IDENT_FRAMES - LAND + 2], [0.4, 0.4, 0], clamp)} />
    </Sequence>
    {CUES.map((c) => {
      const start = c.at - Math.round((c.hit ?? 0) * 30);
      const fade = c.fade ?? 20;
      return (
        <Sequence key={c.name} from={start} durationInFrames={c.len} name={`🔊 ${c.name}`}>
          <Audio src={staticFile(c.file)} trimBefore={Math.round((c.from ?? 0) * 30)} volume={(t) => MASTER * c.vol * interpolate(t, [c.len - fade, c.len], [1, 0], clamp)} />
        </Sequence>
      );
    })}
  </>
);
