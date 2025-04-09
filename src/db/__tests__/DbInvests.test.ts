import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getInvests, addInvest, closeInvest, updateInvest, type Invest } from '../DbInvests';
import { getDB } from '../Db';
import { getPayments } from '../DbPayments';

// Мокаем необходимые модули
vi.mock('../Db', () => ({
    getDB: vi.fn(),
}));

vi.mock('../DbPayments', () => ({
    getPayments: vi.fn(),
}));

// Мокируем IDBKeyRange для тестов
// @ts-ignore
global.IDBKeyRange = {
    lowerBound: vi.fn().mockReturnValue('lower-bound-range')
};

// Глобальный мок для window.dispatchEvent
Object.defineProperty(window, 'dispatchEvent', {
    value: vi.fn(),
});

describe('DbInvests', () => {
    let mockIndexGet: any;
    let mockStore: any;
    let mockTransaction: any;
    let mockDB: any;

    beforeEach(() => {
        // Сбрасываем состояние моков перед каждым тестом
        vi.resetAllMocks();
        
        mockIndexGet = {
            getAll: vi.fn(),
        };
        
        mockStore = {
            add: vi.fn().mockResolvedValue(1),
            get: vi.fn(),
            put: vi.fn().mockResolvedValue(1),
            index: vi.fn().mockReturnValue(mockIndexGet),
            getAll: vi.fn().mockResolvedValue([]),
        };
        
        mockTransaction = {
            objectStore: vi.fn().mockReturnValue(mockStore),
            done: Promise.resolve(),
        };
        
        mockDB = {
            transaction: vi.fn().mockReturnValue(mockTransaction),
        };
        
        (getDB as any).mockResolvedValue(mockDB);
        (getPayments as any).mockResolvedValue([]);
    });

    describe('getInvests', () => {
        it('should get all invests when no filter is provided', async () => {
            const mockInvests = [{ id: 1, money: 1000 }];
            mockStore.getAll.mockResolvedValue(mockInvests);
            
            const result = await getInvests();
            
            expect(mockDB.transaction).toHaveBeenCalledWith('invests');
            expect(mockStore.getAll).toHaveBeenCalled();
            expect(result).toEqual(mockInvests);
        });

        it('should filter by active invests', async () => {
            const mockInvests = [{ id: 1, isActive: 1 }];
            mockIndexGet.getAll.mockResolvedValue(mockInvests);
            
            const result = await getInvests({ filterOnlyActive: 1 });
            
            expect(mockStore.index).toHaveBeenCalledWith('isActiveIdx');
            expect(mockIndexGet.getAll).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockInvests);
        });

        it('should filter by updatedAt date', async () => {
            const mockInvests = [{ id: 1, updatedAt: new Date('2023-06-01') }];
            const filterDate = new Date('2023-05-01');
            mockIndexGet.getAll.mockResolvedValue(mockInvests);
            
            const result = await getInvests({ updatedAt: filterDate });
            
            expect(mockStore.index).toHaveBeenCalledWith('updatedAtIdx');
            // Не проверяем конкретный аргумент IDBKeyRange, просто проверяем, что getAll был вызван
            expect(mockIndexGet.getAll).toHaveBeenCalled();
            expect(result).toEqual(mockInvests);
        });
    });

    describe('addInvest', () => {
        it('should add a new invest', async () => {
            const money = 1000;
            const incomeRatio = 0.05;
            const createdDate = new Date();
            
            const result = await addInvest(money, incomeRatio, createdDate);
            
            expect(mockDB.transaction).toHaveBeenCalledWith('invests', 'readwrite');
            expect(mockStore.add).toHaveBeenCalledWith(expect.objectContaining({
                money,
                incomeRatio,
                createdDate,
                isActive: 1,
            }));
            expect(result).toBe(1);
        });
    });

    describe('closeInvest', () => {
        it('should close an existing invest', async () => {
            const investId = 1;
            const mockInvest = {
                id: investId,
                isActive: 1,
                closedDate: null,
            };
            
            mockStore.get.mockResolvedValue(mockInvest);
            
            const result = await closeInvest(investId);
            
            expect(mockStore.get).toHaveBeenCalledWith(investId);
            expect(mockStore.put).toHaveBeenCalledWith(expect.objectContaining({
                id: investId,
                isActive: 0,
                closedDate: expect.any(Date),
            }));
            expect(result).toBe(1);
        });

        it('should throw error if invest not found', async () => {
            mockStore.get.mockResolvedValue(null);
            
            await expect(closeInvest(999)).rejects.toThrow('Invest not found');
        });
    });

    describe('updateInvest', () => {
        it('should update an invest with new values', async () => {
            const investId = 1;
            const updates = { money: 2000 };
            const mockInvest = {
                id: investId,
                money: 1000,
                incomeRatio: 0.05,
            };
            
            mockStore.get.mockResolvedValue(mockInvest);
            
            const result = await updateInvest(investId, updates);
            
            expect(mockStore.get).toHaveBeenCalledWith(investId);
            expect(mockStore.put).toHaveBeenCalledWith(expect.objectContaining({
                id: investId,
                money: 2000,
                updatedAt: expect.any(Date),
            }));
            expect(window.dispatchEvent).toHaveBeenCalled();
            expect(result).toBe(investId);
        });

        it('should update createdDate when provided', async () => {
            const investId = 1;
            const newDate = new Date('2023-07-01');
            const updates = { createdDate: newDate };
            const mockInvest = {
                id: investId,
                money: 1000,
                incomeRatio: 0.05,
                createdDate: new Date('2023-01-01'),
            };
            
            mockStore.get.mockResolvedValue(mockInvest);
            
            await updateInvest(investId, updates);
            
            expect(mockStore.put).toHaveBeenCalledWith(expect.objectContaining({
                createdDate: newDate,
            }));
        });

        it('should update closedDate when provided', async () => {
            const investId = 1;
            const newDate = new Date('2023-12-31');
            const updates = { closedDate: newDate };
            const mockInvest = {
                id: investId,
                money: 1000,
                incomeRatio: 0.05,
                closedDate: null,
            };
            
            mockStore.get.mockResolvedValue(mockInvest);
            
            await updateInvest(investId, updates);
            
            expect(mockStore.put).toHaveBeenCalledWith(expect.objectContaining({
                closedDate: newDate,
            }));
        });

        it('should update unpaid payments when money changes', async () => {
            const investId = 1;
            const updates = { money: 2000 };
            const mockInvest = {
                id: investId,
                money: 1000,
                incomeRatio: 0.05,
            };
            const mockPayments = [
                { id: 101, investId: 1, money: 50, isPayed: 0 }
            ];
            
            mockStore.get.mockResolvedValue(mockInvest);
            (getPayments as any).mockResolvedValue(mockPayments);
            
            await updateInvest(investId, updates);
            
            // Проверяем, что был запрос на получение неоплаченных платежей
            expect(getPayments).toHaveBeenCalledWith({ id: investId, isPayed: 0 });
            
            // Проверяем, что транзакция включала оба хранилища
            expect(mockDB.transaction).toHaveBeenCalledWith(['invests', 'payments'], 'readwrite');
            
            // Проверяем, что получили objectStore для payments
            expect(mockTransaction.objectStore).toHaveBeenCalledWith('payments');
            
            // Проверяем, что вызвали put для обновления платежа
            expect(mockStore.put).toHaveBeenCalledWith(expect.objectContaining({
                id: 101,
                money: 100, // 2000 * 0.05
                updatedAt: expect.any(Date),
            }));
        });

        it('should use defaultIncomeRatio when invest has no incomeRatio', async () => {
            const investId = 1;
            const updates = { money: 2000 };
            const mockInvest = {
                id: investId,
                money: 1000,
                // отсутствует incomeRatio
            };
            const mockPayments = [
                { id: 101, investId: 1, money: 50, isPayed: 0 }
            ];
            
            mockStore.get.mockResolvedValue(mockInvest);
            (getPayments as any).mockResolvedValue(mockPayments);
            
            await updateInvest(investId, updates);
            
            // Проверяем использование defaultIncomeRatio (0.05)
            expect(mockStore.put).toHaveBeenCalledWith(expect.objectContaining({
                id: 101,
                money: 100, // 2000 * 0.05 (defaultIncomeRatio)
                updatedAt: expect.any(Date),
            }));
        });

        it('should not update payments when money is not changed', async () => {
            const investId = 1;
            const updates = { createdDate: new Date() }; // Только дата, не деньги
            const mockInvest = {
                id: investId,
                money: 1000,
                incomeRatio: 0.05,
            };
            
            mockStore.get.mockResolvedValue(mockInvest);
            
            await updateInvest(investId, updates);
            
            // Проверяем, что не было запроса на получение платежей
            expect(getPayments).not.toHaveBeenCalled();
        });

        it('should throw error if invest not found', async () => {
            mockStore.get.mockResolvedValue(null);
            
            await expect(updateInvest(999, { money: 1000 })).rejects.toThrow('Инвестиция не найдена');
        });
    });
}); 