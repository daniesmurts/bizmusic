const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();

  console.log("Updating role for daniel.smurts@yandex.ru to ADMIN...");
  
  const res = await client.query(`
    UPDATE users 
    SET role = 'ADMIN' 
    WHERE email = 'daniel.smurts@yandex.ru' 
    RETURNING id, email, role
  `);

  if (res.rows.length > 0) {
    console.log("Successfully updated user:");
    console.log(res.rows[0]);
  } else {
    console.log("User not found.");
  }

  // Also, let's make sure the playlists are considered global or at least from this admin business
  // To be safe and consistent with the other 3, we could set businessId to NULL for these two
  console.log("\nSetting businessId to NULL for 'Gym morning' and 'Христианский' to make them globally curated...");
  const playlistRes = await client.query(`
    UPDATE playlists 
    SET "businessId" = NULL 
    WHERE name IN ('Gym morning', 'Христианский')
    RETURNING id, name, "businessId"
  `);
  
  playlistRes.rows.forEach(r => {
    console.log(`- Updated [${r.name}] to Global (BusinessId: ${r.businessId})`);
  });

  await client.end();
}

run().catch(console.error);
