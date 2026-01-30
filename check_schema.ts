
import { turso } from './src/lib/turso';

async function checkSchema() {
    try {
        const result = await turso.execute("PRAGMA table_info(shoots)");
        console.log("Shoots Table Columns:");
        console.table(result.rows);
    } catch (e) {
        console.error(e);
    }
}

checkSchema();
