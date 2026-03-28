import { createClient } from '@libsql/client';
// cleaned up imports

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
    if (process.env.NODE_ENV === 'production') {
        console.error('❌ TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required in production. Database operations will fail.');
    } else {
        console.warn('⚠️ Turso credentials missing. Using local fallback for development.');
    }
}

export const turso = createClient({
    url: url || 'http://localhost:8080',
    authToken: authToken || 'dummy-token',
});
