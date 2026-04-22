const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testRaw() {
  console.log("Testing raw PG connection to:", process.env.DATABASE_URL);
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected successfully!");
    const res = await client.query('SELECT NOW()');
    console.log("Query result:", res.rows[0]);
  } catch (err) {
    console.error("Raw connection error:", err);
  } finally {
    await client.end();
  }
}

testRaw();
