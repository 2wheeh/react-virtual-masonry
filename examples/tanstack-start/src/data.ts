export interface Tile {
  id: number;
  height: number;
  color: string;
}

const COLORS = ['#F47067', '#F4A261', '#E9C46A', '#2A9D8F', '#264653', '#8E7DBE'];

export function createTiles(count: number): Tile[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    height: 80 + ((i * 37) % 320),
    color: COLORS[i % COLORS.length]!,
  }));
}
