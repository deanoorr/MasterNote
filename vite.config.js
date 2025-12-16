import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/scira-api': {
                target: 'https://api.scira.ai',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/scira-api/, ''),
            },
        },
    },
});
