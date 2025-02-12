import { getDB } from './Db';
import { getInvests } from './DbInvests';
import { getPayments, addPayment } from './DbPayments';

const defaultIncomeRatio = 0.05;

async function calculatePayments(): Promise<void> {
    const invests = await getInvests({ filterOnlyActive: 1 });
    if (!invests.length) return;

    for (const invest of invests) {
        let lastPaymentDate = invest.createdDate;

        const payments = await getPayments({ id: invest.id });
        const lastPayment = payments.pop();

        if (lastPayment && !lastPayment.isPayed) {
            continue;
        }

        if (lastPayment) {
            lastPaymentDate = lastPayment.paymentDate;
        }

        lastPaymentDate.setMonth(lastPaymentDate.getMonth() + 1);
        lastPaymentDate.setHours(0, 0, 0);

        await addPayment(invest.id!, invest.money, invest.incomeRatio || defaultIncomeRatio, lastPaymentDate);
    }
}

async function exportData(investFilter = {}, paymentFilter = {}): Promise<object> {
    const invests = await getInvests(investFilter);
    const payments = await getPayments(paymentFilter);

    if (!invests.length && !payments.length) {
        return {};
    }

    return { invests, payments };
}

async function importData(importData: { invests: object[], payments: object[] }, cleanImport: boolean = false): Promise<void> {
    const db = await getDB();
    const transaction = db.transaction(['invests', 'payments'], 'readwrite');
    const investStore = transaction.objectStore('invests');
    const paymentStore = transaction.objectStore('payments');

    if (cleanImport) {
        await investStore.clear();
        await paymentStore.clear();
    }

    for (const invest of importData.invests) {
        invest.createdDate = new Date(invest.createdDate);
        invest.updatedAt = new Date(invest.updatedAt);
        if (!invest.isActive && invest.closedDate) {
            invest.closedDate = new Date(invest.closedDate);
        }
        await investStore.put(invest);
    }

    for (const payment of importData.payments) {
        payment.paymentDate = new Date(payment.paymentDate);
        payment.updatedAt = new Date(payment.updatedAt);
        await paymentStore.put(payment);
    }
}

export { calculatePayments, exportData, importData };
