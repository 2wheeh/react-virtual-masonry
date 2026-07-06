import { createFileRoute } from '@tanstack/react-router';
import { Masonry } from 'react-virtual-masonry';

import { createTiles, type Tile } from '../data';

export const Route = createFileRoute('/ssr')({
  component: SsrPage,
});

const TILES = createTiles(200);
const SSR_ITEM_COUNT = 30;
const INITIAL_COLUMNS = 3;

function SsrPage() {
  return (
    <section data-testid="ssr">
      <h1>SSR Masonry</h1>
      <p style={{ color: '#555' }}>
        Opt-in SSR:{' '}
        <code>ssr={`{{ itemCount: ${SSR_ITEM_COUNT}, columnsCount: ${INITIAL_COLUMNS} }}`}</code>{' '}
        renders the first {SSR_ITEM_COUNT} tiles in the server HTML using the same lane-assignment
        algorithm the client uses. Disable JS in your browser or view source to confirm the items
        are present before hydration.
      </p>
      <Masonry
        data={TILES}
        renderItem={renderTile}
        columnsCountBreakPoints={{ 0: 1, 640: 2, 1024: 3, 1440: 4 }}
        gutter={16}
        estimateSize={(i) => TILES[i]!.height}
        ssr={{ itemCount: SSR_ITEM_COUNT, columnsCount: INITIAL_COLUMNS }}
      />
    </section>
  );
}

function renderTile({ item, index }: { item: Tile; index: number }) {
  return (
    <div
      data-testid="tile"
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
