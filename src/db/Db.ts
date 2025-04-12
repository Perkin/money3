import { openDB, IDBPDatabase } from 'idb';

// Получаем конфигурацию БД из глобальной переменной или используем значения по умолчанию
const { DB_NAME, DB_VERSION } = (window as any).DB_CONFIG;

let dbInstance: IDBPDatabase | null = null;

async function getDB(): Promise<IDBPDatabase> {
    if (!dbInstance) {
        dbInstance = await openDB(DB_NAME, DB_VERSION, {
            upgrade(db, _oldVersion, _newVersion, transaction) {
                // Создаем или получаем хранилище 'invests'
                let invests;
                if (!db.objectStoreNames.contains('invests')) {
                    invests = db.createObjectStore('invests', {
                        keyPath: 'id',
                        autoIncrement: true,
                    });
                    invests.createIndex('isActiveIdx', 'isActive', { unique: false });
                    invests.createIndex('updatedAtIdx', 'updatedAt', { unique: false });
                } else {
                    invests = transaction.objectStore('invests');
                }

                // Создаем или получаем хранилище 'payments'
                let payments;
                if (!db.objectStoreNames.contains('payments')) {
                    payments = db.createObjectStore('payments', {
                        keyPath: 'id',
                        autoIncrement: true,
                    });
                    payments.createIndex('investIdIdx', 'investId', { unique: false });
                    payments.createIndex('updatedAtIdx', 'updatedAt', { unique: false });
                } else {
                    payments = transaction.objectStore('payments');
                }
                
                // Добавляем индекс isPayedIdx, если его еще нет
                if (payments && !payments.indexNames.contains('isPayedIdx')) {
                    payments.createIndex('isPayedIdx', 'isPayed', { unique: false });
                }
            },
            blocked() {
                console.log('База данных заблокирована другой вкладкой');
            },
            blocking() {
                console.log('Эта вкладка блокирует обновление базы данных в другой вкладке');
            },
            terminated() {
                console.log('База данных была неожиданно закрыта');
            }
        });
    }
    return dbInstance;
}

export { getDB };

