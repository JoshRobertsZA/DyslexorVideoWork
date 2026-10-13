import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { FPS } from "../../theme";
import { HAND_H, HAND_W, HandPose, getHands } from "./hands";
import { HOUSES, HOUSE_Y, RING_R, RING_Y, SCATTER, SHEETS, getGround } from "./world";

// First-person view of the realm. The floor is drawn Mode 7 style: every
// screen row below the horizon is one slice of the ground at a fixed distance,
// sampled from the village texture. People, houses and trees stand on it as
// flat sprites scaled by distance. Everything draws into a 640x360 canvas that
// is blown up 3x with hard pixels, so the whole view stays 8-bit.

export const LW = 640;
export const LH = 360;
const FOCAL = 457; // ~70 degree field of view (the default lens)
const FAR = 1100;

export type Cam = {
  x: number;
  y: number;
  // Radians clockwise from north.
  heading: number;
  // Eye height in texels (a realm person is ~30 tall).
  eye?: number;
  // Screen row of the horizon; lower = looking up, higher = looking down.
  horizon?: number;
  // Sideways head roll in radians.
  roll?: number;
  // Lens: focal length in canvas pixels (457 is ~70 degrees; higher is a
  // longer, tighter lens).
  focal?: number;
  // Focus distance in texels, for `dof` (0: the old top/bottom soft band).
  focus?: number;
};

type FullCam = Required<Cam>;
const full = (c: Cam): FullCam => ({ x: c.x, y: c.y, heading: c.heading, eye: c.eye ?? 26, horizon: c.horizon ?? 120, roll: c.roll ?? 0, focal: c.focal ?? FOCAL, focus: c.focus ?? 0 });

export type Actor = {
  // "hero" stacks her avatar layers.
  sheet: keyof typeof SHEETS | "hero";
  // Stays in full colour when the world is drained (Hero).
  keep?: boolean;
  x: number;
  y: number;
  row: number;
  col: number;
  flip?: boolean;
  size?: number;
  // Floats this many texels off the floor (Dyslexi); the shadow stays below.
  lift?: number;
  // Optional pixel bubble above the head.
  bubble?: boolean;
};

export type Sky = "day" | "dusk" | "dawn";

const SKIES: Record<Sky, { top: string; bottom: string; fog: [number, number, number]; hills: string; hillsFar: string }> = {
  day: { top: "#5fa8e0", bottom: "#cdeefb", fog: [205, 238, 251], hills: "#3f8f5a", hillsFar: "#7cb98c" },
  dusk: { top: "#2a1838", bottom: "#f4a259", fog: [244, 162, 89], hills: "#2f3a4f", hillsFar: "#6b4f6f" },
  // The cold morning after the Dark Wizard's attack.
  dawn: { top: "#5b6aa3", bottom: "#f0b49a", fog: [206, 184, 186], hills: "#3a4a5a", hillsFar: "#7a7f95" },
};

// A burnt patch on the floor, in world texels.
export type Scorch = { x: number; y: number; rx: number; ry: number };


// Screen position (1920x1080) of a point `lift` texels above the floor at
// (x, y), and how many screen pixels one texel spans there.
export const toScreen = (camIn: Cam, x: number, y: number, lift = 0) => {
  const p = project(full(camIn), x, y);
  return { x: p.sx * 3, y: (p.footY - lift * p.scale) * 3, px: p.scale * 3, d: p.d };
};

// Frame columns for the realm's 6x10 sheets. Idle frames hold 0.25s, walks 0.12s.
const wrap6 = (n: number) => ((n % 6) + 6) % 6;
export const idleCol = (frame: number) => wrap6(Math.floor(frame / (0.25 * FPS)));
export const walkCol = (frame: number) => wrap6(Math.floor(frame / (0.12 * FPS)));

// Fisherman's casting loop from lib/realm/townsfolk.ts (row 8).
export const fishingCol = (frame: number) => {
  const seq = [
    [0, 0.5],
    [1, 0.35],
    [2, 2.4],
    [3, 0.9],
  ];
  const loop = seq.reduce((s, [, d]) => s + d, 0);
  let t = (((frame / FPS) % loop) + loop) % loop;
  for (const [c, d] of seq) {
    if (t < d) return c;
    t -= d;
  }
  return 0;
};

