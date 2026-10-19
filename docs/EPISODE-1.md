# Episode 1 · The Stolen Words

*Story treatment. Built: about 8:50 (`IntoTheRealm-1`). Realm lines are on screen as text until they're recorded.*

## The story in one line

A girl who hides how hard reading is for her is pulled into a realm whose
words have been stolen by an evil wizard, and saves the village the only way
he can't stop: by reading, one word at a time.

## What it's really about

**"One word at a time."** Reading slowly isn't reading badly. The Dark Wizard
wins when people think words are too hard and give up; Hero beats him by not
giving up on a word. The line is planted by Rowan, said by Hero at the climax,
and lived at home in the last scene.

Nothing in the episode sells anything. The three houses are the realm's
training grounds, never "games" or "apps", and there's no store, link or
"press Play".

## Who's who

| | Wants | Fears / flaw | Arc |
|---|---|---|---|
| **Hero** | To fit in, to not be "the one who can't read" | Reading out loud; letters that swim | Hides it → is pushed to her lowest by the Wizard → reads the word that saves everyone → reads out loud at home, proudly |
| **Dyslexi** (cat with glasses, her guide) | To help Hero, to be taken seriously ("I'm a READING cat") | Being useless when it matters | Comic relief and coach; gets captured, so Hero has to save *her* |
| **Elder Rowan** | To protect the realm | He's hurt and out of magic | Passes the torch: gives Hero the idea that saves the day |
| **The Dark Wizard** | Every word, so no one can read, so no one can tell him no | People who don't give up on words | Wins in the prologue, wins again at the midpoint, loses to one slowly-read word; escapes for next time |

The Wizard's motive in one line for kids: *"A world that can't read can't tell
me no."*

## Things that come back (callbacks kids notice)

- **The three knocks.** In the prologue they mean "he's here". At the
  midpoint we hear them again before we see him. Kids will shout it.
- **The lamps.** They die in the prologue. The first word Hero wins is
  **LIGHT**, and the lamps relight. The Wizard snuffs them; at the end they all
  come back.
- **The card.** At home she can't read a game card and hides it in her hoodie
  pocket. It comes through the portal with her (8-bit), she stares at it at her
  lowest point, and the last scene is her reading it out loud.
- **"One word at a time."** Rowan → Hero → home.
- **"I'm a READING cat."** Dyslexi's running joke.

## How it holds attention

- Something changes on screen at least every 15 seconds; no static talk.
- Two **say-it-with-Hero** moments where the word fills the screen letter by
  letter and kids sound it out with her (the trial, the climax).
- A **pause-and-guess** beat in the trial: three answers float up and the
  episode waits a moment, so kids can call it before Hero does.
- Danger has a sound (the knocks) and a colour (purple); safety has a colour
  (gold/mint). Kids can read the scene without reading text.
- Dyslexi in peril raises the stakes more than any amount of lore.

---

## Episode at a glance

| # | Scene | Length | Where it is | State |
|---|---|---|---|---|
| 1 | Cold open: the realm of words, the attack, Rowan's call | 1:10 | `Opening.tsx`, `Summoning.tsx` | Done |
| 2 | Home: game night, the card she can't read, the chime, the door | 1:04 | `RealWorld.tsx` | AI shots to make (`docs/AI-SHOTS.md`); the card close-up is drawn |
| 3 | Arrival: falling, waking 8-bit, Dyslexi, the status window | 0:53 | `Arrival.tsx` (`RealmArrival-2`) | Done; one line to re-record |
| 4 | The village: townsfolk, Rowan, the quest | 1:00 | `Village.tsx` (`RealmVillage-3`) | Done; two lines to re-record |
| 5–6 | The first trial (the lanterns), light | 1:12 | `Trial.tsx` (`RealmTrial-4`) | Built; lines to record |
| 7–8 | The Wizard strikes, the lowest point | 1:07 | `Strike.tsx` (`RealmStrike-5`) | Built; lines to record |
| 9 | The tower: the door, the storm, FREE | 1:15 | `Tower.tsx` (`RealmTower-6`) | Built; lines to record |
| 10–11 | Home again: the village saved, the portal, reading the card; the sting | 1:10 | `Home.tsx` (`RealmHome-7`) | Built; AI shots to make, lines to record |
| | **Total** | **8:50** | `IntoTheRealm.tsx` (`IntoTheRealm-1`) | |

