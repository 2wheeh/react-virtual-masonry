import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useMasonry } from './useMasonry';

const measureSpy = vi.fn();

vi.mock('@tanstack/react-virtual', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@tanstack/react-virtual')>();
  return {
    ...mod,
    useWindowVirtualizer: ((options: Parameters<typeof mod.useWindowVirtualizer>[0]) => {
      const virtualizer = mod.useWindowVirtualizer(options);
      if (virtualizer.measure !== measureSpy) {
        measureSpy.mockImplementation(virtualizer.measure.bind(virtualizer));
        virtualizer.measure = measureSpy;
      }
      return virtualizer;
    }) as typeof mod.useWindowVirtualizer,
  };
});

describe('useMasonry gutter workaround', () => {
  // https://github.com/TanStack/virtual/issues/1222
  it('remeasures when gutter changes, and only then', () => {
    const data = [100, 200, 300, 400];
    const { rerender } = renderHook(
      ({ gutter }) => useMasonry({ data, estimateSize: (i) => data[i], gutter }),
      { initialProps: { gutter: 20 } }
    );

    measureSpy.mockClear();

    rerender({ gutter: 20 });
    expect(measureSpy).not.toHaveBeenCalled();

    rerender({ gutter: 40 });
    expect(measureSpy).toHaveBeenCalledTimes(1);

    rerender({ gutter: 40 });
    expect(measureSpy).toHaveBeenCalledTimes(1);
  });
});
