import { createFileRoute } from '@tanstack/react-router';
import { Masonry } from 'react-virtual-masonry';

import { createTiles, type Tile } from '../data';

export const Route = createFileRoute('/ssr')({
  component: SsrPage,
});

const TILES = createTiles(200);

function SsrPage() {
  return (
    <section data-testid="ssr">
      <h1>SSR Masonry (current behavior)</h1>
      <p style={{ color: '#555' }}>
        SSR is enabled by default in TanStack Start. With the current{' '}
        <code>react-virtual-masonry</code> implementation, the server HTML for the masonry container
        renders no items because <code>useWindowVirtualizer.getVirtualItems()</code> returns an
        empty array without a measured viewport.
      </p>
      <p style={{ color: '#555' }}>
        This route is the <strong>baseline</strong> for the RFC-0002 SSR PoC. After the SSR hatch
        lands, the server HTML for this page should contain the first N positioned items.
      </p>
      <Masonry
        data={TILES}
        renderItem={renderTile}
        columnsCountBreakPoints={{ 0: 1, 640: 2, 1024: 3, 1440: 4 }}
        gutter={16}
        estimateSize={(i) => TILES[i]!.height}
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
