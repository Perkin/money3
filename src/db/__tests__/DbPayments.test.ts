import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getPayments, addPayment, updatePayment, closePayment } from '../DbPayments';
import { getDB } from '../Db';
import { defaultIncomeRatio } from '../DbUtils';

// Мокаем зависимости
vi.mock('../Db', () => ({
    getDB: vi.fn()
}));

// Мок для window.dispatchEvent
window.dispatchEvent = vi.fn();

describe('DbPayments', () => {
    let mockStore: any;
    let mockTransaction: any;
    let mockDb: any;
    let mockCursor: any;
    let mockIndex: any;

    beforeEach(() => {
        // Сброс всех моков
        vi.clearAllMocks();

        // Создаем моки для IndexedDB
        mockCursor = {
            value: null,
            advance: vi.fn(),
            continue: vi.fn(),
        };

        mockIndex = {
            getAll: vi.fn(),
            openCursor: vi.fn().mockResolvedValue(mockCursor)
        };

        mockStore = {
            get: vi.fn(),
            getAll: vi.fn(),
            put: vi.fn(),
            index: vi.fn().mockReturnValue(mockIndex)
        };

        mockTransaction = {
            objectStore: vi.fn().mockReturnValue(mockStore),
            done: Promise.resolve()
        };

        mockDb = {
            transaction: vi.fn().mockReturnValue(mockTransaction)
        };

        vi.mocked(getDB).mockResolvedValue(mockDb);
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe('getPayments', () => {
        it('должен получить все платежи без фильтров', async () => {
            // Мокируем возвращаемые данные
            const mockPayments = [
                { id: 1, investId: 1, money: 50, isPayed: 1 },
                { id: 2, investId: 2, money: 100, isPayed: 0 }
            ];
            mockStore.getAll.mockResolvedValue(mockPayments);

            // Выполнение теста
            const result = await getPayments();

            // Проверки
            expect(getDB).toHaveBeenCalled();
            expect(mockDb.transaction).toHaveBeenCalledWith('payments');
            expect(mockTransaction.objectStore).toHaveBeenCalledWith('payments');
            expect(mockStore.getAll).toHaveBeenCalled();
            expect(result).toEqual(mockPayments);
        });

        it('должен фильтровать платежи по ID инвестиции', async () => {
            // Мокируем данные и индекс
            const mockPayments = [
                { id: 1, investId: 1, money: 50, isPayed: 1 }
            ];
            mockIndex.getAll.mockResolvedValue(mockPayments);

            // Выполнение теста
            const result = await getPayments({ id: 1 });

            // Проверки
            expect(mockStore.index).toHaveBeenCalledWith('investIdIdx');
            expect(mockIndex.getAll).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockPayments);
        });

        it('должен фильтровать платежи по статусу оплаты', async () => {
            // Мокируем данные и индекс
            const mockPayments = [
                { id: 2, investId: 2, money: 100, isPayed: 0 }
            ];
            mockIndex.getAll.mockResolvedValue(mockPayments);

            // Выполнение теста
            const result = await getPayments({ isPayed: 0 });

            // Проверки
            expect(mockStore.index).toHaveBeenCalledWith('isPayedIdx');
            expect(mockIndex.getAll).toHaveBeenCalledWith(0);
            expect(result).toEqual(mockPayments);
        });

        it('должен фильтровать платежи по дате обновления', async () => {
            // Настраиваем мок для IDBKeyRange
            global.IDBKeyRange = {
                lowerBound: vi.fn().mockReturnValue('lowerBoundRange')
            } as any;
            
            // Настраиваем мок для индекса
            const mockPayments = [
                { 
                    id: 1, 
                    investId: 1, 
                    money: 50, 
                    updatedAt: new Date('2023-01-02')
                }
            ];
            mockIndex.getAll.mockResolvedValue(mockPayments);
            
            // Выполнение теста с фильтром по дате
            const filterDate = new Date('2023-01-01');
            const result = await getPayments({ updatedAt: filterDate });
            
            // Проверки
            expect(mockStore.index).toHaveBeenCalledWith('updatedAtIdx');
            expect(IDBKeyRange.lowerBound).toHaveBeenCalledWith(filterDate);
            expect(mockIndex.getAll).toHaveBeenCalledWith('lowerBoundRange');
            expect(result).toEqual(mockPayments);
        });
    });

    describe('closePayment', () => {
        it('должен отметить платеж как оплаченный', async () => {
            // Мокируем существующий платеж
            const existingPayment = {
                id: 1,
                investId: 1,
                money: 50,
                isPayed: 0,
                paymentDate: new Date('2023-01-01'),
                updatedAt: new Date('2023-01-01')
            };
            mockStore.get.mockResolvedValue(existingPayment);
            mockStore.put.mockResolvedValue(1);

            // Выполнение теста
            const result = await closePayment(1);

            // Проверки
            expect(mockStore.get).toHaveBeenCalledWith(1);
            expect(mockStore.put).toHaveBeenCalledWith(expect.objectContaining({
                id: 1,
                isPayed: 1,
                updatedAt: expect.any(Date)
            }));
            expect(result).toBe(1);
        });

        it('должен выбросить ошибку, если платеж не найден', async () => {
            // Мокируем отсутствие платежа
            mockStore.get.mockResolvedValue(undefined);

            // Выполнение теста
            await expect(closePayment(999)).rejects.toThrow('Payment not found');
            
            // Проверяем, что put не вызывался
            expect(mockStore.put).not.toHaveBeenCalled();
        });
    });

    describe('addPayment', () => {
        it('должен добавить новый платеж и вернуть его ID', async () => {
            // Мокируем возвращаемый ID
            mockStore.add = vi.fn().mockResolvedValue(1);
            
            // Выполнение теста
            const investId = 1;
            const money = 1000;
            const paymentDate = new Date();
            const result = await addPayment(investId, money, defaultIncomeRatio, paymentDate);
            
            // Проверки
            expect(getDB).toHaveBeenCalled();
            expect(mockDb.transaction).toHaveBeenCalledWith('payments', 'readwrite');
            expect(mockTransaction.objectStore).toHaveBeenCalledWith('payments');
            
            // Проверяем, что платеж добавлен с правильными полями
            expect(mockStore.add).toHaveBeenCalledWith(expect.objectContaining({
                investId: 1,
                money: 50, // 1000 * 0.05 (defaultIncomeRatio)
                isPayed: 0,
                paymentDate,
                updatedAt: expect.any(Date)
            }));
            
            // Проверяем, что возвращен правильный ID
            expect(result).toBe(1);
        });
        
        it('должен использовать пользовательский коэффициент доходности', async () => {
            // Мокируем возвращаемый ID
            mockStore.add = vi.fn().mockResolvedValue(1);
            
            // Выполнение теста с пользовательским коэффициентом
            const investId = 1;
            const money = 1000;
            const customRatio = 0.1; // 10%
            const paymentDate = new Date();
            await addPayment(investId, money, customRatio, paymentDate);
            
            // Проверяем, что использован пользовательский коэффициент
            expect(mockStore.add).toHaveBeenCalledWith(expect.objectContaining({
                money: 100, // 1000 * 0.1
            }));
        });
    });

    describe('updatePayment', () => {
        it('должен обновить существующий платеж', async () => {
            // Мокируем существующий платеж
            const existingPayment = {
                id: 1,
                investId: 1,
                money: 50,
                isPayed: 0,
                paymentDate: new Date('2023-01-01'),
                updatedAt: new Date('2023-01-01')
            };
            mockStore.get.mockResolvedValue(existingPayment);

            // Данные для обновления
            const updates = {
                isPayed: 1,
                money: 75
            };

            // Выполнение теста
            const result = await updatePayment(1, updates);

            // Проверки
            expect(mockStore.get).toHaveBeenCalledWith(1);
            expect(mockStore.put).toHaveBeenCalledWith(expect.objectContaining({
                id: 1,
                investId: 1,
                money: 75,
                isPayed: 1,
                updatedAt: expect.any(Date)
            }));
            expect(window.dispatchEvent).toHaveBeenCalled();
        });

        it('должен выбросить ошибку, если платеж не найден', async () => {
            // Мокируем отсутствие платежа
            mockStore.get.mockResolvedValue(undefined);

            // Выполнение теста
            await expect(updatePayment(999, { isPayed: 1 })).rejects.toThrow('Платеж не найден');
            
            // Проверяем, что put не вызывался
            expect(mockStore.put).not.toHaveBeenCalled();
            expect(window.dispatchEvent).not.toHaveBeenCalled();
        });
    });
}); 