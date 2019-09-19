'use strict'

process.env.BABEL_ENV = 'main'

const path = require('path')
const {
  dependencies
} = require('../package.json')
const webpack = require('webpack')

const BabiliWebpackPlugin = require('babili-webpack-plugin')

const outputPath = process.env.NODE_ENV === 'production' ? '../dist' : '../build';

let mainConfig = {
  entry: {
    main: path.join(__dirname, '../src/main/index.js')
  },
  externals: [
    ...Object.keys(dependencies || {})
  ],
  module: {
    rules: [{
        test: /\.js$/,
        exclude: /node_modules/,
        use: [{
          loader: 'babel-loader',
          options: {
            cacheDirectory: true
          }
        }]
      },
      {
        test: /\.node$/,
        use: 'node-loader',
      }
    ]
  },
  node: {
    __dirname: process.env.NODE_ENV !== 'production',
    __filename: process.env.NODE_ENV !== 'production'
  },
  output: {
    filename: '[name].js',
    // libraryTarget: 'commonjs2',
    path: path.join(__dirname, outputPath)
  },
  plugins: [
    new webpack.NoEmitOnErrorsPlugin()
  ],
  resolve: {
    extensions: ['.js', '.json', '.node']
  },
  target: 'electron-main'
}

/**
 * Adjust mainConfig for development settings
 */
// if (process.env.NODE_ENV !== 'production') {
//   mainConfig.plugins.push(
//     new webpack.DefinePlugin({
//       '__static': `"${path.join(__dirname, 'static').replace(/\\/g, '\\\\')}"`
//     })
//   )
// }

/**
 * Adjust mainConfig for production settings
 */
if (process.env.NODE_ENV === 'production') {
  mainConfig.plugins.push(
    new BabiliWebpackPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"production"'
    })
  )
}

module.exports = mainConfig