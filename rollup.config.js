import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import vFileResolver from './tool/vFileResolver';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import copy from 'rollup-plugin-copy';
import json from '@rollup/plugin-json';
import nodePolyfills from 'rollup-plugin-polyfill-node';

const plugins = [
  commonjs(),
  nodePolyfills(),
  vFileResolver,
  nodeResolve(),
  typescript(),
  json(),
  replace({
    preventAssignment: true,
    'process.env.NODE_ENV': JSON.stringify('dev'),
  }),
  copy({
    targets: [
      {
        src: 'src/driver/background/*.json',
        dest: 'dist/chrome-extension',
      },
    ],
  }),
];

export default defineConfig([
  {
    input: 'src/driver/background/index.ts',
    output: {
      file: './dist/chrome-extension/background.js',
      format: 'iife',
    },
    plugins,
  },
  {
    input: 'src/driver/browser/index.ts',
    output: {
      file: './dist/chrome-extension/content-script.js',
      format: 'iife',
    },
    plugins,
  },
  // {
  //   input: 'src/driver/ui/index.ts',
  //   output: {
  //     file: './dist/chrome-extension/popup.js',
  //     format: 'iife',
  //   },
  // }
]);
