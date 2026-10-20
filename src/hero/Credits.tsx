import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import DyslexorLogo from "../components/DyslexorLogo";
import { BODY, C } from "../theme";

// The pilot's end credits, straight after "To be continued...". A slow roll
// (slower than film credits: much of the audience finds reading hard) in
// Lexend, roles left of a centre line and names right of it, over the Lair's
// dark with a few stolen letters drifting. The villain's track carries on from
// the Lair underneath. It settles on the Dyslexor wordmark and fades.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Music in the episode with a known source. These tracks are also used, but
// where they came from isn't recorded anywhere (add them here once known):
// background-music.mp3 (the opening), fighting-background-music.mp3,
// mystery-drone.mp3, rebirth-background-music.mp3
// (Rowan's theme) and sound_effect.mp3 (the chime). background-music.mp3 was
// exported from Clipchamp. The sound effects in sfx/ are from Pixabay.
// "Night Shade" is all rights reserved (THIRD_PARTY_ASSET_NOTICES.md in the
// Dyslexor repo): the credit below is not a licence, so get the artist's
// permission before this is shown publicly.
const MUSIC = [
  { title: "Phoenix", by: "Scott Buckley", note: "Released under CC BY 4.0 · www.scottbuckley.com.au" },
  { title: "Night Shade", by: "AdhesiveWombat", note: "" },
  // evilbackgroundnoise.mp3 (the Lair and these credits). Royalty free; the
  // composer asks for his name and links in the credits
  // (https://www.youtube.com/watch?v=-GuD1rs9Z5I).
  { title: "Dark Choir Music", by: "Mattia Cupelli", note: "Music © 2014 Mattia Cupelli · www.mattiacupelli.com · soundcloud.com/mattiacupelli" },
];

type Block =
  | { kind: "gap"; h: number }
  | { kind: "eyebrow"; text: string }
  | { kind: "wordmark"; w: number }
  | { kind: "title"; over: string; text: string }
  | { kind: "heading"; text: string; sub?: string }
  | { kind: "pair"; role: string; names: string[] }
  | { kind: "columns"; names: string[] }
  | { kind: "track"; title: string; by: string; note: string }
  | { kind: "logos" }
  | { kind: "powered" }
  | { kind: "para"; lines: string[]; size?: number; dim?: boolean };

