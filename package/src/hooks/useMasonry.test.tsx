import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

// ---------------------------------------------------------------------------
// ResizeObserver mock — happy-dom may not provide one; fire synchronously so
// the virtualizer has a resolved rect/lane count by the time we assert.
// ---------------------------------------------------------------------------
type ROCallback = (entries: ResizeObserverEntry[]) => void;

class SyncResizeObserver {
  private callback: ROCallback;
  constructor(callback: ROCallback) {
    this.callback = callback;
  }
  observe(target: Element) {
    this.callback([{ target } as ResizeObserverEntry]);
  }
  unobserve() {}
  disconnect() {}
}

describe('useMasonry — scrollToIndex', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', SyncResizeObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not call the virtualizer unless invoked', () => {
    const { result } = renderHook(() => useMasonry({ data: [1, 2, 3], estimateSize: () => 100 }));

    const spy = vi.spyOn(result.current.virtualizer, 'scrollToIndex');

    expect(spy).not.toHaveBeenCalled();
  });

  it('forwards index and options to the underlying virtualizer', () => {
    const { result } = renderHook(() => useMasonry({ data: [1, 2, 3], estimateSize: () => 100 }));

    const spy = vi.spyOn(result.current.virtualizer, 'scrollToIndex');
    result.current.scrollToIndex(2, { align: 'center', behavior: 'smooth' });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(2, { align: 'center', behavior: 'smooth' });
  });

  it('stays referentially stable across re-renders (safe in effect deps)', () => {
    const { result, rerender } = renderHook(
      (props: { data: number[] }) => useMasonry({ data: props.data, estimateSize: () => 100 }),
      { initialProps: { data: [1, 2, 3] } }
    );

    const first = result.current.scrollToIndex;
    rerender({ data: [1, 2, 3, 4] });
    const second = result.current.scrollToIndex;

    expect(second).toBe(first);
  });
});
