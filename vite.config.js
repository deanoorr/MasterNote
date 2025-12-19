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
            '/deepseek-api': {
                target: 'https://api.deepseek.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/deepseek-api/, ''),
            },
            '/openai-api': {
                target: 'https://api.openai.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/openai-api/, ''),
            },
            '/moonshot-api': {
                target: 'https://api.moonshot.ai',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/moonshot-api/, ''),
            },
            '/openrouter-api': {
                target: 'https://openrouter.ai/api/v1',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/openrouter-api/, ''),
            },
        },
    },
});
