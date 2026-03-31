const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();

  console.log("Reverting role for daniel.smurts@yandex.ru to BUSINESS_OWNER...");
  
  const res = await client.query(`
    UPDATE users 
    SET role = 'BUSINESS_OWNER' 
    WHERE email = 'daniel.smurts@yandex.ru' 
    RETURNING id, email, role
  `);

  if (res.rows.length > 0) {
    console.log("Successfully reverted user:");
    console.log(res.rows[0]);
  } else {
    console.log("User not found.");
  }

  await client.end();
}

run().catch(console.error);
