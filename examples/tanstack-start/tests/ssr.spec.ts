import { expect, test } from '@playwright/test';

/**
 * SSR invariants for <Masonry> on the root route:
 *   1. Opt-in SSR emits the first `ssr.itemCount` positioned tiles in raw HTML,
 *      using the same lane-assignment code path the client uses.
 *   2. Stable attrs: `data-kaskaid-grid` on root, `data-kaskaid-lanes="<n>"` reflecting
 *      the current lane count, `data-kaskaid-item` on each rendered item.
 *   3. Library never declares `container-type` on its root — that lives on a
 *      caller-owned wrapper. (Otherwise `@container` rules targeting the same
 *      element couldn't match.)
 *   4. `--lanes` is never inlined on the grid root. (Inline beats stylesheet
 *      rules on specificity.)
 *   5. SSR widths/positions are baked from `ssr.lanes` via the JS-side
 *      `useCSSLaneCount` fallback, not from CSS.
 */

const SSR_ITEM_COUNT = 30;

test.describe('Masonry SSR', () => {
  test('GET / returns 200', async ({ request }) => {
    const response = await request.get('/');
    expect(response.status()).toBe(200);
  });

  test('emits stable data-kaskaid-grid attr with current lane count', async ({ request }) => {
    const response = await request.get('/');
    const html = await response.text();
    expect(html).toContain('data-kaskaid-grid=""');
    // SSR initial lane count = ssr.lanes (3)
    expect(html).toContain('data-kaskaid-lanes="3"');
  });

  test('emits the first N positioned tiles in raw HTML', async ({ request }) => {
    const response = await request.get('/');
    const html = await response.text();

    const tileMatches = html.match(/data-testid="tile"/g) ?? [];
    expect(tileMatches.length).toBe(SSR_ITEM_COUNT);

    const itemMatches = html.match(/data-kaskaid-item=""/g) ?? [];
    expect(itemMatches.length).toBe(SSR_ITEM_COUNT);
  });

  test('SSR HTML carries computed lane offsets (translateY)', async ({ request }) => {
    const response = await request.get('/');
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

  test('lane positions use single calc(% + px) form baked from ssr.lanes=3', async ({
    request,
  }) => {
    const response = await request.get('/');
    const html = await response.text();

    // Single calc form is used everywhere — server, first paint, and post-mount — so the
    // browser computes the same lane positions whether or not container width is known in JS.
    // For container W, gutter g, lanes n, lane k: left = k*(100/n)% + k*(g/n)px.
    const lane0 = html.match(/data-index="0"[^>]*left:([^;"]+)/)?.[1];
    const lane1 = html.match(/data-index="1"[^>]*left:(calc\([^)]+\))/)?.[1];
    const lane2 = html.match(/data-index="2"[^>]*left:(calc\([^)]+\))/)?.[1];

    // Lane 0 → calc(0% + 0px)
    expect(lane0).toBe('calc(0% + 0px)');
    // Lane 1 → calc(33.333…% + 5.333…px)  (n=3, g=16)
    expect(lane1).toMatch(/^calc\(33\.\d+% \+ 5\.\d+px\)$/);
    // Lane 2 → calc(66.666…% + 10.666…px)
    expect(lane2).toMatch(/^calc\(66\.\d+% \+ 10\.\d+px\)$/);

    // Width: 3-lane calc: 100/3% - (16*2)/3 px = 33.333…% - 10.666…px
    expect(html).toMatch(/width:calc\(33\.\d+% - 10\.\d+px\)/);
  });

  test('container-type lives on author wrapper, not on the masonry root', async ({ request }) => {
    const response = await request.get('/');
    const html = await response.text();
    // Author CSS declares it on .cq-host
    expect(html).toMatch(/\.cq-host\s*\{\s*container-type:\s*inline-size/);
    // Masonry root (the element with data-kaskaid-grid) must NOT inline container-type.
    expect(html).not.toMatch(/data-kaskaid-grid="[^"]*"[^>]*style="[^"]*container-type/);
  });

  test('--lanes is never inlined on the masonry root', async ({ request }) => {
    const response = await request.get('/');
    const html = await response.text();
    expect(html).not.toMatch(/data-kaskaid-grid="[^"]*"[^>]*style="[^"]*--lanes:/);
  });

  test('hydrates without hydration errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/');
    await expect(page.getByTestId('tile').first()).toBeVisible();
    const count = await page.getByTestId('tile').count();
    expect(count).toBeGreaterThan(0);

    const hydrationErrors = consoleErrors.filter((msg) =>
      /hydrat|did not match|mismatch|Server HTML/i.test(msg)
    );
    expect(hydrationErrors).toEqual([]);
  });
});