Cut from the current film: the games showcase and the old end card.

---

## Scene by scene

### 1 · Cold open (1:10). Done

Narrator: the realm of words, letters like fireflies, Rowan the keeper, "But
wisdom has enemies…", three knocks, the Dark Wizard, the duel, Rowan's last
spell: *"Whoever hears this… the realm needs you!"* White. *"…and somewhere,
far away, someone heard."*

### 2 · Home (1:00). Rewrite of the AI live-action shots

The shots in `docs/AI-SHOTS.md` aren't made yet, so this is the moment to give
Hero something to overcome.

1. **Game night.** Hero and two friends on the couch playing a word card game,
   laughing. *(8s)*
2. **Her turn.** A friend hands her a card: *"Your turn, read it out!"* Close
   on the card: the letters drift and swap places (a subtle effect over the
   live action, the same "swimming letters" look the Wizard uses later).
   *(5s)*
3. **The cover.** Hero, a too-quick smile: *"Pass! Your go."* The friends move
   on, nobody noticed. Close on her: the smile drops. She slips the card into
   her hoodie pocket. *(6s)*
4. **The chime.** The same chime as Rowan's spell, faint, from the corridor.
   Only she hears it. *(4s)*
5. **The corridor, the light under the door, the door, the portal,
   hesitation, the step through.** As now (s06–s12), but in the hesitation
   she glances back at the laughter, then touches the card in her pocket, and
   goes. *(about 35s)*

### 3 · Arrival (0:53). Done

Two line changes so it doesn't sound like an app:

- Dyslexi: ~~"Play word games to earn XP. Fill the bar to level up!"~~
  → **"Every word you learn makes you stronger. Fill the bar to level up!"**
- Optional: when she pulls out her phone, the card falls out of her pocket
  too, 8-bit. She stuffs it back. (Plants it in the realm.)

### 4 · The village (1:00). Done

Two line changes so Hero's doubt is in the story and Rowan stops saying
"press Play":

- After *"…brings words back."*, Hero: **"Words? I'm… not great with words."**
  Rowan: **"Then you'll understand them better than anyone."** *(new Rowan
  take)*
- Rowan's last line: ~~"Walk up to a house, then press Play. Let's begin."~~
  → **"Your first lesson waits in the Rhyme Time house. Will you try?"**
  Hero: **"…I'll try."** (Not "I'll do it!" yet. She earns that.)

Ends on the quest: *Bring back the words. First stop: the Rhyme Time house.*

### 5 · The first trial (1:15). New

The Rhyme Time house. No game screen: the trial happens in the world.

- Hero steps into the mint ring. Three dark **lanterns** hang over the door,
  each with a word glowing faintly beneath it. Dyslexi: *"To light a lantern,
  find the word that rhymes!"*
- **Lantern 1: CAT.** Three words float up: *DOG · HAT · SUN*. **Pause and
  guess** (2s of silence, the words bobbing). Hero picks **DOG**: a buzz, the
  lantern sputters, the letters wobble. Hero, embarrassed.
- Dyslexi, kind: *"Listen to the end. C-**at**… h-**at**!"* Hero tries again:
  **HAT**. The lantern blazes gold.
- **Lantern 2: NIGHT** → *KITE · BOAT · TREE*. She hesitates, says it under
  her breath (*"night… kite…"*): **KITE**. Faster now.
- **Lantern 3: STAR** → *CAR* comes almost straight away. Dyslexi: *"See? I
  told you. I'm a READING cat, I know talent."*
- The three lanterns pour their light into one word that rises over the
  house, letter by letter: **L · I · G · H · T**. **Say it with Hero**: the
  word fills the screen, the letters light as she sounds them, *"L… igh… t.
  LIGHT!"*

### 6 · Light (0:20). New

- The word bursts. One by one, the dead lamps down the main path flicker and
  relight (the lamps from the prologue). Colour seeps back around the house.
