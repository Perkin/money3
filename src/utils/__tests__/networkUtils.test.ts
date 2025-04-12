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

        it('должен вызывать fetchWithRetry с методом GET', async () => {
            // Сохраняем оригинальную функцию fetchWithRetry
            const originalFetch = global.fetch;
            
            // Мокируем fetch, чтобы он возвращал успешный результат
            const mockResponse = {
                ok: true,
                json: vi.fn().mockResolvedValue({ data: 'test' })
            };
            global.fetch = vi.fn().mockResolvedValue(mockResponse as any);
            
            // Вызываем get
            const result = await get('/test-get', { headers: { 'X-Test': 'true' } });
            
            // Проверяем, что fetch был вызван с правильными параметрами
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/test-get'),
                expect.objectContaining({
                    method: 'GET',
                    headers: expect.objectContaining({
                        'X-Test': 'true'
                    })
                })
            );
            
            expect(result).toEqual({ data: 'test' });
            
            // Восстанавливаем оригинальную функцию
            global.fetch = originalFetch;
        });
    });

    describe('post', () => {
        it('должен быть функцией', () => {
            expect(typeof post).toBe('function');
        });

        it('должен вызывать fetchWithRetry с методом POST и телом запроса', async () => {
            // Сохраняем оригинальную функцию fetch
            const originalFetch = global.fetch;
            
            // Мокируем fetch, чтобы он возвращал успешный результат
            const mockResponse = {
                ok: true,
                json: vi.fn().mockResolvedValue({ success: true })
            };
            global.fetch = vi.fn().mockResolvedValue(mockResponse as any);
            
            const postData = { name: 'test', value: 123 };
            
            // Вызываем post
            const result = await post('/test-post', postData, { headers: { 'X-Test': 'true' } });
            
            // Проверяем, что fetch был вызван с правильными параметрами
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/test-post'),
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(postData),
                    headers: expect.objectContaining({
                        'X-Test': 'true'
                    })
                })
            );
            
            expect(result).toEqual({ success: true });
            
            // Восстанавливаем оригинальную функцию
            global.fetch = originalFetch;
        });
    });

    it('должен исчерпать все попытки и выбросить последнюю ошибку', async () => {
        // Мокируем ответы с одинаковой ошибкой 500
        const mockResponse = {
            ok: false,
            status: 500,
            statusText: 'Server Error'
        };
        
        vi.mocked(global.fetch)
            .mockResolvedValueOnce(mockResponse as any)
            .mockResolvedValueOnce(mockResponse as any)
            .mockResolvedValueOnce(mockResponse as any);

        // Mocking setTimeout properly
        const originalSetTimeout = global.setTimeout;
        const mockSetTimeout = (callback: Function, _ms?: number): NodeJS.Timeout => {
            callback();
            return { unref: () => {} } as unknown as NodeJS.Timeout;
        };
        global.setTimeout = mockSetTimeout as any;

        // Выполнение запроса с 2 повторами (3 попытки всего)
        await expect(fetchWithRetry('/test', { retries: 2, retryDelay: 0 }))
            .rejects.toThrow('HTTP ошибка: 500');

        // Восстанавливаем setTimeout
        global.setTimeout = originalSetTimeout;

        // Проверки
        expect(global.fetch).toHaveBeenCalledTimes(3);
        expect(toast.error).toHaveBeenCalled();
    });

    it('должен обрабатывать сетевые ошибки, не являющиеся экземплярами ApiError', async () => {
        // Мокируем ошибку сети (не ApiError)
        const networkError = new Error('Network error');
        vi.mocked(global.fetch).mockRejectedValue(networkError);

        // Mocking setTimeout properly
        const originalSetTimeout = global.setTimeout;
        const mockSetTimeout = (callback: Function, _ms?: number): NodeJS.Timeout => {
            callback();
            return { unref: () => {} } as unknown as NodeJS.Timeout;
        };
        global.setTimeout = mockSetTimeout as any;

        // Выполнение запроса с 1 повтором (2 попытки всего)
        await expect(fetchWithRetry('/test', { retries: 1, retryDelay: 0 }))
            .rejects.toThrow('Network error');

        // Восстанавливаем setTimeout
        global.setTimeout = originalSetTimeout;

        // Проверки
        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(toast.error).toHaveBeenCalledWith('Произошла сетевая ошибка');
    });

    it('должен выбросить неизвестную ошибку, если lastError не установлен', async () => {
        // Создаем mock для fetch, который выбрасывает неизвестную ошибку
        vi.mocked(global.fetch).mockImplementation(() => {
            throw new Error('Неизвестная ошибка');
        });

        // Выполнение запроса с 0 повторами (только 1 попытка)
        await expect(fetchWithRetry('/test', { retries: 0 }))
            .rejects.toThrow('Неизвестная ошибка');

        // Проверки
        expect(global.fetch).toHaveBeenCalledTimes(1);
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

    // Дополнительные тесты для увеличения покрытия кода
    it('должен выполнять повторные запросы с увеличением задержки', async () => {
        // Мокируем fetch, первые два вызова завершаются с ошибкой, третий - успешно
        vi.mocked(global.fetch)
            .mockResolvedValueOnce({
                ok: false,
                status: 503,
                statusText: 'Service Unavailable'
            } as any)
            .mockResolvedValueOnce({
                ok: false,
                status: 503,
                statusText: 'Service Unavailable'
            } as any)
            .mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue({ data: 'success after retries' })
            } as any);

        // Мокирование setTimeout с проверкой передаваемой задержки
        const originalSetTimeout = global.setTimeout;
        const mockSetTimeoutWithDelay = vi.fn().mockImplementation((callback: Function, ms?: number) => {
            callback(); // Сразу выполняем callback для ускорения теста
            return { unref: () => {} } as unknown as NodeJS.Timeout;
        });
        global.setTimeout = mockSetTimeoutWithDelay as any;

        try {
            // Выполняем запрос с настройками для тестирования увеличивающейся задержки
            const result = await fetchWithRetry('/test-delay', { 
                retries: 2, 
                retryDelay: 1000 // Базовая задержка 1000мс
            });

            // Проверяем, что запрос в итоге выполнился успешно
            expect(result).toEqual({ data: 'success after retries' });

            // Проверяем, что setTimeout был вызван дважды (для двух повторных попыток)
            expect(mockSetTimeoutWithDelay).toHaveBeenCalledTimes(2);
            
            // Проверяем, что задержка увеличивается с каждой попыткой
            expect(mockSetTimeoutWithDelay).toHaveBeenNthCalledWith(1, expect.any(Function), 1000);
            expect(mockSetTimeoutWithDelay).toHaveBeenNthCalledWith(2, expect.any(Function), 2000);

        } finally {
            // Восстанавливаем оригинальный setTimeout
            global.setTimeout = originalSetTimeout;
        }
    });

    it('должен обрабатывать ошибку парсинга JSON', async () => {
        // Очищаем моки перед тестом
        vi.clearAllMocks();
        
        // Мокируем ответ, в котором json() выбрасывает ошибку
        const mockResponse = {
            ok: true,
            json: vi.fn().mockRejectedValue(new Error('Invalid JSON'))
        };
        vi.mocked(global.fetch).mockResolvedValue(mockResponse as any);
        
        // Отключаем повторные попытки для этого теста
        await expect(fetchWithRetry('/test-json-error', { retries: 0 }))
            .rejects.toThrow('Invalid JSON');
            
        // Проверяем, что fetch был вызван только один раз
        expect(global.fetch).toHaveBeenCalledTimes(1);
        
        // Проверяем, что toast.error был вызван с сообщением о сетевой ошибке
        expect(toast.error).toHaveBeenCalledWith('Произошла сетевая ошибка');
    });

    it('должен использовать параметры конфигурации по умолчанию', async () => {
        // Мокируем успешный ответ
        const mockResponse = {
            ok: true,
            json: vi.fn().mockResolvedValue({ data: 'default config test' })
        };
        vi.mocked(global.fetch).mockResolvedValue(mockResponse as any);

        // Выполняем запрос без дополнительных параметров
        const result = await fetchWithRetry('/test-default-config');

        // Проверяем, что запрос выполнен успешно
        expect(result).toEqual({ data: 'default config test' });

        // Проверяем, что fetch был вызван с правильными параметрами
        expect(global.fetch).toHaveBeenCalledWith(
            'https://api.example.com/test-default-config',
            expect.objectContaining({
                headers: expect.objectContaining({
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer test-token'
                })
            })
        );
    });

    it('должен корректно обрабатывать дополнительные заголовки', async () => {
        // Мокируем успешный ответ
        const mockResponse = {
            ok: true,
            json: vi.fn().mockResolvedValue({ data: 'custom headers test' })
        };
        vi.mocked(global.fetch).mockResolvedValue(mockResponse as any);

        // Выполняем запрос с дополнительными заголовками
        const result = await fetchWithRetry('/test-headers', {
            headers: {
                'X-Custom-Header': 'test-value',
                'Content-Type': 'application/xml' // Проверяем, что этот заголовок переопределяет стандартный
            }
        });

        // Проверяем, что запрос выполнен успешно
        expect(result).toEqual({ data: 'custom headers test' });

        // Проверяем, что fetch был вызван с объединенными заголовками
        expect(global.fetch).toHaveBeenCalledWith(
            'https://api.example.com/test-headers',
            expect.objectContaining({
                headers: expect.objectContaining({
                    'Content-Type': 'application/xml', // Заголовок должен быть переопределен
                    'X-Custom-Header': 'test-value',
                    'Authorization': 'Bearer test-token'
                })
            })
        );
    });
}); 