const imageCache = new Map<string, Promise<HTMLImageElement>>();
const loadImage = (src: string) => {
  if (!imageCache.has(src)) {
    imageCache.set(
      src,
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = staticFile(src);
      }),
    );
  }
  return imageCache.get(src)!;
};

export type Images = Record<keyof typeof SHEETS, HTMLImageElement>;

export function useSheets(): Images | null {
  const [imgs, setImgs] = useState<Images | null>(null);
  const [handle] = useState(() => delayRender("Loading realm sheets"));
  useEffect(() => {
    const keys = Object.keys(SHEETS) as (keyof typeof SHEETS)[];
    Promise.all(keys.map((k) => loadImage(SHEETS[k]))).then((list) => {
      const out = {} as Images;
      keys.forEach((k, i) => (out[k] = list[i]));
      setImgs(out);
      continueRender(handle);
    });
  }, [handle]);
  return imgs;
}


type Billboard = {
  d: number;
  draw: (ctx: CanvasRenderingContext2D, sx: number, footY: number, scale: number) => void;
  x: number;
  y: number;
  shadow?: number;
  keep?: boolean;
};

function project(cam: FullCam, x: number, y: number) {
  const dx = x - cam.x;
  const dy = y - cam.y;
  const fx = Math.sin(cam.heading);
  const fy = -Math.cos(cam.heading);
  const d = dx * fx + dy * fy;
  const lat = dx * -fy + dy * fx;
  const scale = cam.focal / d;
  return { d, sx: LW / 2 + lat * scale, footY: cam.horizon + cam.eye * scale, scale };
}

export type PovProps = {
  cam: Cam;
  actors?: Actor[];
  hands?: HandPose[];
  sky?: Sky;
  // 0..1, how strongly each portal ring glows (by house id).
  glow?: Partial<Record<string, number>>;
  // 0..1: drains the world toward grey (the stolen words). Hero's hands stay
  // in full colour.
  drain?: number;
  // Burn marks on the floor.
  scorch?: Scorch[];
  // A patch of colour coming back through the drain, around a point on the
  // floor: radius `r` in texels, strength `k` 0..1.
  bloom?: { x: number; y: number; r: number; k: number };
  // 0..1: HD-2D depth of field, the lens's aperture. With a `cam.focus`
  // distance, everything nearer or farther than it goes soft by how far off
  // it is (and more so on a long lens); without one, a soft band top and bottom.
  dof?: number;
  // The Dark Wizard's tower far off on the horizon, at a compass bearing
  // (radians clockwise from north). Its lit window is drawn over the view by
  // the caller (see towerWindow), so it stays purple through the drain.
  tower?: number;
  // Extra overlays drawn above the canvas (dialogue, titles).
  children?: React.ReactNode;
};

