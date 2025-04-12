import '@testing-library/jest-dom';
import { afterEach, vi, beforeAll, afterAll } from 'vitest';
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
        addEventListener: vi.fn((cb: (event: any) => void) => setTimeout(() => cb({ target: { result: new MockIDBDatabase() } }), 0)),
        onupgradeneeded: null,
        onsuccess: null,
        onerror: null,
    }),
    deleteDatabase: vi.fn(),
} as any;

// Мок для IDBKeyRange
global.IDBKeyRange = {
    lowerBound: vi.fn().mockReturnValue('lower-bound-range'),
    upperBound: vi.fn().mockReturnValue('upper-bound-range'),
    bound: vi.fn().mockReturnValue('bound-range'),
    only: vi.fn().mockReturnValue('only-range')
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

// Мок для toast из react-toastify
vi.mock('react-toastify', () => ({
    toast: {
        success: vi.fn().mockReturnValue(1),
        error: vi.fn().mockReturnValue(1),
        info: vi.fn().mockReturnValue(1)
    }
}));

// Настройка локализации для тестов
const setupLocalization = () => {
    // Сохраняем оригинальные методы для восстановления после тестов
    const originalToLocaleString = Date.prototype.toLocaleString;
    const originalNumberFormat = Intl.NumberFormat;
    
    // Переопределяем toLocaleString для использования русской локали в тестах
    // @ts-ignore - игнорируем ошибку типов при подмене глобального метода
    Date.prototype.toLocaleString = function(locale: string | string[] | undefined, options?: Intl.DateTimeFormatOptions) {
        return originalToLocaleString.call(this, 'ru-RU', options);
    };
    
    // Подменяем Intl.NumberFormat для тестов
    // @ts-ignore - игнорируем ошибку типов при подмене глобального объекта
    Intl.NumberFormat = function(locale: string | string[] | undefined, options?: Intl.NumberFormatOptions) {
        // Всегда используем ru-RU локаль для тестов независимо от переданной
        return new originalNumberFormat('ru-RU', options);
    };
    
    // Возвращаем функцию для восстановления оригинальных методов
    return () => {
        Date.prototype.toLocaleString = originalToLocaleString;
        // @ts-ignore
        Intl.NumberFormat = originalNumberFormat;
    };
};

// Расширяем тип глобального объекта
declare global {
    namespace NodeJS {
        interface Global {
            restoreLocalization?: () => void;
        }
    }
}

// Настраиваем локализацию перед всеми тестами и восстанавливаем после
beforeAll(() => {
    // @ts-ignore - расширяем global динамически
    global.restoreLocalization = setupLocalization();
});

afterAll(() => {
    // @ts-ignore - restoreLocalization добавлено динамически
    if (global.restoreLocalization) {
        // @ts-ignore
        global.restoreLocalization();
    }
});

// Мок для window.confirm
global.confirm = vi.fn().mockReturnValue(true);

// Мок для window.dispatchEvent
global.dispatchEvent = vi.fn();

// Подавление предупреждений об act() в консоли
console.error = vi.fn(); 