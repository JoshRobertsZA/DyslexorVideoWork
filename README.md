# Dyslexor outro

End credits + post-credits scene for the Dyslexor presentation (Remotion, 1920x1080, 30fps, ~71s).

```
npm run dev      # opens Remotion Studio on http://localhost:3000
```

## Exporting the MP4

Windows Smart App Control on this machine blocks Remotion's bundled `ffmpeg.exe`,
so `npm run render` fails. Export from Studio instead:
**Render ▾ → Client-side render**, which encodes in the browser.

## Scenes

| # | Scene | What happens |
|---|-------|--------------|
| 1 | Sunset in the realm | Sushi + Dyslexi walk the village at dusk, cartoon iris-out |
| 2 | Comic flip + title | Marvel-style accelerating page flips into the DYSLEXOR slam |
| 3 | Starring | Character cards slash in one after another |
| 4 | Featuring | Comic grid of the app's real screen clips |
| 5 | Credits crawl | Team, cast, tech, thanks, with Dyslexi chasing a letter |
| 6 | Will return | "DYSLEXOR WILL RETURN", in silence |
| 7 | Post-credits | Night: Dyslexi opens the chest, out fly + − × ÷, Dyslexor Maths tease |

Names, cast lines and feature clips are in `src/credits.ts`.

## RowanVoyage (lore outro, `src/lore/`)

A second, story-driven version (~68s). Both compositions show in the Studio sidebar.

| # | Scene | What happens |
|---|-------|--------------|
| 1 | Prologue | "Every realm has a keeper. Ours was Elder Rowan." |
| 2 | Farewell | Golden hour at the shore; Rowan says goodbye to the village, boards the boat with the princess |
| 3 | The voyage | Camera pulls back as the realm island shrinks behind them; sunset to moonlight; credits over the sea |
| 4 | Isle of Numbers | Fog parts at dawn on a new island; four standing stones wake with + − × ÷ |
| 5 | The map | Parchment map inks the route between islands; "To be continued…" |

The princess is stacked from the avatar layers in `public/realm/princess/` (skin, hair, outfit, crown).

## IntoTheRealm (`src/hero/`)

Hero hears a chime behind a door, walks through it and wakes up 8-bit in the
Training Realm (2:45). The real-world half is AI live action (prompts and the
model choice are in `docs/AI-SHOTS.md`); everything after the portal is drawn in
Remotion. Hero's look, the footage slots and every act length are in
`src/hero/config.ts`.

| # | Act | What happens |
|---|-----|--------------|
| 1 | Real world (AI) | Title, Hero with friends, a chime, the corridor, mint light under the door |
| 2 | Portal (AI + FX) | The door opens, the portal is composited in, she hesitates and steps through |
| 3 | Arrival (POV) | Eyes open under the trees, blocky hands one by one, a phone selfie shows her 8-bit |
| 4 | Village (POV) | Townsfolk, the Blacksmith's line, Dyslexi runs up, Elder Rowan's welcome |
| 5 | Rhyme Time door | Mint ring glows, Play card, letter tunnel, a Rhyme Time round |
| 6 | Showcase | Rhyme Time, Spelling Sprint, Word Match with their how-to-play steps, then level up |
| 7 | End card | Dusk in the village, DYSLEXOR |

The first-person view (`src/hero/realm/Pov.tsx`) draws the village Mode-7
style into a 640x360 canvas scaled 3x, with the realm sprite sheets standing on
the ground as billboards.
