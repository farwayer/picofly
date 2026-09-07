import {fileURLToPath} from 'node:url'
import {defineConfig} from 'vite'
import preact from '@preact/preset-vite'
import mdx from '@mdx-js/rollup'
import {benchCode} from './vite/bench-code'

export default defineConfig({
  base: '/',
  server: {
    port: 8080,
  },
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./src', import.meta.url)),
      '~docs': fileURLToPath(new URL('../docs', import.meta.url)),
    },
  },
  plugins: [
    {
      enforce: 'pre',
      ...mdx({
        jsxImportSource: 'preact',
        format: 'mdx',
        mdxExtensions: ['.md'],
      }),
    },
    preact(),
    benchCode(),
  ],
})
