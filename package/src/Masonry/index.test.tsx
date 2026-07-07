import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { render } from '@testing-library/react';

import { Masonry, type MasonryHandle } from './index';

const DATA = [100, 200, 300, 400, 500];
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
