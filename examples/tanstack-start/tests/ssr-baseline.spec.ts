import { expect, test } from '@playwright/test';

/**
 * Captures the **current** SSR behavior of <Masonry>.
 *
 * After RFC-0002 lands, expectations here will need to flip — the empty-container
 * assertions should fail, signaling that real SSR layout is now produced.
 */

test.describe('SSR baseline (pre-RFC-0002)', () => {
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

  test('ssr route currently emits empty masonry container', async ({ request }) => {
    const response = await request.get('/ssr');
    expect(response.status()).toBe(200);

    const html = await response.text();
    // Page wrapper + heading should be there.
    expect(html).toContain('SSR Masonry (current behavior)');
    // BASELINE assertion — flip after RFC-0002 implementation.
    const tileMatches = html.match(/data-testid="tile"/g) ?? [];
    expect(tileMatches.length).toBe(0);
  });

  test('client hydration produces tiles after mount', async ({ page }) => {
    await page.goto('/ssr');
    // After hydration, real measurement happens and tiles appear.
    await expect(page.getByTestId('tile').first()).toBeVisible();
    const count = await page.getByTestId('tile').count();
    expect(count).toBeGreaterThan(0);
  });
});
