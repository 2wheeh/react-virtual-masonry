import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';

import { useCSSLaneCount } from './useCSSLaneCount';

// ---------------------------------------------------------------------------
// ResizeObserver mock — happy-dom may not provide one; we need synchronous
// callback triggering to promote the snapshot from fallback to the CSS value.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeRef(el: HTMLElement | null) {
  return { current: el };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------
describe('useCSSLaneCount', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', SyncResizeObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // 1. SSR snapshot returns fallback
  it('SSR snapshot returns fallback', () => {
    // renderToString drives the server-render path of useSyncExternalStore,
    // which calls getServerSnapshot (() => fallback).
    let captured: number | undefined;

    function TestComponent() {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      captured = useCSSLaneCount({ current: null }, { fallback: 2 });
      return null;
    }

    renderToString(createElement(TestComponent));
    expect(captured).toBe(2);
  });

  // 2. Pre-mount client snapshot returns fallback (ref.current === null)
  it('returns fallback when ref is null (pre-mount)', () => {
    const ref = makeRef(null);
    const { result } = renderHook(() => useCSSLaneCount(ref, { fallback: 3 }));
    expect(result.current).toBe(3);
  });

  // 3. Post-mount reads --lanes from getComputedStyle
  it('reads --lanes from the container element after mount', () => {
    const div = document.createElement('div');
    div.style.setProperty('--lanes', '3');
    document.body.appendChild(div);

    const ref = makeRef(div);
    const { result } = renderHook(() => useCSSLaneCount(ref, { fallback: 1 }));

    // SyncResizeObserver fires observe() synchronously → snapshot promoted to 3
    expect(result.current).toBe(3);

    document.body.removeChild(div);
  });

  // 4a. Unset --lanes keeps fallback
  it('returns fallback when --lanes is not set', () => {
    const div = document.createElement('div');
    // No --lanes property set
    document.body.appendChild(div);

    const ref = makeRef(div);
    const { result } = renderHook(() => useCSSLaneCount(ref, { fallback: 2 }));

    expect(result.current).toBe(2);

    document.body.removeChild(div);
  });

  // 4b. Non-numeric --lanes keeps fallback
  it('returns fallback when --lanes is non-numeric', () => {
    const div = document.createElement('div');
    div.style.setProperty('--lanes', 'auto');
    document.body.appendChild(div);

    const ref = makeRef(div);
    const { result } = renderHook(() => useCSSLaneCount(ref, { fallback: 2 }));

    expect(result.current).toBe(2);

    document.body.removeChild(div);
  });

  // 4c. Zero --lanes keeps fallback
  it('returns fallback when --lanes is 0', () => {
    const div = document.createElement('div');
    div.style.setProperty('--lanes', '0');
    document.body.appendChild(div);

    const ref = makeRef(div);
    const { result } = renderHook(() => useCSSLaneCount(ref, { fallback: 2 }));

    expect(result.current).toBe(2);

    document.body.removeChild(div);
  });

  // 4d. Negative --lanes keeps fallback
  it('returns fallback when --lanes is negative', () => {
    const div = document.createElement('div');
    div.style.setProperty('--lanes', '-1');
    document.body.appendChild(div);

    const ref = makeRef(div);
    const { result } = renderHook(() => useCSSLaneCount(ref, { fallback: 2 }));

    expect(result.current).toBe(2);

    document.body.removeChild(div);
  });
});
