import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, staticFile } from "remotion";
import { BODY, C, PIXEL } from "../../theme";
import { ACCENT, HERO_NAME } from "../config";
import { HeroSprite } from "../parts";

// Hero's stats layer: the realm seen through a game interface, Sword Art
// Online-style. A boot-up when she first opens her eyes, a HUD that follows
// her (name, level, XP, health in fights, words restored), pop-ups for XP,
// badges, skills and quests, and a full stats screen for big moments.
//
// Everything is driven by `t`, frames since that piece started, so a scene
// places them wherever it likes.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export type Stats = {
  level: number;
  xp: number;
  xpMax: number;
  words: number;
  wordsMax: number;
  // Health only shows in fights.
  hp?: number;
  hpMax?: number;
};

// The interface's look: dark glass, a mint rim, the realm's pixel type.
export const GLASS = "rgba(10, 8, 22, 0.78)";
export const RIM = ACCENT.mint;
const HP_RED = "#ff5a6e";

export const Panel: React.FC<{ style: React.CSSProperties; children: React.ReactNode }> = ({ style, children }) => (
  <div
    style={{
      position: "absolute",
      background: GLASS,
      border: `3px solid ${RIM}`,
      boxShadow: `0 0 18px ${RIM}55, inset 0 0 24px ${RIM}22`,
      fontFamily: PIXEL,
      color: C.cream,
      ...style,
    }}
  >
    {/* Corner ticks */}
    {[
      { left: -9, top: -9 },
      { right: -9, top: -9 },
      { left: -9, bottom: -9 },
      { right: -9, bottom: -9 },
    ].map((p, i) => (
      <div key={i} style={{ position: "absolute", width: 12, height: 12, background: RIM, ...p }} />
    ))}
    {children}
  </div>
);

// A bar in whole pixel blocks, like the realm's own UI.
const Bar: React.FC<{ value: number; max: number; width: number; color: string; height?: number }> = ({ value, max, width, color, height = 14 }) => {
  const block = 10;
  const n = Math.floor(width / block);
  const on = Math.round((Math.max(0, Math.min(value, max)) / max) * n);
  return (
    <div style={{ display: "flex", gap: 2, width, height, padding: 2, background: "rgba(0,0,0,0.5)", border: "2px solid rgba(255,255,255,0.25)" }}>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} style={{ flex: 1, background: i < on ? color : "rgba(255,255,255,0.06)", boxShadow: i < on ? `0 0 6px ${color}88` : undefined }} />
      ))}
    </div>
  );
};

const fmt = (n: number) => Math.round(n).toLocaleString("en-GB");

// Where Hero starts: Chapter 1, before her first game.
export const START_STATS: Stats = { level: 1, xp: 0, xpMax: 100, words: 0, wordsMax: 5000 };

// ---- The HUD ------------------------------------------------------------------

// Top-left: name, level, XP and (in fights) health. Top-right: words restored.
// `appear` 0..1 slides it in.
export const Hud: React.FC<{ stats: Stats; appear?: number; glitch?: number; t?: number }> = ({ stats, appear = 1, glitch = 0, t = 0 }) => {
  const off = (1 - appear) * -40;
  const jitter = glitch > 0 && random(`hud-g${Math.floor(t / 2)}`) < glitch ? (random(`hud-x${t}`) - 0.5) * 30 : 0;
  const tint = glitch > 0 && Math.floor(t / 3) % 2 === 0 ? `hue-rotate(${glitch * 140}deg) saturate(${1 + glitch})` : undefined;
  const fights = stats.hp !== undefined && stats.hpMax !== undefined;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: appear, filter: tint, transform: `translateX(${jitter}px)` }}>
      <Panel style={{ left: 40, top: 36 + off, width: 430, padding: "18px 20px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontSize: 24, letterSpacing: 2 }}>{HERO_NAME.toUpperCase()}</div>
          <div style={{ fontSize: 20, color: C.gold }}>Lv {stats.level}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
          <div style={{ fontSize: 13, width: 26, color: C.gold }}>XP</div>
          <Bar value={stats.xp} max={stats.xpMax} width={300} color={C.gold} />
        </div>
        <div style={{ fontSize: 11, color: C.lilac, marginTop: 6, marginLeft: 38 }}>
          {fmt(stats.xp)} / {fmt(stats.xpMax)}
        </div>
        {fights && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
            <div style={{ fontSize: 13, width: 26, color: HP_RED }}>HP</div>
            <Bar value={stats.hp!} max={stats.hpMax!} width={300} color={HP_RED} />
          </div>
        )}
      </Panel>
      <Panel style={{ right: 40, top: 36 + off, padding: "16px 20px" }}>
        <div style={{ fontSize: 11, color: C.lilac, letterSpacing: 2 }}>WORDS RESTORED</div>
        <div style={{ fontSize: 22, marginTop: 10 }}>
          <span style={{ color: C.gold }}>{fmt(stats.words)}</span>
          <span style={{ color: C.lilac }}> / {fmt(stats.wordsMax)}</span>
        </div>
      </Panel>
    </AbsoluteFill>
  );
};

