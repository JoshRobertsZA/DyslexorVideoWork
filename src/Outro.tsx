import React from "react";
import { AbsoluteFill, interpolate, Sequence, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { RealmSunset, REALM_SUNSET_DURATION } from "./scenes/RealmSunset";
import { ComicTitle, COMIC_TITLE_DURATION, TITLE_LAST_LETTER } from "./scenes/ComicTitle";
import { Cast, CAST_DURATION, WIPE } from "./scenes/Cast";
import { Featuring, FEATURING_DURATION } from "./scenes/Featuring";
import { Crawl, CRAWL_DURATION } from "./scenes/Crawl";
import { WillReturn, WILL_RETURN_DURATION } from "./scenes/WillReturn";
import { CHEST_OPEN, Stinger, STINGER_DURATION } from "./scenes/Stinger";

// Scene start frames. The cast cards slash in over the end of the title.
const S1 = 0;
const S2 = S1 + REALM_SUNSET_DURATION;
const S3 = S2 + COMIC_TITLE_DURATION - WIPE;
const S4 = S3 + CAST_DURATION;
const S5 = S4 + FEATURING_DURATION;
const S6 = S5 + CRAWL_DURATION;
const S7 = S6 + WILL_RETURN_DURATION;
export const OUTRO_DURATION = S7 + STINGER_DURATION;

export const Outro: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <Sequence from={S1} durationInFrames={REALM_SUNSET_DURATION} name="1 · Sunset in the realm">
      <RealmSunset />
    </Sequence>
    <Sequence from={S2} durationInFrames={COMIC_TITLE_DURATION} name="2 · Comic flip + title">
      <ComicTitle />
    </Sequence>
    <Sequence from={S3} durationInFrames={CAST_DURATION} name="3 · Starring">
      <Cast />
    </Sequence>
    <Sequence from={S4} durationInFrames={FEATURING_DURATION} name="4 · Featuring">
      <Featuring />
    </Sequence>
    <Sequence from={S5} durationInFrames={CRAWL_DURATION} name="5 · Credits crawl">
      <Crawl />
    </Sequence>
    <Sequence from={S6} durationInFrames={WILL_RETURN_DURATION} name="6 · Will return">
      <WillReturn />
    </Sequence>
    <Sequence from={S7} durationInFrames={STINGER_DURATION} name="7 · Post-credits scene">
      <Stinger />
    </Sequence>

    {/* Realm theme under everything up to the "will return" card, which sits in silence */}
    <Sequence from={0} durationInFrames={S6} name="♪ realm theme">
      <Audio
        src={staticFile("music/background-music.mp3")}
        volume={(f) => interpolate(f, [0, 30, S6 - 50, S6], [0, 0.6, 0.6, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
      />
    </Sequence>
    <Sequence from={S2 + TITLE_LAST_LETTER} durationInFrames={120} name="♪ title hit">
      <Audio src={staticFile("music/levelup-sound.mp3")} volume={0.8} />
    </Sequence>
    <Sequence from={S7} durationInFrames={STINGER_DURATION} name="♪ night theme">
      <Audio
        src={staticFile("music/rebirth-background-music.mp3")}
        volume={(f) => interpolate(f, [0, 40, 320, 332, STINGER_DURATION - 15, STINGER_DURATION], [0, 0.35, 0.35, 0.5, 0.5, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
      />
    </Sequence>
    <Sequence from={S7 + CHEST_OPEN} durationInFrames={120} name="♪ chest opens">
      <Audio src={staticFile("music/levelup-sound.mp3")} volume={0.9} />
    </Sequence>
  </AbsoluteFill>
);
