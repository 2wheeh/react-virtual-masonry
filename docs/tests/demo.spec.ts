import { expect, test, type Page } from '@playwright/test';

/**
 * E2e for the `/demo` "Instrument Panel" (docs/src/components/DemoPlayground.tsx).
 *
 * SCOPE — this asserts only the reliably-drivable, state-driven behaviours:
 * control toggles, caption/code-chip text, the append counters, theme flip, and
 * the keyboard-driven lane recompute (a pure `@container` + ResizeObserver path).
 *
 * NOT asserted headlessly: scroll-driven auto-append (AUTO `useEndReached`) and
 * the `scrollToIndex` reposition / minimap window move. TanStack Virtual applies
 * those via `flushSync` from inside a scroll handler, which does not repaint
 * under Playwright's headless Chromium — the assertions would be flaky. That
 * path is exercised by the OverviewMasonry control and the tanstack-start
 * example specs (examples/tanstack-start/tests/infinite.spec.ts) instead.
 */

const DEMO = '/demo';

async function panelReady(page: Page) {
  await page.goto(DEMO);
  await expect(page.getByTestId('stat-items')).toBeVisible();
  // Hydration gate: the panel's chrome is server-rendered (so the stat pod is
  // visible immediately, before React attaches handlers), but the masonry cards
  // mount only after client-side measurement — `scrollElementRef` is null during
  // SSR. Waiting for the first mounted item guarantees the panel is interactive,
  // avoiding a click landing on a not-yet-hydrated control.
  await page.locator('[data-rvm-item]').first().waitFor();
}

function itemsCount(page: Page): Promise<number> {
  return page
    .getByTestId('stat-items')
    .innerText()
    .then((t) => Number(t.replace(/[^0-9]/g, '')));
}

