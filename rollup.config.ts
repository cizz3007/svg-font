import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import { terser } from 'rollup-plugin-terser';

const extensions = ['.ts'];

const inputSource = [
  ['./index.ts', 'es'],
  ['./index.ts', 'cjs']
];

export default inputSource.map(([input, format]) => {
  return {
    input,
    output: {
      dir: 'dist',
      format,
      exports: 'auto'
    },
    external: [/@babel\/runtime/],
    preserveModules: format === 'cjs',
    plugins: [
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions
      }),
      nodeResolve({
        extensions
      }),
      commonjs({
        extensions: [...extensions, '.js']
      }),
      peerDepsExternal(),
      terser()
    ]
  };
});