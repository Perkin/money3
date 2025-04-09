import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getDB } from '../Db';
import * as idb from 'idb';

// Мок для idb
vi.mock('idb', () => ({
    openDB: vi.fn().mockResolvedValue({})
}));

// Мок для console.log
console.log = vi.fn();

describe('Db', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.resetAllMocks();
        
        // Сбрасываем кэшированный экземпляр базы данных между тестами
        // @ts-ignore
        const dbMockModule = vi.importActual('../Db');
        if (dbMockModule && typeof dbMockModule === 'object' && 'dbInstance' in dbMockModule) {
            // @ts-ignore
            dbMockModule.dbInstance = null;
        }
    });

    describe('getDB', () => {
        it('должен открыть базу данных с правильными параметрами', async () => {
            await getDB();
            
            expect(idb.openDB).toHaveBeenCalledWith('money', expect.any(Number), expect.objectContaining({
                upgrade: expect.any(Function),
                blocked: expect.any(Function),
                blocking: expect.any(Function),
                terminated: expect.any(Function)
            }));
        });

        it('должен вернуть уже существующий экземпляр базы данных при повторных вызовах', async () => {
            // Первый вызов
            await getDB();
            
            // Сбрасываем мок
            vi.mocked(idb.openDB).mockClear();
            
            // Второй вызов
            await getDB();
            
            // Проверяем, что openDB не вызывался во второй раз
            expect(idb.openDB).not.toHaveBeenCalled();
        });
    });
}); 