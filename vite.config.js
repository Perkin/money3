import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    base: '/money3/',
    plugins: [react()],
    build: {
        outDir: 'docs', // Билд будет сразу в папку docs/ для GitHub Pages
        rollupOptions: {
            output: {
                // Добавляем хэширование имен файлов для всех типов ресурсов
                entryFileNames: 'assets/[name].[hash].js',
                chunkFileNames: 'assets/[name].[hash].js',
                assetFileNames: 'assets/[name].[hash].[ext]',
                manualChunks: {
                    react: ['react', 'react-dom'],
                    vendor: ['react-toastify', 'idb']
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