// ---- Boot-up ----------------------------------------------------------------

// Paced to be read: each line types out slowly and sits before the next.
export const BOOT_FRAMES = 160;
export const BOOT_WELCOMED = 82; // "Welcome, ..." has finished typing

// The system finds her: mint lines draw a frame, a scan sweeps her view and
// it greets her by name, then the readout fades.
export const HudBoot: React.FC<{ t: number; stats: Stats }> = ({ t, stats }) => {
  if (t < 0 || t > BOOT_FRAMES + 20) return null;
  const draw = interpolate(t, [0, 22], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const out = interpolate(t, [BOOT_FRAMES - 16, BOOT_FRAMES], [1, 0], clamp);
  const type = (from: number, text: string) => text.slice(0, Math.max(0, Math.floor((t - from) * 0.8)));
  const scan = interpolate(t, [4, 40], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: out }}>
      {/* A scan line sweeping the view */}
      <div style={{ position: "absolute", left: 0, right: 0, top: `${scan * 100}%`, height: 3, background: RIM, boxShadow: `0 0 24px 6px ${RIM}`, opacity: scan < 1 ? 0.8 : 0 }} />
      {/* The frame drawing itself in from the corners */}
      {[
        { left: 60, top: 60, width: 800 * draw, height: 3 },
        { right: 60, bottom: 60, width: 800 * draw, height: 3 },
        { left: 60, top: 60, width: 3, height: 400 * draw },
        { right: 60, bottom: 60, width: 3, height: 400 * draw },
      ].map((s, i) => (
        <div key={i} style={{ position: "absolute", background: RIM, boxShadow: `0 0 12px ${RIM}`, ...s }} />
      ))}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 26 }}>
        <div style={{ fontFamily: PIXEL, fontSize: 22, color: RIM, letterSpacing: 6, textShadow: `0 0 16px ${RIM}` }}>{type(22, "READER DETECTED")}</div>
        <div style={{ fontFamily: PIXEL, fontSize: 52, color: C.cream, textShadow: "6px 6px 0 #000" }}>{type(62, `Welcome, ${HERO_NAME}`)}</div>
        <div style={{ fontFamily: PIXEL, fontSize: 22, color: C.gold, textShadow: "4px 4px 0 #000" }}>
          {type(100, `Lv ${stats.level}  ·  ${fmt(stats.xp)} XP`)}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---- Pop-ups --------------------------------------------------------------------

export type PopupKind = "xp" | "badge" | "skill" | "quest";
export type Popup = { at: number; kind: PopupKind; title: string; sub?: string; badge?: string; dur?: number };

const KIND_LABEL: Record<PopupKind, string> = { xp: "", badge: "BADGE EARNED", skill: "NEW SKILL", quest: "QUEST" };

