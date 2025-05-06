import { Masonry } from 'react-virtual-masonry';

const DATA = [200, 600, 200, 400, 100, 600, 200, 400, 100, 600, 200, 400, 100, 600, 200, 400, 100];

const Cell = ({ height, index }: { height: number; index: number }) => {
  return (
    <div
      style={{
        height: height,
        background: 'red',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {index}
    </div>
  );
};

function App() {
  return (
    <>
      <h1> Demo</h1>
      <Masonry data={DATA} renderItem={(item, index) => <Cell height={item} index={index} />} />
    </>
  );
}

export default App;
