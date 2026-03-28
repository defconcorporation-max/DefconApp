import { createClient } from '@libsql/client/web';

const db = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function test() {
    try {
        console.log("Fetching blocks...");
        const slotsRes = await db.execute("SELECT * FROM availability_slots WHERE start_time LIKE '%T08:30%' OR start_time LIKE '% %08:30%' OR end_time LIKE '%T12:30%' OR end_time LIKE '% %12:30%'");
        console.dir(slotsRes.rows, { depth: null });

        const shootsRes = await db.execute("SELECT * FROM shoots WHERE start_time LIKE '%8:30%' OR end_time LIKE '%12:30%'");
        console.dir(shootsRes.rows, { depth: null });
        console.log("Done checking database.");
    } catch(e) {
        console.error(e);
    }
}

test();
