import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Get first user
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log("No user found to associate business with.");
    return;
  }

  const business = await prisma.business.upsert({
    where: { inn: "7701234567" },
    update: {},
    create: {
      userId: user.id,
      inn: "7701234567",
      kpp: "770101001",
      legalName: 'ООО "Кофейня Маяк"',
      address: "г. Москва, ул. Арбат, д. 1",
      subscriptionStatus: "ACTIVE",
    },
  });

  console.log("Seed complete:", business.legalName);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
