const path = require('path');

module.exports = {
  mode: 'development',
  entry: './client.js',
  output: {
    path: path.resolve(__dirname, 'static'),
    filename: 'bundle.js',
  },
}