export const Pov: React.FC<PovProps> = ({ cam: camIn, actors = [], hands = [], sky = "day", glow = {}, drain = 0, scorch = [], bloom, dof = 0, tower, children }) => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  const blurRef = useRef<HTMLCanvasElement>(null);
  const lensRef = useRef<HTMLCanvasElement>(null);
  const imgs = useSheets();

  useLayoutEffect(() => {
    const canvas = ref.current;
    if (!canvas || !imgs) return;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    const cam = full(camIn);
    const FOCAL = cam.focal;
    const S = SKIES[sky];
    // Depth of every canvas pixel, for focus. The sky is "far away".
    const focusing = dof > 0 && cam.focus > 0;
    const depth = focusing ? new Float32Array(LW * LH).fill(FAR * 4) : null;
    const hz = Math.round(cam.horizon);

    // Sky.
    const grad = ctx.createLinearGradient(0, hz - 260, 0, hz);
    grad.addColorStop(0, S.top);
    grad.addColorStop(1, S.bottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, LW, LH);

    // Pixel clouds drifting, parallax with heading.
    ctx.fillStyle = sky === "day" ? "#ffffff" : sky === "dawn" ? "#e9b8a8" : "#f7c6a0";
    for (let i = 0; i < 12; i++) {
      const period = LW + 200;
      const cx = (((i * 173 - cam.heading * 260 + frame * 0.08 * (1 + (i % 3))) % period) + period) % period - 100;
      const cy = hz - 60 - ((i * 97) % 440);
      const w = 30 + ((i * 53) % 40);
      ctx.globalAlpha = 0.85;
      ctx.fillRect(Math.round(cx), cy, w, 6);
      ctx.fillRect(Math.round(cx) + 6, cy - 5, w - 14, 5);
      ctx.fillRect(Math.round(cx) + 12, cy - 9, w - 28, 4);
    }
    ctx.globalAlpha = 1;

    // Distant hills and tree line on the horizon, scrolling with heading.
    const band = (color: string, amp: number, period: number, speed: number, lift: number) => {
      ctx.fillStyle = color;
      const off = cam.heading * FOCAL * speed;
      for (let x = 0; x < LW; x += 2) {
        const u = x + off;
        const h =
          lift +
          amp * (0.5 + 0.5 * Math.sin(u / period)) +
          amp * 0.4 * (0.5 + 0.5 * Math.sin(u / (period * 0.37) + 1.3));
        ctx.fillRect(x, hz - Math.round(h), 2, Math.round(h) + 1);
      }
    };
    band(S.hillsFar, 16, 60, 0.3, 4);
    if (tower !== undefined) drawTower(ctx, cam, tower, S.fog);
    band(S.hills, 6, 9, 0.6, 2);

    // Floor, Mode 7.
    const ground = getGround();
    const img = ctx.getImageData(0, 0, LW, LH);
    const out = new Uint32Array(img.data.buffer);
    const fx = Math.sin(cam.heading);
    const fy = -Math.cos(cam.heading);
    const rx = -fy;
    const ry = fx;
    const grassPx = ground.px[0];
    const [fr, fg, fb] = S.fog;
    const ringAt = (wx: number, wy: number) => {
      for (const h of HOUSES) {
        const g = glow[h.id] ?? 0.35;
        const dd = Math.hypot(wx - h.x, (wy - RING_Y) * 1.0);
        if (dd > RING_R - 3 && dd < RING_R + 1) return { color: h.accent, g };
        if (dd < RING_R - 3 && g > 0.5) return { color: h.accent, g: (g - 0.5) * 0.6 };
      }
      return null;
    };
    // Pixels that keep their colour when the world is drained.
    const keep = new Uint8Array(LW * LH);
    for (let y = Math.max(0, hz + 1); y < LH; y++) {
      const d = (cam.eye * FOCAL) / (y - hz);
      if (d > FAR) {
        continue;
      }
      if (depth) depth.fill(d, y * LW, (y + 1) * LW);
      const fog = Math.min(1, Math.max(0, (d - 220) / (FAR - 220))) ** 1.2;
      // Past ~140 texels one screen pixel covers several texels, so fade to
      // the averaged floor instead of flickering between speckles.
      const lod = Math.min(1, Math.max(0, (d - 140) / 220));
      for (let x = 0; x < LW; x++) {
        const lat = ((x - LW / 2) * d) / FOCAL;
        const wx = cam.x + fx * d + rx * lat;
        const wy = cam.y + fy * d + ry * lat;
        const tx = Math.floor(wx) + ground.ox;
        const ty = Math.floor(wy) + ground.oy;
        const inside = tx >= 0 && ty >= 0 && tx < ground.w && ty < ground.h;
        let p = inside ? ground.px[ty * ground.w + tx] : grassPx;
        let r = p & 255;
        let g = (p >> 8) & 255;
        let b = (p >> 16) & 255;
        if (lod > 0) {
          const m = inside ? ground.mip[ty * ground.w + tx] : grassPx;
          r = r + ((m & 255) - r) * lod;
          g = g + (((m >> 8) & 255) - g) * lod;
          b = b + (((m >> 16) & 255) - b) * lod;
        }
        if (wy > RING_Y - RING_R - 2 && wy < RING_Y + RING_R + 2) {
          const ring = ringAt(wx, wy);
          if (ring) {
            keep[y * LW + x] = 1;
            const c = parseInt(ring.color.slice(1), 16);
            const k = ring.g;
            r = r + (((c >> 16) & 255) - r) * k;
            g = g + (((c >> 8) & 255) - g) * k;
            b = b + ((c & 255) - b) * k;
          }
        }
        for (const m of scorch) {
          const e = ((wx - m.x) / m.rx) ** 2 + ((wy - m.y) / m.ry) ** 2;
          if (e < 1) {
            // Soot that thins toward a ragged, speckled edge.
            const n = hashSpeck(Math.floor(wx), Math.floor(wy));
            const k = (0.62 * (1 - e) ** 0.6 + (n < 0.25 ? 0.18 : 0)) * (e > 0.6 && n > 0.55 ? 0 : 1);
            r = r * (1 - k) + 26 * k;
            g = g * (1 - k) + 18 * k;
            b = b * (1 - k) + 22 * k;
          }
        }
        r = r + (fr - r) * fog;
        g = g + (fg - g) * fog;
        b = b + (fb - b) * fog;
        p = (255 << 24) | (b << 16) | (g << 8) | r;
        out[y * LW + x] = p;
      }
    }
    ctx.putImageData(img, 0, 0);

    // Billboards, far to near.
    const boards: Billboard[] = [];
    const sheetDraw =
      (sheet: HTMLImageElement, sx0: number, sy0: number, w: number, h: number, footInCell: number, flip = false) =>
      (c: CanvasRenderingContext2D, sx: number, footY: number, scale: number) => {
        const dw = w * scale;
        const dh = h * scale;
        if (flip) {
          c.save();
          c.translate(Math.round(sx), 0);
          c.scale(-1, 1);
          c.drawImage(sheet, sx0, sy0, w, h, Math.round(-dw / 2), Math.round(footY - footInCell * scale), Math.round(dw), Math.round(dh));
          c.restore();
        } else {
          c.drawImage(sheet, sx0, sy0, w, h, Math.round(sx - dw / 2), Math.round(footY - footInCell * scale), Math.round(dw), Math.round(dh));
        }
      };

    const houseFrame = Math.floor(frame / 5) % 12;
    for (const h of HOUSES) {
      boards.push({
        x: h.x,
        y: HOUSE_Y,
        d: 0,
        draw: sheetDraw(imgs.house, (houseFrame % 6) * 80, Math.floor(houseFrame / 6) * 136, 80, 136, 130),
      });
    }
    for (const s of SCATTER) {
      boards.push({
        x: s.x,
        y: s.y,
        d: 0,
        shadow: s.kind === "tree" ? 12 : 8,
        draw:
          s.kind === "tree"
            ? sheetDraw(imgs.tree, 96, 1, 32, 46, 45)
            : sheetDraw(imgs.tree, 71, 14, 20, 33, 32),
      });
    }
    for (const a of actors) {
      const size = a.size ?? 1;
      const layers = a.sheet === "hero" ? [imgs.heroSkin, imgs.heroHair, imgs.heroOutfit] : [imgs[a.sheet]];
      const draws = layers.map((sheet) => sheetDraw(sheet, a.col * 48, a.row * 48, 48, 48, 42, a.flip));
      boards.push({
        x: a.x,
        y: a.y,
        d: 0,
        shadow: 9 * size,
        keep: a.keep,
        draw: (c, sx, footY, scale) => {
          const y = footY - (a.lift ?? 0) * scale;
          draws.forEach((draw) => draw(c, sx, y, scale * size));
          if (a.bubble) drawBubble(c, sx, y - 40 * scale * size, Math.max(1, Math.round(scale * size * 0.9)));
        },
      });
    }

    const visible = boards
      .map((b) => ({ b, p: project(cam, b.x, b.y) }))
      .filter(({ p }) => p.d > 6 && p.d < FAR && p.sx > -400 && p.sx < LW + 400)
      .sort((a, b) => b.p.d - a.p.d);

    // What stays in colour (Hero) is also drawn to its own layer; anything
    // nearer drawn after it erases it there, so occlusion still holds when the
    // layer goes back on top after the drain.
    const keepLayer = drain > 0 && visible.some(({ b }) => b.keep) ? keepCanvas() : null;
    const kctx = keepLayer?.getContext("2d") ?? null;
    if (kctx) {
      kctx.imageSmoothingEnabled = false;
      kctx.clearRect(0, 0, LW, LH);
    }
    let kept = false;
    for (const { b, p } of visible) {
      const fog = Math.min(1, Math.max(0, (p.d - 220) / (FAR - 220))) ** 1.2;
      if (b.shadow) {
        ctx.fillStyle = `rgba(20,30,20,${0.28 * (1 - fog)})`;
        ctx.beginPath();
        ctx.ellipse(p.sx, p.footY, b.shadow * p.scale, b.shadow * p.scale * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1 - fog * 0.85;
      if (depth) {
        // Drawn through a scratch canvas so its own pixels (not its box)
        // take its depth.
        const x0 = Math.max(0, Math.floor(p.sx - 45 * p.scale));
        const x1 = Math.min(LW, Math.ceil(p.sx + 45 * p.scale));
        const y0 = Math.max(0, Math.floor(p.footY - 140 * p.scale));
        const y1 = Math.min(LH, Math.ceil(p.footY + 8 * p.scale));
        if (x1 > x0 && y1 > y0) {
          const sc = scratchCanvas().getContext("2d", { willReadFrequently: true })!;
          sc.imageSmoothingEnabled = false;
          sc.clearRect(x0, y0, x1 - x0, y1 - y0);
          sc.globalAlpha = ctx.globalAlpha;
          b.draw(sc, p.sx, p.footY, p.scale);
          sc.globalAlpha = 1;
          const a = sc.getImageData(x0, y0, x1 - x0, y1 - y0).data;
          const w = x1 - x0;
          for (let i = 3, n = 0; i < a.length; i += 4, n++) {
            if (a[i] > 60) depth[(y0 + Math.floor(n / w)) * LW + x0 + (n % w)] = p.d;
          }
          ctx.globalAlpha = 1;
          ctx.drawImage(scratchCanvas(), x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0);
        }
      } else {
        b.draw(ctx, p.sx, p.footY, p.scale);
      }
      ctx.globalAlpha = 1;
      if (kctx && (b.keep || kept)) {
        kctx.globalCompositeOperation = b.keep ? "source-over" : "destination-out";
        b.draw(kctx, p.sx, p.footY, p.scale);
        kept = true;
      }
    }
    // Haze band over the far floor and sprites near the horizon.
    const haze = ctx.createLinearGradient(0, hz - 30, 0, hz + 40);
    haze.addColorStop(0, `rgba(${fr},${fg},${fb},0)`);
    haze.addColorStop(0.45, `rgba(${fr},${fg},${fb},0.55)`);
    haze.addColorStop(1, `rgba(${fr},${fg},${fb},0)`);
    ctx.fillStyle = haze;
    ctx.fillRect(0, hz - 30, LW, 70);

    // The stolen words: everything but Hero (and the game portals) goes grey.
    if (drain > 0) {
      const im = ctx.getImageData(0, 0, LW, LH);
      const d = im.data;
      const b = bloom && bloom.k > 0 ? project(cam, bloom.x, bloom.y) : null;
      const bx = b ? b.sx : 0;
      const by = b ? b.footY - 12 * b.scale : 0;
      const br = b && bloom ? Math.max(1, bloom.r * b.scale) : 1;
      for (let i = 0; i < d.length; i += 4) {
        if (keep[i >> 2]) continue;
        let k = drain;
        if (b && bloom) {
          const px = (i >> 2) % LW;
          const py = (i >> 2) / LW;
          const t = 1 - Math.hypot(px - bx, (py - by) * 1.4) / br;
          if (t > 0) k *= 1 - bloom.k * Math.min(1, t * 1.8);
        }
        const l = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2];
        d[i] += (l - d[i]) * k;
        d[i + 1] += (l - d[i + 1]) * k;
        d[i + 2] += (l * 1.04 - d[i + 2]) * k;
      }
      ctx.putImageData(im, 0, 0);
      if (keepLayer && kctx) {
        kctx.globalCompositeOperation = "source-over";
        ctx.drawImage(keepLayer, 0, 0);
      }
    }

    // Hands last, over everything.
    const H = getHands();
    for (const hand of hands) {
      const palm = hand.turn < 0;
      const src = H[`${palm ? "palm" : "back"}${hand.curl}`];
      // Whole art pixels only, and the turn steps through 3 widths like a
      // sprite animation instead of a smooth squash.
      const scale = 6;
      const k = Math.max(1, Math.round(Math.abs(hand.turn) * 3)) / 3;
      const w = Math.round(HAND_W * k) * scale;
      const h = HAND_H * scale;
      const x = Math.round(hand.x / scale) * scale;
      const y = Math.round(hand.y / scale) * scale;
      ctx.save();
      ctx.translate(x, y);
      if (hand.mirror) ctx.scale(-1, 1);
      ctx.drawImage(src, -Math.round(w / 2), -h, w, h);
      ctx.restore();
    }

    // Focus: each pixel's blur from how far it is off the focus distance
    // (thin lens: proportional to focal * |d - focus| / (d * focus)), laid
    // over the sharp frame as up to three blurred copies, each masked to the
    // pixels that blur that much.
    const lens = lensRef.current;
    if (lens && depth) {
      const k = dof * 1.3 * cam.focal / cam.focus;
      const masks = LEVELS.slice(1).map(() => new ImageData(LW, LH));
      for (let i = 0; i < depth.length; i++) {
        const d = depth[i];
        const r = Math.min(LEVELS[LEVELS.length - 1], (k * Math.abs(d - cam.focus)) / d);
        for (let l = 1; l < LEVELS.length; l++) {
          const a = (r - LEVELS[l - 1]) / (LEVELS[l] - LEVELS[l - 1]);
          masks[l - 1].data[i * 4 + 3] = a <= 0 ? 0 : a >= 1 ? 255 : a * 255;
        }
      }
      const lctx = lens.getContext("2d")!;
      lctx.clearRect(0, 0, lens.width, lens.height);
      const tmp = lensTmp();
      const tctx = tmp.getContext("2d")!;
      const mask = maskCanvas().getContext("2d")!;
      masks.forEach((m, n) => {
        tctx.globalCompositeOperation = "source-over";
        tctx.clearRect(0, 0, tmp.width, tmp.height);
        tctx.imageSmoothingEnabled = false;
        tctx.filter = `blur(${LEVELS[n + 1] * 3}px)`;
        tctx.drawImage(canvas, 0, 0, tmp.width, tmp.height);
        tctx.filter = "none";
        mask.putImageData(m, 0, 0);
        tctx.globalCompositeOperation = "destination-in";
        tctx.imageSmoothingEnabled = true;
        tctx.drawImage(maskCanvas(), 0, 0, tmp.width, tmp.height);
        lctx.drawImage(tmp, 0, 0);
      });
      tctx.globalCompositeOperation = "source-over";
    }

    // A copy for the soft-band blur.
    const blur = blurRef.current;
    if (blur && dof > 0 && !depth) {
      const bctx = blur.getContext("2d")!;
      bctx.clearRect(0, 0, LW, LH);
      bctx.drawImage(canvas, 0, 0);
    }
  });

  const focusOn = (camIn.focus ?? 0) > 0;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <canvas
        ref={ref}
        width={LW}
        height={LH}
        style={{
          width: LW * 3,
          height: LH * 3,
          imageRendering: "pixelated",
          transform: camIn.roll ? `rotate(${camIn.roll}rad) scale(1.05)` : undefined,
        }}
      />
      {dof > 0 && focusOn && (
        <canvas
          ref={lensRef}
          width={LW * 3}
          height={LH * 3}
          style={{ position: "absolute", inset: 0, transform: camIn.roll ? `rotate(${camIn.roll}rad) scale(1.05)` : undefined }}
        />
      )}
      {dof > 0 && !focusOn && (
        <canvas
          ref={blurRef}
          width={LW}
          height={LH}
          style={{
            position: "absolute",
            inset: 0,
            width: LW * 3,
            height: LH * 3,
            filter: `blur(${dof * 6}px)`,
            maskImage: "linear-gradient(black 0%, transparent 34%, transparent 72%, black 100%)",
            WebkitMaskImage: "linear-gradient(black 0%, transparent 34%, transparent 72%, black 100%)",
            transform: camIn.roll ? `rotate(${camIn.roll}rad) scale(1.05)` : undefined,
          }}
        />
      )}
      {children}
    </AbsoluteFill>
  );
};

