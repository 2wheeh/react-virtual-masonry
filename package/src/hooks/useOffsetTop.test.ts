import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
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
