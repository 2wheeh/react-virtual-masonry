import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    ...(mode === 'development' && {
      conditions: ['source', 'module', 'browser', 'default'],
    }),
  },
}));
