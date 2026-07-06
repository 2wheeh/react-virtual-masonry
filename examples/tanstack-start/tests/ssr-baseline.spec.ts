import { expect, test } from '@playwright/test';

/**
 * Captures the SSR behavior of <Masonry>.
 *
 * - The home route opts out of SSR via `ssr: false` — server emits no tile markup.
 * - The /ssr route opts in via `ssrItemCount` — server emits the first N positioned tiles
 *   using the same lane-assignment code path the client uses.
 */

const SSR_ITEM_COUNT = 30;

test.describe('Masonry SSR behavior', () => {
  test('home route disables SSR via ssr:false', async ({ request }) => {
    const response = await request.get('/');
    expect(response.status()).toBe(200);

    const html = await response.text();
    // The route opts out of SSR — the route component is not rendered server-side.
    // TanStack Start emits a streaming placeholder where the route would mount client-side.
    expect(html).not.toContain('Client-only Masonry');
    // No tile markup in raw HTML.
    expect(html).not.toMatch(/data-testid="tile"/);
  });

  test('home route hydrates and renders the masonry on the client', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Client-only Masonry' })).toBeVisible();
    await expect(page.getByTestId('tile').first()).toBeVisible();
  });

  test('ssr route emits the first N positioned tiles in raw HTML', async ({ request }) => {
    const response = await request.get('/ssr');
    expect(response.status()).toBe(200);

    const html = await response.text();
    expect(html).toContain('SSR Masonry');

    const tileMatches = html.match(/data-testid="tile"/g) ?? [];
    expect(tileMatches.length).toBe(SSR_ITEM_COUNT);
  });

  test('ssr route HTML carries computed lane offsets (translateY)', async ({ request }) => {
    const response = await request.get('/ssr');
    const html = await response.text();

    // Items are emitted in index order in a flat list. Item 0/1/2 are seeded into
    // lanes 0/1/2 (left-to-right), so the first three translateY values are all 0px.
    const translateMatches = html.match(/translateY\((\d+(?:\.\d+)?)px\)/g) ?? [];
    expect(translateMatches.length).toBe(SSR_ITEM_COUNT);
    expect(translateMatches.slice(0, 3)).toEqual([
      'translateY(0px)',
      'translateY(0px)',
      'translateY(0px)',
    ]);
  });

  test('ssr lane positions use single calc(% + px) form across all phases', async ({ request }) => {
    const response = await request.get('/ssr');
    const html = await response.text();

    // Single calc form is used everywhere — server, first paint, and post-mount — so the
    // browser computes the same lane positions whether or not container width is known in JS.
    // For container W, gutter g, columns n, lane k: left = k*(100/n)% + k*(g/n)px.
    const lane0 = html.match(/data-index="0"[^>]*left:([^;"]+)/)?.[1];
    const lane1 = html.match(/data-index="1"[^>]*left:(calc\([^)]+\))/)?.[1];
    const lane2 = html.match(/data-index="2"[^>]*left:(calc\([^)]+\))/)?.[1];

    // Lane 0 → calc(0% + 0px)
    expect(lane0).toBe('calc(0% + 0px)');
    // Lane 1 → calc(33.333…% + 5.333…px)  (n=3, g=16)
    expect(lane1).toMatch(/^calc\(33\.\d+% \+ 5\.\d+px\)$/);
    // Lane 2 → calc(66.666…% + 10.666…px)
    expect(lane2).toMatch(/^calc\(66\.\d+% \+ 10\.\d+px\)$/);
  });

  test('client hydration produces tiles after mount with no hydration warnings', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/ssr');
    await expect(page.getByTestId('tile').first()).toBeVisible();
    const count = await page.getByTestId('tile').count();
    expect(count).toBeGreaterThan(0);

    const hydrationErrors = consoleErrors.filter((err) =>
      /hydrat|did not match|Server HTML/i.test(err)
    );
    expect(hydrationErrors).toEqual([]);
  });
});