const ROLL: Block[] = [
  { kind: "eyebrow", text: "A DYSLEXOR PRODUCTION" },
  { kind: "gap", h: 30 },
  { kind: "wordmark", w: 520 },
  { kind: "gap", h: 50 },
  { kind: "title", over: "SEASON 1 · EPISODE 1", text: "Someone Heard" },
  { kind: "gap", h: 140 },

  { kind: "pair", role: "Directed by", names: ["Joshua Roberts"] },
  { kind: "pair", role: "Written by", names: ["Joshua Roberts", "Dylan Shortt", "Sushmitha Nooka"] },
  { kind: "pair", role: "Storyboards by", names: ["Dylan Shortt"] },
  { kind: "pair", role: "Edited by", names: ["Joshua Roberts", "Sushmitha Nooka"] },
  { kind: "pair", role: "Produced by", names: ["Dyslexor"] },

  // The Narrator's, Rowan's and the Blacksmith's takes carry Fish Audio tags
  // (public/voice/*.mp3 metadata). The Dark Wizard (evil-line*, evil-new*) is
  // ElevenLabs' "Branok - Evil & Villainous" voice, and Dyslexi is its "Lulu
  // Lolipop - High-Pitched and Bubbly" (the team, 2026-10-20).
  { kind: "heading", text: "VOICE CAST", sub: "in order of appearance" },
  { kind: "pair", role: "Narrator", names: ["Voice created with Fish Audio"] },
  { kind: "pair", role: "The Dark Wizard", names: ["“Branok” voice by ElevenLabs"] },
  { kind: "pair", role: "Elder Rowan", names: ["Voice created with Fish Audio"] },
  { kind: "pair", role: "Hero", names: ["Sushmitha Nooka"] },
  { kind: "pair", role: "Dyslexi", names: ["“Lulu Lolipop” voice by ElevenLabs"] },
  { kind: "pair", role: "Blacksmith", names: ["Voice created with Fish Audio"] },
  { kind: "pair", role: "???", names: ["Joshua Roberts"] },

  { kind: "heading", text: "PRODUCTION TEAM" },
  {
    kind: "columns",
    names: [
      "Joshua Roberts",
      "Sushmitha Nooka",
      "Dylan Shortt",
      "Connor Manuel",
      "Joshua Westcott",
      "Tyron DuPont",
      "Luc de Marillac St Julien",
      "Ripfumelo Khoza",
      "Farhan Khan Hoth",
      "Marcus McDowall",
    ],
  },

  { kind: "heading", text: "POST-PRODUCTION" },
  { kind: "pair", role: "Sound design", names: ["Joshua Roberts"] },
  { kind: "pair", role: "Re-recording mixer", names: ["Joshua Roberts"] },

  { kind: "heading", text: "ACADEMIC SUPERVISION" },
  { kind: "pair", role: "Lecturer", names: ["Amber Bruil"] },

  { kind: "heading", text: "ANIMATION & TECHNOLOGY" },
  { kind: "pair", role: "Animated with", names: ["Remotion", "Adobe After Effects"] },
  { kind: "pair", role: "Character voices", names: ["Fish Audio", "ElevenLabs"] },
  // As THIRD_PARTY_ASSET_NOTICES.md in the Dyslexor repo credits them.
  { kind: "pair", role: "Realm art", names: ["The Dyslexor team"] },
  { kind: "pair", role: "Based on", names: ["“Mystic Woods”", "by Game Endeavor"] },
  { kind: "pair", role: "Typefaces", names: ["Lexend", "Press Start 2P"] },
  // All of sfx/ (the team, 2026-10-20). Pixabay's licence needs no credit;
  // this is a courtesy.
  { kind: "pair", role: "Sound effects", names: ["Pixabay"] },

  { kind: "heading", text: "MUSIC" },
  ...MUSIC.map((m) => ({ kind: "track" as const, ...m })),

  { kind: "heading", text: "SPECIAL THANKS" },
  { kind: "logos" },
  { kind: "gap", h: 20 },
  {
    kind: "para",
    size: 34,
    lines: [
      "IIE Emeris",
      "Kensio House",
      "The Dyslexor Maths team",
      "Every learner and teacher who tested Dyslexor",
      "",
      "The British Dyslexia Association,",
      "for the Dyslexia Style Guide",
      "",
      "Google Fonts · OpenDyslexic · Braille Institute,",
      "for type that makes reading easier",
    ],
  },

  // What the Dyslexor app (and Rhyme Time in it) runs on.
  { kind: "heading", text: "POWERED BY" },
  { kind: "powered" },

  { kind: "gap", h: 170 },
  { kind: "para", lines: ["For every learner who reads", "one word at a time."], size: 44 },
  { kind: "gap", h: 170 },

  {
    kind: "para",
    dim: true,
    size: 24,
    lines: [
      "This programme is a work of fiction. The characters, places and events portrayed are fictitious.",
      "Any resemblance to actual persons, living or dead, or to actual events is purely coincidental.",
      "",
      "Made as part of INSY7315 Work Integrated Learning, IIE Emeris.",
      "",
      "© 2026 Dyslexor (Pty) Ltd. All rights reserved.",
    ],
  },
];

// Each block's height, so the roll knows exactly where it ends.
const PAIR_LINE = 62;
const height = (b: Block): number => {
  switch (b.kind) {
    case "gap":
      return b.h;
    case "eyebrow":
      return 40;
    case "wordmark":
      return Math.round((b.w * 53) / 230);
    case "title":
      return 170;
    case "heading":
      return b.sub ? 190 : 160;
    case "pair":
      return b.names.length * PAIR_LINE + 26;
    case "columns":
      return Math.ceil(b.names.length / 2) * 62;
    case "track":
      return b.note ? 156 : 116;
    case "logos":
      return 150;
    case "powered":
      return 110;
    case "para":
      return b.lines.length * (b.size ?? 30) * 1.55;
  }
};
const TOTAL = ROLL.reduce((h, b) => h + height(b), 0);

// The last card: the wordmark, centred, once the roll has gone by.
const FINAL_H = 260;

// Timing. The card from the Lair holds, then fades; the roll runs at 2.4 px a
// frame (72 px/s, at the slow end of film credits); the final card holds and everything fades out.
const CARD_OUT = { from: 26, to: 52 };
const ROLL_IN = 50;
const SPEED = 2.4;
const ROLL_END = ROLL_IN + Math.ceil((1080 + TOTAL + 220) / SPEED);
const FINAL = { from: ROLL_END - 40, to: ROLL_END + 20 };
const HOLD = 150;
export const CREDITS_FRAMES = FINAL.to + HOLD + 40;

const CENTRE_GAP = 28;
const ROLE = { fontFamily: BODY, fontWeight: 300, fontSize: 32, color: C.lilac, letterSpacing: 0.5 } as const;
const NAME = { fontFamily: BODY, fontWeight: 500, fontSize: 38, color: C.cream } as const;

