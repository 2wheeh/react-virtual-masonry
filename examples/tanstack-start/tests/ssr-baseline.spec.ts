import { expect, test } from '@playwright/test';

/**
 * Captures the SSR behavior of <Masonry> as currently shipped.
 *
 * The server HTML emits the page chrome and an empty masonry container; the
 * actual tile markup is produced after client-side hydration.
 */

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

  test('ssr route emits the page chrome but no tile markup', async ({ request }) => {
    const response = await request.get('/ssr');
    expect(response.status()).toBe(200);

    const html = await response.text();
    expect(html).toContain('SSR Masonry');
    const tileMatches = html.match(/data-testid="tile"/g) ?? [];
    expect(tileMatches.length).toBe(0);
  });

  test('client hydration produces tiles after mount', async ({ page }) => {
    await page.goto('/ssr');
    await expect(page.getByTestId('tile').first()).toBeVisible();
    const count = await page.getByTestId('tile').count();
    expect(count).toBeGreaterThan(0);
  });
});
