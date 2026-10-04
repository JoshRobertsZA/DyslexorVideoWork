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
