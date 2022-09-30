const path = require('path');
const ESLintWebpackPlugin = require('eslint-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
// const WebpackDeepScopeAnalysisPlugin = require('webpack-deep-scope-plugin');

const isProduction = process.env.NODE_ENV === 'production';

const getStyleLoaders = function (loader) {
  return [
    isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
    'css-loader',
    {
      loader: 'postcss-loader',
      options: {
        postcssOptions: {
          plugins: ['postcss-loader-env']
        }
      }
    },
    loader && {
    // antd 主题自定义
      loader: loader,
      options: loader === 'less-loader' ? {
        lessOptions: {
          modifyVars: {
            // 其他主题色：https://ant.design/docs/react/customize-theme-cn
            "@primary-color": "#1DA57A", // 全局主色
          },
          javascriptEnabled: true
        }
      } : {}
    }
  ].filter(Boolean);
}

const commonConfig = {
  // 入口
  entry: './src/main.js',

  // 输出
  output: {
    path: isProduction ? path.resolve(__dirname, 'dist') : undefined,
    filename: isProduction ? 'static/js/[name].[contenthash: 10].js' : 'static/js/[name].js',
    chunkFilename: isProduction ? 'static/js/[name].[contenthash: 10].chunk.js' : 'static/js/[name].chunk.js',
    assetModuleFilename: 'static/js/[hash: 10][ext][query]',
    clean: true,

    globalObject: 'self'
  },

  // 加载器
  module: {
    rules: [
      {
        oneOf: [
          {
            test: /\.css$/,
            use: getStyleLoaders()
          },
          {
            test: /\.less$/,
            use: getStyleLoaders('less-loader')
          },
          {
            test: /\.s[ac]ss$/,
            use: getStyleLoaders('sass-loader')
          },
          {
            test: /\.styl$/,
            use: getStyleLoaders('stylus-loader')
          },
          {
            test: /\.(png|jpe?g|gif|svg|ico)$/,
            type: 'asset',
            // 小于10kb的图片会被base64处理
            parser: {
              dataUrlCondition: {
                maxSize: 10 * 1024
              }
            },
            generator: {
              filename: 'static/imgs/[hash: 8][ext][query]'
            }
          },
          {
            test: /\.(ttf|woff2?|map3|map4|avi)$/,
            type: 'asset/resource'
          },
          {
            test: /\.(jsx|js)$/,
            include: path.resolve(__dirname, 'src'),
            loader: 'babel-loader',
            options: {
              cacheDirectory: true, // 开启babel编译缓存
              cacheCompression: false, // 缓存文件不要压缩
              plugins: [
                !isProduction && 'react-refresh/babel'
              ].filter(Boolean)
            }
          },

          {
            test: /\.(jsx?|tsx?)$/,
            loader: 'babel-loader',
            exclude: /node_modules/,
            options: {
              // babelrc: true,
              plugins: [
                ["import", {
                  libraryName: "antd",
                  style: "css"
                }]
              ]
            }
          }, {
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/
          }
        ]
      }
    ],
  },

  // 插件
  plugins: [
    new ESLintWebpackPlugin({
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      context: path.resolve(__dirname, 'src'),
      exclude: 'node_module',
      cache: true,
      cacheLocation: path.resolve(__dirname, './node_module/.cache/.eslintcache')
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'public/index.html'),

      filename: 'index.html'
    }),
    isProduction && new MiniCssExtractPlugin({
      filename: 'static/css/[name].[contenthash: 10].css',
      chunkFilename: 'static/css/[name].[contenthash: 10].chunk.css'
    }),
    !isProduction && new ReactRefreshWebpackPlugin(),

    // !isProduction && new WebpackDeepScopeAnalysisPlugin()
  ].filter(Boolean),

  // 模式
  mode: isProduction ? 'production' : 'development',

  optimization: {
    minimize: isProduction,
    minimizer: [
      // 压缩css
      new CssMinimizerPlugin(),
      // 压缩js
      new TerserWebpackPlugin(),
      // 压缩图片
      new ImageMinimizerPlugin({
        minimizer: {
          implementation: ImageMinimizerPlugin.imageminGenerate,
          options: {
            plugins: [
              ['gifsicle', { interlaced: true }],
              ['jpegtran', { progressive: true }],
              ['optipng', { optimizationLevel: 5 }],
              [
                'svgo',
                {
                  plugins: [
                    'preset-default',
                    'prefixIds',
                    {
                      name: 'sortAttrs',
                      params: {
                        xmlnsOrder: 'alphabetical'
                      }
                    }
                  ]
                }
              ]
            ]
          }
        }
      })
    ],
    splitChunks: {
      chunks: 'all'
    },
    runtimeChunk: {
      name: (entrypoint) => `runtime~${entrypoint.name}.js`
      // name: (entrypoint) => `runtime~${entrypoint.name}`
    }
  },

  resolve: {
    extensions: ['.js'],
    // extensions: ['.tsx', '.ts', '.js', '.jsx', '.json'],
    mainFiles: ['index.tsx', 'index.ts', 'index.js', 'index.jsx'],
    // 设置路径别名
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  },

  devtool: isProduction ? 'source-map' : 'cheap-module-source-map',

  devServer: {
    open: true,
    host: 'localhost',
    port: 3000,
    hot: true,
    compress: true,
    historyApiFallback: true
  },

  performance: false, // 关闭性能分析，提示速度
}

module.exports = commonConfig;
