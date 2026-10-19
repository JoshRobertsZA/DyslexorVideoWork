// The realm's houses in 3D for the first-person view: a log cabin box with
// a 45° gable roof running front to back and a stone chimney, textured with
// pieces cut from the house sprite (public/realm/house3d, made by cutting up
// realm/house.png: front with the door, back, side, roof tiles, chimney stone).
//
// Each house is ray-traced per pixel over its bit of the low-res canvas: for
// every pixel, the nearest of its faces the view ray hits, textured, shaded
// by which way the face looks, and fogged with distance like everything else.
// The house's front (gable end, door) faces south (+y) at y = front.

export type HouseCam = { x: number; y: number; heading: number; eye: number; horizon: number; focal: number };
export type Tex = { w: number; h: number; px: Uint32Array };
export type HouseTex = { front: Tex; back: Tex; side: Tex; roof: Tex; chimney: Tex };

// One sprite pixel is this many texels, so the door is a little taller than
// a person (about 30 texels).
const HS = 1.35;
const W = 60 * HS; // width (x)
const H = 25 * HS; // wall height
const G = 30 * HS; // gable height above the walls
const D = 52 * HS; // depth (y), front to back
const OVX = 5; // roof overhang past the side walls
const OVY = 4; // roof overhang past the front and back
const Z0 = H + G; // ridge height
const K = G / (W / 2); // roof slope
const SLOPE = Math.sqrt(1 + K * K);

export const HOUSE_DEPTH = D;

// Packed colours (little-endian ABGR, as ImageData reads).
const rgba = (r: number, g: number, b: number) => (255 << 24) | (b << 16) | (g << 8) | r;
const RIDGE = rgba(0xe4, 0x7a, 0x40);
const EAVE = rgba(0x46, 0x12, 0x12);
const CAP = rgba(0x3a, 0x34, 0x3c);

const texCache = new Map<HTMLImageElement, Tex>();
export const texOf = (img: HTMLImageElement): Tex => {
  let t = texCache.get(img);
  if (!t) {
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const x = c.getContext("2d", { willReadFrequently: true })!;
    x.drawImage(img, 0, 0);
    t = { w: c.width, h: c.height, px: new Uint32Array(x.getImageData(0, 0, c.width, c.height).data.buffer.slice(0)) };
    texCache.set(img, t);
  }
  return t;
};

const clampTex = (t: Tex, u: number, v: number) => {
  const x = Math.min(t.w - 1, Math.max(0, Math.floor(u)));
  const y = Math.min(t.h - 1, Math.max(0, Math.floor(v)));
  return t.px[y * t.w + x];
};
const wrapTex = (t: Tex, u: number, v: number) => {
  const x = ((Math.floor(u) % t.w) + t.w) % t.w;
  const y = ((Math.floor(v) % t.h) + t.h) % t.h;
  return t.px[y * t.w + x];
};

