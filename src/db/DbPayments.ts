import { getDB } from './Db';

interface Payment {
    id?: number;
    investId: number;
    money: number;
    paymentDate: Date;
    isPayed: 1 | 0;
    updatedAt: Date;
}

type PaymentFilter = {
    id?: number;
    updatedAt?: Date;
};

async function getPayments(filter: PaymentFilter = {}): Promise<Payment[]> {
    const db = await getDB();
    const transaction = db.transaction('payments');
    const store = transaction.objectStore('payments');

    if (filter.id !== undefined) {
        return store.index('investIdIdx').getAll(filter.id);
    } else if (filter.updatedAt !== undefined) {
        return store.index('updatedAtIdx').getAll(IDBKeyRange.lowerBound(filter.updatedAt));
    } else {
        return store.getAll();
    }
}

async function addPayment(investId: number, investMoney: number, incomeRatio: number, paymentDate: Date): Promise<number> {
    const db = await getDB();
    const transaction = db.transaction('payments', 'readwrite');
    const store = transaction.objectStore('payments');

    const payment: Payment = {
        investId,
        money: Math.round(investMoney * incomeRatio),
        paymentDate,
        isPayed: 0,
        updatedAt: new Date()
    };

    return store.add(payment);
}

async function closePayment(paymentId: number): Promise<void> {
    const db = await getDB();
    const transaction = db.transaction('payments', 'readwrite');
    const store = transaction.objectStore('payments');

    const payment = await store.get(paymentId);
    if (!payment) throw new Error('Payment not found');

    payment.isPayed = 1;
    payment.updatedAt = new Date();
    await store.put(payment);
}

export { Payment, getPayments, addPayment, closePayment };
