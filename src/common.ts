// Should've been named Vec2, but it's too late now
export type Pos = {
  row: number
  col: number
}

// height of each tile
export type World = Array<Array<number>>

export type Rect = {
  tl: Pos,    // top-left
  w: number,  // width
  h: number,  // height
}

export function dim(world: World): { rows: number, cols: number} {
  const rows = world.length;
  const cols = world[0].length;
  return { rows, cols };
}

export function booleanMatrix(rows: number, cols: number): Array<Array<boolean>> {
  const m = Array<Array<boolean>>(rows)
  for (let row = 0; row < rows; row++) {
    m[row] = Array<boolean>(cols).fill(false)
  }
  return m
}

export function matrix<T>(rows: number, cols: number, initial: T): Array<Array<T>> {
  const m = Array<Array<T>>(rows)
  for (let row = 0; row < rows; row++) {
    m[row] = Array<T>(cols).fill(initial)
  }
  return m
}

export function lerp(a: number, b: number, x: number): number {
  return (1-x)*a + x*b;
}

export function randint(a: number, b: number): number {
  return a + Math.floor(Math.random() * (b-a));
}

export function eqPos(a: Pos, b: Pos): boolean {
  return a.row == b.row && a.col == b.col;
}

export function clamp(x: number, a: number, b: number): number {
  if (x < a) return a;
  if (x > b) return b;
  return x;
}