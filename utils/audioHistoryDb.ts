import { openDB, DBSchema } from 'idb';

interface AudioHistoryDB extends DBSchema {
    taunts: {
        key: string;
        value: {
            id: string;
            name: string;
            date: number;
            blob: Blob;
        };
        indexes: { 'by-date': number };
    };
}

const DB_NAME = 'overload-audio-tool';
const STORE_NAME = 'taunts';

export const initDB = async () => {
    return openDB<AudioHistoryDB>(DB_NAME, 1, {
        upgrade(db) {
            const store = db.createObjectStore(STORE_NAME, {
                keyPath: 'id',
            });
            store.createIndex('by-date', 'date');
        },
    });
};

export const saveTaunt = async (name: string, blob: Blob) => {
    const db = await initDB();
    // crypto.randomUUID() is not available in all contexts (e.g. non-secure), so we use a fallback
    const id = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `taunt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    await db.put(STORE_NAME, {
        id,
        name,
        date: Date.now(),
        blob,
    });
    return id;
};

export const getTaunts = async () => {
    const db = await initDB();
    return db.getAllFromIndex(STORE_NAME, 'by-date');
};


export const deleteTaunt = async (id: string) => {
    const db = await initDB();
    await db.delete(STORE_NAME, id);
};

export const updateTauntName = async (id: string, newName: string) => {
    const db = await initDB();
    const item = await db.get(STORE_NAME, id);
    if (item) {
        item.name = newName;
        await db.put(STORE_NAME, item);
    }
};
