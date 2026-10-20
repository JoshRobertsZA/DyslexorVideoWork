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
import { Trial, TRIAL_FRAMES } from "./hero/Trial";
import { Strike, STRIKE_FRAMES } from "./hero/Strike";
import { Tower, TOWER_FRAMES } from "./hero/Tower";
import { Home, HOME_FRAMES } from "./hero/Home";
import { Lair, LAIR_FRAMES } from "./hero/Lair";
import { Credits, CREDITS_FRAMES } from "./hero/Credits";

export const Root: React.FC = () => (
  <>
    <Composition id="DyslexorOutro" component={Outro} durationInFrames={OUTRO_DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="RowanVoyage" component={LoreOutro} durationInFrames={LORE_DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="IntoTheRealm-1" component={IntoTheRealm} durationInFrames={INTO_THE_REALM_DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
    {/* Act 3 on its own, for working on it while IntoTheRealm is prologue-only. */}
    <Composition id="RealmArrival-2" component={Arrival} durationInFrames={ARRIVAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="RealmVillage-3" component={Village} durationInFrames={VILLAGE_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
    {/* The pilot's game: the first trial, and light. */}
    <Composition id="RealmTrial-4" component={Trial} durationInFrames={TRIAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
    {/* The pilot's ending: the Wizard and his apprentice. */}
    <Composition id="RealmLair-5" component={Lair} durationInFrames={LAIR_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
    {/* The pilot's end credits. */}
    <Composition id="RealmCredits-6" component={Credits} durationInFrames={CREDITS_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
    {/* Built for later episodes (docs/SEASON-1.md). */}
    <Composition id="Ep2-Taken" component={Strike} durationInFrames={STRIKE_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="Ep5-Tower" component={Tower} durationInFrames={TOWER_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="Ep6-Home" component={Home} durationInFrames={HOME_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
    {/* The Village in HD-2D: the realm's 3D world with a flying camera. */}
    {/* Chapter 2 · First Words. */}
    {/* The stats layer and Dyslexi, all in one run, for review. */}
  </>
);
