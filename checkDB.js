const { createClient } = require('@libsql/client');

require('dotenv').config({ path: '.env.local' });

async function check() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  const slots = await client.execute("SELECT * FROM availability_slots");
  const shoots = await client.execute("SELECT * FROM shoots");

  console.log('--- SLOTS ---');
  console.dir(slots.rows, { depth: null });
  console.log('\n--- SHOOTS ---');
  console.dir(shoots.rows, { depth: null });
}

check().catch(console.error);
