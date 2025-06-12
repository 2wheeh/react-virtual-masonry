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
    }}
  >
    {index}
  </div>
);

function App() {
  return (
    <>
      <h1> Demo</h1>

      <Masonry
        data={DATA}
        renderItem={Cell}
        estimateSize={() => 400}
        columnsCountBreakPoints={{
          350: 1,
          750: 2,
          900: 3,
        }}
      />
    </>
  );
}

export default App;
