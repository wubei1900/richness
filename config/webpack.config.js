'use strict'

process.env.BABEL_ENV = 'renderer'

const os = require('os');
const path = require('path');
const webpack = require('webpack');
const HappyPack = require('happypack');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const node_modules_dir = path.resolve(__dirname, '../node_modules');

const happyThreadPool = HappyPack.ThreadPool({
    size: os.cpus().length
});

module.exports = {
    mode: 'development',
    devtool: 'source-map',
    entry: {
        renderer: path.resolve(__dirname, '../src/renderer/main.js')
    },
    output: {
        filename: 'bundle.js',
        // libraryTarget: 'commonjs2',
        path: path.join(__dirname, '../build')
    },
    resolve: {
        alias: {
            '@common': path.resolve(__dirname, '../src/renderer/common'),
            '@components': path.resolve(__dirname, '../src/renderer/components'),
            '@static': path.resolve(__dirname, '../src/renderer/static'),
            '@styles': path.resolve(__dirname, '../src/renderer/styles'),
            '@router': path.resolve(__dirname, '../src/renderer/router')
        }
    },
    target: 'electron-renderer',
    module: {
        rules: [{
            test: /\.vue$/,
            exclude: node_modules_dir,
            use: [{
                loader: 'vue-loader',
                options: {
                    loaders: {
                        js: 'happypack/loader?id=babel'
                    }
                }
            }]
        }, {
            test: /\.jsx?$/,
            exclude: node_modules_dir,
            use: 'happypack/loader?id=babel'
        }, {
            test: /\.css$/,
            exclude: node_modules_dir,
            loader: 'vue-style-loader!css-loader!postcss-loader'
        }, {
            test: /\.jpe?g$|\.gif$|\.png$|\.svg$|\.mp3$/,
            exclude: node_modules_dir,
            loader: 'file-loader'
        }]
    },
    devServer: {
        host: '127.0.0.1',
        port: 8088
    },
    plugins: [
        new VueLoaderPlugin(),
        new HtmlWebpackPlugin({
            title: 'richness',
            filename: 'index.html',
            template: path.resolve(__dirname, '../template.html'),
            inject: false
        }),
        new HappyPack({
            id: 'babel',
            loaders: [{
                loader: 'babel-loader',
                options: {
                    cacheDirectory: true
                }
            }],
            threadPool: happyThreadPool
        }),
        new webpack.HotModuleReplacementPlugin()
    ]
}