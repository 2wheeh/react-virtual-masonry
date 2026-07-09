import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useMasonry } from './useMasonry';

// Capture the `estimateSize` the hook hands to TanStack so we can drive it with
// the out-of-range indices the virtualizer transiently probes (mid-scrollToIndex,
// or as a growing feed shrinks) and assert the hook clamps before the consumer's
// estimator ever sees them.
let capturedEstimateSize: ((index: number) => number) | undefined;

vi.mock('@tanstack/react-virtual', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@tanstack/react-virtual')>();
  return {
    ...mod,
    useWindowVirtualizer: ((options: Parameters<typeof mod.useWindowVirtualizer>[0]) => {
      capturedEstimateSize = options.estimateSize;
      return mod.useWindowVirtualizer(options);
    }) as typeof mod.useWindowVirtualizer,
  };
});

describe('useMasonry — estimateSize out-of-range clamp', () => {
  it('clamps out-of-range indices to the nearest valid one before calling estimateSize', () => {
    const data = [{ height: 100 }, { height: 200 }, { height: 300 }];
    const estimateSize = vi.fn((i: number) => data[i].height);

    renderHook(() => useMasonry({ data, estimateSize }));

    expect(capturedEstimateSize).toBeDefined();
    const bounded = capturedEstimateSize!;

    // Below range → clamped to 0; above range → clamped to length - 1.
    expect(bounded(-5)).toBe(100);
    expect(bounded(0)).toBe(100);
    expect(bounded(1)).toBe(200);
    expect(bounded(2)).toBe(300);
    expect(bounded(99)).toBe(300);

    // The consumer's estimator only ever saw in-range indices — never threw.
    for (const call of estimateSize.mock.calls) {
      expect(call[0]).toBeGreaterThanOrEqual(0);
      expect(call[0]).toBeLessThan(data.length);
    }
  });

  it('does not crash when a throwing estimator is driven with out-of-range probes', () => {
    const data = [{ height: 100 }, { height: 200 }];
    // Throws on any out-of-range read, mirroring `(i) => data[i].height`.
    const estimateSize = (i: number) => data[i].height;

    renderHook(() => useMasonry({ data, estimateSize }));

    expect(capturedEstimateSize).toBeDefined();
    expect(() => capturedEstimateSize!(-1)).not.toThrow();
    expect(() => capturedEstimateSize!(data.length + 10)).not.toThrow();
  });

  it('returns 0 for an empty data set instead of indexing into nothing', () => {
    const data: { height: number }[] = [];
    const estimateSize = (i: number) => data[i].height;

    renderHook(() => useMasonry({ data, estimateSize }));

    expect(capturedEstimateSize).toBeDefined();
    expect(capturedEstimateSize!(0)).toBe(0);
  });
});
