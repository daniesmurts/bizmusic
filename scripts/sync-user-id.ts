import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const currentSessionUserId = '49a08a8b-0ded-40b1-a0f0-94607f3e22b4';
  const targetEmail = 'daniel.smurts@yandex.ru';
  const oldUserId = 'bd53f787-a450-46fc-bb05-6371ba20eae3';

  console.log(`--- Syncing Account: ${targetEmail} ---`);
  
  // 1. Temporarily rename the old user email to avoid unique constraint
  const oldUser = await prisma.user.findFirst({
    where: { email: targetEmail }
  });

  if (oldUser && oldUser.id !== currentSessionUserId) {
    console.log(`Renaming old user email: ${oldUser.email} (ID: ${oldUser.id})`);
    await prisma.user.update({
      where: { id: oldUser.id },
      data: { email: `${targetEmail}-old-${Date.now()}` }
    });
  }

  // 2. Create the NEW user with the correct session ID
  console.log(`Creating/Updating new user with session ID: ${currentSessionUserId}`);
  const newUser = await prisma.user.upsert({
    where: { id: currentSessionUserId },
    update: { email: targetEmail },
    create: {
      id: currentSessionUserId,
      email: targetEmail,
      passwordHash: oldUser?.passwordHash || 'synced-from-supabase',
      role: oldUser?.role || 'BUSINESS_OWNER'
    }
  });

  // 3. Remap all businesses from old ID to new ID
  const businesses = await prisma.business.findMany({
    where: { userId: oldUserId }
  });

  for (const b of businesses) {
    console.log(`Remapping business '${b.legalName}' to ${currentSessionUserId}`);
    await prisma.business.update({
      where: { id: b.id },
      data: { userId: currentSessionUserId }
    });
  }

  // 4. Cleanup old user if it exists and has no businesses
  if (oldUser && oldUser.id !== currentSessionUserId) {
    const remainingBusinesses = await prisma.business.count({
      where: { userId: oldUser.id }
    });
    
    if (remainingBusinesses === 0) {
      console.log(`Deleting orphaned user record ${oldUser.id}`);
      await prisma.user.delete({ where: { id: oldUser.id } });
    }
  }

  console.log("--- Sync Complete ---");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
