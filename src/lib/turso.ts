import { createClient } from '@libsql/client';
// cleaned up imports

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
    console.warn('⚠️ Turso credentials missing. Database functionality will fail.');
}

export const turso = createClient({
    url: url || 'libsql://dummy-db.turso.io',
    authToken: authToken || 'dummy-token',
    intMode: 'number',
});
