import { useMemo, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider, useInfiniteQuery } from '@tanstack/react-query';
import { useEndReached, useMasonry } from 'kaskaid';

import { fetchFeedPage, type FeedItem } from '../infinite-data';

export const Route = createFileRoute('/infinite')({
  component: InfiniteFeedPage,
});

const GUTTER = 16;
const OVERSCAN = 3;
// Prefetch this many items ahead; keep it ≥ OVERSCAN (see useEndReached).
const FETCH_THRESHOLD = 20;
const HOST_CLASS = 'cq-host-infinite';

function InfiniteFeedPage() {
  // Fresh QueryClient per mount → per-request isolation on the server, stable on
  // the client. A real app would lift this to router/app scope for cross-visit cache.
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <InfiniteFeed />
    </QueryClientProvider>
  );
}

function InfiniteFeed() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status, error } = useInfiniteQuery({
    queryKey: ['infinite-feed'],
    queryFn: ({ pageParam }) => fetchFeedPage({ data: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  const items = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);

  const {
    gridProps,
    getItemProps,
    items: virtualItems,
  } = useMasonry({
    data: items,
    gutter: GUTTER,
    estimateSize: (index) => items[index]?.height ?? 200,
    overscan: OVERSCAN,
  });

  // Fires `fetchNextPage` as the last rendered item nears the end of loaded data;
  // `disabled` gates re-firing while a page is in flight or none remain.
  useEndReached(virtualItems, items.length, fetchNextPage, {
    threshold: FETCH_THRESHOLD,
    disabled: !hasNextPage || isFetchingNextPage,
  });

  return (
    <section data-testid="infinite-feed">
      <style>{`
        .${HOST_CLASS}             { container-type: inline-size; }
        [data-kaskaid-grid]            { --lanes: 1; }
        @container (min-width: 640px)  { [data-kaskaid-grid] { --lanes: 2; } }
        @container (min-width: 1024px) { [data-kaskaid-grid] { --lanes: 3; } }
        @container (min-width: 1440px) { [data-kaskaid-grid] { --lanes: 4; } }
      `}</style>
      <h1>Infinite Feed</h1>
      <p style={{ color: '#555' }}>
        Composed with <code>useEndReached</code>: it watches the index of the last rendered item
        (viewport + overscan) and calls <code>fetchNextPage()</code> once it gets within{' '}
        {FETCH_THRESHOLD} items of the end of loaded data.
      </p>
      {status === 'pending' && <p data-testid="feed-initial-loading">Loading…</p>}
      {status === 'error' && (
        <p data-testid="feed-error">Failed to load: {(error as Error).message}</p>
      )}
      {status === 'success' && (
        <div className={HOST_CLASS}>
          <div {...gridProps}>
            {virtualItems.map((virtualItem) => (
              <div key={virtualItem.key} {...getItemProps(virtualItem)}>
                {renderTile(items[virtualItem.index]!, virtualItem.index)}
              </div>
            ))}
          </div>
        </div>
      )}
      {isFetchingNextPage && <p data-testid="feed-loading-more">Loading more…</p>}
      {!hasNextPage && status === 'success' && (
        <p data-testid="feed-end">Reached the end — {items.length} items loaded.</p>
      )}
    </section>
  );
}

function renderTile(item: FeedItem, index: number) {
  return (
    <div
      data-testid="tile"
      data-tile-index={index}
      style={{
        height: item.height,
        background: item.color,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 600,
        borderRadius: 8,
      }}
    >
      {index}
    </div>
  );
}
