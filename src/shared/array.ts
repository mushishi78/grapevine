export function shuffleArray<T>(array: T[]): T[] {
  array = cloneArray(array);

  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
}

export function cloneArray<T>(array: T[]): T[] {
  return array.slice(0);
}

export function initialize2DMatrix<T>(rows: number, columns: number) {
  return Array(rows)
    .fill(null)
    .map(() => Array(columns).fill(null));
}

export function initialize3DMatrix<T>(
  i: number,
  j: number,
  k: number
): T[][][] {
  return Array(i)
    .fill(null)
    .map(() => initialize2DMatrix(j, k));
}

export function set2DMatrixValue<T>(
  matrix: T[][],
  x: number,
  y: number,
  value: T
) {
  matrix = cloneArray(matrix);
  matrix[x] = cloneArray(matrix[x]);
  matrix[x][y] = value;
  return matrix;
}

export function set3DMatrixValue<T>(
  matrix: T[][][],
  x: number,
  y: number,
  z: number,
  value: T
) {
  matrix = cloneArray(matrix);
  matrix[x] = cloneArray(matrix[x]);
  matrix[x][y] = cloneArray(matrix[x][y]);
  matrix[x][y][z] = value;
  return matrix;
}
