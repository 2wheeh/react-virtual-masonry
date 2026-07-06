import { createFileRoute } from '@tanstack/react-router';
import { Masonry } from 'react-virtual-masonry';

import { createTiles, type Tile } from '../data';

export const Route = createFileRoute('/')({
  component: HomePage,
});

const TILES = createTiles(200);
const SSR_ITEM_COUNT = 30;
const INITIAL_LANES = 3;
const GUTTER = 16;
const HOST_CLASS = 'cq-host';

function HomePage() {
  return (
    <section data-testid="home">
      {/* Wrapper owns `container-type`. @container rules target `[data-rvm-grid]`. */}
      <style>{`
        .${HOST_CLASS}             { container-type: inline-size; }
        [data-rvm-grid]            { --lanes: 1; }
        @container (min-width: 640px)  { [data-rvm-grid] { --lanes: 2; } }
        @container (min-width: 1024px) { [data-rvm-grid] { --lanes: 3; } }
        @container (min-width: 1440px) { [data-rvm-grid] { --lanes: 4; } }
      `}</style>
      <h1>SSR Masonry</h1>
      <p style={{ color: '#555' }}>
        Opt-in SSR: <code>ssr={`{{ itemCount: ${SSR_ITEM_COUNT}, lanes: ${INITIAL_LANES} }}`}</code>{' '}
        renders the first {SSR_ITEM_COUNT} tiles in the server HTML using the same lane-assignment
        algorithm the client uses. Post-mount, the lane count comes from the <code>--lanes</code>{' '}
        CSS variable — here driven by <code>@container</code> rules on a caller-owned wrapper with{' '}
        <code>container-type: inline-size</code>. Disable JS or view source to confirm the items are
        present before hydration.
      </p>
      <div className={HOST_CLASS}>
        <Masonry
          data={TILES}
          renderItem={renderTile}
          gutter={GUTTER}
          estimateSize={(i) => TILES[i]!.height}
          ssr={{ itemCount: SSR_ITEM_COUNT, lanes: INITIAL_LANES }}
        />
      </div>
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
