import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadPixel } from "@remotion/google-fonts/PressStart2P";
import { loadFont as loadLexend } from "@remotion/google-fonts/Lexend";

// Anton = the big condensed "movie poster" type, Press Start 2P = the realm's
// pixel voice, Lexend = the app's own reading font.
export const TITLE = loadAnton("normal", { weights: ["400"], subsets: ["latin"] }).fontFamily;
export const PIXEL = loadPixel("normal", { weights: ["400"], subsets: ["latin"] }).fontFamily;
export const BODY = loadLexend("normal", { weights: ["300", "500", "700"], subsets: ["latin"] }).fontFamily;

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

// Sampled from the realm art and the app header.
export const C = {
  ink: "#09060d",
  night: "#120b1c",
  plum: "#2a1838",
  purple: "#5b3a75",
  lilac: "#b69ad6",
  gold: "#f6c945",
  peach: "#f4a259",
  cream: "#fff6e5",
  grass: "#79bf56",
  grassDark: "#5fa344",
  path: "#ee9d51",
  tuft: "#2f6d4f",
  tuftLight: "#58a86c",
};
