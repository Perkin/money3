import { getDB } from './Db';
import { getPayments } from './DbPayments';
import { defaultIncomeRatio } from './DbUtils';

interface Invest {
    id?: number;
    money: number;
    incomeRatio: number;
    createdDate: Date;
    closedDate: Date | null;
    isActive: 1 | 0;
    updatedAt: Date;
}

interface InvestFilter {
    filterOnlyActive?: number;
    updatedAt?: Date;
}

async function getInvests(filter: InvestFilter = {}): Promise<Invest[]> {
    const db = await getDB();
    const transaction = db.transaction('invests');
    const store = transaction.objectStore('invests');

    if (filter.filterOnlyActive === 1) {
        return store.index('isActiveIdx').getAll(1);
    } else if (filter.updatedAt !== undefined) {
        return store.index('updatedAtIdx').getAll(IDBKeyRange.lowerBound(filter.updatedAt));
    } else {
        return store.getAll();
    }
}

async function addInvest(money: number, incomeRatio: number, createdDate: Date): Promise<number> {
    const db = await getDB();
    const transaction = db.transaction('invests', 'readwrite');
    const store = transaction.objectStore('invests');

    const invest: Invest = {
        money,
        incomeRatio,
        createdDate,
        closedDate: null,
        isActive: 1,
        updatedAt: new Date(),
    };

    return store.add(invest) as Promise<number>;
}

async function closeInvest(investId: number): Promise<number> {
    const db = await getDB();
    const transaction = db.transaction('invests', 'readwrite');
    const store = transaction.objectStore('invests');

    const invest = await store.get(investId);
    if (!invest) throw new Error('Invest not found');

    invest.isActive = 0;
    invest.closedDate = new Date();
    invest.updatedAt = new Date();

    return store.put(invest) as Promise<number>;
}

async function updateInvest(
    id: number,
    updates: {
        money?: number;
        createdDate?: Date;
        closedDate?: Date | null;
    }
): Promise<number> {
    // Сначала получаем все необходимые данные
    const payments = updates.money !== undefined ? await getPayments({ id, isPayed: 0 }) : [];
    
    const db = await getDB();
    const transaction = db.transaction(['invests', 'payments'], 'readwrite');
    const investStore = transaction.objectStore('invests');

    const invest = await investStore.get(id);
    if (!invest) {
        throw new Error('Инвестиция не найдена');
    }

    const updatedInvest = {
        ...invest,
        ...updates,
        updatedAt: new Date()
    };

    await investStore.put(updatedInvest);
    
    // Если изменилась сумма, обновляем платежи
    if (updates.money !== undefined) {
        const paymentStore = transaction.objectStore('payments');
        
        for (const payment of payments) {
            const updatedPayment = {
                ...payment,
                money: updates.money * (invest.incomeRatio || defaultIncomeRatio),
                updatedAt: new Date()
            };
            await paymentStore.put(updatedPayment);
        }
    }

    // Дожидаемся завершения транзакции
    await transaction.done;

    window.dispatchEvent(new CustomEvent('fetchInvests'));
    return id;
}

export type { InvestFilter, Invest };
export { getInvests, addInvest, closeInvest, updateInvest };
