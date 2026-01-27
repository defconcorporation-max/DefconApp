
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'agency.db');

// Prevent multiple connections in development due to HMR
const globalForDb = global as unknown as { db: Database.Database };

export const db = globalForDb.db || new Database(dbPath);

if (process.env.NODE_ENV !== 'production') {
    globalForDb.db = db;
}

db.pragma('journal_mode = WAL');
