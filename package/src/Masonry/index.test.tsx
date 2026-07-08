import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

// The `scrollElementRef` option flows through `<Masonry>` to `useMasonry` untouched
// (props aren't destructured), so container mode is reachable with the component alone
// — no need to compose the hook. useMasonry.container.test.ts proves the scroll-tracking
// math; this just proves the prop reaches the element-scoped virtualizer via the component.
describe('Masonry — scrollElementRef (container mode)', () => {
  let scrollEl: HTMLDivElement;

  beforeEach(() => {
    class ImmediateResizeObserver {
      constructor(private cb: (entries: ResizeObserverEntry[]) => void) {}
      observe(target: Element) {
        this.cb([{ target } as ResizeObserverEntry]);
      }
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', ImmediateResizeObserver);

    scrollEl = document.createElement('div');
    // happy-dom has no layout engine — stub the surface the virtualizer reads.
    Object.defineProperty(scrollEl, 'offsetHeight', { value: 400, configurable: true });
    Object.defineProperty(scrollEl, 'offsetWidth', { value: 800, configurable: true });
    Object.defineProperty(scrollEl, 'clientHeight', { value: 400, configurable: true });
    Object.defineProperty(scrollEl, 'scrollHeight', { value: 100_000, configurable: true });
    Object.defineProperty(scrollEl, 'scrollTop', { value: 0, writable: true, configurable: true });
    document.body.appendChild(scrollEl);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.removeChild(scrollEl);
  });

  it('scopes the virtualizer to the ref-passed container', () => {
    const ref = createRef<MasonryHandle>();
    const data = Array.from({ length: 1000 }, (_, i) => i);

    render(
      <Masonry
        ref={ref}
        data={data}
        estimateSize={() => 100}
        scrollElementRef={{ current: scrollEl }}
        renderItem={renderItem}
      />
    );

    // Element-scoped, not window — the prop reached the element virtualizer.
    // (Scroll-tracking/windowing math is covered in useMasonry.container.test.ts;
    // item DOM measures to 0 under happy-dom, so a mounted-count bound is unreliable here.)
    expect(ref.current?.virtualizer.scrollElement).toBe(scrollEl);
    expect(document.querySelectorAll('[data-rvm-item]').length).toBeGreaterThan(0);
  });
});
