import { getDB } from './Db';
import { getInvests } from './DbInvests';
import { getPayments, addPayment } from './DbPayments';
import { toast } from 'react-toastify';
import { useUser } from '@/components/UserContext.tsx';

export const defaultIncomeRatio = 0.05;

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

        await addPayment(
            invest.id!,
            invest.money,
            invest.incomeRatio || defaultIncomeRatio,
            lastPaymentDate
        );
    }
}

async function importData(
    importData: { invests: object[]; payments: object[] },
    cleanImport: boolean = false
): Promise<void> {
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

async function exportData(): Promise<void> {
    const invests = await getInvests();
    const payments = await getPayments();

    const exportString = JSON.stringify({invests: invests, payments: payments});
    try {
        await navigator.clipboard.writeText(exportString);
        toast.success('Данные скопированы в буфер обмена');
    } catch (err) {
        toast.error('Не удалось скопировать данные в буфер обмена');
    }
}

async function syncUpdates(): Promise<void> {
    const lastSyncDate = localStorage.getItem('lastSyncDate') || '';

    const toastSyncUpdates = toast.info('Получаю обновления...', {autoClose: false});
    const result = await sendRequest(`/updates?since=${lastSyncDate}`);
    toast.done(toastSyncUpdates)

    if (result && result.status == 'success') {
        await updateLocalData(result);
    } else {
        if (result && result.status == 'no_updates') {
            toast.info('Обновлений нет');
        }
        await updateRemoteData();
    }

    localStorage.setItem('lastSyncDate', new Date().toISOString());
}

async function updateLocalData(result: any): Promise<void> {
    await dbImportData(result);

    toast('Новые данные загружены');
    setTimeout(() => document.location.reload(), 1000);
}

async function updateRemoteData(): Promise<void> {
    const lastSyncDate = localStorage.getItem('lastSyncDate');

    let investFilter : InvestFilter = {};
    let paymentFilter : PaymentFilter = {};

    if (lastSyncDate) {
        investFilter = {updatedAt: new Date(lastSyncDate)};
        paymentFilter = {updatedAt: new Date(lastSyncDate)};
    }

    const invests = await dbGetInvests(investFilter);
    const payments = await dbGetPayments(paymentFilter);

    if (!invests.length && !payments.length ) {
        return;
    }
    const exportJson = {invests: invests, payments: payments};

    const toastUpdateRemoteData = toast('Отправляю данные...', -1);
    const result = await sendRequest('/update', 'POST', exportJson);
    toastUpdateRemoteData.hideToast();

    if (result && result.status == 'success') {
        toast('Новые данные успешно отправлены на сервер');
    }
}

async function sendRequest(url: string, method: string = 'GET', json: any = null): Promise<any> {
    const { user } = useUser();

    try {
        const response = await fetch(api_url + url, {
            method: method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authUser.token}`
            },
            body: json ? JSON.stringify(json) : null
        });

        if (!response.ok) {
            if (response.status == 401) {
                toastError('Неавторизованный запрос, возможно истекло время токена, просто авторизуйтесь снова', 7000);
                await logout();
                return null;
            }
            toastError(`Ошибка: ${response.statusText}`);
            console.error(`Ошибка:`, response);
            return null;
        }

        return response.json();
    } catch (error: unknown) {
        toastError(`"Неизвестная ошибка`);
        console.error("Неизвестная ошибка:", error);
    }

    return null;
}

export { calculatePayments, exportData, importData, syncUpdates };
