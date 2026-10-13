# Into the Realm: AI live-action shots

The real-world half of `IntoTheRealm` (0:04–0:55) is AI-generated video. This
file is the brief for every shot. Each shot has a slot in `src/hero/config.ts`;
until a clip exists, the slot renders as a slate with the same title, so the
edit stays timed.

## Which model

| Use | Model | Why |
|---|---|---|
| **Main** | **Google Veo 3.1** (in Google Flow) | Most often rated the most photoreal (light, skin, texture). 1080p/4K, 16:9, native audio. "Ingredients" (reference images) keep Hero consistent. |
| **People moving** (s05, s06, s12) | **Kling 3.0** | Most natural walking, standing up and body weight. Image-to-video with start frame. |
| Backup | Runway Gen‑4.5 | Strong reference-image consistency if the other two fight you. |

Sora is out: OpenAI discontinued it in 2026.

**Do this before generating video:**

1. **Make Hero's reference sheet as stills first** (Nano Banana / Gemini image,
   or Midjourney): front, 3/4, profile, back and a hand close-up, all in the
   same outfit. Do the same for the two friends, the lounge, the corridor and
   the door. **Every video shot is image-to-video from one of these stills.**
   That's what keeps her face and clothes identical from shot to shot.
2. Generate **4–6 takes per shot** and keep the best one. Reject any take with
   warped hands, morphing faces, text on screen or extra fingers.
3. Export 16:9, 1080p or higher. Remotion runs at 30fps; 24fps clips play fine.
4. Name each clip after its shot id and put it in `public/footage/`, e.g.
   `public/footage/s02.mp4`. Then set `src: "footage/s02.mp4"` for that shot
   in `src/hero/config.ts`.

**Things that give AI video away, and how this edit hides them:**
- Long takes drift. Every shot here is 3–8 seconds.
- Hands touching objects warp. Only s08 shows a hand on something; keep that
  shot short and simple.
- An "too clean" image. Remotion adds the 2.39:1 letterbox, a cool grade,
  film grain and a vignette over every clip, so the shots match each other.
- Lip-sync. Nobody says a full line on camera. Your voice-over plays over
  shots where the mouth is hidden or the speaker is turned away.

## Character bible

**Hero**: young woman, late teens / early twenties, light-medium warm skin,
shoulder-length brown hair, an **oversized purple hoodie**, black jeans, white
sneakers. Curious, quiet confidence.
*(Her realm sprite uses `HERO_LOOK` in `src/hero/config.ts`: skin tone 3,
brown hair, purple outfit. If you change her real look, pick the matching
avatar layers so she reads as the same person in the realm.)*

**Friend 1**: young man, short curly hair, grey crew-neck sweatshirt.
**Friend 2**: young woman, braids, denim jacket over a yellow top.

**Places**
- *Lounge*: a cosy flat at night, warm practical lamps, fairy lights, a couch,
  a low table with snacks, phones lit.
- *Corridor*: narrow, dim, cool blue night light from a window, wooden floor,
  a closed white wooden door at the far end.

**Style line for every prompt** (paste at the end):
> Cinematic, photorealistic, shot on ARRI Alexa with a 35mm anamorphic lens,
> shallow depth of field, natural skin texture, subtle film grain, 2.39:1
> framing, moody night interior, no text, no subtitles.

## Shot list

Durations match `src/hero/config.ts` (30fps). Generate a little longer than
each slot so there's room to trim.

### s02: Wide, friends on the couch (8s)
> Wide shot of three friends on a couch in a cosy flat at night. Hero, a young
> woman with shoulder-length brown hair in an oversized purple hoodie, sits in
> the middle laughing at something on her friend's phone. On her left, a young
> man with short curly hair in a grey sweatshirt; on her right, a young woman
> with braids in a denim jacket. Warm lamp light, fairy lights on the wall,
> snacks on the low table. Slow handheld push-in. Audio: soft laughter,
> background room tone. *[style line]*

### s03: MCU, she hears it (4s)
> Medium close-up of Hero, still smiling from a joke. Her smile fades and her
> eyes shift to the side as if she heard something faint in another room. Her
> friends are out of focus beside her, still laughing. Warm light, shallow
> depth of field. Static camera. Audio: friends laughing, quiet room tone.
> *[style line]*

*(Remotion plays the realm chime here, filtered so it sounds like it's behind
a wall.)*

### s04: OTS toward the corridor (3s)
> Over-the-shoulder shot from behind Hero on the couch, looking past her
> toward a dark doorway that leads into an unlit corridor. Hero turns her head
> toward it. Foreground warm and soft, background cool and dark. Static.
> *[style line]*

### s05: She stands (3s) · *Kling*
> Medium shot. Hero puts down her drink and stands up from the couch, glancing
> toward the corridor. Her friends keep chatting, not noticing. Natural, relaxed
> motion. Slow pan following her up. *[style line]*

### s06: The corridor (5s) · *Kling*
> Tracking shot from behind Hero as she walks slowly down a narrow dim corridor
> toward a closed white wooden door at the end. Cool blue moonlight from a side
> window. The ceiling light flickers once. A thin line of soft mint-green light
> glows under the door. Steadicam, slow forward movement. Audio: footsteps on a
> wooden floor, distant muffled laughter behind her. *[style line]*

### s07: Under the door (3s)
> Extreme close-up at floor level of the gap under a closed white wooden door
> in a dark corridor. Soft mint-green light spills through the gap and flickers
> gently across the floorboards. Tiny dust motes float in the light. Static,
> macro lens. *[style line]*

*(Remotion adds the 8-bit pixel dust drifting out.)*

### s08: Hand on the handle (3s)
> Close-up of a young woman's hand in a purple hoodie sleeve slowly reaching
> for and gripping a brass door handle, pausing, then pressing it down. Mint
> light from under the door. Static. Keep the motion simple. *[style line]*

### s09: The door opens, light on her face (3s)
> Close-up of Hero's face as she opens the door. Bright mint-green and lavender
> light pours out from the doorway onto her face, flickering softly. Her eyes
> widen in awe, lips parted. Hair stirs slightly in a breeze from the doorway.
> Static. *[style line]*

*(Remotion adds a pulsing mint light pass over this shot.)*

### s10: POV, the open doorway (4s) · **compositing plate**
> First-person point of view standing in a dim corridor, looking straight
> through a fully open white wooden doorway into a **completely pitch-black
> room**. The doorway is centred and fills the middle third of the frame,
> top to bottom. The camera is perfectly still. *[style line]*

*(Remotion puts the portal into the doorway: rings, a view of the pixel
village, pixel dust. If the doorway lands somewhere else in the frame, change
`DOORWAY` in `src/hero/config.ts` to line it up.)*

### s11: Hesitation (7s)
> Medium close-up of Hero standing at an open doorway that glows with swirling
> mint and lavender light, the light dancing across her face. She takes half
> a step back, glances over her shoulder toward the warm room behind her, takes
> a breath, then turns back to the light with a small determined nod. Static.
> Audio: low magical hum. *[style line]*

### s12: She steps through (8s) · *Kling*
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

## Voice-over

Every line is on screen as a realm dialogue box, so the timing is already set
in `src/hero/Village.tsx` (`ROWAN_LINES`, `BLACKSMITH`). Record the VO against
those frames and drop it in with `<Audio>` in `src/hero/IntoTheRealm.tsx`.
