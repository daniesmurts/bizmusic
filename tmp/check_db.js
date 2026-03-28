const { drizzle } = require("drizzle-orm/postgres-js");
const postgres = require("postgres");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env.local") });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL not found");
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

async function check() {
  console.log("Checking playlists...");
  
  // Using direct SQL to avoid schema issues in scratch script
  const playlists = await client`SELECT id, name, "businessId" FROM playlists`;
  const admins = await client`SELECT id, email, role FROM users WHERE role = 'ADMIN'`;
  const adminBusinesses = await client`
    SELECT b.id, b."userId", u.email 
    FROM businesses b 
    JOIN users u ON b."userId" = u.id 
    WHERE u.role = 'ADMIN'
  `;

  console.log("\n--- ALL PLAYLISTS ---");
  playlists.forEach(p => {
    console.log(`- ID: ${p.id}, Name: ${p.name}, Business: ${p.businessId}`);
  });

  console.log("\n--- ADMIN USERS ---");
  admins.forEach(a => {
    console.log(`- ID: ${a.id}, Email: ${a.email}, Role: ${a.role}`);
  });

  console.log("\n--- ADMIN BUSINESSES ---");
  adminBusinesses.forEach(b => {
    console.log(`- ID: ${b.id}, UserID: ${b.userId}, Email: ${b.email}`);
  });

  process.exit(0);
}

check().catch(e => {
  console.error(e);
  process.exit(1);
});
