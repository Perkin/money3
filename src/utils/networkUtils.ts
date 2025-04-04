import { toast } from 'react-toastify';
import { API_URL } from '@/config';

interface RequestConfig extends RequestInit {
    retries?: number;
    retryDelay?: number;
}

interface NetworkError extends Error {
    status?: number;
    statusText?: string;
}

export class ApiError extends Error {
    constructor(
        message: string,
        public status?: number,
        public statusText?: string
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

const defaultRetryConfig = {
    retries: 3,
    retryDelay: 1000,
};

/**
 * Выполняет сетевой запрос с автоматическими повторными попытками при ошибке
 */
export async function fetchWithRetry<T>(
    url: string,
    config: RequestConfig = {}
): Promise<T> {
    const { retries = defaultRetryConfig.retries, retryDelay = defaultRetryConfig.retryDelay, ...fetchConfig } = config;
    let lastError: NetworkError | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new ApiError('Токен не найден', 401);
            }

            const response = await fetch(API_URL + url, {
                ...fetchConfig,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    ...fetchConfig.headers,
                },
            });

            if (!response.ok) {
                const error = new ApiError(
                    `HTTP ошибка: ${response.status}`,
                    response.status,
                    response.statusText
                );

                if (response.status === 401) {
                    toast.error('Сессия истекла. Пожалуйста, авторизуйтесь заново');
                    throw error;
                }

                // Не повторяем запрос при ошибках 4xx (кроме 429 - too many requests)
                if (response.status < 500 && response.status !== 429) {
                    throw error;
                }

                throw error;
            }

            const data = await response.json();
            return data as T;
        } catch (error) {
            lastError = error as NetworkError;

            // Если это последняя попытка или ошибка не подлежит повтору - выбрасываем её
            if (
                attempt === retries ||
                (error instanceof ApiError && error.status && error.status < 500 && error.status !== 429)
            ) {
                const errorMessage = error instanceof ApiError 
                    ? error.message 
                    : 'Произошла сетевая ошибка';
                
                toast.error(errorMessage);
                throw error;
            }

            // Ждём перед следующей попыткой
            await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        }
    }

    throw lastError || new Error('Неизвестная ошибка');
}

/**
 * Отправляет GET запрос
 */
export async function get<T>(url: string, config: RequestConfig = {}): Promise<T> {
    return fetchWithRetry<T>(url, {
        method: 'GET',
        ...config,
    });
}

/**
 * Отправляет POST запрос
 */
export async function post<T>(url: string, data: unknown, config: RequestConfig = {}): Promise<T> {
    return fetchWithRetry<T>(url, {
        method: 'POST',
        body: JSON.stringify(data),
        ...config,
    });
} 