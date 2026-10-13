import { track } from "../parts";
import { LENS, Shot3D, distOf } from "./Camera3D";

// An anime edit as data: each set-up starts on a clean cut at `at` and holds
// until the next, moving only slowly within itself from `start` to `end` (or
// along `path`, [frame, set-up] keys, for one continuous move).
// `rack`: focus pulls within the shot, [frame, subject]: the shot opens sharp
// on the first, and each later key pulls focus to its subject over RACK frames.
export type Shot<F extends string = string> = { at: number; start: Shot3D; end?: Shot3D; path?: [number, Shot3D][]; rack?: [number, F][] };
const RACK = 12;

const FIELDS: [keyof Shot3D, number][] = [
  ["x", 0],
  ["y", 0],
  ["eye", 26],
  ["tx", 0],
  ["ty", 0],
  ["lift", 20],
  ["roll", 0],
  ["aim", 160],
  ["lens", LENS.normal],
];

// The camera at frame `f`. `end` is when the last shot stops; `focusPoint`
// says where a rack subject stands (null: the shot's own target).
export const shotAt = <F extends string>(shots: Shot<F>[], f: number, end: number, focusPoint: (who: F, f: number) => { x: number; y: number } | null): Shot3D => {
  let i = 0;
  while (i + 1 < shots.length && shots[i + 1].at <= f) i++;
  const s = shots[i];
  const next = i + 1 < shots.length ? shots[i + 1].at : end;
  const out = {} as Shot3D;
  for (const [k, dflt] of FIELDS) {
    const v = s.path
      ? track(f, s.path.map(([at, p]) => [at, p[k] ?? dflt] as [number, number]))
      : track(f, [
          [s.at, s.start[k] ?? dflt],
          [next, (s.end ?? s.start)[k] ?? dflt],
        ]);
    (out as Record<string, number>)[k] = v;
  }
  // Focus: the target, unless the shot racks between people.
  if (s.rack) {
    const distTo = (who: F) => {
      const p = focusPoint(who, f);
      return p ? Math.hypot(p.x - out.x, p.y - out.y) : distOf(out);
    };
    const keys = s.rack.map(([at, who]) => [Math.max(at, s.at), who] as const);
    let k = 0;
    while (k + 1 < keys.length && keys[k + 1][0] <= f) k++;
    const d = distTo(keys[k][1]);
    out.focus = k > 0 ? track(f, [[keys[k][0], distTo(keys[k - 1][1])], [keys[k][0] + RACK, d]]) : d;
  }
  // A little human drift, so held shots breathe instead of sitting locked.
  out.x += Math.sin(f / 27) * 0.35 + Math.sin(f / 11) * 0.1;
  out.y += Math.cos(f / 31) * 0.35;
  out.tx += Math.sin(f / 19) * 0.25;
  out.lift += Math.sin(f / 23) * 0.15;
  return out;
};
