import { getDB } from './Db';

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

    return store.add(invest);
}

async function closeInvest(investId: number): Promise<void> {
    const db = await getDB();
    const transaction = db.transaction('invests', 'readwrite');
    const store = transaction.objectStore('invests');

    const invest = await store.get(investId);
    if (!invest) throw new Error('Invest not found');

    invest.isActive = 0;
    invest.closedDate = new Date();
    invest.updatedAt = new Date();

    return store.put(invest);
}

export { InvestFilter, Invest, getInvests, addInvest, closeInvest };
