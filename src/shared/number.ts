export function getMin(values: number[]) {
  let min = values[0];

  for (const value of values) {
    if (value < min) min = value;
  }

  return min;
}

export function getMax(values: number[]) {
  let max = values[0];

  for (const value of values) {
    if (value > max) max = value;
  }

  return max;
}
