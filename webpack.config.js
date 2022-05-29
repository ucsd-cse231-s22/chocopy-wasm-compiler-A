const path = require('path');
module.exports = {
  entry: './webstart.ts',
  mode: "development",
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
    hot: true,
    port: 8000,
    static: path.join(__dirname, 'build'),
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
