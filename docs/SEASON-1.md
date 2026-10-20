# Dyslexor · Season 1: The Stolen Words

*Season plan. Draft 2. A pilot and five more episodes, each about 6–10
minutes.*

One story told over a season. Each episode has its own small story with a
beginning, middle and end, and finishes on a hook so kids want the next one.
The big story (Hero saves the village from the Dark Wizard) runs across the
season and only resolves in the finale.

## The season in one line

A girl who hides how hard reading is for her is pulled into a realm whose
words have been stolen, and finds the Dark Wizard has an apprentice: a boy
from her own class who struggles just like her, and who chose the other side.

## What keeps the season going

- **The way home is closed.** The doorway she fell through was made of words,
  and the Wizard took them. Bring the words back and the way home opens. The
  words-restored counter is how far she has to go.
- **Three houses, three lessons.** Rhyme Time (listen to the end of a word),
  Spelling Sprint (build a word one letter at a time), Word Match (know what a
  word means). Each is a trial she has to play and win.
- **Two kids, one problem, two choices.** Hero and the quiet boy from her
  class both find reading hard and both get laughed at. The Wizard got to him
  first: "No one will ever laugh at you again." He's her mirror and her rival
  all season, and the finale leaves the door open for him to come back.
- **Hero's arc, slowly.** Hides it (pilot) → wants to quit (Ep 2) → does it
  alone (Ep 3) → starts to believe it (Ep 4) → faces her worst fear (Ep 5) →
  reads aloud in class (Ep 6).

## How we talk about reading

Most of the kids watching find reading hard too, so the show is on their side:

- **No line says anyone "can't read".** Reading is slow, hard, or the letters
  swim. Never impossible.
- **Nobody's taunt is about how someone reads,** not even the Wizard's. His
  weapon is getting kids to give up ("Give up. Go home."), and that's the
  thing the story answers.
- **Struggling is shown from the inside** (the swimming letters, a breath, a
  finger on the page), not as something to laugh at.

## Episodes

| # | Title | What it's about | Ends on | Built? |
|---|---|---|---|---|
| 1 | **Pilot: Someone Heard** | The Wizard's story; real life (the reading lesson); waking up 8-bit; the village; her first game, won | The Wizard's apprentice: the boy from her class | **Built** (`IntoTheRealm-1`) |
| 2 | **Taken** | The Wizard and his apprentice come to the village: LIGHT torn back out, the townsfolk frozen, Rowan hurt, Dyslexi taken. Hero wants to quit; "one word at a time". She stays. | Dyslexi in her cage, the apprentice guarding it | Mostly built (`Strike.tsx`) |
| 3 | **Spelling Sprint** | The second house, alone. She spells a broken bridge back together, letter by letter. The apprentice tries to beat her to it. | Half the village in colour; shadow letters creep out of the forest | New |
| 4 | **Word Match** | Shadow letters attack; she matches each to its word to turn it back to light. She and the apprentice face each other. | The last house blazes; a path opens through the Word Maze | New |
| 5 | **The Word Maze** | The journey, the N·E·P·O door, the top of the tower, the storm of swimming letters | "It's too much… too fast…" | Partly built (`Tower.tsx`) |
| 6 | **One Word at a Time** | FREE. The words fly home, the village is whole, the way home opens. Back in class, she reads aloud. | The quiet boy's empty seat. Far away, the tower window glows. Season 2. | Mostly built (`Tower.tsx`, `Home.tsx`) |

## The pilot · Someone Heard (about 6 minutes, built)

`IntoTheRealm-1` in Studio. Each scene can also be reviewed on its own.

| # | Scene | Length | Composition | State |
|---|---|---|---|---|
| 1 | **The Wizard's story**: the realm of words, the knock, the duel, Rowan's last spell, "someone heard" | 1:10 | (in `IntoTheRealm-1`) | Done |
| 2 | **Real life**: the reading lesson; asked to read aloud, the letters swim, a snigger; the quiet boy at the back watches. The chime: she hears it… and so does he. The corridor, the storeroom door, the light. | 1:11 | (in `IntoTheRealm-1`) | AI shots to make (`docs/AI-SHOTS.md`); the page close-up is drawn |
| 3 | **Arrival**: falling, waking 8-bit, the hands, the selfie, Dyslexi, the status window | 0:53 | `RealmArrival-2` | Done |
| 4 | **The village**: the townsfolk, Rowan, the quest | 1:00 | `RealmVillage-3` | Done |
| 5 | **The game**: "Go on, open the door!" The moment she steps through it, the door teleports her into the cockpit of a spaceship in a launch bay under the house. The shutters open on the bay wall; it launches up the silo and out through the glowing ring in front of the house, into space: Rhyme Time as it is in the app (the purple night sky, the planet), with the game on the windshield ("Which word rhymes with…", four answers, three dots). CAT (a wrong pick, then HAT), BALL, BEE. The stars gather into LIGHT; she flies it home, in low over the village as the colour floods back and down the silo, then steps out of the front door as the lamps relight and everyone cheers. | 1:40 | `RealmTrial-4` | Built (lines to record) |
| 6 | **The suspense ending**: far away, the Wizard watches her win in his orb. "So. Rowan found himself a reader." A voice in the shadows: "…I know her." A hooded boy steps into the torchlight. "She's just like me. The letters swim for her too." The hood comes down: the boy from her class (a flash of him looking up at the chime). "Then watch her closely… my apprentice." *To be continued…* | 0:30 | `RealmLair-5` | Built (lines to record; the flash needs AI shot c05) |
| | **Total** | **≈ 6:24** | | |

### Lines to record for the pilot's new scenes

**The game** (`Trial.tsx`)
- Dyslexi: "Psst! Did you miss me?" / "Cats don't do goodbyes. Come on!" / "This is the Rhyme Time house. Go on, open the door!" / "Surprise! The house is just the front door." / "Hold on to your whiskers!" / "Welcome to Rhyme Time!" / "Next stop: home!" / "Home sweet home." / "Listen to the end. C-at… h-at!" / "See? I told you. I'm a READING cat, I know talent." / "One down!"
- Farmer: "Light! Real light!"

**The ending** (`Lair.tsx`)
- Dark Wizard: "So. Rowan found himself a reader." / "Of course you do. She sits in your class." / "Then watch her closely… my apprentice."
- The apprentice: "…I know her." / "She's just like me. The letters swim for her too."

**Real life** (AI shots, native audio)
- Teacher: "Would you read the next part for us?"

## What already exists and where it goes

| Built | Season home |
|---|---|
| `Opening.tsx`, `Summoning.tsx`, `RealWorld.tsx`, `Arrival.tsx`, `Village.tsx`, `Trial.tsx`, `Lair.tsx` | The pilot |
| `Strike.tsx` (`Ep2-Taken`): the knocks, the theft, the cage, the rain, the lowest point | Episode 2 (add the apprentice at the Wizard's side) |
| `Tower.tsx` (`Ep5-Tower`): the journey, the door, the storm | Episode 5 |
| `Tower.tsx`: FREE, the words freed | Episode 6 |
| `Home.tsx` (`Ep6-Home`): the village saved, the portal, back in class, the sting | Episode 6 |

`docs/EPISODE-1.md` is the earlier single-episode treatment; its scenes 7–11
are now Episodes 2, 5 and 6.
