import { defineConfig } from 'vite';
import viteReact from '@vitejs/plugin-react';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';

export default defineConfig({
  plugins: [
    tanstackStart({
      target: 'node-server',
    }),
    viteReact(),
  ],
  resolve: {
    conditions: ['source', 'module', 'browser', 'default'],
  },
});
