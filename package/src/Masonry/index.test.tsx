import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { render } from '@testing-library/react';

import { Masonry, type MasonryHandle } from './index';

const DATA = Array.from({ length: 8 }, () => 100);
const renderItem = ({ index }: { item: number; index: number }) => <div>{index}</div>;

describe('Masonry — imperative handle', () => {
  it('exposes scrollToIndex and virtualizer via ref', () => {
    const ref = createRef<MasonryHandle>();
    render(<Masonry ref={ref} data={DATA} estimateSize={(i) => DATA[i]} renderItem={renderItem} />);

    expect(typeof ref.current?.scrollToIndex).toBe('function');
    expect(ref.current?.virtualizer).toBeDefined();
  });

  it('handle.scrollToIndex forwards to the virtualizer', () => {
    const ref = createRef<MasonryHandle>();
    render(<Masonry ref={ref} data={DATA} estimateSize={(i) => DATA[i]} renderItem={renderItem} />);

    const spy = vi.spyOn(ref.current!.virtualizer, 'scrollToIndex');
    ref.current!.scrollToIndex(3, { align: 'center' });

    expect(spy).toHaveBeenCalledWith(3, { align: 'center' });
  });
});

describe('Masonry — onEndReached', () => {
  it('fires onEndReached when the grid renders to the end of data', () => {
    const onEndReached = vi.fn();
    render(
      <Masonry
        data={DATA}
        estimateSize={(i) => DATA[i]}
        renderItem={renderItem}
        onEndReached={onEndReached}
      />
    );
    // Small list: the final item is within the (default 0) threshold immediately.
    expect(onEndReached).toHaveBeenCalled();
  });

  it('does not fire when endReachedDisabled', () => {
    const onEndReached = vi.fn();
    render(
      <Masonry
        data={DATA}
        estimateSize={(i) => DATA[i]}
        renderItem={renderItem}
        onEndReached={onEndReached}
        endReachedDisabled
      />
    );
    expect(onEndReached).not.toHaveBeenCalled();
  });

  it('is inert when onEndReached is omitted', () => {
    // Just renders without throwing — the internal useEndReached is disabled.
    const { container } = render(
      <Masonry data={DATA} estimateSize={(i) => DATA[i]} renderItem={renderItem} />
    );
    expect(container.querySelector('[data-rvm-grid]')).not.toBeNull();
  });
});
