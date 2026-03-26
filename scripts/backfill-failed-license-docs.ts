import { db } from "../src/db";
import { sql } from "drizzle-orm";

async function backfillFailedLicenseDocs() {
  const [{ count: beforeCount }] = (await db.execute(sql`
    SELECT count(*)::int AS count
    FROM licenses
    WHERE COALESCE(TRIM("pdfUrl"), '') = ''
      AND "documentStatus" <> 'FAILED'
  `)).rows as Array<{ count: number }>;

  const updateResult = await db.execute(sql`
    UPDATE licenses
    SET
      "documentStatus" = 'FAILED',
      "generationError" = COALESCE(NULLIF("generationError", ''), 'Backfill: missing pdfUrl after document-status migration')
    WHERE COALESCE(TRIM("pdfUrl"), '') = ''
      AND "documentStatus" <> 'FAILED'
  `);

  const [{ count: afterCount }] = (await db.execute(sql`
    SELECT count(*)::int AS count
    FROM licenses
    WHERE COALESCE(TRIM("pdfUrl"), '') = ''
      AND "documentStatus" <> 'FAILED'
  `)).rows as Array<{ count: number }>;

  console.log("Backfill completed.");
  console.log(`Rows requiring fix before: ${beforeCount}`);
  console.log(`Rows still requiring fix after: ${afterCount}`);
  console.log(`Updated rows: ${updateResult.rowCount ?? 0}`);
}

backfillFailedLicenseDocs()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exit(1);
  });