export const drawHouse = (
  c: CanvasRenderingContext2D,
  cam: HouseCam,
  hx: number,
  front: number,
  tex: HouseTex,
  fog: [number, number, number],
  far: number,
  lw: number,
  lh: number,
  frame: number,
  depth?: Float32Array | null,
  // Clear the house's pixels instead of painting them (cutting it out of a
  // layer that's drawn over the world).
  erase = false,
) => {
  const F = front;
  const B = front - D;
  const L = hx - W / 2;
  const R = hx + W / 2;
  // The chimney: near the front-left, poking up through the roof.
  const CX0 = L + 9;
  const CX1 = CX0 + 10;
  const CY1 = F - 10;
  const CY0 = CY1 - 12;
  const CTOP = Z0 - (hx - (CX0 + CX1) / 2) * K + 12;

  const fx = Math.sin(cam.heading);
  const fy = -Math.cos(cam.heading);
  const rx = -fy;
  const ry = fx;
  const project = (x: number, y: number, z: number) => {
    const dx = x - cam.x;
    const dy = y - cam.y;
    const d = dx * fx + dy * fy;
    const lat = dx * rx + dy * ry;
    const s = cam.focal / d;
    return { d, sx: lw / 2 + lat * s, sy: cam.horizon + (cam.eye - z) * s };
  };

  // Where on the canvas it can be.
  let x0 = lw;
  let x1 = 0;
  let y0 = lh;
  let y1 = 0;
  let behind = false;
  for (const x of [L - OVX, R + OVX])
    for (const y of [B - OVY, F + OVY])
      for (const z of [0, Z0 + 1, CTOP + 6]) {
        const p = project(x, y, z);
        if (p.d < 1) behind = true;
        x0 = Math.min(x0, p.sx);
        x1 = Math.max(x1, p.sx);
        y0 = Math.min(y0, p.sy);
        y1 = Math.max(y1, p.sy);
      }
  if (behind) {
    x0 = 0;
    x1 = lw;
    y0 = 0;
    y1 = lh;
  }
  x0 = Math.max(0, Math.floor(x0) - 1);
  y0 = Math.max(0, Math.floor(y0) - 1);
  x1 = Math.min(lw, Math.ceil(x1) + 1);
  y1 = Math.min(lh, Math.ceil(y1) + 1);
  const w = x1 - x0;
  const h = y1 - y0;
  if (w <= 0 || h <= 0) return;

  const img = c.getImageData(x0, y0, w, h);
  const out = new Uint32Array(img.data.buffer);
  const [fr, fg, fb] = fog;

  for (let py = 0; py < h; py++) {
    const b = (y0 + py + 0.5 - cam.horizon) / cam.focal;
    const dz = -b;
    for (let px = 0; px < w; px++) {
      const a = (x0 + px + 0.5 - lw / 2) / cam.focal;
      const dx = fx + rx * a;
      const dy = fy + ry * a;
      let best = Infinity;
      let col = 0;
      let shade = 1;

      // Front and back gable ends.
      if (cam.y > F && dy < 0) {
        const t = (F - cam.y) / dy;
        if (t > 0.5 && t < best) {
          const x = cam.x + t * dx;
          const z = cam.eye + t * dz;
          const ax = Math.abs(x - hx);
          if (ax <= W / 2 && z >= 0 && z <= H + G * (1 - ax / (W / 2))) {
            const p = clampTex(tex.front, (x - L) / HS, (Z0 - z) / HS);
            if (p >>> 24) {
              best = t;
              col = p;
              shade = 1;
            }
          }
        }
      }
      if (cam.y < B && dy > 0) {
        const t = (B - cam.y) / dy;
        if (t > 0.5 && t < best) {
          const x = cam.x + t * dx;
          const z = cam.eye + t * dz;
          const ax = Math.abs(x - hx);
          if (ax <= W / 2 && z >= 0 && z <= H + G * (1 - ax / (W / 2))) {
            const p = clampTex(tex.back, (R - x) / HS, (Z0 - z) / HS);
            if (p >>> 24) {
              best = t;
              col = p;
              shade = 0.72;
            }
          }
        }
      }
      // Side walls.
      if (cam.x < L && dx > 0) {
        const t = (L - cam.x) / dx;
        if (t > 0.5 && t < best) {
          const y = cam.y + t * dy;
          const z = cam.eye + t * dz;
          if (y >= B && y <= F && z >= 0 && z <= H) {
            best = t;
            col = clampTex(tex.side, ((y - B) / D) * tex.side.w, (H - z) / HS);
            shade = 0.8;
          }
        }
      }
      if (cam.x > R && dx < 0) {
        const t = (R - cam.x) / dx;
        if (t > 0.5 && t < best) {
          const y = cam.y + t * dy;
          const z = cam.eye + t * dz;
          if (y >= B && y <= F && z >= 0 && z <= H) {
            best = t;
            col = clampTex(tex.side, ((F - y) / D) * tex.side.w, (H - z) / HS);
            shade = 0.9;
          }
        }
      }
      // The two roof slopes (also seen from underneath, darker, past the eaves).
      for (const side of [-1, 1]) {
        // z = Z0 - side * (x - hx) * K on that side of the ridge.
        const den = dz + side * dx * K;
        if (Math.abs(den) < 1e-6) continue;
        const t = (Z0 - side * (cam.x - hx) * K - cam.eye) / den;
        if (t <= 0.5 || t >= best) continue;
        const x = cam.x + t * dx;
        const y = cam.y + t * dy;
        const off = (x - hx) * side;
        if (off < 0 || off > W / 2 + OVX || y < B - OVY || y > F + OVY) continue;
        best = t;
        const run = off * SLOPE;
        const edge = off > W / 2 + OVX - 1.2 || y < B - OVY + 1 || y > F + OVY - 1;
        col = off < 1.4 ? RIDGE : edge ? EAVE : wrapTex(tex.roof, (y - (B - OVY)) / HS, run / HS);
        const under = cam.eye < Z0 - side * (cam.x - hx) * K;
        shade = (side < 0 ? 1.06 : 0.8) * (under && (cam.x - hx) * side < W / 2 ? 0.55 : 1);
      }
      // The chimney (an upright box).
      {
        let tmin = 0.5;
        let tmax = best;
        let face = -1;
        const slab = (o: number, dd: number, lo: number, hi: number, axis: number) => {
          if (Math.abs(dd) < 1e-9) return o >= lo && o <= hi;
          let ta = (lo - o) / dd;
          let tb = (hi - o) / dd;
          if (ta > tb) [ta, tb] = [tb, ta];
          if (ta > tmin) {
            tmin = ta;
            face = axis;
          }
          tmax = Math.min(tmax, tb);
          return tmin <= tmax;
        };
        if (slab(cam.x, dx, CX0, CX1, 0) && slab(cam.y, dy, CY0, CY1, 1) && slab(cam.eye, dz, 0, CTOP, 2) && face >= 0 && tmin < best) {
          const x = cam.x + tmin * dx;
          const y = cam.y + tmin * dy;
          const z = cam.eye + tmin * dz;
          best = tmin;
          if (face === 2) {
            col = CAP;
            shade = 1;
          } else {
            col = wrapTex(tex.chimney, (face === 0 ? y : x) / HS, (CTOP - z) / HS);
            shade = face === 0 ? (dx > 0 ? 0.78 : 0.92) : dy < 0 ? 1 : 0.72;
          }
        }
      }

      if (best === Infinity) continue;
      const k = Math.min(1, Math.max(0, (best - 220) / (far - 220))) ** 1.2;
      let r = (col & 255) * shade;
      let g = ((col >> 8) & 255) * shade;
      let bb = ((col >> 16) & 255) * shade;
      r = Math.min(255, r + (fr - r) * k);
      g = Math.min(255, g + (fg - g) * k);
      bb = Math.min(255, bb + (fb - bb) * k);
      out[py * w + px] = erase ? 0 : (255 << 24) | (bb << 16) | (g << 8) | r;
      if (depth) depth[(y0 + py) * lw + x0 + px] = best;
    }
  }
  c.putImageData(img, x0, y0);
  if (erase) return;

  // Smoke from the chimney: a few soft pixel puffs drifting up.
  const top = { x: (CX0 + CX1) / 2, y: (CY0 + CY1) / 2 };
  for (let i = 0; i < 4; i++) {
    const t = ((frame / 90 + i / 4) % 1 + 1) % 1;
    const p = project(top.x + t * 6, top.y - t * 3, CTOP + 3 + t * 26);
    if (p.d < 2) continue;
    const s = Math.max(1, Math.round((3 + t * 5) * (cam.focal / p.d)));
    c.fillStyle = `rgba(232,230,236,${0.55 * (1 - t)})`;
    c.fillRect(Math.round(p.sx - s / 2), Math.round(p.sy - s / 2), s, s);
  }
};
