import { createClient } from '@libsql/client/web';

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
    try {
        console.log("Checking slots...");
        const slotsRes = await db.execute("SELECT * FROM availability_slots LIMIT 50");
        console.dir(slotsRes.rows.filter(x => String(x.start_time).includes(':30')), { depth: null });

        console.log("Checking shoots...");
        const shootsRes = await db.execute("SELECT * FROM shoots LIMIT 100");
        console.dir(shootsRes.rows.filter(x => String(x.start_time).includes(':30') || String(x.shoot_date).includes('Sat')), { depth: null });
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
run();
