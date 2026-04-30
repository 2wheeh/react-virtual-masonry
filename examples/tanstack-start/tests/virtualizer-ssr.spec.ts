import { expect, test } from '@playwright/test';

/**
 * Verifies how `useWindowVirtualizer` behaves across server and client runtimes.
 *
 * - On the server: measurements are computed (lane assignment, start offsets) but
 *   the visible window is empty because no DOM rect is available.
 * - On the client: after mount, the visible window is populated by the virtualizer.
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

test.describe('useWindowVirtualizer SSR behavior', () => {
  test('server: measurements computed without DOM, visible window empty', async ({ request }) => {
    const response = await request.get('/ssr-debug');
    const html = await response.text();
    const snapshot = await readServerSnapshot(html);

    expect(snapshot.runtime).toBe('server');
    expect(snapshot.count).toBe(200);
    expect(snapshot.lanes).toBe(3);

    expect(snapshot.measurementsLength).toBe(200);
    expect(snapshot.measurementsFirst).not.toBeNull();
    expect(snapshot.measurementsFirst!.index).toBe(0);
    expect(snapshot.measurementsFirst!.lane).toBeGreaterThanOrEqual(0);
    expect(snapshot.measurementsFirst!.lane).toBeLessThan(3);

    expect(snapshot.visibleItemsLength).toBe(0);
    expect(snapshot.visibleItemsFirst).toBeNull();

    expect(snapshot.totalSize).toBeGreaterThan(0);
  });

  test('client: visible window populated after hydration', async ({ page }) => {
    await page.goto('/ssr-debug');
    await expect(page.getByTestId('snapshot')).toBeVisible();

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

  test('server: lane distribution and start offsets follow expected shape', async ({ request }) => {
    const response = await request.get('/ssr-debug');
    const html = await response.text();
    const snapshot = await readServerSnapshot(html);

    expect(snapshot.measurementsFirst!.start).toBe(0);
    // Last item should be in some lane and start past zero.
    expect(snapshot.measurementsLast!.start).toBeGreaterThan(0);
  });
});
