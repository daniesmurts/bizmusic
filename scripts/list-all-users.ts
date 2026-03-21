import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("--- Listing All Users in public.users ---");
  const users = await prisma.user.findMany();
  
  users.forEach(u => {
    console.log(`- Email: ${u.email} (ID: ${u.id})`);
  });

  console.log("\n--- Checking for businesses without valid userId mapping ---");
  const businesses = await prisma.business.findMany();
  for (const b of businesses) {
    const user = await prisma.user.findUnique({ where: { id: b.userId } });
    if (!user) {
      console.log(`- Orphaned Business: ${b.legalName} (UserId: ${b.userId}) - User NOT in public.users`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