// ---- The Wizard's tower ------------------------------------------------------------
// So far off it never changes size as the camera moves, only with the lens.

const TOWER_K = 0.9;
const towerFrame = (cam: FullCam, bearing: number) => {
  const rel = Math.atan2(Math.sin(bearing - cam.heading), Math.cos(bearing - cam.heading));
  if (Math.abs(rel) > 1.2) return null;
  return { sx: LW / 2 + Math.tan(rel) * cam.focal, base: cam.horizon + 2, k: (cam.focal / FOCAL) * TOWER_K };
};

function drawTower(ctx: CanvasRenderingContext2D, cam: FullCam, bearing: number, fog: [number, number, number]) {
  const t = towerFrame(cam, bearing);
  if (!t) return;
  const { sx, base, k } = t;
  // Dark slate, half lost in the haze.
  const [fr, fg, fb] = fog;
  ctx.fillStyle = `rgb(${(42 + fr) / 2},${(36 + fg) / 2},${(56 + fb) / 2})`;
  const r = (x: number, y: number, w: number, h: number) => ctx.fillRect(Math.round(sx + x * k), Math.round(base - (y + h) * k), Math.max(1, Math.round(w * k)), Math.max(1, Math.round(h * k)));
  // Rocky foot, shaft, flared top, battlements and a crooked spire.
  r(-12, 0, 24, 6);
  r(-6, 0, 12, 52);
  r(-9, 52, 18, 6);
  for (let i = -9; i < 9; i += 4) r(i, 58, 2, 3);
  r(-4, 58, 8, 8);
  r(-3, 66, 6, 6);
  r(-2, 72, 4, 6);
  r(-1, 78, 3, 5);
  r(0, 83, 2, 4);
  // A thinner side turret.
  r(6, 0, 5, 34);
  r(5, 34, 7, 3);
  r(7, 37, 3, 6);
}

