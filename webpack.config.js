const path = require('path');
module.exports = {
  entry: './webstart.ts',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /(node_modules|tests)/,
      },
    ],
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'build'),
    },
  },
  devtool: 'inline-source-map',
  externals: {
    wabt: 'wabt'
  },
  resolve: {
    extensions: ['.ts']
  },
  output: {
    path: path.resolve(__dirname, "build"),
    filename: 'webstart.js'
  }
};
