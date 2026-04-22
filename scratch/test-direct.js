const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testDirect() {
  const directUrl = process.env.DRIZZLE_DATABASE_URL; // This is the 5432 one
  console.log("Testing direct PG connection to:", directUrl);
  const client = new Client({
    connectionString: directUrl,
    ssl: { rejectUnauthorized: false }
  });

  const start = Date.now();
  try {
    await client.connect();
    console.log("Connected in:", Date.now() - start, "ms");
    const qStart = Date.now();
    const res = await client.query('SELECT NOW()');
    console.log("Query took:", Date.now() - qStart, "ms");
    console.log("Result:", res.rows[0]);
  } catch (err) {
    console.error("Direct connection error:", err);
  } finally {
    await client.end();
  }
}

testDirect();
