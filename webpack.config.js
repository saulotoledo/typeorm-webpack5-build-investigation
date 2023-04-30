const glob = require('glob');
const path = require('path');
const webpack = require('webpack');
const migrations = glob.sync('./src/migration/*.ts');
const entities = glob.sync('./src/entity/*.ts');
const subscribers = glob.sync('./src/subscriber/*.ts');

const convertToEntries = (files, dependOn) => files.reduce(
  (prev, currentResource) => ({
    ...prev,
    [currentResource]: {
      import: currentResource,
      filename: currentResource.replace('src/', '').replace('.ts', '.js'),
      dependOn,
    },
  }),
  {}
);

const webpackConfig = [
  {
    stats: 'verbose',
    mode: 'none',
    entry: {
      ...convertToEntries(migrations),
      ...convertToEntries(entities),
      ...convertToEntries(['./src/data-source.ts']),
      ...convertToEntries(subscribers),
    },
    devtool: 'inline-source-map',
    target: 'node',
    output: {
      path: path.resolve('.', 'dist', 'database'),
      filename: `[name].js`,
      libraryTarget: 'commonjs',
    },
    ignoreWarnings: [/^(?!CriticalDependenciesWarning$)/],
    module: {
      rules: [
        {
          test: /\.html?$/,
          use: 'ignore-loader'
        },
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
                configFile: 'tsconfig.json',
                compilerOptions: {
                  module: 'commonjs'
                },
              },
            }
          ],
          exclude: /node_modules/
        },
      ],
    },
    optimization: {
      splitChunks: {
        cacheGroups: {
          common: {
            name: 'common',
            test: /node_modules/,
            chunks: 'initial',
            minChunks: 1,
            minSize: 0,
          },
        },
      }
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
      alias: {},
    },
    plugins: [
      new webpack.IgnorePlugin({
        checkResource: (resource, _context) => {
          // return ['mssql', 'react-native-sqlite-storage', 'sql.js', 'sqlite3', 'better-sqlite3', 'ioredis', 'redis', 'typeorm-aurora-data-api-driver', 'pg-native', 'pg-query-stream', 'oracledb', 'mysql2', 'mysql', 'hdb-pool', '@sap/hana-client', 'mongodb', '@google-cloud/spanner', 'react-native-sqlite-storage'].some((value) => resource.includes(value));

        }
      }),
      new webpack.NormalModuleReplacementPlugin(
        /(mssql|react-native-sqlite-storage|sqlite3|better-sqlite3|ioredis|redis|typeorm-aurora-data-api-driver|oracledb|mysql2|mysql|hdb-pool|@sap\/hana-client|mongodb|@google-cloud\/spanner|react-native-sqlite-storage)/,
        path.resolve('.', './empty-module.js')
      ),
    ],
  }
];

console.log(require('util').inspect(webpackConfig, { depth: null }));

module.exports = webpackConfig;
