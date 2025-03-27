import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  define: {
    // Define these at a global level to avoid chunk loading errors
    'global': 'window',
    'process.env': '{}'
  }
}); 