import { useEffect, useState } from 'react';
import { getDB } from './Db';
import { IDBPDatabase } from 'idb';

export function useIndexedDB(): IDBPDatabase | null {
    const [db, setDb] = useState<IDBPDatabase | null>(null);

    useEffect(() => {
        void (async function initDB() {
            try {
                const database = await getDB();
                setDb(database);
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error('Ошибка инициализации БД:', error);
            }
        })();
    }, []);

    return db;
}
