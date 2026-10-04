import React from "react";
import { AbsoluteFill, Easing, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ROW, Sprite } from "../components/Sprite";
import { Grain, Halftone, Vignette } from "../components/Fx";
import { CAST, CastMember } from "../credits";
import { BODY, C, HEIGHT, PIXEL, TITLE, WIDTH } from "../theme";

// Scene 3: "STARRING" cards for the realm's characters, each one slashing in
// over the last like the end-title cards in a Marvel film.
const CARD = 96;
export const WIPE = 14;
const STEP = CARD - WIPE;
export const CAST_DURATION = STEP * (CAST.length - 1) + CARD;

const Card: React.FC<{ member: CastMember; index: number }> = ({ member, index }) => {
  const t = useCurrentFrame();
  const { fps } = useVideoConfig();

  const wipe = interpolate(t, [0, WIPE], [0, 1], { easing: Easing.out(Easing.cubic), extrapolateRight: "clamp" });
  const edge = (1 - wipe) * (WIDTH + 500) - 250;
  const slant = 250;

  const hero = spring({ frame: t - 6, fps, config: { damping: 14, stiffness: 120 } });
  const bob = Math.sin(t / 9) * 6;
  const label = spring({ frame: t - 10, fps, config: { damping: 20 } });
  const name = interpolate(t, [14, 30], [0, 1], { easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const role = spring({ frame: t - 24, fps, config: { damping: 20 } });
  const quote = interpolate(t, [36, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const drift = interpolate(t, [0, CARD], [0, -40]);

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          clipPath: `polygon(${edge + slant}px 0, ${WIDTH}px 0, ${WIDTH}px ${HEIGHT}px, ${edge - slant}px ${HEIGHT}px)`,
          backgroundColor: member.bg,
          overflow: "hidden",
        }}
      >
        {/* Spotlight panel behind the character */}
        <AbsoluteFill
          style={{
            clipPath: "polygon(0 0, 58% 0, 44% 100%, 0 100%)",
            background: `radial-gradient(circle at 28% 55%, rgba(255,255,255,0.35), rgba(255,255,255,0.06) 45%, rgba(0,0,0,0.25) 80%)`,
          }}
        >
          <AbsoluteFill
            style={{
              background: `repeating-conic-gradient(from ${t * 0.5}deg at 28% 55%, rgba(255,255,255,0.08) 0deg 7deg, transparent 7deg 20deg)`,
            }}
          />
          <Halftone color="rgba(0,0,0,0.28)" size={14} />
        </AbsoluteFill>

        {/* Giant ghost number */}
        <div
          style={{
            position: "absolute",
            right: -40 + drift,
            bottom: -120,
            fontFamily: TITLE,
            fontSize: 760,
            lineHeight: 1,
            color: "transparent",
            WebkitTextStroke: "4px rgba(255,255,255,0.10)",
          }}
        >
          {String(index + 1).padStart(2, "0")}
        </div>

        {/* Character */}
        <div
          style={{
            position: "absolute",
            left: 540 - 336,
            top: 560 - 336 + (1 - hero) * 260 + bob,
            opacity: Math.min(1, hero * 1.5),
            filter: "drop-shadow(14px 14px 0 rgba(0,0,0,0.45))",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 336 - 150,
              top: 336 + 190 - bob,
              width: 300,
              height: 50,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.35)",
            }}
          />
          <Sprite src={member.sheet} row={ROW.idleDown} scale={14} animFps={6} />
        </div>

        {/* Credit text */}
        <div style={{ position: "absolute", left: 1000, top: 330, width: 860 }}>
          <div
            style={{
              fontFamily: PIXEL,
              fontSize: 28,
              letterSpacing: 8,
              color: C.gold,
              opacity: label,
              transform: `translateX(${(1 - label) * 60}px)`,
              textShadow: "3px 3px 0 #000",
            }}
          >
            STARRING
          </div>
          <div
            style={{
              fontFamily: TITLE,
              fontSize: member.name.length > 10 ? 128 : 180,
              lineHeight: 1.05,
              color: C.cream,
              marginTop: 18,
              clipPath: `inset(0 ${100 - name * 100}% 0 0)`,
              textShadow: "8px 8px 0 rgba(0,0,0,0.5)",
              whiteSpace: "nowrap",
            }}
          >
            {member.name}
          </div>
          <div
            style={{
              fontFamily: BODY,
              fontWeight: 300,
              fontStyle: "italic",
              fontSize: 54,
              color: C.cream,
              opacity: role * 0.9,
              transform: `translateY(${(1 - role) * 20}px)`,
              marginTop: 6,
            }}
          >
            {member.role}
          </div>
          <div
            style={{
              fontFamily: BODY,
              fontWeight: 500,
              fontSize: 32,
              color: C.cream,
              opacity: quote * 0.7,
              marginTop: 40,
              paddingLeft: 24,
              borderLeft: `6px solid ${C.gold}`,
              maxWidth: 760,
            }}
          >
            “{member.quote}”
          </div>
        </div>
        <Vignette strength={0.45} />
      </AbsoluteFill>

      {/* Gold edge riding along the wipe */}
      {wipe < 1 && (
        <AbsoluteFill
          style={{
            backgroundColor: C.gold,
            clipPath: `polygon(${edge + slant - 26}px 0, ${edge + slant}px 0, ${edge - slant}px ${HEIGHT}px, ${edge - slant - 26}px ${HEIGHT}px)`,
          }}
        />
      )}
    </AbsoluteFill>
  );
};

export const Cast: React.FC = () => (
  <AbsoluteFill>
    {CAST.map((member, i) => (
      <Sequence key={member.name} from={i * STEP} durationInFrames={CARD}>
        <Card member={member} index={i} />
      </Sequence>
    ))}
    <Grain />
  </AbsoluteFill>
);
