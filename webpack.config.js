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
      {
        test: /\.s[ac]ss$/i,
        use: [
          "style-loader",
          "css-loader",
          "sass-loader",
        ],
      },
    ],
  },
  devServer: {
    contentBase: "./build",
    hot: true,
  },
  devtool: 'inline-source-map',
  externals: {
    wabt: 'wabt'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },

  output: {
    path: path.resolve(__dirname, "build"),
    filename: 'webstart.js'
  }
};
