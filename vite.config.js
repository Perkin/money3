import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    base: '/money3/',
    plugins: [react()],
    build: {
        outDir: 'docs', // Билд будет сразу в папку docs/ для GitHub Pages
        rollupOptions: {
            output: {
                manualChunks: {
                    react: ['react', 'react-dom'],
                    vendor: ['lodash', 'moment'],
                },
            },
        },
        chunkSizeWarningLimit: 1000,
    },
    resolve: {
        alias: {
            '@': '/src',
        },
    },
    server: {
        port: 3000,
        open: true,
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        css: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: ['node_modules/', 'src/test/'],
        },
    },
});