// Where the tower's top window is on the 1920x1080 screen, and how big one
// tower pixel is there, or null when it's out of view.
export const towerWindow = (camIn: Cam, bearing: number) => {
  const t = towerFrame(full(camIn), bearing);
  if (!t) return null;
  return { x: (t.sx - 0.5 * t.k) * 3, y: (t.base - 56.5 * t.k) * 3, px: t.k * 3 };
};

const hashSpeck = (x: number, y: number) => {
  let h = x * 374761393 + y * 668265263;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};

// Blur radii (canvas pixels) of the focus layers: sharp, then three copies.
const LEVELS = [0, 1, 2.2, 4.5];

const offscreen = (w: number, h: number) => {
  let el: HTMLCanvasElement | null = null;
  return () => {
    if (!el) {
      el = document.createElement("canvas");
      el.width = w;
      el.height = h;
    }
    return el;
  };
};
const scratchCanvas = offscreen(LW, LH);
const maskCanvas = offscreen(LW, LH);
const lensTmp = offscreen(LW * 3, LH * 3);

let keepCanvasEl: HTMLCanvasElement | null = null;
const keepCanvas = () => {
  if (!keepCanvasEl) {
    keepCanvasEl = document.createElement("canvas");
    keepCanvasEl.width = LW;
    keepCanvasEl.height = LH;
  }
  return keepCanvasEl;
};

// The realm's white "!" bubble, in canvas pixels.
export function drawBubble(c: CanvasRenderingContext2D, cx: number, bottom: number, px: number) {
  const x = Math.round(cx - 4.5 * px);
  const y = Math.round(bottom - 12 * px);
  c.fillStyle = "#fff";
  c.fillRect(x + px, y, 7 * px, 9 * px);
  c.fillRect(x, y + px, 9 * px, 7 * px);
  c.fillRect(x + 3 * px, y + 9 * px, 3 * px, px);
  c.fillRect(x + 4 * px, y + 10 * px, px, px);
  c.fillStyle = "#09060d";
  c.fillRect(x + 4 * px, y + 2 * px, px, 4 * px);
  c.fillRect(x + 4 * px, y + 7 * px, px, px);
}

// Camera helpers for walking: head bob that follows footsteps.
export const bob = (frame: number, walking: number) => ({
  eye: 26 + Math.sin((frame / FPS) * Math.PI * 4) * 0.6 * walking,
  sway: Math.sin((frame / FPS) * Math.PI * 2) * 0.012 * walking,
});
