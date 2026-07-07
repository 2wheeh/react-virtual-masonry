import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useEndReached } from './useEndReached';

function itemsUpTo(lastIndex: number): { index: number }[] {
  // Fresh array + fresh objects every call, mirroring `useMasonry().items`'
  // 'use no memo' contract (a new identity every render).
  return Array.from({ length: lastIndex + 1 }, (_, i) => ({ index: i }));
}

describe('useEndReached', () => {
  it('fires once when the last rendered index enters dataLength - threshold', () => {
    const onEndReached = vi.fn();
    const dataLength = 100;
    const threshold = 20;

    const { rerender } = renderHook(
      ({ items }: { items: { index: number }[] }) =>
        useEndReached(items, dataLength, onEndReached, { threshold }),
      { initialProps: { items: itemsUpTo(78) } } // 78 < 100 - 1 - 20 (=79): not yet
    );
    expect(onEndReached).not.toHaveBeenCalled();

    rerender({ items: itemsUpTo(79) }); // 79 >= 79: fires
    expect(onEndReached).toHaveBeenCalledTimes(1);
    expect(onEndReached).toHaveBeenCalledWith();

    // Re-render with an unrelated prop change but the same last index should not re-fire.
    rerender({ items: itemsUpTo(79) });
    expect(onEndReached).toHaveBeenCalledTimes(1);
  });

  it('does not fire when disabled', () => {
    const onEndReached = vi.fn();

    renderHook(() => useEndReached(itemsUpTo(99), 100, onEndReached, { disabled: true }));
    expect(onEndReached).not.toHaveBeenCalled();
  });

  it('does not re-fire on unrelated re-renders with a fresh-identity items array whose last index is unchanged', () => {
    const onEndReached = vi.fn();
    const dataLength = 100;

    const { rerender } = renderHook(
      (_props: { unrelated: number }) =>
        useEndReached(itemsUpTo(99), dataLength, onEndReached, { threshold: 0 }),
      { initialProps: { unrelated: 0 } }
    );
    expect(onEndReached).toHaveBeenCalledTimes(1);

    // A fresh `items` array is constructed on every call (as `useMasonry().items`
    // would be), but its last index (99) never changes. If the hook depended on
    // the array identity instead of the derived primitive, this would re-fire.
    rerender({ unrelated: 1 });
    rerender({ unrelated: 2 });
    expect(onEndReached).toHaveBeenCalledTimes(1);
  });

  it('default threshold (0) fires only when the final item renders', () => {
    const onEndReached = vi.fn();
    const dataLength = 10;

    const { rerender } = renderHook(
      ({ items }: { items: { index: number }[] }) => useEndReached(items, dataLength, onEndReached),
      { initialProps: { items: itemsUpTo(8) } } // last index 8, not the final item (9)
    );
    expect(onEndReached).not.toHaveBeenCalled();

    rerender({ items: itemsUpTo(9) }); // last index 9 === dataLength - 1: fires
    expect(onEndReached).toHaveBeenCalledTimes(1);
    expect(onEndReached).toHaveBeenCalledWith();
  });

  it('does not fire when no items are rendered', () => {
    const onEndReached = vi.fn();
    renderHook(() => useEndReached([], 100, onEndReached));
    expect(onEndReached).not.toHaveBeenCalled();
  });
});
