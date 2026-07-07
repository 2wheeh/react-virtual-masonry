import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';

import { useOffsetTop } from './useOffsetTop';

type ROCallback = (entries: ResizeObserverEntry[]) => void;

class SyncResizeObserver {
  private callback: ROCallback;
  constructor(callback: ROCallback) {
    this.callback = callback;
  }
  observe(target: Element) {
    // Fire synchronously so the snapshot is promoted before assertions run.
    this.callback([{ target } as ResizeObserverEntry]);
  }
  disconnect() {}
}

describe('useOffsetTop', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', SyncResizeObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('SSR snapshot returns fallback', () => {
    let captured: number | undefined;

    function TestComponent() {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      captured = useOffsetTop({ current: null }, { fallback: 120 });
      return null;
    }

    renderToString(createElement(TestComponent));
    expect(captured).toBe(120);
  });

  it('returns fallback when ref is null (pre-mount)', () => {
    const ref = { current: null };
    const { result } = renderHook(() => useOffsetTop(ref, { fallback: 80 }));
    expect(result.current).toBe(80);
  });

  // Ancestor layout shift: content above the element changes height, so
  // `offsetTop` moves while the element itself never resizes. Body height
  // does change in that scenario — the subscription must catch it there.
  it('refreshes when the body resizes without the element resizing', () => {
    class ControlledResizeObserver {
      static all: ControlledResizeObserver[] = [];
      private readonly callback: ROCallback;
      private readonly targets = new Set<Element>();
      constructor(callback: ROCallback) {
        this.callback = callback;
        ControlledResizeObserver.all.push(this);
      }
      observe(target: Element) {
        this.targets.add(target);
      }
      disconnect() {
        this.targets.clear();
      }
      static fire(target: Element) {
        for (const observer of ControlledResizeObserver.all) {
          if (observer.targets.has(target)) {
            observer.callback([{ target } as ResizeObserverEntry]);
          }
        }
      }
    }
    vi.stubGlobal('ResizeObserver', ControlledResizeObserver);

    const div = document.createElement('div');
    document.body.appendChild(div);
    let offsetTop = 100;
    Object.defineProperty(div, 'offsetTop', { get: () => offsetTop });

    const ref = { current: div };
    const { result } = renderHook(() => useOffsetTop(ref, { fallback: 0 }));
    expect(result.current).toBe(100);

    // Content above grows: offsetTop moves, only the body resize fires.
    offsetTop = 300;
    act(() => ControlledResizeObserver.fire(document.body));
    expect(result.current).toBe(300);

    document.body.removeChild(div);
  });

  it('reads offsetTop from the element after mount', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    // happy-dom has no layout — stub the resolved value.
    Object.defineProperty(div, 'offsetTop', { value: 240 });

    const ref = { current: div };
    const { result } = renderHook(() => useOffsetTop(ref, { fallback: 80 }));

    expect(result.current).toBe(240);

    document.body.removeChild(div);
  });
});
