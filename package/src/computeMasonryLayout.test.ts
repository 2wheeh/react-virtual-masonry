import { describe, it, expect } from 'vitest';

import { computeMasonryLayout } from './computeMasonryLayout';

describe('computeMasonryLayout', () => {
  it('packs into the shortest lane with a known sizes array', () => {
    // 3 lanes, no gutter. Walk the shortest-column packing by hand:
    //   i0 size100 -> lane0 start0   heights[100,  0,  0]
    //   i1 size 80 -> lane1 start0   heights[100, 80,  0]
    //   i2 size 60 -> lane2 start0   heights[100, 80, 60]
    //   i3 size 40 -> lane2 start60  heights[100, 80,100]
    //   i4 size 30 -> lane1 start80  heights[100,110,100]
    //   i5 size 20 -> lane0 start100 heights[120,110,100]
    const { items, totalSize, lanes } = computeMasonryLayout({
      sizes: [100, 80, 60, 40, 30, 20],
      lanes: 3,
    });

    expect(lanes).toBe(3);
    expect(items).toEqual([
      { index: 0, lane: 0, start: 0, size: 100 },
      { index: 1, lane: 1, start: 0, size: 80 },
      { index: 2, lane: 2, start: 0, size: 60 },
      { index: 3, lane: 2, start: 60, size: 40 },
      { index: 4, lane: 1, start: 80, size: 30 },
      { index: 5, lane: 0, start: 100, size: 20 },
    ]);
    // Tallest lane is lane0 at 120.
    expect(totalSize).toBe(120);
  });

  it('breaks ties toward the lowest lane index', () => {
    // All lanes start at 0, so the first `lanes` items fill lanes 0,1,2 in order.
    const { items } = computeMasonryLayout({ sizes: [10, 10, 10], lanes: 3 });
    expect(items.map((it) => it.lane)).toEqual([0, 1, 2]);
  });

  it('accounts for the gutter between items in a lane', () => {
    // 2 lanes, gutter 10:
    //   i0 size50 -> lane0 start0   heights[60,  0]
    //   i1 size50 -> lane1 start0   heights[60, 60]
    //   i2 size50 -> lane0 start60  heights[120,60]  (50 + gutter 10 after i0)
    //   i3 size50 -> lane1 start60  heights[120,120]
    const { items, totalSize } = computeMasonryLayout({
      sizes: [50, 50, 50, 50],
      lanes: 2,
      gutter: 10,
    });

    expect(items).toEqual([
      { index: 0, lane: 0, start: 0, size: 50 },
      { index: 1, lane: 1, start: 0, size: 50 },
      { index: 2, lane: 0, start: 60, size: 50 },
      { index: 3, lane: 1, start: 60, size: 50 },
    ]);
    // Lane height is 50 + 10 + 50 + 10 = 120; one trailing gutter is stripped.
    expect(totalSize).toBe(110);
  });

  it('returns an empty layout with zero totalSize for no items', () => {
    const layout = computeMasonryLayout({ sizes: [], lanes: 3, gutter: 20 });
    expect(layout.items).toEqual([]);
    expect(layout.totalSize).toBe(0);
    expect(layout.lanes).toBe(3);
  });

  it('clamps lanes to a minimum of 1', () => {
    const { items, totalSize, lanes } = computeMasonryLayout({
      sizes: [10, 20, 30],
      lanes: 0,
    });

    expect(lanes).toBe(1);
    // Everything stacks in lane 0.
    expect(items).toEqual([
      { index: 0, lane: 0, start: 0, size: 10 },
      { index: 1, lane: 0, start: 10, size: 20 },
      { index: 2, lane: 0, start: 30, size: 30 },
    ]);
    expect(totalSize).toBe(60);
  });
});
