import { expect, test } from '@playwright/test';

/**
 * Infinite-loading feed on `/infinite`, composed (not a built-in API) from
 * `useMasonry().items`: an effect watches the index of the last *rendered*
 * item (viewport + overscan) and calls `fetchNextPage()` once it gets within
 * a threshold of `data.length`. Data comes from a `createServerFn` page
 * endpoint (`PAGE_SIZE=50`, `TOTAL_ITEMS=1000`, ~200ms artificial delay).
 *
 * Each page request is a distinct GET to `/_serverFn/...`, so counting those
 * is the reliable way to assert "at least 2 fetches happened" — the rendered
 * DOM tile count does NOT grow with total items loaded (it's virtualized and
 * stays bounded to roughly the viewport + overscan window regardless of how
 * many pages have been fetched).
 */

const TOTAL_ITEMS = 1000;

function countServerFnRequests(page: import('@playwright/test').Page): { get: () => number } {
  let count = 0;
  page.on('request', (req) => {
    if (req.url().includes('/_serverFn/')) count++;
  });
  return { get: () => count };
}

async function scrollToBottom(page: import('@playwright/test').Page) {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
}

test.describe('Infinite feed', () => {
  test.setTimeout(60_000);

  test('initial load fetches the first page automatically', async ({ page }) => {
    const requests = countServerFnRequests(page);
    await page.goto('/infinite');
    await expect(page.getByTestId('tile').first()).toBeVisible();
    expect(requests.get()).toBeGreaterThanOrEqual(1);
  });

  test('scrolling triggers additional fetches, with no duplicate rendered indices', async ({
    page,
  }) => {
    const requests = countServerFnRequests(page);
    await page.goto('/infinite');
    await expect(page.getByTestId('tile').first()).toBeVisible();

    // Scroll toward the bottom repeatedly; document height grows as pages
    // load, so repeated scrollTo(bottom) calls walk further down the feed.
    for (let i = 0; i < 15 && requests.get() < 3; i++) {
      await scrollToBottom(page);
      await page.waitForTimeout(300);
    }

    // At least 2 fetches beyond the automatic first-page load.
    expect(requests.get()).toBeGreaterThanOrEqual(3);

    // No duplicate `data-index` among the currently-rendered virtualized items.
    const indices = await page
      .locator('[data-rvm-item]')
      .evaluateAll((els) => els.map((el) => el.getAttribute('data-index')));
    expect(new Set(indices).size).toBe(indices.length);
  });

  test('reaches the end of the feed and stops fetching', async ({ page }) => {
    const requests = countServerFnRequests(page);
    await page.goto('/infinite');
    await expect(page.getByTestId('tile').first()).toBeVisible();

    const deadline = Date.now() + 45_000;
    while (Date.now() < deadline) {
      if (
        await page
          .getByTestId('feed-end')
          .isVisible()
          .catch(() => false)
      )
        break;
      await scrollToBottom(page);
      await page.waitForTimeout(250);
    }

    await expect(page.getByTestId('feed-end')).toBeVisible();
    await expect(page.getByTestId('feed-end')).toContainText(`${TOTAL_ITEMS} items loaded`);

    // `feed-end` can flip visible the instant the last page resolves, before the
    // document has grown to its final scrollHeight and the last items have
    // actually entered the virtualizer's rendered window. Nudge once more so
    // the tail assertions below reflect the settled end state.
    await scrollToBottom(page);
    await page.waitForTimeout(300);

    // No duplicates at the tail either.
    const indices = await page
      .locator('[data-rvm-item]')
      .evaluateAll((els) => els.map((el) => el.getAttribute('data-index')));
    expect(new Set(indices).size).toBe(indices.length);
    expect(Math.max(...indices.map(Number))).toBe(TOTAL_ITEMS - 1);

    // No further fetch beyond the end: keep nudging the scroll and confirm
    // the request count (and `isFetchingNextPage` indicator) stay put.
    const finalCount = requests.get();
    for (let i = 0; i < 5; i++) {
      await scrollToBottom(page);
      await page.waitForTimeout(200);
    }
    expect(requests.get()).toBe(finalCount);
    await expect(page.getByTestId('feed-loading-more')).toHaveCount(0);
  });
});
