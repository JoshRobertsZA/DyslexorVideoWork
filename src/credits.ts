// Everything you'd want to tweak before the presentation lives here.

// Names pulled from the repo's git history. Fill in missing surnames, fix any
// spelling and add anyone missing (e.g. whoever commits as ST10449620).
export const TEAM: string[] = [
  "Joshua Roberts",
  "Marcus McDowall",
  "Luc de Marillac St Julien",
  "Connor Manuel",
  "Farhan Khan Hoth",
  "Sushmitha",
  "Dylan",
  "Joshua Westcott",
  "Tyron DuPont",
];

export type CastMember = {
  name: string;
  role: string;
  quote: string;
  sheet: string;
  bg: string;
};

// "Starring" cards. Quotes are real lines the townsfolk say in the realm.
export const CAST: CastMember[] = [
  {
    name: "SUSHI",
    role: "as The Student",
    quote: "One word at a time.",
    sheet: "realm/character_female.png",
    bg: "#4a2d63",
  },
  {
    name: "DYSLEXI",
    role: "as The Loyal Companion",
    quote: "Meow. (Translation: you've got this.)",
    sheet: "realm/dyslexi.png",
    bg: "#1f5c5a",
  },
  {
    name: "THE WIZARD",
    role: "as Keeper of the Games",
    quote: "Three doors. Three games. Endless words.",
    sheet: "realm/villager.png",
    bg: "#232c5e",
  },
  {
    name: "THE FARMER",
    role: "as Grower of Words",
    quote: "Words grow like crops - a little practice every day.",
    sheet: "realm/npc_farmer.png",
    bg: "#2d5e33",
  },
  {
    name: "THE BLACKSMITH",
    role: "as Forger of Readers",
    quote: "Strong readers are forged one word at a time.",
    sheet: "realm/npc_blacksmith.png",
    bg: "#6b2a2e",
  },
];

export const FEATURES: { label: string; clip: string }[] = [
  { label: "SPELLCHECKER", clip: "clips/spellchecker.mp4" },
  { label: "READER", clip: "clips/reader.mp4" },
  { label: "SCAN", clip: "clips/scan.mp4" },
  { label: "WRITER", clip: "clips/writer.mp4" },
  { label: "TRAINING GAMES", clip: "clips/training-games.mp4" },
  { label: "THE REALM", clip: "clips/realm-pass.mp4" },
];

export const WEBSITE = "dyslexor.com";
