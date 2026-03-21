import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("--- Checking User and Business Mappings ---");
  
  const debugUserId = process.env.DEBUG_USER_ID;
  const userByDebugId = debugUserId ? await prisma.user.findUnique({
    where: { id: debugUserId }
  }) : null;
  console.log("User for DEBUG_USER_ID:", userByDebugId ? `${userByDebugId.email} (ID: ${userByDebugId.id})` : "NOT FOUND or NOT PROVIDED");

  // 2. Find target user by email
  const targetEmail = process.env.TARGET_EMAIL;
  const userByEmail = targetEmail ? await prisma.user.findFirst({
    where: { email: targetEmail }
  }) : null;
  console.log(`User for ${targetEmail || 'TARGET_EMAIL'}:`, userByEmail ? `${userByEmail.email} (ID: ${userByEmail.id})` : "NOT FOUND or NOT PROVIDED");

  // 3. List all businesses and their associated user IDs
  const businesses = await prisma.business.findMany({
    include: {
      licenses: true
    }
  });

  console.log("\n--- All Businesses in DB ---");
  businesses.forEach((b: any) => {
    console.log(`- Business: ${b.legalName} (ID: ${b.id})`);
    console.log(`  User ID: ${b.userId}`);
    console.log(`  License Count: ${b.licenses.length}`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
