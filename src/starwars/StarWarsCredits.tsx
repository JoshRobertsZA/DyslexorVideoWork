import React from "react";
import { AbsoluteFill, Easing, interpolate, random, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { loadFont as loadNewsCycle } from "@remotion/google-fonts/NewsCycle";
import { Grain } from "../components/Fx";
import { HEIGHT, TITLE, WIDTH } from "../theme";
import { Boat, Passengers } from "../lore/parts";

// A space-opera opening crawl, starring the Dyslexor team.
const CRAWL_FONT = loadNewsCycle("normal", { weights: ["400", "700"], subsets: ["latin"] }).fontFamily;

const YELLOW = "#ffe81f";
const BLUE = "#4bd5ee";

export const TEAM_NAMES = [
  "Joshua Roberts",
  "Sushmitha Nooka",
  "Dylan Shortt",
  "Joshua Westcott",
  "Marcus McDowall",
  "Tyron DuPont",
  "Ripfumelo Khoza",
  "Farhan Hoth",
  "Luc de Marillac",
  "Connor Manuel",
];

// Hand-wrapped so every line can be laid out (and justified) on its own.
const PARAGRAPHS = [
  ["It is a time of struggle. Across the", "land, young readers battle letters", "that twist, flip and refuse to stay", "still."],
  ["Ten brave developers have joined", "forces to build DYSLEXOR, a realm", "where every reader can level up,", "one word at a time."],
  ["Armed with spellcheckers, scanners,", "a loyal cat and a wise wizard named", "Elder Rowan, the team now races to", "finish their final project before", "the presentation ends...."],
];

type Line = { text: string; size: number; justify: boolean; gapBefore: number };

const LINES: Line[] = (() => {
  const lines: Line[] = [
    { text: "Episode I", size: 72, justify: false, gapBefore: 0 },
    { text: "THE READING AWAKENS", size: 120, justify: false, gapBefore: 30 },
  ];
  PARAGRAPHS.forEach((p, pi) =>
    p.forEach((text, i) =>
      lines.push({ text, size: 76, justify: i < p.length - 1, gapBefore: i === 0 ? (pi === 0 ? 110 : 70) : 0 }),
    ),
  );
  lines.push({ text: "STARRING", size: 72, justify: false, gapBefore: 140 });
  TEAM_NAMES.forEach((text, i) => lines.push({ text, size: 92, justify: false, gapBefore: i === 0 ? 50 : 20 }));
  lines.push({ text: "May the words be with you.", size: 66, justify: false, gapBefore: 130 });
  return lines;
})();

// Plane-space y (distance from the top of the text block) of each line.
const LINE_Y = (() => {
  let y = 0;
  return LINES.map((l) => {
    y += l.gapBefore;
    const at = y;
    y += l.size * 1.32;
    return at;
  });
})();

// Timeline
const INTRO_END = 150;
const LOGO_START = INTRO_END;
const LOGO_DUR = 260;
const CRAWL_START = INTRO_END + 40;
const CRAWL_SPEED = 3.4;
const TILT_START = 1480;
const TILT_DUR = 150;
export const STAR_WARS_DURATION = TILT_START + TILT_DUR + 180;

// Crawl plane geometry: a plane tilted back by THETA, its near edge just
// below the frame, viewed with perspective P from the top centre.
const PLANE_W = 1180;
const TILT_PX = 700;
const P = 900;
const THETA = (58 * Math.PI) / 180;
const NEAR_Y = HEIGHT + 120;

// d = distance along the plane from its near edge.
const project = (d: number) => {
  const z = d * Math.sin(THETA);
  const k = P / (P + z);
  return { y: (NEAR_Y - d * Math.cos(THETA)) * k, k };
};

const CrawlLine: React.FC<{ line: Line; d: number }> = ({ line, d }) => {
  if (d < -200) return null;
  const { y, k } = project(Math.max(0, d));
  const lineH = line.size * 1.32;
  const yBelow = project(Math.max(0, d - lineH)).y;
  // Vertical squash from foreshortening, relative to the horizontal scale.
  const squash = Math.min(1, Math.abs(yBelow - y) / (lineH * k));
  const opacity = interpolate(k, [0.1, 0.24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (opacity <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: (WIDTH - PLANE_W) / 2,
        top: y,
        width: PLANE_W,
        height: lineH,
        transformOrigin: "50% 0%",
        transform: `scale(${k}, ${k * squash})`,
        opacity,
        fontFamily: CRAWL_FONT,
        fontWeight: 700,
        fontSize: line.size,
        lineHeight: `${lineH}px`,
        color: YELLOW,
        whiteSpace: "nowrap",
        textAlign: line.justify ? "justify" : "center",
        textAlignLast: line.justify ? "justify" : line.size === 76 ? "left" : "center",
        letterSpacing: line.size >= 100 ? 4 : undefined,
      }}
    >
      {line.text}
    </div>
  );
};

const Stars: React.FC = () => (
  <AbsoluteFill>
    {Array.from({ length: 380 }, (_, i) => {
      const s = random(`sw-s${i}`) < 0.85 ? 2 : 3;
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: random(`sw-x${i}`) * WIDTH,
            // Taller than the frame so the camera can tilt down into more sky
            top: random(`sw-y${i}`) * (HEIGHT + TILT_PX),
            width: s,
            height: s,
            background: "#fff",
            opacity: 0.4 + random(`sw-o${i}`) * 0.6,
          }}
        />
      );
    })}
  </AbsoluteFill>
);

