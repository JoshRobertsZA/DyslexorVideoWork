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
const FOCAL = 457; // ~70 degree field of view
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
};

export type Actor = {
  sheet: keyof typeof SHEETS;
  x: number;
  y: number;
  row: number;
  col: number;
  flip?: boolean;
  size?: number;
  // Optional pixel bubble above the head.
  bubble?: boolean;
};

export type Sky = "day" | "dusk";

const SKIES: Record<Sky, { top: string; bottom: string; fog: [number, number, number]; hills: string; hillsFar: string }> = {
  day: { top: "#5fa8e0", bottom: "#cdeefb", fog: [205, 238, 251], hills: "#3f8f5a", hillsFar: "#7cb98c" },
  dusk: { top: "#2a1838", bottom: "#f4a259", fog: [244, 162, 89], hills: "#2f3a4f", hillsFar: "#6b4f6f" },
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

type Images = Record<keyof typeof SHEETS, HTMLImageElement>;

function useSheets(): Images | null {
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
};

function project(cam: Required<Cam>, x: number, y: number) {
  const dx = x - cam.x;
  const dy = y - cam.y;
  const fx = Math.sin(cam.heading);
  const fy = -Math.cos(cam.heading);
  const d = dx * fx + dy * fy;
  const lat = dx * -fy + dy * fx;
  const scale = FOCAL / d;
  return { d, sx: LW / 2 + lat * scale, footY: cam.horizon + cam.eye * scale, scale };
}

export type PovProps = {
  cam: Cam;
  actors?: Actor[];
  hands?: HandPose[];
  sky?: Sky;
  // 0..1, how strongly each portal ring glows (by house id).
  glow?: Partial<Record<string, number>>;
  // Extra overlays drawn above the canvas (dialogue, titles).
  children?: React.ReactNode;
};

export const Pov: React.FC<PovProps> = ({ cam: camIn, actors = [], hands = [], sky = "day", glow = {}, children }) => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  const imgs = useSheets();

  useLayoutEffect(() => {
    const canvas = ref.current;
    if (!canvas || !imgs) return;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    const cam: Required<Cam> = { eye: 26, horizon: 120, roll: 0, ...camIn };
    const S = SKIES[sky];
    const hz = Math.round(cam.horizon);

    // Sky.
    const grad = ctx.createLinearGradient(0, hz - 260, 0, hz);
    grad.addColorStop(0, S.top);
    grad.addColorStop(1, S.bottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, LW, LH);

    // Pixel clouds drifting, parallax with heading.
    ctx.fillStyle = sky === "day" ? "#ffffff" : "#f7c6a0";
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
    for (let y = Math.max(0, hz + 1); y < LH; y++) {
      const d = (cam.eye * FOCAL) / (y - hz);
      if (d > FAR) {
        continue;
      }
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
            const c = parseInt(ring.color.slice(1), 16);
            const k = ring.g;
            r = r + (((c >> 16) & 255) - r) * k;
            g = g + (((c >> 8) & 255) - g) * k;
            b = b + ((c & 255) - b) * k;
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
      const sheet = imgs[a.sheet];
      const draw = sheetDraw(sheet, a.col * 48, a.row * 48, 48, 48, 42, a.flip);
      boards.push({
        x: a.x,
        y: a.y,
        d: 0,
        shadow: 9 * size,
        draw: (c, sx, footY, scale) => {
          draw(c, sx, footY, scale * size);
          if (a.bubble) drawBubble(c, sx, footY - 40 * scale * size, Math.max(1, Math.round(scale * size * 0.9)));
        },
      });
    }

    const visible = boards
      .map((b) => ({ b, p: project(cam, b.x, b.y) }))
      .filter(({ p }) => p.d > 6 && p.d < FAR && p.sx > -400 && p.sx < LW + 400)
      .sort((a, b) => b.p.d - a.p.d);

    for (const { b, p } of visible) {
      const fog = Math.min(1, Math.max(0, (p.d - 220) / (FAR - 220))) ** 1.2;
      if (b.shadow) {
        ctx.fillStyle = `rgba(20,30,20,${0.28 * (1 - fog)})`;
        ctx.beginPath();
        ctx.ellipse(p.sx, p.footY, b.shadow * p.scale, b.shadow * p.scale * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1 - fog * 0.85;
      b.draw(ctx, p.sx, p.footY, p.scale);
      ctx.globalAlpha = 1;
    }
    // Haze band over the far floor and sprites near the horizon.
    const haze = ctx.createLinearGradient(0, hz - 30, 0, hz + 40);
    haze.addColorStop(0, `rgba(${fr},${fg},${fb},0)`);
    haze.addColorStop(0.45, `rgba(${fr},${fg},${fb},0.55)`);
    haze.addColorStop(1, `rgba(${fr},${fg},${fb},0)`);
    ctx.fillStyle = haze;
    ctx.fillRect(0, hz - 30, LW, 70);

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
  });

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
      {children}
    </AbsoluteFill>
  );
};

// The realm's white "!" bubble, in canvas pixels.
function drawBubble(c: CanvasRenderingContext2D, cx: number, bottom: number, px: number) {
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
