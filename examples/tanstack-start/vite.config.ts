import { defineConfig } from 'vite';
import viteReact from '@vitejs/plugin-react';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';

export default defineConfig({
  server: {
    port: 3001,
  },
  preview: {
    port: 3001,
  },
  resolve: {
    conditions: ['source', 'module', 'browser', 'default'],
  },
  plugins: [
    tanstackStart({
      srcDirectory: 'src',
    }),
    viteReact(),
  ],
});
