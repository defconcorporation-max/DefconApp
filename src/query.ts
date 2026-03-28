import { turso as db } from './lib/turso';

async function run() {
    const slots = await db.execute('SELECT * FROM availability_slots');
    console.log('Availability Slots:', slots.rows);
    
    // Also check shoots that are blocking
    const shoots = await db.execute("SELECT * FROM shoots WHERE is_blocking = 1 OR title LIKE '%Block%' OR status = 'Pending'");
    console.log('Shoots blocking:', shoots.rows);
}

run().catch(console.error);
