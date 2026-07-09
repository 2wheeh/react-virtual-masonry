// ---------------------------------------------------------------------------
// Deterministic feed data — stable across re-renders (no Math.random). Two-seed
// sin hash so archetype / height / metadata vary independently but reproducibly.
// ---------------------------------------------------------------------------
export const ARCHETYPES = ['image', 'short', 'tall', 'quote'] as const;
export type Archetype = (typeof ARCHETYPES)[number];

// The card renders placeholder bars, not real author text, so a descriptor
// carries only what the demo actually draws: the measured height, the body
// archetype, and the engagement counts.
export interface Descriptor {
  height: number;
  archetype: Archetype;
  replies: number;
  reposts: number;
  likes: number;
}

function hash(n: number, seed: number): number {
  const x = Math.sin(n * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export const ITEM_COUNT = 72;
// One appended "page" of the infinite feed (AUTO end-reached / MANUAL load-more).
export const PAGE_SIZE = 24;

// Fixed index targets for the START / CENTER align buttons. These MUST stay
// inside the *initial* feed (< ITEM_COUNT): the virtualizer clamps an
// out-of-range index to `count - 1`, so a too-large target would silently
// collapse onto the last item — and then quietly un-collapse once enough pages
// had been appended. END resolves against the live feed at click time instead.
export const SCROLL_TARGETS = {
  start: 1,
  center: Math.floor(ITEM_COUNT / 2), // 36 — mid-feed
} as const;

// Raw pixel offset for the scrollToOffset button. Deliberately a constant in
// px, not an index: it demonstrates that the offset space is independent of the
// item space (the item landing at 2000px depends on gutter / lane count).
export const SCROLL_OFFSET_PX = 2000;

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
    replies: Math.round(hash(i, 4) * 30),
    reposts: Math.round(hash(i, 5) * 40),
    likes: Math.round(hash(i, 6) * 200),
  };
}

export function makeRange(start: number, count: number): Descriptor[] {
  return Array.from({ length: count }, (_, k) => makeItem(start + k));
}
