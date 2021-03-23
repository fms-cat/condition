/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */

const HtmlWebpackPlugin = require( 'html-webpack-plugin' );
const packageJson = require( './package.json' );
const path = require( 'path' );
const webpack = require( 'webpack' );

module.exports = ( env, argv ) => {
  const VERSION = packageJson.version;
  const DEV = argv.mode === 'development';
  // console.info( `Webpack: Building ${ packageJson.name } v${ VERSION } under ${ argv.mode } settings...` );

  return {
    entry: path.resolve( __dirname, 'src/main.ts' ),
    output: {
      path: path.join( __dirname, 'dist' ),
      filename: 'bundle.js',
    },
    resolve: {
      extensions: [ '.js', '.ts' ],
    },
    module: {
      rules: [
        {
          test: /automaton\.json$/,
          use: [
            {
              loader: path.resolve( __dirname, './loaders/automaton-json-loader.js' ),
              options: {
                minimize: DEV ? false : {
                  precisionTime: 3,
                  precisionValue: 3,
                }
              }
            },
          ],
          type: 'javascript/auto',
        },
        {
          test: /\.(glsl|frag|vert)$/,
          type: 'asset/source',
          use: [
            // shader minifier is kinda jej
            // want to try it works well in development phase
            {
              loader: path.resolve( __dirname, './loaders/shader-minifier-loader.js' ),
              options: {
                preserveExternals: true,
              },
            },
            'glslify-loader',
          ],
        },
        {
          test: /\.(opus|png)$/,
          type: 'asset/inline',
        },
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: [
            'ts-loader',
          ],
        },
      ],
    },
    optimization: {
      minimize: !DEV,
      moduleIds: DEV ? 'named' : undefined,
      usedExports: !DEV,
    },
    devServer: {
      inline: true,
      hot: true
    },
    devtool: DEV ? 'inline-source-map' : 'source-map',
    plugins: [
      new webpack.DefinePlugin( {
        'process.env': {
          DEV,
          VERSION: `"${ VERSION }"`
        },
      } ),
      new HtmlWebpackPlugin(),
    ],
  };
};
