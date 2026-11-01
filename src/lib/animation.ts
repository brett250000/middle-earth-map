export type ScenePhase =
  | "idle-beleriand"
  | "revealing"
  | "raining"
  | "flooding"
  | "settling"
  | "idle-middle-earth";

export const PHASE_COPY: Record<
  ScenePhase,
  { age: string; title: string; line: string }
> = {
  "idle-beleriand": {
    age: "First Age",
    title: "Beleriand",
    line: "The western lands before the breaking of the world.",
  },
  revealing: {
    age: "War of Wrath",
    title: "A world in miniature",
    line: "Pull back—the atlas becomes a living land upon the table.",
  },
  raining: {
    age: "War of Wrath",
    title: "The heavens open",
    line: "Storm gathers over the miniature North.",
  },
  flooding: {
    age: "War of Wrath",
    title: "The drowning",
    line: "The western sea breaks inland and sweeps across Beleriand.",
  },
  settling: {
    age: "Second Age dawns",
    title: "What remains",
    line: "The sea draws back. Middle-earth is what endured.",
  },
  "idle-middle-earth": {
    age: "Third Age",
    title: "Middle-earth",
    line: "The lands that endured after the flood.",
  },
};
