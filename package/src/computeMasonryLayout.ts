/** A single item's placement within the computed masonry layout. */
export interface MasonryLayoutItem {
  /** Index of the item in the input `sizes` array. */
  index: number;
  /** Zero-based lane (column) the item was packed into. */
  lane: number;
  /** Offset of the item's leading edge within its lane, in the main axis. */
  start: number;
  /** The item's size along the main axis (its `sizes[index]`). */
  size: number;
}

/** The full masonry layout produced by {@link computeMasonryLayout}. */
export interface MasonryLayout {
  /** Placed items, in input order (item `i` is at `items[i]`). */
  items: MasonryLayoutItem[];
  /** Length of the tallest lane, excluding any trailing gutter. */
  totalSize: number;
  /** Number of lanes used (the clamped `lanes` option). */
  lanes: number;
}

export interface ComputeMasonryLayoutOptions {
  /** Main-axis size of each item, in input order. */
  sizes: number[];
  /** Number of lanes (columns) to pack into. Clamped to a minimum of `1`. */
  lanes: number;
  /** Gap inserted between consecutive items in the same lane. Defaults to `0`. */
  gutter?: number;
}

/**
 * Computes the full masonry layout for a list of item sizes using the same
 * shortest-column packing the virtualizer applies with
 * `laneAssignmentMode: 'measured'` — each item is placed into the currently
 * shortest lane (lowest lane index on ties).
 *
 * This is an estimate-based / approximate layout: it packs from the
 * caller-supplied `sizes` rather than measured DOM heights, so it mirrors what
 * the internal virtualizer does without requiring a mounted grid. Use it to
 * build whole-list UIs — minimaps, occupancy meters, position indicators —
 * that need every item's lane and offset without re-implementing the packing.
 */
export function computeMasonryLayout(options: ComputeMasonryLayoutOptions): MasonryLayout {
  const { sizes, gutter = 0 } = options;
  const lanes = Math.max(1, options.lanes);

  // Running main-axis length of each lane, including trailing gutters.
  const laneHeights: number[] = Array.from({ length: lanes }, () => 0);
  const items: MasonryLayoutItem[] = [];

  for (let index = 0; index < sizes.length; index++) {
    const size = sizes[index];

    // Pick the shortest lane, breaking ties toward the lowest lane index.
    let lane = 0;
    for (let l = 1; l < lanes; l++) {
      if (laneHeights[l] < laneHeights[lane]) lane = l;
    }

    const start = laneHeights[lane];
    items.push({ index, lane, start, size });
    laneHeights[lane] = start + size + gutter;
  }

  // Each lane height carries one trailing gutter per item; strip a single
  // trailing gutter from the tallest lane so `totalSize` is the real extent.
  const tallest = Math.max(...laneHeights);
  const totalSize = items.length === 0 ? 0 : Math.max(0, tallest - gutter);

  return { items, totalSize, lanes };
}
