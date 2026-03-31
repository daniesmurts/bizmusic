const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();

  console.log("Checking for playlists and admin roles...");
  
  // 1. Get all playlists
  const playlistsRes = await client.query('SELECT id, name, "businessId" FROM playlists');
  console.log(`\nFound ${playlistsRes.rows.length} total playlists:`);
  playlistsRes.rows.forEach(r => {
    console.log(`- [${r.id}] "${r.name}" (BusinessId: ${r.businessId})`);
  });

  // 2. Get all admin users
  const adminUsersRes = await client.query("SELECT id, email, role, \"userType\" FROM users WHERE role = 'ADMIN' OR \"userType\" = 'CREATOR'");
  console.log(`\nFound ${adminUsersRes.rows.length} admin/creator users:`);
  adminUsersRes.rows.forEach(r => {
    console.log(`- [${r.id}] ${r.email} (Role: ${r.role}, Type: ${r.userType})`);
  });

  // 3. Get all businesses for these users
  if (adminUsersRes.rows.length > 0) {
    const userIds = adminUsersRes.rows.map(r => `'${r.id}'`).join(',');
    const adminBizRes = await client.query(`SELECT id, "userId", "legalName" FROM businesses WHERE "userId" IN (${userIds})`);
    console.log(`\nFound ${adminBizRes.rows.length} businesses owned by admins/creators:`);
    adminBizRes.rows.forEach(r => {
      console.log(`- [${r.id}] "${r.legalName}" (Owner: ${r.userId})`);
    });
  }

  await client.end();
}

run().catch(console.error);
