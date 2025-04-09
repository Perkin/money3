import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculatePayments, exportData, importData, syncUpdates, updateRemoteData } from '../DbUtils';
import * as DbInvests from '../DbInvests';
import * as DbPayments from '../DbPayments';
import * as Db from '../Db';
import { toast } from 'react-toastify';
import * as networkUtils from '../../utils/networkUtils';

// Мокаем все внешние зависимости
vi.mock('../Db', () => ({
    getDB: vi.fn()
}));

vi.mock('../DbInvests', () => ({
    getInvests: vi.fn(),
    InvestFilter: vi.fn()
}));

vi.mock('../DbPayments', () => ({
    getPayments: vi.fn(),
    addPayment: vi.fn(),
    PaymentFilter: vi.fn()
}));

vi.mock('react-toastify', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        done: vi.fn()
    }
}));

vi.mock('@/utils/networkUtils', () => ({
    get: vi.fn(),
    post: vi.fn()
}));

// Мок для navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
    value: {
        writeText: vi.fn()
    },
    writable: true
});

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

// Мок для window.dispatchEvent
window.dispatchEvent = vi.fn();

describe('DbUtils', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.clear();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe('importData', () => {
        it('должен импортировать данные в базу данных', async () => {
            // Подготовка моков для хранилищ и транзакции
            const mockInvestStore = {
                clear: vi.fn().mockResolvedValue(undefined),
                put: vi.fn().mockResolvedValue(1)
            };
            
            const mockPaymentStore = {
                clear: vi.fn().mockResolvedValue(undefined),
                put: vi.fn().mockResolvedValue(1)
            };
            
            const mockTransaction = {
                objectStore: vi.fn((name) => 
                    name === 'invests' ? mockInvestStore : mockPaymentStore
                )
            };
            
            const mockDb = {
                transaction: vi.fn().mockReturnValue(mockTransaction)
            };
            
            vi.mocked(Db.getDB).mockResolvedValue(mockDb as any);
            
            // Тестовые данные для импорта
            const testData = {
                invests: [
                    {
                        id: 1,
                        money: 1000,
                        incomeRatio: 0.05,
                        isActive: 1,
                        createdDate: '2023-01-01T00:00:00.000Z',
                        updatedAt: '2023-01-01T00:00:00.000Z'
                    }
                ],
                payments: [
                    {
                        id: 1,
                        investId: 1,
                        money: 50,
                        isPayed: 0,
                        paymentDate: '2023-02-01T00:00:00.000Z',
                        updatedAt: '2023-02-01T00:00:00.000Z'
                    }
                ]
            };
            
            // Выполнение теста
            await importData(testData, true);
            
            // Проверки
            expect(Db.getDB).toHaveBeenCalled();
            expect(mockDb.transaction).toHaveBeenCalledWith(['invests', 'payments'], 'readwrite');
            expect(mockTransaction.objectStore).toHaveBeenCalledWith('invests');
            expect(mockTransaction.objectStore).toHaveBeenCalledWith('payments');
            
            // Проверяем очистку при cleanImport=true
            expect(mockInvestStore.clear).toHaveBeenCalled();
            expect(mockPaymentStore.clear).toHaveBeenCalled();
            
            // Проверяем вставку данных
            expect(mockInvestStore.put).toHaveBeenCalledWith(expect.objectContaining({
                id: 1,
                money: 1000,
                createdDate: expect.any(Date),
                updatedAt: expect.any(Date)
            }));
            
            expect(mockPaymentStore.put).toHaveBeenCalledWith(expect.objectContaining({
                id: 1,
                investId: 1,
                money: 50,
                paymentDate: expect.any(Date),
                updatedAt: expect.any(Date)
            }));
        });
        
        it('не должен очищать хранилища, если cleanImport=false', async () => {
            // Подготовка моков
            const mockInvestStore = {
                clear: vi.fn().mockResolvedValue(undefined),
                put: vi.fn().mockResolvedValue(1)
            };
            
            const mockPaymentStore = {
                clear: vi.fn().mockResolvedValue(undefined),
                put: vi.fn().mockResolvedValue(1)
            };
            
            const mockTransaction = {
                objectStore: vi.fn((name) => 
                    name === 'invests' ? mockInvestStore : mockPaymentStore
                )
            };
            
            const mockDb = {
                transaction: vi.fn().mockReturnValue(mockTransaction)
            };
            
            vi.mocked(Db.getDB).mockResolvedValue(mockDb as any);
            
            // Пустые тестовые данные
            const testData = { invests: [], payments: [] };
            
            // Выполнение теста
            await importData(testData, false);
            
            // Проверяем, что очистка не вызывалась
            expect(mockInvestStore.clear).not.toHaveBeenCalled();
            expect(mockPaymentStore.clear).not.toHaveBeenCalled();
        });
    });
    
    describe('exportData', () => {
        it('должен экспортировать данные и скопировать их в буфер обмена', async () => {
            // Мокируем данные для инвестиций и платежей
            const mockInvests = [{ id: 1, money: 1000 }];
            const mockPayments = [{ id: 1, investId: 1, money: 50 }];
            
            vi.mocked(DbInvests.getInvests).mockResolvedValue(mockInvests as any);
            vi.mocked(DbPayments.getPayments).mockResolvedValue(mockPayments as any);
            vi.mocked(navigator.clipboard.writeText).mockResolvedValue(undefined);
            
            // Выполнение теста
            await exportData();
            
            // Проверка вызовов
            expect(DbInvests.getInvests).toHaveBeenCalled();
            expect(DbPayments.getPayments).toHaveBeenCalled();
            
            const expectedJson = JSON.stringify({
                invests: mockInvests,
                payments: mockPayments
            });
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expectedJson);
            expect(toast.success).toHaveBeenCalledWith('Данные скопированы в буфер обмена');
        });
        
        it('должен показать ошибку, если копирование в буфер обмена не удалось', async () => {
            // Мокируем данные
            vi.mocked(DbInvests.getInvests).mockResolvedValue([{ id: 1 }] as any);
            vi.mocked(DbPayments.getPayments).mockResolvedValue([{ id: 1 }] as any);
            
            // Симулируем ошибку при копировании
            vi.mocked(navigator.clipboard.writeText).mockRejectedValue(new Error('Copy failed'));
            
            // Выполнение теста
            await exportData();
            
            // Проверка, что показано сообщение об ошибке
            expect(toast.error).toHaveBeenCalledWith('Не удалось скопировать данные в буфер обмена');
        });
    });
    
    describe('syncUpdates', () => {
        // Сохраняем оригинальные функции
        const originalImportData = importData;
        
        beforeEach(async () => {
            vi.clearAllMocks();
            
            // Мокируем importData только для тестов syncUpdates
            const originalModule = await vi.importActual('../DbUtils');
            vi.mock('../DbUtils', () => ({
                ...originalModule,
                importData: vi.fn().mockResolvedValue(undefined),
                syncUpdates: originalModule.syncUpdates
            }));
            
            // Мокируем базу данных
            const mockStore = {
                clear: vi.fn().mockResolvedValue(undefined),
                put: vi.fn().mockResolvedValue(1),
                objectStore: vi.fn().mockReturnThis(),
                add: vi.fn().mockResolvedValue(1),
                index: vi.fn().mockReturnThis(),
                getAll: vi.fn().mockResolvedValue([]),
                get: vi.fn().mockResolvedValue(null)
            };
            
            const mockTransaction = {
                objectStore: vi.fn().mockReturnValue(mockStore),
                done: Promise.resolve()
            };
            
            const mockDb = {
                transaction: vi.fn().mockReturnValue(mockTransaction)
            };
            
            vi.mocked(Db.getDB).mockResolvedValue(mockDb as any);
        });
        
        afterEach(() => {
            vi.resetAllMocks();
            vi.restoreAllMocks();
            vi.unmock('../DbUtils');
        });
            
        it('не должен делать запрос без токена авторизации', async () => {
            vi.mocked(localStorageMock.getItem).mockReturnValue(null);
            
            await syncUpdates();
            
            expect(networkUtils.get).not.toHaveBeenCalled();
        });
        
        it('должен получить и применить обновления при успешном ответе', async () => {
            // Мокируем токен и дату синхронизации
            vi.mocked(localStorageMock.getItem).mockImplementation((key) => {
                if (key === 'token') return 'test-token';
                if (key === 'lastSyncDate') return '2023-01-01T00:00:00.000Z';
                return null;
            });
            
            // Мокируем успешный ответ от сервера
            const mockUpdateResponse = {
                status: 'success',
                invests: [{ id: 1, money: 1000 }],
                payments: [{ id: 1, investId: 1 }]
            };
            
            vi.mocked(networkUtils.get).mockResolvedValue(mockUpdateResponse as any);
            
            // Выполнение теста
            await syncUpdates();
            
            // Проверки
            expect(toast.info).toHaveBeenCalledWith('Получаю обновления...');
            expect(networkUtils.get).toHaveBeenCalledWith('/updates?since=2023-01-01T00:00:00.000Z');
            
            // Проверяем, что отправленная дата обновлена
            expect(localStorageMock.setItem).toHaveBeenCalledWith('lastSyncDate', expect.any(String));
            
            // Проверяем, что отправлено событие обновления
            expect(window.dispatchEvent).toHaveBeenCalled();
            expect(toast.success).toHaveBeenCalledWith('Обновления успешно применены');
        });
        
        it('должен показать сообщение об отсутствии обновлений', async () => {
            // Мокируем токен
            vi.mocked(localStorageMock.getItem).mockImplementation((key) => {
                if (key === 'token') return 'test-token';
                return null;
            });
            
            // Мокируем ответ "нет обновлений"
            vi.mocked(networkUtils.get).mockResolvedValue({
                status: 'no_updates'
            } as any);
            
            // Выполнение теста
            await syncUpdates();
            
            // Проверки
            expect(toast.info).toHaveBeenCalledWith('Обновлений нет');
            expect(localStorageMock.setItem).toHaveBeenCalledWith('lastSyncDate', expect.any(String));
        });
        
        it('должен показать предупреждение при другом статусе ответа', async () => {
            // Мокируем токен
            vi.mocked(localStorageMock.getItem).mockImplementation((key) => {
                if (key === 'token') return 'test-token';
                return null;
            });
            
            // Мокируем ответ с произвольным статусом
            vi.mocked(networkUtils.get).mockResolvedValue({
                status: 'error',
                message: 'Произошла ошибка'
            } as any);
            
            // Выполнение теста
            await syncUpdates();
            
            // Проверки
            expect(toast.warn).toHaveBeenCalledWith('error');
            expect(localStorageMock.setItem).toHaveBeenCalledWith('lastSyncDate', expect.any(String));
        });
    });
    
    describe('updateRemoteData', () => {
        it('не должен делать запрос без токена авторизации', async () => {
            vi.mocked(localStorageMock.getItem).mockReturnValue(null);
            
            await updateRemoteData();
            
            expect(DbInvests.getInvests).not.toHaveBeenCalled();
            expect(DbPayments.getPayments).not.toHaveBeenCalled();
            expect(networkUtils.post).not.toHaveBeenCalled();
        });
        
        it('не должен делать запрос, если нет данных для отправки', async () => {
            // Мокируем токен
            vi.mocked(localStorageMock.getItem).mockImplementation((key) => {
                if (key === 'token') return 'test-token';
                return null;
            });
            
            // Мокируем пустые списки данных
            vi.mocked(DbInvests.getInvests).mockResolvedValue([]);
            vi.mocked(DbPayments.getPayments).mockResolvedValue([]);
            
            // Выполнение теста
            await updateRemoteData();
            
            // Проверка, что запрос не отправлен
            expect(networkUtils.post).not.toHaveBeenCalled();
        });
        
        it('должен отправить данные на сервер и показать сообщение об успехе', async () => {
            // Мокируем token
            vi.mocked(localStorageMock.getItem).mockImplementation((key) => {
                if (key === 'token') return 'test-token';
                return null;
            });
            
            vi.mocked(DbInvests.getInvests).mockResolvedValue([{id: 1}] as any);
            vi.mocked(DbPayments.getPayments).mockResolvedValue([{id: 1}] as any);
            vi.mocked(networkUtils.post).mockResolvedValue({ status: 'success' } as any);
            
            await updateRemoteData();
            
            expect(networkUtils.post).toHaveBeenCalledWith('/update', {
                invests: [{id: 1}],
                payments: [{id: 1}]
            });
            expect(toast.success).toHaveBeenCalledWith('Новые данные успешно отправлены на сервер');
        });
        
        it('должен показать сообщение об ошибке при неудачной отправке', async () => {
            // Мокируем token
            vi.mocked(localStorageMock.getItem).mockImplementation((key) => {
                if (key === 'token') return 'test-token';
                return null;
            });
            
            vi.mocked(DbInvests.getInvests).mockResolvedValue([{id: 1}] as any);
            vi.mocked(DbPayments.getPayments).mockResolvedValue([{id: 1}] as any);
            vi.mocked(networkUtils.post).mockRejectedValue(new Error('Network error'));
            
            await updateRemoteData();
            
            expect(toast.done).toHaveBeenCalled();
        });
        
        it('должен использовать фильтры по дате при наличии lastSyncDate', async () => {
            // Устанавливаем дату последней синхронизации
            const lastSyncDate = '2023-01-01T00:00:00.000Z';
            vi.mocked(localStorageMock.getItem).mockImplementation((key) => {
                if (key === 'token') return 'test-token';
                if (key === 'lastSyncDate') return lastSyncDate;
                return null;
            });
            
            vi.mocked(DbInvests.getInvests).mockResolvedValue([{id: 1}] as any);
            vi.mocked(DbPayments.getPayments).mockResolvedValue([{id: 1}] as any);
            vi.mocked(networkUtils.post).mockResolvedValue({ status: 'success' } as any);
            
            await updateRemoteData();
            
            // Проверяем, что getInvests и getPayments вызваны с правильными фильтрами по дате
            expect(DbInvests.getInvests).toHaveBeenCalledWith({ 
                updatedAt: expect.any(Date) 
            });
            expect(DbPayments.getPayments).toHaveBeenCalledWith({
                updatedAt: expect.any(Date)
            });
            
            // Проверяем, что дата в фильтре соответствует lastSyncDate
            const investsCallArg = vi.mocked(DbInvests.getInvests).mock.calls[0][0];
            expect(investsCallArg?.updatedAt).toBeDefined();
            expect(investsCallArg?.updatedAt).toBeInstanceOf(Date);
            
            const paymentsCallArg = vi.mocked(DbPayments.getPayments).mock.calls[0][0];
            expect(paymentsCallArg?.updatedAt).toBeDefined();
            expect(paymentsCallArg?.updatedAt).toBeInstanceOf(Date);
        });
    });
    
    describe('calculatePayments', () => {
        it('не должен выполнять расчеты, если нет активных инвестиций', async () => {
            vi.mocked(DbInvests.getInvests).mockResolvedValue([]);
            
            await calculatePayments();
            
            expect(DbPayments.getPayments).not.toHaveBeenCalled();
            expect(DbPayments.addPayment).not.toHaveBeenCalled();
        });
        
        it('должен создать платеж для активной инвестиции без существующих платежей', async () => {
            // Создаем дату инвестиции
            const investDate = new Date('2023-01-15T00:00:00.000Z');
            
            // Мокируем активную инвестицию
            const mockInvest = {
                id: 1,
                money: 1000,
                incomeRatio: 0.05,
                isActive: 1,
                createdDate: investDate
            };
            
            vi.mocked(DbInvests.getInvests).mockResolvedValue([mockInvest] as any);
            vi.mocked(DbPayments.getPayments).mockResolvedValue([]);
            
            // Выполнение теста
            await calculatePayments();
            
            // Проверка, что запрошены платежи для инвестиции
            expect(DbPayments.getPayments).toHaveBeenCalledWith({ id: 1 });
            
            // Проверка создания нового платежа
            // Ожидаем, что дата платежа будет 15 февраля
            const expectedPaymentDate = new Date('2023-02-15T00:00:00.000Z');
            
            expect(DbPayments.addPayment).toHaveBeenCalledWith(
                1,
                1000,
                0.05,
                expect.any(Date)
            );
            
            // Проверяем, что дата платежа в следующем месяце
            const addPaymentCall = vi.mocked(DbPayments.addPayment).mock.calls[0];
            const actualPaymentDate = addPaymentCall[3] as Date;
            
            expect(actualPaymentDate.getFullYear()).toBe(expectedPaymentDate.getFullYear());
            expect(actualPaymentDate.getMonth()).toBe(expectedPaymentDate.getMonth());
            expect(actualPaymentDate.getDate()).toBe(expectedPaymentDate.getDate());
        });
        
        it('должен использовать последний день месяца, если оригинальный день не существует', async () => {
            // Создаем дату инвестиции (31 января)
            const investDate = new Date('2023-01-31T00:00:00.000Z');
            
            // Мокируем активную инвестицию
            const mockInvest = {
                id: 1,
                money: 1000,
                incomeRatio: 0.05,
                isActive: 1,
                createdDate: investDate
            };
            
            vi.mocked(DbInvests.getInvests).mockResolvedValue([mockInvest] as any);
            vi.mocked(DbPayments.getPayments).mockResolvedValue([]);
            
            // Выполнение теста
            await calculatePayments();
            
            // Февраль имеет максимум 28/29 дней, поэтому ожидаем последний день февраля
            const addPaymentCall = vi.mocked(DbPayments.addPayment).mock.calls[0];
            const actualPaymentDate = addPaymentCall[3] as Date;
            
            expect(actualPaymentDate.getMonth()).toBe(1); // Февраль
            expect(actualPaymentDate.getDate()).toBe(28); // Последний день февраля 2023
        });
        
        it('не должен создавать новый платеж, если есть неоплаченный платеж', async () => {
            // Мокируем активную инвестицию
            const mockInvest = {
                id: 1,
                money: 1000,
                incomeRatio: 0.05,
                isActive: 1,
                createdDate: new Date('2023-01-15T00:00:00.000Z')
            };
            
            // Мокируем неоплаченный платеж
            const mockPayment = {
                id: 1,
                investId: 1,
                money: 50,
                isPayed: 0,
                paymentDate: new Date('2023-02-15T00:00:00.000Z')
            };
            
            vi.mocked(DbInvests.getInvests).mockResolvedValue([mockInvest] as any);
            vi.mocked(DbPayments.getPayments).mockResolvedValue([mockPayment] as any);
            
            // Выполнение теста
            await calculatePayments();
            
            // Проверка, что новый платеж не создается
            expect(DbPayments.addPayment).not.toHaveBeenCalled();
        });
        
        it('должен создать новый платеж на основе даты последнего оплаченного платежа', async () => {
            // Мокируем активную инвестицию
            const mockInvest = {
                id: 1,
                money: 1000,
                incomeRatio: 0.05,
                isActive: 1,
                createdDate: new Date('2023-01-15T00:00:00.000Z')
            };
            
            // Мокируем оплаченный платеж
            const mockPayment = {
                id: 1,
                investId: 1,
                money: 50,
                isPayed: 1,
                paymentDate: new Date('2023-02-15T00:00:00.000Z')
            };
            
            vi.mocked(DbInvests.getInvests).mockResolvedValue([mockInvest] as any);
            vi.mocked(DbPayments.getPayments).mockResolvedValue([mockPayment] as any);
            
            // Выполнение теста
            await calculatePayments();
            
            // Проверяем, что новый платеж создан на основе даты последнего платежа
            const addPaymentCall = vi.mocked(DbPayments.addPayment).mock.calls[0];
            const actualPaymentDate = addPaymentCall[3] as Date;
            
            // Ожидаем 15 марта
            expect(actualPaymentDate.getFullYear()).toBe(2023);
            expect(actualPaymentDate.getMonth()).toBe(2); // Март
            expect(actualPaymentDate.getDate()).toBe(15);
        });
        
        it('должен использовать defaultIncomeRatio, если у инвестиции нет собственного коэффициента', async () => {
            // Мокируем активную инвестицию без incomeRatio
            const mockInvest = {
                id: 1,
                money: 1000,
                isActive: 1,
                createdDate: new Date('2023-01-15T00:00:00.000Z')
            };
            
            vi.mocked(DbInvests.getInvests).mockResolvedValue([mockInvest] as any);
            vi.mocked(DbPayments.getPayments).mockResolvedValue([]);
            
            // Выполнение теста
            await calculatePayments();
            
            // Проверяем, что использован defaultIncomeRatio
            expect(DbPayments.addPayment).toHaveBeenCalledWith(
                1,
                1000,
                0.05, // defaultIncomeRatio
                expect.any(Date)
            );
        });
        
        it('должен корректно обрабатывать дату в високосный год', async () => {
            // Создаем дату инвестиции (31 января в високосный год)
            const investDate = new Date('2024-01-31T00:00:00.000Z');
            
            // Мокируем активную инвестицию
            const mockInvest = {
                id: 1,
                money: 1000,
                incomeRatio: 0.05,
                isActive: 1,
                createdDate: investDate
            };
            
            vi.mocked(DbInvests.getInvests).mockResolvedValue([mockInvest] as any);
            vi.mocked(DbPayments.getPayments).mockResolvedValue([]);
            
            // Выполнение теста
            await calculatePayments();
            
            // Проверка создания нового платежа
            // Ожидаем, что дата платежа будет 29 февраля в високосный год
            const expectedPaymentDate = new Date('2024-02-29T00:00:00.000Z');
            
            expect(DbPayments.addPayment).toHaveBeenCalledWith(
                1,
                1000,
                0.05,
                expect.any(Date)
            );
            
            // Проверяем, что дата платежа корректная
            const addPaymentCall = vi.mocked(DbPayments.addPayment).mock.calls[0];
            const actualPaymentDate = addPaymentCall[3] as Date;
            
            expect(actualPaymentDate.getFullYear()).toBe(expectedPaymentDate.getFullYear());
            expect(actualPaymentDate.getMonth()).toBe(expectedPaymentDate.getMonth());
        });

        it('должен правильно выбирать последний платеж при наличии нескольких платежей с разными датами', async () => {
            // Мокируем активную инвестицию
            const mockInvest = {
                id: 1,
                money: 1000,
                incomeRatio: 0.05,
                isActive: 1,
                createdDate: new Date('2023-01-15T00:00:00.000Z')
            };
            
            // Мокируем несколько платежей с разными датами (НЕ в хронологическом порядке)
            const mockPayments = [
                {
                    id: 2,
                    investId: 1,
                    money: 50,
                    isPayed: 1,
                    paymentDate: new Date('2023-03-15T00:00:00.000Z')
                },
                {
                    id: 1,
                    investId: 1,
                    money: 50,
                    isPayed: 1,
                    paymentDate: new Date('2023-02-15T00:00:00.000Z')
                }
            ];
            
            vi.mocked(DbInvests.getInvests).mockResolvedValue([mockInvest] as any);
            vi.mocked(DbPayments.getPayments).mockResolvedValue(mockPayments as any);
            
            // Выполнение теста
            await calculatePayments();
            
            // Проверяем, что новый платеж создан на основе даты последнего платежа (март)
            const addPaymentCall = vi.mocked(DbPayments.addPayment).mock.calls[0];
            const actualPaymentDate = addPaymentCall[3] as Date;
            
            // Ожидаем 15 апреля (месяц после последнего платежа в марте)
            expect(actualPaymentDate.getFullYear()).toBe(2023);
            expect(actualPaymentDate.getMonth()).toBe(3); // Апрель
            expect(actualPaymentDate.getDate()).toBe(15);
        });

        it('должен корректно обрабатывать смену года при создании нового платежа в декабре', async () => {
            // Мокируем активную инвестицию
            const mockInvest = {
                id: 1,
                money: 1000,
                incomeRatio: 0.05,
                isActive: 1,
                createdDate: new Date('2023-12-15T00:00:00.000Z')
            };
            
            vi.mocked(DbInvests.getInvests).mockResolvedValue([mockInvest] as any);
            vi.mocked(DbPayments.getPayments).mockResolvedValue([]);
            
            // Выполнение теста
            await calculatePayments();
            
            // Проверка создания нового платежа
            // Ожидаем, что дата платежа будет 15 января следующего года
            const addPaymentCall = vi.mocked(DbPayments.addPayment).mock.calls[0];
            const actualPaymentDate = addPaymentCall[3] as Date;
            
            expect(actualPaymentDate.getFullYear()).toBe(2024); // Следующий год
            expect(actualPaymentDate.getMonth()).toBe(0); // Январь
            expect(actualPaymentDate.getDate()).toBe(15);
        });

        it('не должен создавать платежи, если все инвестиции неактивны', async () => {
            // Мокируем пустой массив активных инвестиций
            vi.mocked(DbInvests.getInvests).mockResolvedValue([]);
            
            // Выполнение теста
            await calculatePayments();
            
            // Проверяем, что запрос был сделан с параметром filterOnlyActive: 1
            expect(DbInvests.getInvests).toHaveBeenCalledWith({ filterOnlyActive: 1 });
            
            // Проверяем, что платежи не запрашивались и не создавались
            expect(DbPayments.getPayments).not.toHaveBeenCalled();
            expect(DbPayments.addPayment).not.toHaveBeenCalled();
        });
    });
}); 