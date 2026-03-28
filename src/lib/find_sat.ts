import { turso } from './turso';

async function findSatBlocks() {
    console.log('--- Checking for Saturday blocks ---');
    const { rows: shoots } = await turso.execute("SELECT id, shoot_date, start_time, end_time, title FROM shoots");
    
    for (const s of shoots) {
        const d = new Date(s.shoot_date as string);
        if (d.getDay() === 6) {
            console.log(`Shoot [ID: ${s.id}] on Saturday ${s.shoot_date}: ${s.start_time} - ${s.end_time} (${s.title})`);
        }
    }

    const { rows: slots } = await turso.execute("SELECT id, start_time, end_time FROM availability_slots");
    // slots don't have a date, they are templates?
    console.log('\n--- Availability Templates (slots) ---');
    for (const slot of slots) {
        console.log(`Slot [ID: ${slot.id}]: ${slot.start_time} - ${slot.end_time}`);
    }
}

findSatBlocks().catch(console.error);
