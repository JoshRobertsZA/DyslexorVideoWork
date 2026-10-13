import React from "react";
import { Composition } from "remotion";
import { Outro, OUTRO_DURATION } from "./Outro";
import { LoreOutro, LORE_DURATION } from "./lore/LoreOutro";
import { StarWarsWithMusic, STAR_WARS_DURATION } from "./starwars/StarWarsCredits";
import { FPS, HEIGHT, WIDTH } from "./theme";
import { IntoTheRealm, INTO_THE_REALM_DURATION } from "./hero/IntoTheRealm";
import { Arrival } from "./hero/Arrival";
import { ARRIVAL_FRAMES, VILLAGE_FRAMES } from "./hero/config";
import { Village } from "./hero/Village";
import { HudDemo, HUD_DEMO_FRAMES } from "./hero/hud/HudDemo";
import { Village3D, VILLAGE_3D_FRAMES } from "./hero/Village3D";
import { FirstWords, FIRST_WORDS_FRAMES } from "./hero/FirstWords";

export const Root: React.FC = () => (
  <>
    <Composition id="DyslexorOutro" component={Outro} durationInFrames={OUTRO_DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="RowanVoyage" component={LoreOutro} durationInFrames={LORE_DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="StarWarsCredits" component={StarWarsWithMusic} durationInFrames={STAR_WARS_DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="IntoTheRealm" component={IntoTheRealm} durationInFrames={INTO_THE_REALM_DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
    {/* Act 3 on its own, for working on it while IntoTheRealm is prologue-only. */}
    <Composition id="RealmArrival" component={Arrival} durationInFrames={ARRIVAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="RealmVillage" component={Village} durationInFrames={VILLAGE_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
    {/* The Village in HD-2D: the realm's 3D world with a flying camera. */}
    <Composition id="Village3D" component={Village3D} durationInFrames={VILLAGE_3D_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
    {/* Chapter 2 · First Words. */}
    <Composition id="FirstWords" component={FirstWords} durationInFrames={FIRST_WORDS_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
    {/* The stats layer and Dyslexi, all in one run, for review. */}
    <Composition id="HudDemo" component={HudDemo} durationInFrames={HUD_DEMO_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
  </>
);
