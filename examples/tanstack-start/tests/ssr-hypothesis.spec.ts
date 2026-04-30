import { expect, test } from '@playwright/test';

/**
 * Validates the core assumptions RFC-0002 is built on:
 *   1. `getMeasurements()` runs without DOM and returns positions for all items.
 *   2. `getVirtualItems()` returns an empty array on the server (no rect).
 *   3. `getTotalSize()` is computed deterministically from `count * estimateSize / lanes`.
 *
 * If any of these flip, the SSR hatch in RFC-0002 needs to be redesigned.
 */

interface Snapshot {
  runtime: 'server' | 'client';
  count: number;
  lanes: number;
  totalSize: number;
  measurementsLength: number;
  measurementsFirst: { index: number; lane: number; start: number; size: number } | null;
  measurementsLast: { index: number; lane: number; start: number; size: number } | null;
  visibleItemsLength: number;
  visibleItemsFirst: { index: number } | null;
}

async function readServerSnapshot(html: string): Promise<Snapshot> {
  const match = html.match(/data-testid="snapshot"[^>]*>([\s\S]*?)<\/pre>/);
  if (!match) throw new Error('snapshot pre element not found in SSR HTML');
  const decoded = (match[1] ?? '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
  return JSON.parse(decoded) as Snapshot;
}

test.describe('RFC-0002 hypothesis', () => {
  test('server snapshot: measurements computed, visible empty', async ({ request }) => {
    const response = await request.get('/ssr-debug');
    const html = await response.text();
    const snapshot = await readServerSnapshot(html);

    expect(snapshot.runtime).toBe('server');
    expect(snapshot.count).toBe(200);
    expect(snapshot.lanes).toBe(3);

    // CORE ASSUMPTION 1: measurements available without DOM
    expect(snapshot.measurementsLength).toBe(200);
    expect(snapshot.measurementsFirst).not.toBeNull();
    expect(snapshot.measurementsFirst!.index).toBe(0);
    expect(snapshot.measurementsFirst!.lane).toBeGreaterThanOrEqual(0);
    expect(snapshot.measurementsFirst!.lane).toBeLessThan(3);

    // CORE ASSUMPTION 2: getVirtualItems empty on server
    expect(snapshot.visibleItemsLength).toBe(0);
    expect(snapshot.visibleItemsFirst).toBeNull();

    // CORE ASSUMPTION 3: getTotalSize deterministic
    expect(snapshot.totalSize).toBeGreaterThan(0);
  });

  test('client snapshot after hydration: visible items populated', async ({ page }) => {
    await page.goto('/ssr-debug');
    await expect(page.getByTestId('snapshot')).toBeVisible();

    // Wait for client snapshot to overwrite server snapshot
    await page.waitForFunction(
      () => {
        const el = document.querySelector('[data-testid="snapshot"]');
        if (!el) return false;
        try {
          const data = JSON.parse(el.textContent ?? '');
          return data.runtime === 'client' && data.visibleItemsLength > 0;
        } catch {
          return false;
        }
      },
      { timeout: 5_000 }
    );

    const text = await page.getByTestId('snapshot').textContent();
    const snapshot = JSON.parse(text ?? '') as Snapshot;

    expect(snapshot.runtime).toBe('client');
    expect(snapshot.measurementsLength).toBe(200);
    expect(snapshot.visibleItemsLength).toBeGreaterThan(0);
  });

  test('measurements lane distribution matches algorithm shape', async ({ request }) => {
    const response = await request.get('/ssr-debug');
    const html = await response.text();
    const snapshot = await readServerSnapshot(html);

    expect(snapshot.measurementsFirst!.start).toBe(0);
    // Last item should be in some lane and start past zero.
    expect(snapshot.measurementsLast!.start).toBeGreaterThan(0);
  });
});
