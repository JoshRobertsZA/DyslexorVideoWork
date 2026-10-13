import React from "react";
import { Composition } from "remotion";
import { Outro, OUTRO_DURATION } from "./Outro";
import { LoreOutro, LORE_DURATION } from "./lore/LoreOutro";
import { StarWarsWithMusic, STAR_WARS_DURATION } from "./starwars/StarWarsCredits";
import { FPS, HEIGHT, WIDTH } from "./theme";
import { IntoTheRealm, INTO_THE_REALM_DURATION } from "./hero/IntoTheRealm";

export const Root: React.FC = () => (
  <>
    <Composition id="DyslexorOutro" component={Outro} durationInFrames={OUTRO_DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="RowanVoyage" component={LoreOutro} durationInFrames={LORE_DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="StarWarsCredits" component={StarWarsWithMusic} durationInFrames={STAR_WARS_DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="IntoTheRealm" component={IntoTheRealm} durationInFrames={INTO_THE_REALM_DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
  </>
);
