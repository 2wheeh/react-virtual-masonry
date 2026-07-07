'use client';

import { Masonry } from 'react-virtual-masonry';

const HEIGHTS = [200, 600, 200, 400, 100, 100, 50, 200];

export function OverviewMasonry() {
  return (
    <Masonry
      data={HEIGHTS}
      ssr={{ itemCount: HEIGHTS.length }}
      estimateSize={(i) => HEIGHTS[i]}
      renderItem={({ item, index }) => (
        <div
          style={{
            height: item,
            background: '#F47067',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {index}
        </div>
      )}
    />
  );
}