- The townsfolk cheer. The farmer: *"Light! Real light!"* The counter ticks:
  **Words restored 1 / 5,000**.
- Hero, really smiling for the first time. Dyslexi: *"One down!"*

### 7 · The Wizard strikes (1:00). New

- Mid-cheer: **KNOCK. KNOCK. KNOCK.** The same three booms as the prologue.
  Everyone freezes. The lamps gutter.
- Purple cloud pours down the path. At the top of it, the **Dark Wizard**.
  *"Well, well. Rowan's little helper."*
- He raises his staff. The word LIGHT is torn out of the air into the orb;
  every lamp dies again; the colour drains. The townsfolk turn grey and still
  mid-gasp.
- Rowan staggers forward: *"Leave her alone!"* A flick of the staff and he's
  knocked down.
- Dyslexi leaps in front of Hero: *"Back off, you overgrown nightlight!"* The
  Wizard laughs, and a cage of **jumbled letters** snaps shut around her.
- He leans close to Hero, quietly, the worst thing he could know: *"Words are
  hard, aren't they? You couldn't even read a little card."* He vanishes with
  Dyslexi in a swirl of letters, toward the tower on the horizon.

### 8 · The lowest point (0:30). New

- Grey drizzle. Hero sits on the path. She takes the 8-bit card out of her
  pocket; the letters swim. *"He's right. I can't even read this."*
- Rowan, hurt, limps over and sits beside her. *"His spells are made of
  words, child. And a word can always be read, if you don't give up on it."*
  He taps the card. *"Not fast. Not first. Just… one word at a time."*
- Hero looks at the tower. Puts the card away. Stands. *"One word at a
  time."*

### 9 · The tower (1:30). New

- **The path.** A short run across the grey land to the tower (two or three
  quick shots: the bridge, the dark trees, the tower looming).