// Slides in from the right under the words counter; several stack downwards.
export const HudPopup: React.FC<{ t: number; p: Popup; slot?: number }> = ({ t, p, slot = 0 }) => {
  const dur = p.dur ?? 90;
  if (t < 0 || t > dur) return null;
  const inK = interpolate(t, [0, 10], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
  const outK = interpolate(t, [dur - 12, dur], [1, 0], clamp);
  const x = (1 - inK) * 520 + (1 - outK) * 520;
  const big = p.kind !== "xp";
  return (
    <Panel style={{ right: 40 - x + 0, top: 150 + slot * 120, padding: big ? "14px 22px 14px 14px" : "12px 20px", display: "flex", alignItems: "center", gap: 16, opacity: outK }}>
      {p.badge && <Img src={staticFile(`badges/${p.badge}.svg`)} style={{ width: 76, height: 76, filter: `drop-shadow(0 0 10px ${C.gold})` }} />}
      {p.kind === "skill" && !p.badge && (
        <div style={{ width: 56, height: 56, border: `3px solid ${C.gold}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, color: C.gold }}>✦</div>
      )}
      <div>
        {KIND_LABEL[p.kind] && <div style={{ fontSize: 11, color: RIM, letterSpacing: 2, marginBottom: 8 }}>{KIND_LABEL[p.kind]}</div>}
        <div style={{ fontSize: big ? 20 : 22, color: C.gold }}>{p.title}</div>
        {p.sub && <div style={{ fontSize: 12, color: C.lilac, marginTop: 8 }}>{p.sub}</div>}
      </div>
    </Panel>
  );
};

// LEVEL UP: a burst across the middle of the view.
export const LEVEL_UP_FRAMES = 70;
export const LevelUp: React.FC<{ t: number; level: number }> = ({ t, level }) => {
  if (t < 0 || t > LEVEL_UP_FRAMES) return null;
  const pop = interpolate(t, [0, 8, 14], [0.4, 1.15, 1], clamp);
  const out = interpolate(t, [LEVEL_UP_FRAMES - 14, LEVEL_UP_FRAMES], [1, 0], clamp);
  const ring = interpolate(t, [0, 30], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  return (
    <AbsoluteFill style={{ pointerEvents: "none", justifyContent: "center", alignItems: "center", opacity: out }}>
      <div
        style={{
          position: "absolute",
          width: 900 * ring,
          height: 900 * ring,
          borderRadius: "50%",
          border: `${10 * (1 - ring) + 2}px solid ${C.gold}`,
          opacity: 1 - ring,
        }}
      />
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 8,
              height: 160 * ring,
              background: `linear-gradient(${C.gold}, transparent)`,
              transform: `rotate(${a}rad) translateY(${-140 - 200 * ring}px)`,
              opacity: 1 - ring,
            }}
          />
        );
      })}
      <div style={{ transform: `scale(${pop})`, textAlign: "center" }}>
        <div style={{ fontFamily: PIXEL, fontSize: 84, color: C.gold, textShadow: `8px 8px 0 #000, 0 0 40px ${C.gold}` }}>LEVEL UP!</div>
        <div style={{ fontFamily: PIXEL, fontSize: 30, color: C.cream, marginTop: 22, textShadow: "4px 4px 0 #000" }}>Lv {level}</div>
      </div>
    </AbsoluteFill>
  );
};

// ---- The stats screen -------------------------------------------------------------

export const STATS_OPEN = 12;

// A part of the stats screen to point at while it's being explained: it
// glows gold and everything else dims.
export type StatsFocus = "hero" | "xp" | "words";
// A label popping beside the level ("LEVEL UP!") or the words count ("+1
// WORD"), `k` 0..1 for how far it's in.
export type StatsPop = { on: "xp" | "words"; text: string; k: number };

// Drawn like the realm's dialogue box (cream border, black outline, solid
// plum) so the two read as one interface, with every word in Lexend and big
// enough to read at a glance.
const CARD = "linear-gradient(#24152f, #170d22)";
// The panel's size, so a scene can sit things on its edges.
export const STATS_PANEL = { w: 1240, h: 540 };
const WELL = "#0b0712";

const PopTag: React.FC<{ pop?: StatsPop; on: StatsPop["on"] }> = ({ pop, on }) =>
  pop && pop.on === on && pop.k > 0 ? (
    <div
      style={{
        fontFamily: BODY,
        fontWeight: 700,
        fontSize: 28,
        color: C.ink,
        background: C.gold,
        padding: "6px 16px",
        border: "4px solid #000",
        borderRadius: 10,
        boxShadow: `0 0 26px ${C.gold}`,
        opacity: pop.k,
        transform: `scale(${0.6 + 0.4 * pop.k}) rotate(-4deg)`,
        whiteSpace: "nowrap",
      }}
    >
      {pop.text}
    </div>
  ) : null;

// A chunky rounded bar with tick marks every tenth, like a game's health bar.
const FatBar: React.FC<{ value: number; max: number; color: string; light: string }> = ({ value, max, color, light }) => {
  const k = Math.max(0, Math.min(1, value / max));
  return (
    <div style={{ position: "relative", height: 34, borderRadius: 17, background: WELL, border: "4px solid #000", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: `${k * 100}%`,
          borderRadius: 13,
          background: `linear-gradient(${light}, ${color} 60%)`,
          boxShadow: k > 0 ? `0 0 16px ${color}` : undefined,
        }}
      />
      {Array.from({ length: 9 }, (_, i) => (
        <div key={i} style={{ position: "absolute", left: `${(i + 1) * 10}%`, top: 6, bottom: 6, width: 3, background: "rgba(255,255,255,0.08)" }} />
      ))}
    </div>
  );
};

// A round or square icon chip at the start of a row.
const Chip: React.FC<{ color: string; round?: boolean; children: React.ReactNode }> = ({ color, round, children }) => (
  <div
    style={{
      width: 64,
      height: 64,
      flexShrink: 0,
      borderRadius: round ? 32 : 14,
      background: color,
      border: "4px solid #000",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: BODY,
      fontWeight: 700,
      fontSize: 26,
      color: C.ink,
    }}
  >
    {children}
  </div>
);

// A gold arrow pulsing at the left of the row being explained.
const Pointer: React.FC<{ t: number }> = ({ t }) => (
  <div
    style={{
      position: "absolute",
      left: -40,
      top: "50%",
      width: 0,
      height: 0,
      borderTop: "16px solid transparent",
      borderBottom: "16px solid transparent",
      borderLeft: `22px solid ${C.gold}`,
      filter: `drop-shadow(0 0 8px ${C.gold})`,
      transform: `translate(${Math.sin(t / 4) * 6}px, -50%)`,
    }}
  />
);

// Opened at big moments: a menu that snaps open from a line. `offsetY` moves
// the panel (not the dimmed backdrop) up or down the frame.
export const StatsScreen: React.FC<{
  t: number;
  dur: number;
  stats: Stats;
  badges: string[];
  locked?: string[];
  skills: string[];
  focus?: StatsFocus;
  pop?: StatsPop;
  offsetY?: number;
}> = ({
  t,
  dur,
  stats,
  badges,
  locked = [],
  skills,
  focus,
  pop,
  offsetY = 0,
}) => {
  if (t < 0 || t > dur) return null;
  const open = Math.min(interpolate(t, [0, STATS_OPEN], [0.02, 1], { ...clamp, easing: Easing.out(Easing.back(1.2)) }), interpolate(t, [dur - 10, dur], [1, 0.02], clamp));
  const content = interpolate(t, [STATS_OPEN - 2, STATS_OPEN + 8, dur - 12, dur - 8], [0, 1, 1, 0], clamp);
  const lit = (part: StatsFocus | "other"): React.CSSProperties =>
    !focus
      ? {}
      : part === focus
        ? { background: "rgba(246,201,69,0.10)", boxShadow: `0 0 0 4px ${C.gold}, 0 0 34px ${C.gold}55` }
        : { opacity: 0.4 };
  const realSkills = skills.filter((s) => s !== "None yet");
  const allBadges = [...badges, ...locked];
  const label: React.CSSProperties = { fontFamily: BODY, fontWeight: 700, fontSize: 34, color: C.cream };
  const count: React.CSSProperties = { fontFamily: BODY, fontWeight: 500, fontSize: 26, color: C.lilac, marginLeft: "auto" };
  const row: React.CSSProperties = { borderRadius: 18, padding: "14px 20px" };
  return (
    <AbsoluteFill style={{ pointerEvents: "none", justifyContent: "center", alignItems: "center" }}>
      <AbsoluteFill style={{ background: "rgba(5,4,12,0.5)", opacity: open }} />
      <div
        style={{
          position: "relative",
          width: STATS_PANEL.w,
          height: STATS_PANEL.h,
          background: CARD,
          border: `6px solid ${C.cream}`,
          outline: "6px solid #000",
          borderRadius: 20,
          boxShadow: "14px 14px 0 rgba(0,0,0,0.5)",
          transform: `translateY(${offsetY}px) scaleY(${open})`,
        }}
      >
        {/* Title tab, like the dialogue box's speaker tag */}
        <div
          style={{
            position: "absolute",
            top: -34,
            left: "50%",
            transform: "translateX(-50%)",
            background: C.gold,
            border: "4px solid #000",
            borderRadius: 10,
            padding: "6px 30px",
            fontFamily: BODY,
            fontWeight: 700,
            fontSize: 30,
            letterSpacing: 4,
            color: C.ink,
            opacity: content,
          }}
        >
          STATUS
        </div>
        <div style={{ opacity: content, display: "flex", gap: 36, height: "100%", padding: "48px 44px 40px" }}>
          {/* Who she is */}
          <div style={{ ...row, width: 330, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, ...lit("hero") }}>
            <div
              style={{
                width: 290,
                height: 290,
                borderRadius: 20,
                border: "4px solid #000",
                background: `radial-gradient(circle at 50% 45%, #4a3470, #1d1230 75%)`,
                boxShadow: `inset 0 0 0 3px ${C.purple}`,
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div style={{ position: "absolute", left: 145 - 24.5 * 10, top: 160 - 32 * 10 }}>
                <HeroSprite row={0} scale={10} animFps={5} />
              </div>
            </div>
            <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 44, color: C.cream, lineHeight: 1 }}>{HERO_NAME}</div>
            <div style={{ fontFamily: BODY, fontWeight: 500, fontSize: 22, color: RIM, border: `3px solid ${RIM}`, borderRadius: 20, padding: "4px 18px" }}>Reader</div>
          </div>

          {/* What she's got */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 26 }}>
            <div style={{ ...row, position: "relative", ...lit("xp") }}>
              {focus === "xp" && <Pointer t={t} />}
              <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 12 }}>
                <Chip color={C.gold} round>
                  LV
                </Chip>
                <div style={label}>
                  Level <span style={{ color: C.gold }}>{stats.level}</span>
                </div>
                <PopTag pop={pop} on="xp" />
                <div style={count}>
                  {fmt(stats.xp)} / {fmt(stats.xpMax)} XP
                </div>
              </div>
              <FatBar value={stats.xp} max={stats.xpMax} color={C.gold} light="#fff1b0" />
            </div>

            <div style={{ ...row, position: "relative", ...lit("words") }}>
              {focus === "words" && <Pointer t={t} />}
              <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 12 }}>
                <Chip color={RIM}>Aa</Chip>
                <div style={label}>Words restored</div>
                <PopTag pop={pop} on="words" />
                <div style={count}>
                  {fmt(stats.words)} / {fmt(stats.wordsMax)}
                </div>
              </div>
              {/* Never shows less than a sliver once she has one, so a single word reads. */}
              <FatBar value={stats.words > 0 ? Math.max(stats.words, stats.wordsMax * 0.012) : 0} max={stats.wordsMax} color={RIM} light="#d6fff0" />
            </div>

            <div style={{ ...row, display: "flex", alignItems: "center", gap: 18, ...lit("other") }}>
              <div style={{ ...label, fontSize: 30 }}>Badges</div>
              <div style={{ display: "flex", gap: 12, marginLeft: 10 }}>
                {allBadges.map((b, i) => (
                  <Img
                    key={b}
                    src={staticFile(`badges/${b}.svg`)}
                    style={{ width: 70, height: 70, filter: i < badges.length ? `drop-shadow(0 0 8px ${C.gold}88)` : "grayscale(1) brightness(0.55)", opacity: i < badges.length ? 1 : 0.75 }}
                  />
                ))}
              </div>
              <div style={count}>
                {badges.length} / {allBadges.length}
              </div>
            </div>

            {realSkills.length > 0 && (
              <div style={{ ...row, display: "flex", alignItems: "center", gap: 14, ...lit("other") }}>
                <div style={{ ...label, fontSize: 30 }}>Skills</div>
                {realSkills.map((s) => (
                  <div key={s} style={{ fontFamily: BODY, fontWeight: 500, fontSize: 24, color: C.gold, border: `3px solid ${C.gold}`, borderRadius: 12, padding: "6px 16px" }}>
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
