
import { db } from "../src/db";
import { playlists } from "../src/db/schema";

async function checkPlaylists() {
  const allPlaylists = await db.select().from(playlists);
  console.log("Total Playlists:", allPlaylists.length);
  allPlaylists.forEach(p => {
    console.log(`Playlist: ${p.id} | Name: ${p.name} | businessId: ${p.businessId}`);
  });
  process.exit(0);
}

checkPlaylists().catch(err => {
  console.error(err);
  process.exit(1);
});
