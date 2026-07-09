import { Masonry } from 'kaskaid';

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
    }}
  >
    {index}
  </div>
);

function App() {
  return (
    <>
      <h1> Demo</h1>

      {/* Responsive lane count via CSS — library reads `--lanes` from the grid root. */}
      <style>{`
        [data-kaskaid-grid]                        { --lanes: 1; }
        @media (min-width: 750px)  { [data-kaskaid-grid] { --lanes: 2; } }
        @media (min-width: 900px)  { [data-kaskaid-grid] { --lanes: 3; } }
      `}</style>
      <Masonry data={DATA} renderItem={Cell} estimateSize={() => 400} />
    </>
  );
}

export default App;