test.describe('DemoPlayground', () => {
  test.beforeEach(async ({ page }) => {
    await panelReady(page);
  });

  test('x-ray is on by default — per-card index/size chips are present at load', async ({
    page,
  }) => {
    const chips = page.getByTestId('xray-chip');
    await expect(chips.first()).toBeVisible();
    expect(await chips.count()).toBeGreaterThan(0);
    // The chip annotates the live VirtualItem: `#<index> · <size>px`.
    await expect(chips.first()).toHaveText(/#\d+ · \d+px/);
  });

  test('align button updates the scrollToIndex code chip + pressed state', async ({ page }) => {
    const code = page.getByTestId('scroll-api');
    await expect(code).toContainText("scrollToIndex(184, { align: 'start' })");

    const center = page.getByRole('button', { name: /CENTER/i });
    await center.click();

    await expect(code).toContainText("scrollToIndex(198, { align: 'center' })");
    await expect(center).toHaveAttribute('aria-pressed', 'true');
    // The previously-active START button is no longer pressed.
    await expect(page.getByRole('button', { name: /START/i })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  test('LOAD AUTO↔MANUAL flips the endReachedDisabled caption', async ({ page }) => {
    const caption = page.getByTestId('load-caption');
    await expect(caption).toHaveText('endReachedDisabled: false');

    // `exact` avoids colliding with the align "random → AUTO" button.
    await page.getByRole('button', { name: 'MANUAL', exact: true }).click();
    await expect(caption).toHaveText('endReachedDisabled: true');

    await page.getByRole('button', { name: 'AUTO', exact: true }).click();
    await expect(caption).toHaveText('endReachedDisabled: false');
  });

  test('MANUAL Load more appends exactly one page — no double fetch on rapid clicks', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'MANUAL', exact: true }).click();

    const before = await itemsCount(page);
    const loadMore = page.getByRole('button', { name: /Load more/i });

    // Two rapid clicks. The in-flight guard (loadingRef + the button's disabled
    // attr while `loading`) must collapse them into a single appended page.
    await loadMore.click();
    await loadMore.click({ force: true, noWaitAfter: true, timeout: 1000 }).catch(() => {});

    // One page = PAGE_SIZE (24). Poll for the append, then confirm it is stable
    // (a second fetch would have pushed it to +48).
    await expect.poll(() => itemsCount(page)).toBe(before + 24);
    await page.waitForTimeout(1000); // outlast the 700ms skeleton delay
    expect(await itemsCount(page)).toBe(before + 24);
  });

  test('+10k raises ITEMS by exactly 10,000 while MOUNTED stays bounded', async ({ page }) => {
    const before = await itemsCount(page);
    await page.getByRole('button', { name: 'Append 10,000 items' }).click();

    await expect.poll(() => itemsCount(page)).toBe(before + 10_000);

    // Virtualization: the mounted-tile count stays a small window, not 10k+.
    const mounted = Number(await page.getByTestId('stat-mounted').innerText());
    expect(mounted).toBeGreaterThan(0);
    expect(mounted).toBeLessThan(200);
  });

  test('theme flip changes the panel background-color', async ({ page }) => {
    const bg = () =>
      page.getByTestId('demo-panel').evaluate((el) => getComputedStyle(el).backgroundColor);

    const setTheme = (t: 'light' | 'dark') =>
      page.evaluate((theme) => document.documentElement.setAttribute('data-vocs-theme', theme), t);

    await setTheme('light');
    const light = await bg();
    await setTheme('dark');
    const dark = await bg();

    expect(dark).not.toBe(light);
  });

  test('drag handle is keyboard-operable — ArrowLeft shrinks the stage and drops lanes', async ({
    page,
  }) => {
    const readout = page.getByTestId('lanes-readout');
    const lanes = () => readout.innerText().then((t) => Number(t.replace(/[^0-9]/g, '')));

    const start = await lanes();
    expect(start).toBeGreaterThan(1); // at full width the container query yields multiple lanes

    const handle = page.getByRole('separator');
    await handle.focus();
    // Each ArrowLeft nudges the stage −20px; walk it well past the 560/380px
    // container breakpoints so `--lanes` must recompute downward.
    for (let i = 0; i < 24; i++) await handle.press('ArrowLeft');

    await expect.poll(lanes).toBeLessThan(start);
  });
});

test.describe('DemoPlayground · prefers-reduced-motion', () => {
  test.beforeEach(async ({ page }) => {
    // Emulate BEFORE navigation so the component mounts with reduce=true (its
    // matchMedia effect reads it on mount). `page.emulateMedia` is used rather
    // than `test.use({ reducedMotion })` as the latter did not take effect here.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await panelReady(page);
  });

  test('TOUR does not autoplay — it makes a single jump per click', async ({ page }) => {
    const tour = page.getByRole('button', { name: /tour/i });
    const code = page.getByTestId('scroll-api');

    await tour.click();
    // Single deliberate jump (index 10, centered) — no sustained "touring".
    await expect(code).toContainText("scrollToIndex(10, { align: 'center' })");
    await expect(tour).toHaveAttribute('aria-pressed', 'false');

    // Wait well past the would-be 1100ms autoplay tick: the target must NOT
    // have advanced on its own.
    await page.waitForTimeout(1500);
    await expect(code).toContainText("scrollToIndex(10, { align: 'center' })");
  });

  test('shimmer/dot keyframes (rvmsk + rvmdot) are disabled', async ({ page }) => {
    // MANUAL Load more mounts both skeletons (rvmsk) and the footer dots (rvmdot),
    // all carrying [data-rvm-anim]; the reduced-motion <style> must zero them.
    await page.getByRole('button', { name: 'MANUAL', exact: true }).click();
    await page.getByRole('button', { name: /Load more/i }).click();

    const animated = page.locator('[data-rvm-anim]');
    await expect(animated.first()).toBeVisible();
    const names = await animated.evaluateAll((els) =>
      els.map((el) => getComputedStyle(el).animationName)
    );
    expect(names.length).toBeGreaterThan(0);
    expect(names.every((n) => n === 'none')).toBe(true);
  });
});