const BlockView: React.FC<{ b: Block }> = ({ b }) => {
  const h = height(b);
  const box: React.CSSProperties = { height: h, width: "100%", position: "relative" };
  switch (b.kind) {
    case "gap":
      return <div style={box} />;
    case "eyebrow":
      return <div style={{ ...box, textAlign: "center", fontFamily: BODY, fontWeight: 500, fontSize: 24, letterSpacing: "0.42em", color: C.lilac }}>{b.text}</div>;
    case "wordmark":
      return (
        <div style={{ ...box, display: "flex", justifyContent: "center", color: C.peach }}>
          <DyslexorLogo width={b.w} height={h} />
        </div>
      );
    case "title":
      return (
        <div style={{ ...box, textAlign: "center" }}>
          <div style={{ fontFamily: BODY, fontWeight: 500, fontSize: 24, letterSpacing: "0.36em", color: C.peach }}>{b.over}</div>
          <div style={{ fontFamily: BODY, fontWeight: 300, fontSize: 92, color: C.cream, marginTop: 14, letterSpacing: 1 }}>{b.text}</div>
        </div>
      );
    case "heading":
      return (
        <div style={{ ...box, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", paddingBottom: 34, boxSizing: "border-box" }}>
          <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 26, letterSpacing: "0.34em", color: C.peach }}>{b.text}</div>
          <div style={{ width: 56, height: 2, background: C.peach, opacity: 0.6, marginTop: 14 }} />
          {b.sub && <div style={{ fontFamily: BODY, fontWeight: 300, fontStyle: "italic", fontSize: 24, color: C.lilac, marginTop: 14 }}>{b.sub}</div>}
        </div>
      );
    case "pair":
      return (
        <div style={{ ...box, display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: CENTRE_GAP * 2 }}>
          <div style={{ ...ROLE, textAlign: "right", lineHeight: `${PAIR_LINE}px` }}>{b.role}</div>
          <div>
            {b.names.map((n) => (
              <div key={n} style={{ ...NAME, lineHeight: `${PAIR_LINE}px` }}>
                {n}
              </div>
            ))}
          </div>
        </div>
      );
    case "columns": {
      const half = Math.ceil(b.names.length / 2);
      const col = (names: string[], align: "right" | "left") => (
        <div>
          {names.map((n) => (
            <div key={n} style={{ ...NAME, fontWeight: 300, fontSize: 36, textAlign: align, lineHeight: "62px" }}>
              {n}
            </div>
          ))}
        </div>
      );
      return (
        <div style={{ ...box, display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: CENTRE_GAP * 2 }}>
          {col(b.names.slice(0, half), "right")}
          {col(b.names.slice(half), "left")}
        </div>
      );
    }
    case "track":
      return (
        <div style={{ ...box, textAlign: "center" }}>
          <div style={{ ...NAME, fontWeight: 500 }}>“{b.title}”</div>
          <div style={{ ...ROLE, marginTop: 6 }}>by {b.by}</div>
          {b.note && <div style={{ fontFamily: BODY, fontWeight: 300, fontSize: 22, color: C.cream, opacity: 0.55, marginTop: 8 }}>{b.note}</div>}
        </div>
      );
    case "logos":
      return (
        <div style={{ ...box, display: "flex", justifyContent: "center", alignItems: "center", gap: 56 }}>
          {/* Both logos carry their own backgrounds, so they sit on cards */}
          {["logos/emeris.svg", "logos/kensioHouse.svg"].map((src) => (
            <div key={src} style={{ background: C.cream, padding: "18px 30px", borderRadius: 14 }}>
              <Img src={staticFile(src)} style={{ height: 84, display: "block" }} />
            </div>
          ))}
        </div>
      );
    case "powered":
      return (
        <div style={{ ...box, display: "flex", justifyContent: "center", alignItems: "center", gap: 80 }}>
          {/* One colour, like the rest of the roll */}
          {["logos/supabase.svg", "logos/cloudfare.svg"].map((src) => (
            <Img key={src} src={staticFile(src)} style={{ height: 56, filter: "brightness(0) invert(1)", opacity: 0.85 }} />
          ))}
          <span style={{ fontFamily: BODY, fontWeight: 500, fontSize: 40, color: C.cream, opacity: 0.85 }}>Google Cloud</span>
        </div>
      );
    case "para":
      return (
        <div style={{ ...box, textAlign: "center" }}>
          {b.lines.map((l, i) => (
            <div key={i} style={{ fontFamily: BODY, fontWeight: 300, fontSize: b.size ?? 30, lineHeight: 1.55, color: C.cream, opacity: b.dim ? 0.6 : 1, minHeight: (b.size ?? 30) * 1.55 }}>
              {l}
            </div>
          ))}
        </div>
      );
  }
};

