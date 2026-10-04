import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { C, HEIGHT, WIDTH } from "../theme";

// Grass with the realm's little two-leaf tufts scattered over it.
export const Grass: React.FC<{ seed: string; density?: number; px?: number }> = ({
  seed,
  density = 90,
  px = 4,
}) => {
  const tufts = Array.from({ length: density }, (_, i) => ({
    x: random(`${seed}-x-${i}`) * WIDTH,
    y: random(`${seed}-y-${i}`) * HEIGHT,
  }));
  return (
    <AbsoluteFill style={{ backgroundColor: C.grass }}>
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0 }} shapeRendering="crispEdges">
        {tufts.map((t, i) => (
          <g key={i} transform={`translate(${Math.round(t.x)} ${Math.round(t.y)}) scale(${px})`}>
            <rect x={0} y={0} width={2} height={1} fill={C.tuft} />
            <rect x={1} y={1} width={1} height={2} fill={C.tuft} />
            <rect x={5} y={0} width={2} height={1} fill={C.tuft} />
            <rect x={5} y={1} width={1} height={2} fill={C.tuft} />
            <rect x={2} y={2} width={4} height={1} fill={C.tuftLight} />
            <rect x={3} y={3} width={2} height={2} fill={C.tuft} />
          </g>
        ))}
      </svg>
    </AbsoluteFill>
  );
};

// Chunky stepping-stone pebble like the ones along realm paths.
export const Pebble: React.FC<{ size: number }> = ({ size }) => (
  <div
    style={{
      width: size,
      height: size * 0.85,
      borderRadius: "45%",
      background: "radial-gradient(circle at 40% 35%, #d8c9a8, #b5a587 60%, #8d7f66)",
      boxShadow: `0 ${size * 0.08}px 0 #5c513f, inset 0 0 0 ${size * 0.06}px #6d614c`,
    }}
  />
);

// Comic-book halftone dots.
export const Halftone: React.FC<{ color?: string; size?: number; opacity?: number }> = ({
  color = "rgba(0,0,0,0.35)",
  size = 14,
  opacity = 1,
}) => (
  <AbsoluteFill
    style={{
      backgroundImage: `radial-gradient(${color} 22%, transparent 24%)`,
      backgroundSize: `${size}px ${size}px`,
      opacity,
      pointerEvents: "none",
    }}
  />
);

export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.7 }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,${strength}) 100%)`,
      pointerEvents: "none",
    }}
  />
);

// Film grain that shifts every frame.
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.06 }) => {
  const frame = useCurrentFrame();
  const ox = Math.floor(random(`g-x-${frame}`) * 200);
  const oy = Math.floor(random(`g-y-${frame}`) * 200);
  return (
    <AbsoluteFill style={{ opacity, mixBlendMode: "overlay", pointerEvents: "none" }}>
      <svg width="100%" height="100%">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 30} />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" transform={`translate(${ox - 100} ${oy - 100})`} />
      </svg>
    </AbsoluteFill>
  );
};

// Warm glowing dots drifting upward.
export const Fireflies: React.FC<{ count?: number; opacity?: number; seed?: string }> = ({
  count = 40,
  opacity = 1,
  seed = "ff",
}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity, pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => {
        const bx = random(`${seed}x${i}`) * WIDTH;
        const by = random(`${seed}y${i}`) * HEIGHT;
        const sp = 0.4 + random(`${seed}s${i}`) * 0.8;
        const ph = random(`${seed}p${i}`) * Math.PI * 2;
        const x = bx + Math.sin(frame / 30 + ph) * 30;
        const y = ((by - frame * sp) % HEIGHT + HEIGHT) % HEIGHT;
        const blink = 0.4 + 0.6 * Math.abs(Math.sin(frame / 12 + ph));
        const s = 4 + random(`${seed}r${i}`) * 5;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: s,
              height: s,
              borderRadius: "50%",
              background: "#fff3a8",
              opacity: blink,
              boxShadow: `0 0 ${s * 3}px ${s}px rgba(255, 220, 110, 0.55)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// Pixel speech bubble with a "!" in it.
export const Exclaim: React.FC<{ px?: number }> = ({ px = 6 }) => (
  <svg width={9 * px} height={12 * px} shapeRendering="crispEdges">
    <rect x={px} y={0} width={7 * px} height={9 * px} fill="#fff" />
    <rect x={0} y={px} width={9 * px} height={7 * px} fill="#fff" />
    <rect x={3 * px} y={9 * px} width={3 * px} height={px} fill="#fff" />
    <rect x={4 * px} y={10 * px} width={px} height={px} fill="#fff" />
    <rect x={4 * px} y={2 * px} width={px} height={4 * px} fill={C.ink} />
    <rect x={4 * px} y={7 * px} width={px} height={px} fill={C.ink} />
  </svg>
);
