import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Автоматически очищаем состояние DOM после каждого теста
afterEach(() => {
    cleanup();
});

// Мок для IndexedDB
class MockIDBDatabase {
    objectStoreNames = {
        contains: () => true,
        item: () => null,
        length: 0,
    };
    createObjectStore = vi.fn().mockReturnThis();
    transaction = vi.fn().mockReturnThis();
    objectStore = vi.fn().mockReturnThis();
    put = vi.fn().mockResolvedValue(1);
    get = vi.fn().mockResolvedValue({});
    getAll = vi.fn().mockResolvedValue([]);
    add = vi.fn().mockResolvedValue(1);
    delete = vi.fn().mockResolvedValue(undefined);
    clear = vi.fn().mockResolvedValue(undefined);
    createIndex = vi.fn().mockReturnThis();
    index = vi.fn().mockReturnThis();
    done = Promise.resolve();
}

// Мок для глобальных объектов, которые нужны для тестов
global.indexedDB = {
    open: vi.fn().mockReturnValue({
        result: new MockIDBDatabase(),
        transaction: vi.fn().mockReturnThis(),
        objectStore: vi.fn().mockReturnThis(),
        addEventListener: vi.fn((event: string, cb: (event: any) => void) => setTimeout(() => cb({ target: { result: new MockIDBDatabase() } }), 0)),
        onupgradeneeded: null,
        onsuccess: null,
        onerror: null,
    }),
    deleteDatabase: vi.fn(),
} as any;

// Мок для localStorage
class MockLocalStorage {
    private store: Record<string, string> = {};

    getItem(key: string): string | null {
        return this.store[key] || null;
    }

    setItem(key: string, value: string): void {
        this.store[key] = value;
    }

    removeItem(key: string): void {
        delete this.store[key];
    }

    clear(): void {
        this.store = {};
    }
}

global.localStorage = new MockLocalStorage() as any;

// Мок для fetch API
global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue({}),
    status: 200,
    statusText: 'OK',
}) as any;

// Подавление предупреждений об act() в консоли
console.error = vi.fn(); 