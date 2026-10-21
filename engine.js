export const solved = tiles => tiles.every((tile, index) => tile === index);
export function shuffled(random = Math.random) {
  const tiles = Array.from({ length: 9 }, (_, i) => i);
  for (let i = 8; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  if (solved(tiles)) [tiles[0], tiles[1]] = [tiles[1], tiles[0]];
  return tiles;
}
export function swap(tiles, a, b) {
  if (![a, b].every(n => Number.isInteger(n) && n >= 0 && n < 9) || a === b) throw Error('Неверные фрагменты');
  const next = [...tiles]; [next[a], next[b]] = [next[b], next[a]]; return next;
}
