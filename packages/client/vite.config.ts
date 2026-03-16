import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@farmville/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
  server: { port: 3000 },
  build:  { outDir: 'dist', target: 'es2020' },
});
