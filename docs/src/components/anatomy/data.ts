// ---------------------------------------------------------------------------
// Deterministic feed data — stable across re-renders (no Math.random). Two-seed
// sin hash so archetype / height / metadata vary independently but reproducibly.
// ---------------------------------------------------------------------------
export const ARCHETYPES = ['image', 'short', 'tall', 'quote'] as const;
export type Archetype = (typeof ARCHETYPES)[number];

export interface Descriptor {
  height: number;
  archetype: Archetype;
  name: string;
  handle: string;
  time: string;
  replies: number;
  reposts: number;
  likes: number;
}

const NAMES = [
  'Ada Lovelace',
  'Grace Hopper',
  'Alan Kay',
  'Radia Perlman',
  'Linus T.',
  'Margaret H.',
  'Ken Thompson',
  'Barbara Liskov',
];
const HANDLES = ['ada', 'ghopper', 'alankay', 'radia', 'torvalds', 'mhamilton', 'ken', 'liskov'];

function hash(n: number, seed: number): number {
  const x = Math.sin(n * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export const ITEM_COUNT = 72;
// One appended "page" of the infinite feed (AUTO end-reached / MANUAL load-more).
export const PAGE_SIZE = 24;

// A descriptor is a pure function of its absolute index, so appended pages keep
// every earlier item's height/archetype byte-for-byte stable — the measured
// layout never reflows out from under the user as the feed grows.
export function makeItem(i: number): Descriptor {
  const archetype = ARCHETYPES[Math.floor(hash(i, 1) * ARCHETYPES.length) % ARCHETYPES.length];
  let height: number;
  switch (archetype) {
    case 'image':
      height = 200 + Math.round(hash(i, 2) * 90);
      break;
    case 'short':
      height = 96 + Math.round(hash(i, 2) * 44);
      break;
    case 'tall':
      height = 230 + Math.round(hash(i, 2) * 90);
      break;
    default:
      height = 130 + Math.round(hash(i, 2) * 60);
  }
  return {
    height,
    archetype,
    name: NAMES[i % NAMES.length],
    handle: `@${HANDLES[i % HANDLES.length]}`,
    time: `${1 + Math.floor(hash(i, 3) * 23)}h`,
    replies: Math.round(hash(i, 4) * 30),
    reposts: Math.round(hash(i, 5) * 40),
    likes: Math.round(hash(i, 6) * 200),
  };
}

export function makeRange(start: number, count: number): Descriptor[] {
  return Array.from({ length: count }, (_, k) => makeItem(start + k));
}
