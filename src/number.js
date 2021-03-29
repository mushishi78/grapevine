module.exports = {
  getMin,
  getMax,
};

function getMin(values) {
  let min = values[0];

  for (const value of values) {
    if (value < min) min = value;
  }

  return min;
}

function getMax(values) {
  let max = values[0];

  for (const value of values) {
    if (value > max) max = value;
  }

  return max;
}
