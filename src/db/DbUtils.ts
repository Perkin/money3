import { getDB } from './Db';
import { getInvests, InvestFilter } from './DbInvests';
import { getPayments, addPayment, PaymentFilter } from './DbPayments';
import { toast } from 'react-toastify';
import { get, post } from '@/utils/networkUtils';
import { API_URL } from '@/config.ts';

interface ImportInvest {
    id?: number;
    money: number;
    incomeRatio: number;
    isActive: number;
    createdDate: string;
    updatedAt: string;
    closedDate?: string;
}

interface ImportPayment {
    id?: number;
    investId: number;
    money: number;
    isPayed: number;
    paymentDate: string;
    updatedAt: string;
}

interface ImportData {
    invests: ImportInvest[];
    payments: ImportPayment[];
}

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
    importData: ImportData,
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
        const newInvest = {
            ...invest,
            createdDate: new Date(invest.createdDate),
            updatedAt: new Date(invest.updatedAt),
            closedDate: invest.closedDate ? new Date(invest.closedDate) : undefined
        };
        await investStore.put(newInvest);
    }

    for (const payment of importData.payments) {
        const newPayment = {
            ...payment,
            paymentDate: new Date(payment.paymentDate),
            updatedAt: new Date(payment.updatedAt)
        };
        await paymentStore.put(newPayment);
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

interface UpdateResponse {
    status: 'success' | 'no_updates' | 'error';
    message?: string;
    data?: ImportData;
}

async function syncUpdates(): Promise<void> {
    if (!localStorage.getItem('token')) {
        return;
    }

    const lastSyncDate = localStorage.getItem('lastSyncDate') || '';
    const toastSyncUpdates = toast.info('Получаю обновления...', {autoClose: false});

    try {
        const result = await get<UpdateResponse>(`/updates?since=${lastSyncDate}`);
        toast.done(toastSyncUpdates);

        if (result.status === 'success' && result.data) {
            await importData(result.data);
            toast.success('Обновления успешно применены');
            window.dispatchEvent(new CustomEvent('fetchInvests'));
        } else if (result.status === 'no_updates') {
            toast.info('Обновлений нет');
        }

        localStorage.setItem('lastSyncDate', new Date().toISOString());
    } catch (error) {
        toast.done(toastSyncUpdates);
        // Ошибка уже обработана в networkUtils
    }
}

async function updateRemoteData(): Promise<void> {
    if (!localStorage.getItem('token')) {
        return;
    }

    const lastSyncDate = localStorage.getItem('lastSyncDate');

    let investFilter: InvestFilter = {};
    let paymentFilter: PaymentFilter = {};

    if (lastSyncDate) {
        investFilter = { updatedAt: new Date(lastSyncDate) };
        paymentFilter = { updatedAt: new Date(lastSyncDate) };
    }

    const invests = await getInvests(investFilter);
    const payments = await getPayments(paymentFilter);

    if (!invests.length && !payments.length) {
        return;
    }

    const exportJson = { invests, payments };
    const toastUpdateRemoteData = toast.info('Отправляю данные...', { autoClose: false });

    try {
        const result = await post<UpdateResponse>('/update', exportJson);
        toast.done(toastUpdateRemoteData);

        if (result.status === 'success') {
            toast.success('Новые данные успешно отправлены на сервер');
        }
    } catch (error) {
        toast.done(toastUpdateRemoteData);
        // Ошибка уже обработана в networkUtils
    }
}

async function sendRequest(url: string, method: string = 'GET', json: any = null): Promise<any> {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error("Токен не найден.");
    }

    try {
        const response = await fetch(API_URL + url, {
            method: method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: json ? JSON.stringify(json) : null
        });

        if (!response.ok) {
            if (response.status == 401) {
                toast.error('Неавторизованный запрос, возможно истекло время токена, просто авторизуйтесь снова');
                return null;
            }
            toast.error(`Ошибка: ${response.statusText}`);
            console.error(`Ошибка:`, response);
            return null;
        }

        return response.json();
    } catch (error: unknown) {
        toast.error(`"Неизвестная ошибка`);
        console.error("Неизвестная ошибка:", error);
    }

    return null;
}

export {
    calculatePayments,
    importData,
    exportData,
    syncUpdates,
    updateRemoteData,
};
