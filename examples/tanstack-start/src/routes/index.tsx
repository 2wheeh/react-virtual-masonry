import { createFileRoute } from '@tanstack/react-router';
import { Masonry } from 'react-virtual-masonry';

import { createTiles, type Tile } from '../data';

export const Route = createFileRoute('/')({
  component: HomePage,
  ssr: false,
});

const TILES = createTiles(200);

function HomePage() {
  return (
    <section data-testid="home">
      <h1>Client-only Masonry</h1>
      <p style={{ color: '#555' }}>
        Baseline: this route disables SSR (<code>ssr: false</code>) and renders the Masonry purely
        on the client. The HTML you receive from the server contains an empty placeholder.
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