// Pixel planet: a grid of squares coloured by a cheap noise function,
// with the land slowly turning and a shadowed night side.
const Planet: React.FC<{ r: number; cell: number }> = ({ r, cell }) => {
  const frame = useCurrentFrame();
  const spin = frame * 0.6;
  const cells: React.ReactNode[] = [];
  for (let y = -r; y < r; y += cell) {
    for (let x = -r; x < r; x += cell) {
      const cx = x + cell / 2;
      const cy = y + cell / 2;
      if (cx * cx + cy * cy > r * r) continue;
      const u = cx + spin;
      const n = Math.sin(u * 0.012) + Math.sin(cy * 0.017 + 1.3) + Math.sin((u + cy) * 0.008 + 2.1);
      let color = "#3f7fb0";
      if (n > 0.55) color = "#79bf56";
      else if (n > 0.35) color = "#e0c894";
      else if (n < -1.2) color = "#31648f";
      if (n > 1.5) color = "#5fa344";
      cells.push(<rect key={`${x},${y}`} x={x + r} y={y + r} width={cell} height={cell} fill={color} />);
    }
  }
  return (
    <div style={{ position: "relative", width: r * 2, height: r * 2 }}>
      <svg width={r * 2} height={r * 2} shapeRendering="crispEdges">
        {cells}
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.18), transparent 40%, rgba(0,0,10,0.75) 85%)",
        }}
      />
      <div style={{ position: "absolute", inset: -30, borderRadius: "50%", boxShadow: "0 0 80px 20px rgba(90,163,205,0.45)" }} />
    </div>
  );
};

export const StarWarsCredits: React.FC = () => {
  const frame = useCurrentFrame();

  // "A long time ago..."
  const intro = interpolate(frame, [12, 36, INTRO_END - 30, INTRO_END - 6], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Logo starts huge and recedes into the stars.
  const lt = frame - LOGO_START;
  const logoScale = 2.8 * Math.pow(0.988, Math.max(0, lt));
  const logoOpacity = interpolate(lt, [0, 1, LOGO_DUR - 60, LOGO_DUR], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Camera tilts down to reveal the planet at the end.
  const tilt = interpolate(frame, [TILT_START, TILT_START + TILT_DUR], [0, TILT_PX], {
    easing: Easing.inOut(Easing.sin),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scroll = Math.max(0, frame - CRAWL_START) * CRAWL_SPEED;

  // Rowan's boat sails over the camera toward the planet.
  const fly = interpolate(frame, [TILT_START + 60, STAR_WARS_DURATION - 30], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [STAR_WARS_DURATION - 30, STAR_WARS_DURATION], [1, 0], { extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden", opacity: fadeOut }}>
      {frame < INTRO_END ? (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "flex-start", paddingLeft: 380 }}>
          <div style={{ fontFamily: CRAWL_FONT, fontSize: 58, lineHeight: 1.35, color: BLUE, opacity: intro }}>
            A long time ago in a realm far,
            <br />
            far away....
          </div>
        </AbsoluteFill>
      ) : (
        <AbsoluteFill style={{ transform: `translateY(${-tilt}px)` }}>
          <Stars />

          {/* Opening crawl: each line projected onto the receding plane */}
          {LINES.map((line, i) => (
            <CrawlLine key={i} line={line} d={scroll - LINE_Y[i]} />
          ))}

          {/* Fade the crawl into the distance */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: WIDTH,
              height: 520,
              background: "linear-gradient(180deg, #000 30%, rgba(0,0,0,0))",
              opacity: tilt > 0 ? 0 : 1,
            }}
          />

          {/* Logo */}
          <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
            <div
              style={{
                transform: `scale(${logoScale})`,
                opacity: logoOpacity,
                textAlign: "center",
                lineHeight: 0.92,
              }}
            >
              <div
                style={{
                  fontFamily: TITLE,
                  fontSize: 220,
                  letterSpacing: 18,
                  color: "transparent",
                  WebkitTextStroke: `7px ${YELLOW}`,
                }}
              >
                DYSLEXOR
              </div>
            </div>
          </AbsoluteFill>

          {/* Planet waiting below the frame */}
          <div style={{ position: "absolute", left: WIDTH / 2 - 700, top: HEIGHT + TILT_PX - 420 }}>
            <Planet r={700} cell={20} />
          </div>

          {/* The boat flies in over the camera, toward the planet */}
          {fly > 0 && (
            <div
              style={{
                position: "absolute",
                left: interpolate(fly, [0, 1], [-200, WIDTH / 2 - 40]),
                top: interpolate(fly, [0, 1], [TILT_PX - 200, HEIGHT + TILT_PX - 560]),
                transform: `scale(${interpolate(fly, [0, 1], [2.4, 0.35])})`,
                transformOrigin: "center",
              }}
            >
              <Boat px={5} lantern={0.8}>
                <Passengers px={5} />
              </Boat>
            </div>
          )}
        </AbsoluteFill>
      )}
      <Grain opacity={0.05} />
    </AbsoluteFill>
  );
};

export const StarWarsWithMusic: React.FC = () => (
  <AbsoluteFill>
    <StarWarsCredits />
    <Sequence from={LOGO_START} name="♪ theme">
      <Audio
        src={staticFile("music/background-music.mp3")}
        volume={(f) =>
          interpolate(f, [0, 4, STAR_WARS_DURATION - LOGO_START - 60, STAR_WARS_DURATION - LOGO_START], [0.9, 0.7, 0.7, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />
    </Sequence>
  </AbsoluteFill>
);
