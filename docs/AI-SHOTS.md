# Dyslexor Season 1: AI live-action shots

The real-world scenes are AI-generated video (story in `docs/SEASON-1.md`):

- **The pilot, real life** (about 1:10, right after the Wizard's story): a
  reading lesson. Hero is asked to read aloud and the letters swim. A quiet
  boy at the back who finds reading hard too watches her. A chime only she
  hears (and, at the back, so does he). The corridor, the storeroom door, the
  light.
- **Episode 6, home again** (about 25s, near the end of the season): back in
  the same classroom, she reads the page aloud.

Each shot has a slot in `src/hero/config.ts` (`ACT1_SHOTS`, `ACT2_SHOTS`,
`HOME_SHOTS`); until a clip exists, the slot renders as a slate with the same
title, so the edit stays timed.

## Which model

| Use | Model | Why |
|---|---|---|
| **Main** | **Google Veo 3.1** (in Google Flow) | Most often rated the most photoreal (light, skin, texture). 1080p/4K, 16:9, native audio. "Ingredients" (reference images) keep the characters consistent. |
| **People moving** (s05, s06, s12) | **Kling 3.0** | Most natural walking, standing up and body weight. Image-to-video with start frame. |
| Backup | Runway Gen‑4.5 | Strong reference-image consistency if the other two fight you. |

Sora is out: OpenAI discontinued it in 2026.

**Do this before generating video:**

1. **Make reference sheets as stills first** (Nano Banana / Gemini image, or
   Midjourney): Hero, the quiet boy and the teacher (front, 3/4, profile),
   plus the classroom, the corridor and the storeroom door. **Every video shot
   is image-to-video from one of these stills.** That keeps faces and clothes
   identical from shot to shot.
2. Generate **4–6 takes per shot** and keep the best one. Reject any take with
   warped hands, morphing faces, text on screen or extra fingers.
3. Export 16:9, 1080p or higher. Remotion runs at 30fps; 24fps clips play fine.
4. Name each clip after its shot id and put it in `public/footage/`, e.g.
   `public/footage/s02.mp4`. Then set `src: "footage/s02.mp4"` for that shot
   in `src/hero/config.ts`.

**Things that give AI video away, and how this edit hides them:**
- Long takes drift. Every shot here is 3–7 seconds.
- Hands touching objects warp. Only s08 shows a hand on something; keep that
  shot short and simple.
- A "too clean" image. Remotion adds the 2.39:1 letterbox, a cool grade,
  film grain and a vignette over every clip, so the shots match each other.
- Lip-sync. Nobody says a full line facing the camera. Voices play over shots
  where the mouth is hidden or the speaker is turned away.
- Text. AI video garbles writing, so **the book's page never faces the camera
  in an AI shot**. Every close-up of the page (its swimming letters, and the
  letters settling as she reads in Episode 6) is drawn in Remotion: shot c02,
  and the insert in e03.

## Character bible

**Hero**: a girl of about 12, light-medium warm skin, shoulder-length brown
hair, an **oversized purple hoodie** over her school clothes. Quiet, kind,
quick to joke to cover how she feels.
*(Her realm sprite uses `HERO_LOOK` in `src/hero/config.ts`: skin tone 3,
brown hair, purple outfit. If you change her real look, pick the matching
avatar layers so she reads as the same person in the realm.)*

**The quiet boy** (the Wizard's apprentice, revealed at the end of the pilot):
about 12, fair skin, short messy black hair, a **red hoodie**. Sits at the
back, keeps his head down, struggles to read too. Never the centre of a shot
until c05, so kids barely notice him the first time.
*(His realm sprite is `public/realm/classmate.png`, from `CLASSMATE_LOOK`:
fair skin, short black hair, red hoodie. Keep his real look matching.)*

**The teacher**: kind, patient, forties, cardigan. Never unkind to Hero.

**A classmate who sniggers**: one kid near Hero, out of focus, a short laugh.

**Places**
- *Classroom*: a school classroom in the afternoon, warm window light, rows
  of desks, open reading books, a whiteboard, the door to the corridor at the
  side.
- *Corridor*: an empty school corridor, cool light, coat hooks, a storeroom
  door at the far end.

**Style line for every prompt** (paste at the end):
> Cinematic, photorealistic, shot on ARRI Alexa with a 35mm anamorphic lens,
> shallow depth of field, natural skin texture, subtle film grain, 2.39:1
> framing, soft afternoon light, no text, no subtitles.

## Shot list

Durations match `src/hero/config.ts` (30fps). Generate a little longer than
each slot so there's room to trim.

### The pilot · Real life

### s02: Wide, the reading lesson (6s)
> Wide shot of a classroom in the afternoon. Students at desks with reading
> books open. Hero, a girl of about 12 with shoulder-length brown hair in an
> oversized purple hoodie, sits by the window. A kind teacher in a cardigan
> walks between the desks. At the back, a quiet boy in a red hoodie keeps his
> head down. Warm window light. Slow push-in. Audio: a pupil reading aloud,
> pages turning, room tone. *[style line]*

### c01: Her turn (4s)
> Medium close-up of Hero at her desk. The teacher, kind, out of focus at the
> edge of frame, asks her to read the next part. Hero's smile freezes and she
> looks down at her book (its page away from the camera). Static. Audio:
> "Would you read the next part for us?" *[style line]*

### c02: The page (4s) · **drawn in Remotion, no clip needed**

The page close, its letters swimming. Remotion draws the whole shot.

### c03: She tries (6s)
> Medium close-up of Hero looking down at her book, lips parted, trying. A
> short snigger from a desk nearby (that pupil out of focus). The teacher
> gently moves on to someone else. Hero's cheeks colour and she sinks a little
> in her seat, staring at the page. Static. Audio: a stifled laugh, the
> teacher's kind voice moving on. *[style line]*

### c04: The boy at the back (4s)
> Medium close-up of a quiet boy of about 12 in a red hoodie with short messy
> black hair, at a desk at the back. He watches Hero across the room with a
> flicker of something like recognition, then looks down at his own book and
> shrinks into his hood. Static. *[style line]*

### s03: She hears it (4s)
> Medium close-up of Hero at her desk, later, quiet. Her eyes shift to the
> side as if she heard something faint from the corridor. The classmates
> around her are out of focus, working. Static camera. Audio: pencils,
> quiet room tone. *[style line]*

*(Remotion plays the realm chime here, filtered so it sounds far off.)*

### c05: He hears it too (3s)
> Close-up of the quiet boy in the red hoodie at the back of the class. At
> the same moment, his head lifts and he looks toward the classroom door, as
> if he heard something faint. Static. *[style line]*

*(This shot flashes back for a second at the end of the pilot, when his hood
comes down.)*

### s04: OTS toward the door (3s)
> Over-the-shoulder shot from behind Hero at her desk, looking past her to the
> classroom door, half open onto a dim corridor. Hero turns her head toward
> it. Foreground warm, background cool. Static. *[style line]*

### s05: She slips out (3s) · *Kling*
> Medium shot. Hero raises her hand briefly, the teacher nods, and she stands
> and slips out of the classroom door into the corridor. Natural, relaxed
> motion. *[style line]*

### s06: The corridor (4s) · *Kling*
> Tracking shot from behind Hero as she walks down an empty school corridor
> toward a storeroom door at the far end. Cool light; a ceiling light flickers
> once. A thin line of soft mint-green light glows under the door. Steadicam,
> slow forward movement. Audio: footsteps, a distant classroom murmur.
> *[style line]*

### s07: Under the door (3s)
> Extreme close-up at floor level of the gap under a closed storeroom door in
> a school corridor. Soft mint-green light spills through the gap and flickers
> across the floor. Tiny dust motes float in the light. Static, macro lens.
> *[style line]*

*(Remotion adds the 8-bit pixel dust drifting out.)*

### s08: Hand on the handle (3s)
> Close-up of a girl's hand in a purple hoodie sleeve slowly reaching for and
> gripping a door handle, pausing, then pressing it down. Mint light from under
> the door. Static. Keep the motion simple. *[style line]*

### s09: The door opens, light on her face (3s)
> Close-up of Hero's face as she opens the door. Bright mint-green and lavender
> light pours out onto her face, flickering softly. Her eyes widen in awe, lips
> parted. Hair stirs slightly in a breeze from the doorway. Static.
> *[style line]*

*(Remotion adds a pulsing mint light pass over this shot.)*

### s10: POV, the open doorway (4s) · **compositing plate**
> First-person point of view standing in a dim school corridor, looking
> straight through a fully open storeroom doorway into a **completely
> pitch-black room**. The doorway is centred and fills the middle third of
> the frame, top to bottom. The camera is perfectly still. *[style line]*

*(Remotion puts the portal into the doorway: rings, a view of the pixel
village, pixel dust. If the doorway lands somewhere else in the frame, change
`DOORWAY` in `src/hero/config.ts` to line it up.)*

### s11: Hesitation (6s)
> Medium close-up of Hero standing at an open doorway that glows with swirling
> mint and lavender light, the light dancing across her face. She takes half
> a step back, glances over her shoulder down the corridor toward her
> classroom, takes a breath, then turns back to the light with a small
> determined nod. Static. Audio: low magical hum. *[style line]*

### s12: She steps through (7s) · *Kling*
> Wide shot from behind Hero in the corridor. She walks forward through an
> open doorway filled with brilliant swirling mint, lavender and soft gold
> light. As she steps through, the light grows until it fills the frame and
> bleaches to white. Slow push-in following her. Audio: rising shimmer that
> cuts to silence. *[style line]*

*(Remotion opens the letterbox and flashes to white over the last second; the
realm fades up from that white.)*

### h01: Her real hand, POV (3s) · optional
> First-person point of view, looking down at your own left hand as it rises
> into frame, fingers spread, then slowly turns over to show the palm. Purple
> hoodie sleeve. Bright, soft, overexposed white light all around, as if just
> waking up. Static. *[style line]*

*(If you make this, set `REAL_HAND.src` in `config.ts`. Her real hand breaks
into pixel blocks and becomes the 8-bit hand. Without it, the Arrival goes
straight to the pixel hands.)*

### Episode 6 · Home again

### e01: Back in the corridor (5s)
> Wide shot of the empty school corridor. The storeroom door at the end glows
> with fading mint light, then closes on its own as the light goes out. Hero
> stands with her back to it, a little dazed. She looks toward her classroom.
> Static. Audio: a soft shimmer fading out, a distant classroom murmur.
> *[style line]*

### e02: Back in class (4s)
> Medium shot from behind Hero as she walks back into the classroom and sits
> down. The teacher smiles at her. Warm afternoon light. Audio: "Welcome
> back. Would you like to try again?" *[style line]*

### e03: She reads it (11s)
> Medium close-up of Hero at her desk holding her reading book (its page away
> from the camera). She takes a slow breath, points at the page with one
> finger, and reads aloud slowly, focused and calm. Classmates out of focus,
> turning to listen. Static. *[style line]*

*(Remotion cuts in the page close-up from about 3s in: its letters swim,
then settle a chunk at a time as she reads, "Ad... ven... ture... Adventure!")*

### e04: The class (5s)
> Wide shot of the classroom. The teacher beams; a few classmates clap. Hero
> grins, a little embarrassed and very proud. At the back, the quiet boy's
> seat is empty. Slow push-in. *[style line]*

## Voice-over

Every realm line is on screen as a dialogue box, and the Village's and
Arrival's lines already have their takes. The newer scenes' lines are text
only until they're recorded; each scene's file (`Trial.tsx`, `Lair.tsx`,
`Strike.tsx`, `Tower.tsx`, `Home.tsx`) has their timings, and
`docs/EPISODE-1.md` lists the lines to record.
