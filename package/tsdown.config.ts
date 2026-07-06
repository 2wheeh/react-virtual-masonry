import pluginBabel from '@rollup/plugin-babel';
import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  treeshake: true,
  unbundle: true,
  outExtensions: ({ format }) => ({
    js: format === 'cjs' ? '.cjs' : '.js',
    dts: '.d.ts',
  }),
  platform: 'neutral',
  plugins: [
    pluginBabel({
      babelHelpers: 'bundled',
      parserOpts: {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
      },
      // target '18' → react-compiler-runtime polyfill imports; react/compiler-runtime
      // is React 19-only and peerDependencies allow ^18.
      plugins: [['babel-plugin-react-compiler', { target: '18' }]],
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    }),
  ],
});
