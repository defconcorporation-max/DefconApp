import { turso as db } from './lib/turso';

async function run() {
    const slots = await db.execute('SELECT * FROM availability_slots');
    console.log('--- SLOTS ---');
    console.dir(slots.rows, { depth: null });

    const shoots = await db.execute('SELECT * FROM shoots');
    console.log('\n--- SHOOTS ---');
    console.dir(shoots.rows, { depth: null });
}

run().catch(console.error);
