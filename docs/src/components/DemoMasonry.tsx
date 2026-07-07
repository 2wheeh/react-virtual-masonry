'use client';

import { Masonry } from 'react-virtual-masonry';

const DATA = [
  200, 600, 200, 400, 100, 600, 200, 400, 100, 600, 200, 400, 100, 600, 200, 400, 100, 200, 600,
  200, 400, 100, 600, 200, 400, 100, 600, 200, 400, 100, 600, 200, 400, 100,
];

const Cell = ({ item, index }: { item: number; index: number }) => (
  <div
    style={{
      height: item,
      background: 'forestgreen',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
    }}
  >
    {index}
  </div>
);

export function DemoMasonry() {
  return (
    <>
      {/* Responsive lane count via CSS — library reads `--lanes` from the grid root. */}
      <style>{`
        .demo-masonry [data-rvm-grid]                       { --lanes: 1; }
        @media (min-width: 750px) { .demo-masonry [data-rvm-grid] { --lanes: 2; } }
        @media (min-width: 900px) { .demo-masonry [data-rvm-grid] { --lanes: 3; } }
      `}</style>
      <div className="demo-masonry">
        <Masonry data={DATA} renderItem={Cell} estimateSize={() => 400} />
      </div>
    </>
  );
}