// A few of the stolen letters, drifting up very faintly behind the roll.
const Drift: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill>
    {Array.from({ length: 26 }, (_, i) => {
      const x = random(`cx${i}`) * 1920;
      const speed = 0.25 + random(`cs${i}`) * 0.35;
      const y = 1180 - ((f * speed + random(`cy${i}`) * 1300) % 1300);
      return (
        <div
          key={i}
          style={{ position: "absolute", left: x, top: y, fontFamily: BODY, fontWeight: 700, fontSize: 28 + random(`cz${i}`) * 40, color: C.lilac, opacity: 0.05 + random(`co${i}`) * 0.05, transform: `rotate(${(random(`cr${i}`) - 0.5) * 40}deg)` }}
        >
          {String.fromCharCode(65 + Math.floor(random(`cl${i}`) * 26))}
        </div>
      );
    })}
  </AbsoluteFill>
);

export const Credits: React.FC = () => {
  const f = useCurrentFrame();
  const card = interpolate(f, [CARD_OUT.from, CARD_OUT.to], [1, 0], clamp);
  const y = Math.round(1080 - Math.max(0, f - ROLL_IN) * SPEED);
  const final = interpolate(f, [FINAL.from, FINAL.to], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const out = interpolate(f, [CREDITS_FRAMES - 40, CREDITS_FRAMES], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: C.ink, overflow: "hidden" }}>
      <AbsoluteFill style={{ opacity: out }}>
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 55% at 50% 110%, #2a144599, transparent 70%)" }} />
        <Drift f={f} />
        {/* The roll; soft edges top and bottom so lines fade in and out */}
        {f < ROLL_END + 10 && (
          <AbsoluteFill style={{ WebkitMaskImage: "linear-gradient(transparent 0%, #000 14%, #000 86%, transparent 100%)", maskImage: "linear-gradient(transparent 0%, #000 14%, #000 86%, transparent 100%)" }}>
            <div style={{ position: "absolute", left: 360, width: 1200, top: y }}>
              {ROLL.map((b, i) => (
                <BlockView key={i} b={b} />
              ))}
            </div>
          </AbsoluteFill>
        )}
        {/* The last card */}
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: final }}>
          <div style={{ height: FINAL_H, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 26, transform: `translateY(${(1 - final) * 20}px)` }}>
            <DyslexorLogo width={420} height={97} style={{ color: C.peach }} />
            <div style={{ fontFamily: BODY, fontWeight: 300, fontSize: 30, letterSpacing: "0.2em", color: C.cream, opacity: 0.8 }}>dyslexor.com</div>
          </div>
        </AbsoluteFill>
        {/* "To be continued..." from the Lair, fading as the roll comes in */}
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: card, backgroundColor: "#000" }}>
          <div style={{ fontFamily: BODY, fontStyle: "italic", fontWeight: 500, fontSize: 64, color: C.cream, letterSpacing: 2 }}>To be continued...</div>
        </AbsoluteFill>
      </AbsoluteFill>
      <CreditsSound />
    </AbsoluteFill>
  );
};

// The villain's track carries on from the Lair (which plays its first
// LAIR_FRAMES); it runs out partway, so a second pass of it fades in under the
// end of the first, and the whole thing fades with the picture.
const TRACK = Math.floor(74.6 * 30);
export const CREDITS_MUSIC_FROM = 900; // = LAIR_FRAMES, kept literal to avoid an import loop
const FIRST = TRACK - CREDITS_MUSIC_FROM;
const XFADE = 90;
const LEVEL = 0.32;
const CreditsSound: React.FC = () => (
  <>
    <Sequence durationInFrames={FIRST} name="♪ evil background (cont.)">
      <Audio src={staticFile("music/evilbackgroundnoise.mp3")} trimBefore={CREDITS_MUSIC_FROM} volume={(t) => interpolate(t, [0, FIRST - XFADE, FIRST], [LEVEL, LEVEL, 0], clamp)} />
    </Sequence>
    <Sequence from={FIRST - XFADE} durationInFrames={CREDITS_FRAMES - (FIRST - XFADE)} name="♪ evil background (again)">
      <Audio
        src={staticFile("music/evilbackgroundnoise.mp3")}
        volume={(t) => interpolate(t, [0, XFADE, CREDITS_FRAMES - (FIRST - XFADE) - 90, CREDITS_FRAMES - (FIRST - XFADE)], [0, LEVEL, LEVEL, 0], clamp)}
      />
    </Sequence>
  </>
);
