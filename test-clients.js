const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
});

async function run() {
    try {
        const { rows } = await db.execute('SELECT id, name, company_name FROM clients');
        console.log("Total clients found:", rows.length);
        console.log("First 5 clients:", JSON.stringify(rows.slice(0, 5), null, 2));
    } catch (e) {
        console.error(e);
    }
}

run();
