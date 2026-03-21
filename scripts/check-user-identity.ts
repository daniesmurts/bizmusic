import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("--- Checking User and Business Mappings ---");
  
  // 1. Find the user with the ID reported in the browser
  const debugUserId = '49a08a8b-0ded-40b1-a0f0-94607f3e22b4';
  const userByDebugId = await prisma.user.findUnique({
    where: { id: debugUserId }
  });
  console.log("User for debug_user_id (49a0...):", userByDebugId ? `${userByDebugId.email} (ID: ${userByDebugId.id})` : "NOT FOUND");

  // 2. Find daniel.smurts@yandex.ru specifically
  const targetEmail = 'daniel.smurts@yandex.ru';
  const userByEmail = await prisma.user.findFirst({
    where: { email: targetEmail }
  });
  console.log(`User for ${targetEmail}:`, userByEmail ? `${userByEmail.email} (ID: ${userByEmail.id})` : "NOT FOUND");

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
