import { createServerFn } from '@tanstack/react-start';

export interface FeedItem {
  id: number;
  height: number;
  color: string;
}

export interface FeedPage {
  items: FeedItem[];
  /** `undefined` once `TOTAL_ITEMS` has been fully served. */
  nextPage: number | undefined;
}

export const PAGE_SIZE = 50;
export const TOTAL_ITEMS = 1000;
const FETCH_DELAY_MS = 200;

const COLORS = ['#F47067', '#F4A261', '#E9C46A', '#2A9D8F', '#264653', '#8E7DBE'];

// Integer hash (not Math.random) so height/color are a pure function of index —
// the same page always serves identical bytes, which is what makes the e2e
// assertions on item count and index continuity meaningful.
function hash(n: number): number {
  let x = (n + 0x9e3779b9) | 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = x ^ (x >>> 16);
  return Math.abs(x);
}

function itemAt(index: number): FeedItem {
  return {
    id: index,
    height: 80 + (hash(index) % 320),
    color: COLORS[index % COLORS.length]!,
  };
}

function buildPage(page: number): FeedPage {
  const start = page * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, TOTAL_ITEMS);
  const items = Array.from({ length: Math.max(0, end - start) }, (_, i) => itemAt(start + i));
  return { items, nextPage: end < TOTAL_ITEMS ? page + 1 : undefined };
}

/** Server round-trip stands in for a real paginated API: validated input, an
 *  artificial network delay, and a response shape mirroring a typical REST feed. */
export const fetchFeedPage = createServerFn({ method: 'GET' })
  .inputValidator((page: number) => {
    if (!Number.isInteger(page) || page < 0) throw new Error(`Invalid page: ${page}`);
    return page;
  })
  .handler(async ({ data: page }): Promise<FeedPage> => {
    await new Promise((resolve) => setTimeout(resolve, FETCH_DELAY_MS));
    return buildPage(page);
  });
