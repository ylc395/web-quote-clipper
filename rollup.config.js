import { defineConfig } from 'rollup';
import typescript from 'rollup-plugin-typescript2';
import vFileResolver from './tool/vFileResolver';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import vue from 'rollup-plugin-vue';
import copy from 'rollup-plugin-copy';
import styles from 'rollup-plugin-styles';
import json from '@rollup/plugin-json';
import nodePolyfills from 'rollup-plugin-polyfill-node';

const plugins = [
  vue({ css: false }),
  commonjs(),
  nodePolyfills(),
  vFileResolver,
  nodeResolve(),
  typescript(),
  json(),
  styles({ mode: ['inject', { singleTag: true }] }),
  replace({
    preventAssignment: true,
    // todo: use env variable
    'process.env.NODE_ENV': JSON.stringify('dev'),
    __VUE_OPTIONS_API__: false,
    __VUE_PROD_DEVTOOLS__: false,
  }),
  copy({
    targets: [
      {
        src: 'src/driver/background/*.json',
        dest: 'dist/chrome-extension',
      },
      {
        src: 'src/driver/ui/main/index.html',
        dest: 'dist/chrome-extension',
        rename: 'popup.html',
      },
    ],
  }),
];

export default defineConfig([
  {
    input: 'src/driver/background/index.ts',
    output: {
      file: './dist/chrome-extension/background.js',
      format: 'module',
    },
    plugins,
  },
  {
    input: 'src/driver/ui/content/index.ts',
    output: {
      file: './dist/chrome-extension/content-script.js',
      format: 'iife',
    },
    plugins,
  },
  {
    input: 'src/driver/ui/main/index.ts',
    output: {
      file: './dist/chrome-extension/popup.js',
      format: 'iife',
    },
    plugins,
  },
]);
