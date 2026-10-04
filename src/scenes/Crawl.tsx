import React from "react";
import { AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { ROW, Sprite } from "../components/Sprite";
import { Grain } from "../components/Fx";
import { TEAM } from "../credits";
import { BODY, C, HEIGHT, PIXEL, TITLE, WIDTH } from "../theme";

// Scene 5: the classic end-credits crawl, with Dyslexi chasing a runaway
// letter along the bottom of the screen.
export const CRAWL_DURATION = 480;

const TOWNSFOLK: { name: string; role: string; sheet: string }[] = [
  { name: "Sushi", role: "The Student", sheet: "realm/character_female.png" },
  { name: "Dyslexi", role: "The Loyal Companion", sheet: "realm/dyslexi.png" },
  { name: "The Wizard", role: "Keeper of the Games", sheet: "realm/villager.png" },
  { name: "The Farmer", role: "Grower of Words", sheet: "realm/npc_farmer.png" },
  { name: "The Town Guard", role: "Keeper of the Peace", sheet: "realm/npc_town_guard.png" },
  { name: "The Merchant", role: "Trader of Tips", sheet: "realm/npc_merchant.png" },
  { name: "The Blacksmith", role: "Forger of Readers", sheet: "realm/npc_blacksmith.png" },
  { name: "The Fisherman", role: "Angler of Lost Letters", sheet: "realm/npc_fisherman.png" },
];

const Heading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: PIXEL, fontSize: 24, letterSpacing: 8, color: C.gold, marginTop: 130, marginBottom: 36 }}>{children}</div>
);

const Line: React.FC<{ children: React.ReactNode; size?: number; dim?: boolean }> = ({ children, size = 46, dim }) => (
  <div style={{ fontFamily: BODY, fontWeight: 500, fontSize: size, color: C.cream, opacity: dim ? 0.7 : 1, lineHeight: 1.45 }}>{children}</div>
);

const Logo: React.FC<{ src: string; h: number }> = ({ src, h }) => (
  <Img src={staticFile(src)} style={{ height: h, filter: "brightness(0) invert(1)", opacity: 0.9 }} />
);

const Stars: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      {Array.from({ length: 120 }, (_, i) => {
        const tw = 0.3 + 0.7 * Math.abs(Math.sin(frame / (20 + (i % 7) * 6) + i));
        const s = 1 + random(`star-s${i}`) * 2.5;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: random(`star-x${i}`) * WIDTH,
              top: random(`star-y${i}`) * HEIGHT,
              width: s,
              height: s,
              background: "#fff",
              opacity: tw * 0.6,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const Chase: React.FC = () => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [40, 440], [-200, WIDTH + 200]);
  const hop = Math.abs(Math.sin(frame / 5)) * 40;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x + 170,
          top: HEIGHT - 120 - hop,
          fontFamily: PIXEL,
          fontSize: 44,
          color: C.gold,
          textShadow: "4px 4px 0 #000",
          transform: `rotate(${frame * 12}deg)`,
        }}
      >
        b
      </div>
      <div style={{ position: "absolute", left: x - 72, top: HEIGHT - 190 }}>
        <Sprite src="realm/dyslexi.png" row={ROW.walkSide} scale={3} animFps={12} />
      </div>
    </>
  );
};

export const Crawl: React.FC = () => {
  const frame = useCurrentFrame();
  const p = frame / CRAWL_DURATION;
  const fade = interpolate(frame, [0, 15, CRAWL_DURATION - 20, CRAWL_DURATION], [0, 1, 1, 0]);

  return (
    <AbsoluteFill style={{ backgroundColor: C.ink, opacity: fade }}>
      <Stars />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 120%, rgba(91,58,117,0.55), transparent 60%)` }} />

      <div
        style={{
          position: "absolute",
          left: 0,
          width: WIDTH,
          top: 0,
          textAlign: "center",
          transform: `translateY(calc(${HEIGHT}px - ${p} * (100% + ${HEIGHT}px)))`,
        }}
      >
        <div style={{ fontFamily: TITLE, fontSize: 170, color: C.gold, lineHeight: 1, letterSpacing: 10 }}>DYSLEXOR</div>
        <Line size={40} dim>
          <i>Reading, reimagined.</i>
        </Line>

        <Heading>CREATED BY</Heading>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 80, width: 1500, margin: "0 auto" }}>
          {TEAM.map((name, i) => (
            <div key={name} style={{ textAlign: i % 2 ? "left" : "right", whiteSpace: "nowrap" }}>
              <Line>{name}</Line>
            </div>
          ))}
        </div>

        <Heading>CAST OF THE REALM</Heading>
        <div style={{ width: 1200, margin: "0 auto" }}>
          {TOWNSFOLK.map((c) => (
            <div key={c.name} style={{ display: "grid", gridTemplateColumns: "1fr 110px 1fr", alignItems: "center", height: 96 }}>
              <div style={{ textAlign: "right", fontFamily: BODY, fontWeight: 300, fontSize: 36, color: C.lilac }}>{c.role}</div>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <Sprite src={c.sheet} row={ROW.idleDown} scale={2.2} animFps={5} />
              </div>
              <div style={{ textAlign: "left" }}>
                <Line size={42}>{c.name}</Line>
              </div>
            </div>
          ))}
        </div>

        <Heading>TRAINING GAMES</Heading>
        <Line>Rhyme Time · Spelling Sprint · Word Match</Line>

        <Heading>REALM ART</Heading>
        <Line>“Mystic Woods” by Game Endeavor</Line>

        <Heading>TYPEFACES</Heading>
        <Line>Lexend · OpenDyslexic · Atkinson Hyperlegible</Line>

        <Heading>BUILT WITH</Heading>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 90 }}>
          <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: 52, color: C.cream }}>Next.js</span>
          <Logo src="logos/supabase.svg" h={60} />
          <Logo src="logos/cloudfare.svg" h={60} />
          <Logo src="logos/github_logo_icon_229278.svg" h={70} />
        </div>

        <Heading>WITH THANKS TO</Heading>
        {/* These two logos carry their own backgrounds, so they sit on cards un-inverted */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 60 }}>
          {["logos/emeris.svg", "logos/kensioHouse.svg"].map((src) => (
            <div key={src} style={{ background: C.cream, padding: "22px 36px", borderRadius: 18 }}>
              <Img src={staticFile(src)} style={{ height: 90, display: "block" }} />
            </div>
          ))}
        </div>

        <div style={{ height: 160 }} />
        <div style={{ width: 1000, margin: "0 auto", fontFamily: BODY, fontWeight: 300, fontSize: 26, color: C.cream, opacity: 0.55, lineHeight: 1.6 }}>
          No words were misspelled in the making of this presentation.
          <br />
          (Okay, one. The spellchecker caught it.)
          <br />
          <br />
          No cats were harmed during production. Dyslexi did, however, demand extra treats.
        </div>
        <div style={{ height: 120 }} />
        <div style={{ fontFamily: PIXEL, fontSize: 18, color: C.cream, opacity: 0.5 }}>© 2026 DYSLEXOR (PTY) LTD.</div>
        <div style={{ height: 200 }} />
      </div>

      <Chase />
      <Grain />
    </AbsoluteFill>
  );
};
