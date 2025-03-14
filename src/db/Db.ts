import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'money';
const DB_VERSION = 4;
let dbInstance: IDBPDatabase | null = null;

async function getDB(): Promise<IDBPDatabase> {
    if (!dbInstance) {
        dbInstance = await openDB(DB_NAME, DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('invests')) {
                    const invests = db.createObjectStore('invests', {
                        keyPath: 'id',
                        autoIncrement: true,
                    });
                    invests.createIndex('isActiveIdx', 'isActive', { unique: false });
                    invests.createIndex('updatedAtIdx', 'updatedAt', { unique: false });
                }
                if (!db.objectStoreNames.contains('payments')) {
                    const payments = db.createObjectStore('payments', {
                        keyPath: 'id',
                        autoIncrement: true,
                    });
                    payments.createIndex('investIdIdx', 'investId', { unique: false });
                    payments.createIndex('updatedAtIdx', 'updatedAt', { unique: false });
                }
            },
        });
    }

    return dbInstance;
}

export { getDB };
