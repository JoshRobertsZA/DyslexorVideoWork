import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ROW, Sprite } from "../components/Sprite";
import { Grain } from "../components/Fx";
import { WEBSITE } from "../credits";
import { PIXEL } from "../theme";
import { EPIC } from "./parts";

// The storybook closes on a hand-drawn map: the route from the realm to the
// Isle of Numbers inks itself in, and the tale is "to be continued".
export const MAP_END_DURATION = 300;

const INK = "#4a3423";
const PAPER = "#f1e2c0";
const ROUTE = "M 520 610 C 760 420, 1000 820, 1180 600 S 1380 470, 1430 560";

// Wobbly hand-drawn island outline.
const islandPath = (cx: number, cy: number, r: number, seed: string) => {
  const pts = Array.from({ length: 18 }, (_, i) => {
    const a = (i / 18) * Math.PI * 2;
    const rr = r * (0.82 + random(`${seed}${i}`) * 0.3);
    return [cx + Math.cos(a) * rr * 1.3, cy + Math.sin(a) * rr];
  });
  return `M ${pts.map((p) => p.join(" ")).join(" L ")} Z`;
};

export const MapEnd: React.FC = () => {
  const t = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fromWhite = interpolate(t, [0, 24], [1, 0], { extrapolateRight: "clamp" });
  const draw = interpolate(t, [30, 150], [0, 1], { easing: Easing.inOut(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const title = spring({ frame: t - 10, fps, config: { damping: 20 } });
  const cont = interpolate(t, [160, 190], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tease = interpolate(t, [205, 230], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const out = interpolate(t, [MAP_END_DURATION - 25, MAP_END_DURATION], [1, 0], { extrapolateLeft: "clamp" });

  // Little boat riding the inked route, via the SVG path.
  const pathRef = React.useRef<SVGPathElement>(null);
  const [len, setLen] = React.useState(1400);
  React.useLayoutEffect(() => {
    if (pathRef.current) setLen(pathRef.current.getTotalLength());
  }, []);
  const pt = pathRef.current?.getPointAtLength(len * draw);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", opacity: out }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, ${PAPER} 40%, #d9c08f 85%, #a8865a 100%)`,
        }}
      >
        <svg width="100%" height="100%" viewBox="0 0 1920 1080">
          {/* Sea hatching */}
          {Array.from({ length: 40 }, (_, i) => (
            <path
              key={i}
              d={`M ${120 + random(`h-x${i}`) * 1680} ${300 + random(`h-y${i}`) * 560} q 14 -10 28 0 q 14 10 28 0`}
              stroke={INK}
              strokeOpacity={0.35}
              strokeWidth={3}
              fill="none"
            />
          ))}
          <path d={islandPath(400, 620, 150, "realm")} fill="#d6c79a" stroke={INK} strokeWidth={5} />
          <path d={islandPath(1560, 560, 120, "isle")} fill="#d6c79a" stroke={INK} strokeWidth={5} />
          {/* Tiny houses on the realm, a stone ring on the isle */}
          {[330, 400, 470].map((x) => (
            <path key={x} d={`M ${x - 18} 620 v -24 l 18 -16 l 18 16 v 24 z`} fill="none" stroke={INK} strokeWidth={4} />
          ))}
          {Array.from({ length: 4 }, (_, i) => {
            const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
            return <rect key={i} x={1560 + Math.cos(a) * 45 - 7} y={560 + Math.sin(a) * 38 - 12} width={14} height={24} fill={INK} />;
          })}
          <path
            ref={pathRef}
            d={ROUTE}
            stroke="#9b2c22"
            strokeWidth={6}
            strokeDasharray="18 16"
            fill="none"
            style={{ strokeDashoffset: 0 }}
            mask="url(#reveal)"
          />
          <defs>
            <mask id="reveal">
              <path d={ROUTE} stroke="#fff" strokeWidth={14} fill="none" strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
            </mask>
          </defs>
          {draw >= 1 && (
            <g stroke="#9b2c22" strokeWidth={8} strokeLinecap="round">
              <line x1={1418} y1={548} x2={1442} y2={572} />
              <line x1={1442} y1={548} x2={1418} y2={572} />
            </g>
          )}
          <text x={400} y={830} textAnchor="middle" fontFamily={EPIC} fontWeight={700} fontSize={36} fill={INK}>
            The Realm
          </text>
          <text x={1560} y={740} textAnchor="middle" fontFamily={EPIC} fontWeight={700} fontSize={36} fill={INK}>
            Isle of Numbers
          </text>
          {/* Compass */}
          <g transform="translate(1720 200)" stroke={INK} strokeWidth={3} fill="none">
            <circle r={54} />
            <path d="M 0 -70 L 12 0 L 0 70 L -12 0 Z" fill={INK} fillOpacity={0.25} />
            <text y={-80} textAnchor="middle" fontFamily={EPIC} fontSize={28} fill={INK} stroke="none">
              N
            </text>
          </g>
        </svg>

        {pt && draw > 0 && draw < 1 && (
          <div style={{ position: "absolute", left: pt.x - 40, top: pt.y - 60, fontSize: 0 }}>
            <Sprite src="realm/villager.png" row={ROW.idleSide} scale={1.7} />
          </div>
        )}

        <div
          style={{
            position: "absolute",
            top: 80,
            width: "100%",
            textAlign: "center",
            fontFamily: EPIC,
            fontWeight: 700,
            fontSize: 74,
            letterSpacing: 6,
            color: INK,
            opacity: title,
            transform: `translateY(${(1 - title) * 20}px)`,
          }}
        >
          THE VOYAGE OF ELDER ROWAN
        </div>

        <div style={{ position: "absolute", bottom: 70, width: "100%", textAlign: "center" }}>
          <div style={{ fontFamily: EPIC, fontStyle: "italic", fontSize: 54, color: INK, opacity: cont }}>To be continued…</div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 40, marginTop: 26, opacity: tease }}>
            <Img src={staticFile("logos/dyslexor-maths.svg")} style={{ height: 40 }} />
            <span style={{ fontFamily: PIXEL, fontSize: 22, color: INK }}>{WEBSITE}</span>
          </div>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: "#fff8ea", opacity: fromWhite }} />
      <Grain opacity={0.1} />
    </AbsoluteFill>
  );
};