- **The door.** Sealed with a scrambled word: **N · E · P · O**. Hero, too
  fast: *"Nep… o? Nepo?"* Nothing happens. She stops, breathes, and touches
  the letters one at a time; they slide into place as she works it out:
  **O · P · E · N**. *"Open!"* The door swings open. (A small win just before
  the big one, and the same move she'll need at the top.)
- **The top of the tower.** Dyslexi hangs in the letter cage over a pit of
  swirling stolen words. The Wizard turns: *"You came. How very brave. How
  very foolish."*
- He hurls the storm: hundreds of letters fly at her and swirl around her,
  the **same swimming letters as the card at home**. She shrinks. The sound
  drops out.
- Close on her face. Breath. Rowan's voice, quietly: *"One word at a time."*
- The cage's lock is a word. She points at the first letter. **Say it with
  Hero**, slowly, each letter lighting gold as she says it: **"F… r… ee…
  FREE!"**
- The cage shatters. Dyslexi lands on her shoulder. The word FREE blasts
  through the storm; the letters stop swirling and **line up**, and
  thousands of stolen words pour out of the Wizard's staff like a flock of
  golden birds. The orb cracks.
- The Wizard, blown back into the shadows: *"This isn't over, reader!"* Gone.

### 10 · Home again (1:00). New

- The flock of words flies home over the land. **Every lamp in the village
  relights**, colour floods down the path, the townsfolk unfreeze mid-cheer,
  Rowan's robe turns purple again.
- Celebration. The guard: *"Three cheers for the Reader!"* Rowan: *"You saved
  us all."* Hero: *"I just read one word at a time."* Rowan: *"That's all
  reading ever is."*
- The portal home opens. Dyslexi: *"You'll come back… right?"* Hero: **"Try
  and stop me."**
- **Home (AI shot).** The corridor. The door, closed. Hero is back, the card
  in her hand, real again. She walks into the lounge. A friend: *"There you
  are! Your go."* Hero takes a breath, points at the first word, and reads the
  card out loud, slowly, all the way through. A beat. The friends cheer. Hero
  grins.

### 11 · Sting (0:15). New

- Her phone buzzes on the couch. On the lock screen, a tiny 8-bit cat with
  glasses waves. Hero, delighted, hides it from her friends.
- Far away, in the realm: the tower window lights purple. *"…Reader."*
- Title: **DYSLEXOR · Episode 1 · The Stolen Words**.

---

## Lines to record

Hero stays text only, as everywhere else in the episode. Timings are in each
scene's file; record against them, then add each take like the Village's
(`voice` on the line, an `<Audio>` per line).

**Re-records for scenes 3 and 4** (their current takes still play until then)
- Dyslexi (Arrival): "Every word you learn makes you stronger. Fill the bar to level up!" *(replaces "Play word games to earn XP…")*
- Rowan (Village): "Then you'll understand them better than anyone." *(new, after Hero's "Words? I'm… not great with words.")*
- Rowan (Village): "Your first lesson waits in the Rhyme Time house. Will you try?" *(replaces "Walk up to a house, then press Play. Let's begin.")*

**Dyslexi**
- "Psst! Did you miss me?"
- "Cats don't do goodbyes. Come on!"
- "To light a lantern, find the word that rhymes!"
- "Listen to the end. C-at… h-at!"
- "See? I told you. I'm a READING cat, I know talent."
- "One down!"
- "Back off, you overgrown nightlight!"
- "Hero! You came!"
- "You came for me!"
- "You'll come back… right?"

**Elder Rowan**
- "Leave her alone!"
- "His spells are made of words, child. And a word can always be read, if you don't give up on it."
- "Not fast. Not first. Just… one word at a time." *(also plays softly in the tower, remembered)*
- "You saved us all."
- "That's all reading ever is."

**Dark Wizard**
- "Well, well. Rowan's little helper."
- "Words are hard, aren't they? You couldn't even read a little card."
- "You came. How very brave. How very foolish."
- "This isn't over, reader!"
- "…Reader." *(sting)*

**Townsfolk**
- Farmer: "Light! Real light!"
- Guard: "Three cheers for the Reader!"

**Real world (AI shots, with native audio)**
- Friend: "Your turn, read it out!" / "There you are! Your go."
- Hero: "Pass! Your go." / reading the card: "Ad… ven… ture… Adventure!"

**Hero's on-screen lines** (text, no recording): "Dyslexi! Where did you go?",
"Oops...", "HAT!", "Night... kite...", "L... igh... t... LIGHT!", "I... I
actually did it!", "DYSLEXI!", "He's right. I can't even read this.", "One word
at a time.", "Nep... o? Nepo?", "O... p... e... n... OPEN!", "I... I can't...",
"F... r... ee... FREE!", "Of course I did.", "I just read one word at a time.",
"Try and stop me."


## Production notes

- **Reuse:** the village, townsfolk, Rowan and the colour bloom (`Village.tsx`,
  `realm/Pov.tsx`); the Dark Wizard sprite and his staff/orb (`DarkWizard.tsx`);
  the three knock booms, shock-rings and letter-stealing swirl (`Opening.tsx`);
  the tower on the horizon and the in-world staging around the Rhyme Time
  house (`FirstWords.tsx`); Dyslexi (`hud/Dyslexi.tsx`); dialogue boxes, status
  window and quest card.
- **New art:** three lanterns over the Rhyme Time door; the letter cage; the
  tower's door and its top room; the swimming-letters effect (shared by the
  real-world card, the Wizard's storm and the 8-bit card).
- **Cut:** `Showcase.tsx` (games montage) and `EndCard.tsx` leave the
  episode. `RhymeDoor.tsx`'s tunnel into a game screen is replaced by scene 5.
- **The swimming letters** should look the same every time, so kids connect
  the card at home, the card in the realm and the Wizard's storm.

## Open questions

1. **Hero's age.** The AI-shots bible has her late teens / early twenties with
   friends at a flat. For a kids' audience, a hero about 11–13 at a sleepover
   game night may land better. The 8-bit look works either way.
2. **Length.** About 9:50 as written. To get near 8 minutes: drop the scrambled
   door in scene 9, and shorten scene 2 to just the card and the chime.
3. **The Wizard's ending.** He escapes (sets up Episode 2). Or he's beaten
   for good and the sting hints at someone else behind him.
