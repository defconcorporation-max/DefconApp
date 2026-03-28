import { turso as db } from './lib/turso';

async function run() {
    console.log("Searching for anything related to Saturdays 08:30-12:30...");
    const { rows: slots } = await db.execute("SELECT * FROM availability_slots");
    const { rows: shoots } = await db.execute("SELECT * FROM shoots");

    const satSlots = slots.filter((s: any) => {
        const d = new Date(s.start_time);
        return d.getDay() === 6; // Saturday
    });

    const satShoots = shoots.filter((s: any) => {
        const d = new Date(s.shoot_date);
        return d.getDay() === 6; // Saturday
    });

    console.log("Saturday Slots:", satSlots);
    console.log("Saturday Shoots:", satShoots);
}

run();
