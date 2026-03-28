const { createClient } = require('@libsql/client');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function check() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  const slots = await client.execute("SELECT * FROM availability_slots");
  const shoots = await client.execute("SELECT * FROM shoots");

  fs.writeFileSync('db_dump.json', JSON.stringify({ slots: slots.rows, shoots: shoots.rows }, null, 2));
  console.log('Dumped to db_dump.json');
}

check().catch(console.error);
