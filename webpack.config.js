const path = require("path");

module.exports = {
  mode: "development",
  entry: "./src/client/index.js",
  output: {
    path: path.resolve(__dirname, "static"),
    filename: "bundle.js",
  },
  module: {
    rules: [
      {
        test: /\.svg$/i,
        type: "asset/source",
      },
    ],
  },
};
