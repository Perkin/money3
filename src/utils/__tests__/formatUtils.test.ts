import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { formatDate, formatMoney } from '../formatUtils';

describe('formatUtils with Russian locale', () => {
    // Сохраняем оригинальный метод для восстановления после тестов
    const originalToLocaleString = Date.prototype.toLocaleString;
    const originalNumberFormat = Intl.NumberFormat;
    
    beforeAll(() => {
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
    });
    
    afterAll(() => {
        // Восстанавливаем оригинальные методы после тестов
        Date.prototype.toLocaleString = originalToLocaleString;
        // @ts-ignore
        Intl.NumberFormat = originalNumberFormat;
    });

    describe('formatDate', () => {
        it('форматирует дату в виде "год-месяц-день" с русским месяцем', () => {
            const date = new Date('2024-04-15');
            const formatted = formatDate(date);
            expect(formatted).toMatch(/2024-апр-15/);
        });
        
        it('возвращает пустую строку для null', () => {
            const formatted = formatDate(null);
            expect(formatted).toBe('');
        });
        
        it('возвращает пустую строку для undefined', () => {
            const formatted = formatDate(undefined);
            expect(formatted).toBe('');
        });
        
        it('возвращает строку как есть если это не объект Date', () => {
            const notDate = '2024-04-15' as any;
            const formatted = formatDate(notDate);
            expect(formatted).toBe('2024-04-15');
        });
        
        it('добавляет ведущий ноль к дню, если день меньше 10', () => {
            const date = new Date('2024-04-05');
            const formatted = formatDate(date);
            expect(formatted).toMatch(/2024-апр-05/);
        });
    });

    describe('formatMoney', () => {
        it('форматирует положительное число с символом рубля', () => {
            const formatted = formatMoney(1000);
            // Формат "1,000 ₽" с символом рубля после числа
            expect(formatted).toMatch(/1,000[\s\u00A0]₽/);
        });
        
        it('корректно форматирует ноль', () => {
            const formatted = formatMoney(0);
            // Формат "0 ₽" с символом рубля после числа
            expect(formatted).toMatch(/0[\s\u00A0]₽/);
        });
        
        it('форматирует отрицательные значения с символом рубля', () => {
            const formatted = formatMoney(-1000);
            // Формат "-1,000 ₽" с минусом перед числом и символом рубля после
            expect(formatted).toMatch(/-1,000[\s\u00A0]₽/);
        });
        
        it('форматирует десятичные значения', () => {
            const formatted = formatMoney(1000.5);
            // Формат "1,000.5 ₽" с десятичной точкой и символом рубля после
            expect(formatted).toMatch(/1,000\.5[\s\u00A0]₽/);
        });
    });
}); 