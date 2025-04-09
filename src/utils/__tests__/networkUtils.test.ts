import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get, post, fetchWithRetry, ApiError } from '../networkUtils';
import { toast } from 'react-toastify';

// Мокаем внешние зависимости
vi.mock('react-toastify', () => ({
    toast: {
        error: vi.fn()
    }
}));

// Мок для fetch
global.fetch = vi.fn();

// Мок для localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value.toString();
        }),
        clear: vi.fn(() => {
            store = {};
        })
    };
})();
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true
});

// Мокируем API_URL через vi.mock
vi.mock('@/config', () => ({
    API_URL: 'https://api.example.com'
}));

describe('networkUtils', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.clear();
        localStorageMock.setItem('token', 'test-token');
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe('fetchWithRetry', () => {
        it('должен успешно выполнить запрос и вернуть данные', async () => {
            // Мокируем успешный ответ
            const mockResponse = {
                ok: true,
                json: vi.fn().mockResolvedValue({ data: 'test' })
            };
            vi.mocked(global.fetch).mockResolvedValue(mockResponse as any);

            // Выполнение запроса
            const result = await fetchWithRetry('/test');

            // Проверки
            expect(global.fetch).toHaveBeenCalledWith(
                'https://api.example.com/test',
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer test-token'
                    })
                })
            );
            expect(mockResponse.json).toHaveBeenCalled();
            expect(result).toEqual({ data: 'test' });
        });

        it('должен выбросить ошибку, если токен не найден', async () => {
            localStorageMock.clear(); // Удаляем токен

            await expect(fetchWithRetry('/test')).rejects.toThrow('Токен не найден');
            expect(global.fetch).not.toHaveBeenCalled();
        });

        it('должен выбросить ошибку и показать сообщение при HTTP ошибке 401', async () => {
            // Мокируем ответ с ошибкой 401
            const mockResponse = {
                ok: false,
                status: 401,
                statusText: 'Unauthorized'
            };
            vi.mocked(global.fetch).mockResolvedValue(mockResponse as any);

            // Проверяем, что запрос выбрасывает ошибку
            await expect(fetchWithRetry('/test')).rejects.toThrow('HTTP ошибка: 401');
            
            // Проверяем, что показано сообщение об ошибке
            expect(toast.error).toHaveBeenCalledWith('Сессия истекла. Пожалуйста, авторизуйтесь заново');
        });

        it('должен выбросить ошибку без повтора для 4xx ошибок (кроме 429)', async () => {
            // Мокируем ответ с ошибкой 404
            const mockResponse = {
                ok: false,
                status: 404,
                statusText: 'Not Found'
            };
            vi.mocked(global.fetch).mockResolvedValue(mockResponse as any);

            // Выполнение запроса
            await expect(fetchWithRetry('/test')).rejects.toThrow('HTTP ошибка: 404');
            
            // Проверяем, что запрос был сделан только один раз (без повторов)
            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(toast.error).toHaveBeenCalled();
        });

        it('должен повторить запрос при ошибке 500 с указанным количеством повторов', async () => {
            // Мокируем первые неудачные ответы и последний успешный
            vi.mocked(global.fetch)
                .mockResolvedValueOnce({
                    ok: false,
                    status: 500,
                    statusText: 'Server Error'
                } as any)
                .mockResolvedValueOnce({
                    ok: false,
                    status: 500,
                    statusText: 'Server Error'
                } as any)
                .mockResolvedValueOnce({
                    ok: true,
                    json: vi.fn().mockResolvedValue({ data: 'success' })
                } as any);

            // Mocking setTimeout properly
            const originalSetTimeout = global.setTimeout;
            const mockSetTimeout = (callback: Function, _ms?: number): NodeJS.Timeout => {
                callback();
                return { unref: () => {} } as unknown as NodeJS.Timeout;
            };
            global.setTimeout = mockSetTimeout as any;

            // Выполнение запроса с 2 повторами (3 попытки всего)
            const result = await fetchWithRetry('/test', { retries: 2, retryDelay: 0 });

            // Восстанавливаем setTimeout
            global.setTimeout = originalSetTimeout;

            // Проверки
            expect(global.fetch).toHaveBeenCalledTimes(3);
            expect(result).toEqual({ data: 'success' });
        });

        it('должен повторить запрос при ошибке 429', async () => {
            // Мокируем ответ с ошибкой 429 (too many requests)
            const mockResponse1 = {
                ok: false,
                status: 429,
                statusText: 'Too Many Requests'
            };
            const mockResponse2 = {
                ok: true,
                json: vi.fn().mockResolvedValue({ data: 'success' })
            };
            
            vi.mocked(global.fetch)
                .mockResolvedValueOnce(mockResponse1 as any)
                .mockResolvedValueOnce(mockResponse2 as any);

            // Mocking setTimeout properly
            const originalSetTimeout = global.setTimeout;
            const mockSetTimeout = (callback: Function, _ms?: number): NodeJS.Timeout => {
                callback();
                return { unref: () => {} } as unknown as NodeJS.Timeout;
            };
            global.setTimeout = mockSetTimeout as any;

            // Выполнение запроса
            const result = await fetchWithRetry('/test', { retries: 1, retryDelay: 0 });

            // Восстанавливаем setTimeout
            global.setTimeout = originalSetTimeout;

            // Проверки
            expect(global.fetch).toHaveBeenCalledTimes(2);
            expect(result).toEqual({ data: 'success' });
        });
    });

    describe('get', () => {
        it('должен быть функцией', () => {
            expect(typeof get).toBe('function');
        });
    });

    describe('post', () => {
        it('должен быть функцией', () => {
            expect(typeof post).toBe('function');
        });
    });

    describe('ApiError', () => {
        it('должен создать экземпляр ApiError с сообщением и статусом', () => {
            const error = new ApiError('Test error', 400, 'Bad Request');
            expect(error).toBeInstanceOf(ApiError);
            expect(error.message).toBe('Test error');
            expect(error.status).toBe(400);
            expect(error.statusText).toBe('Bad Request');
        });

        it('должен создать экземпляр ApiError только с сообщением', () => {
            const error = new ApiError('Test error');
            expect(error).toBeInstanceOf(ApiError);
            expect(error.message).toBe('Test error');
            expect(error.status).toBeUndefined();
            expect(error.statusText).toBeUndefined();
        });
    });
}); 