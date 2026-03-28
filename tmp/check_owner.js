const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();

  console.log("Checking specific business and owner...");
  
  const bizId = '6be53f96-5349-46ac-b457-785e3c7c6e12';
  const res = await client.query(`
    SELECT b.id as biz_id, b."legalName", u.id as user_id, u.email, u.role, u."userType"
    FROM businesses b
    JOIN users u ON b."userId" = u.id
    WHERE b.id = $1
  `, [bizId]);

  if (res.rows.length > 0) {
    const r = res.rows[0];
    console.log(`- Business: [${r.biz_id}] "${r.legalName}"`);
    console.log(`- Owner: [${r.user_id}] ${r.email}`);
    console.log(`- Role: ${r.role}, Type: ${r.userType}`);
  } else {
    console.log("Business not found in public.businesses table.");
  }

  await client.end();
}

run().catch(console.error);
