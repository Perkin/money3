import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import prettier from 'eslint-plugin-prettier';

export default [
    // Игнорируемые файлы и папки
    {
        ignores: ['dist', 'node_modules', '**/*.test.ts', '**/*.spec.ts', '**/*.d.ts'],
    },

    // Базовая конфигурация ESLint (eslint:recommended)
    js.configs.recommended,

    // Конфигурация для TypeScript
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: globals.browser,
            parser: tsParser, // Парсер TypeScript
        },
        plugins: {
            '@typescript-eslint': ts,
        },
        rules: {
            ...ts.configs.recommended.rules, // Рекомендации для TypeScript
        },
    },

    // Конфигурация для React
    {
        files: ['**/*.{ts,tsx}'],
        plugins: {
            react,
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
            prettier,
        },
        settings: {
            react: {
                version: 'detect', // Автоматически определяет версию React из package.json
            },
        },
        rules: {
            ...react.configs.recommended.rules, // Рекомендации для React
            ...reactHooks.configs.recommended.rules, // Рекомендации для React Hooks
            'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
            'no-console': 'error',
            'react/jsx-uses-react': 'error',
            'react/jsx-uses-vars': 'error',
            'react/prop-types': 'off',
            'react/react-in-jsx-scope': 'off',
            'react-hooks/exhaustive-deps': 'warn',
            '@typescript-eslint/no-unused-vars': 'warn',
            '@typescript-eslint/no-explicit-any': 'warn',
            'prettier/prettier': 'warn',
        },
    },
];
