import { prisma } from "../src/lib/prisma"

async function main() {
  console.log('--- Businesses ---')
  const businesses = await (prisma as any).business.findMany({
    include: {
      user: true,
      licenses: true
    }
  })
  console.log(JSON.stringify(businesses.map((b: any) => ({
    id: b.id,
    userId: b.userId,
    inn: b.inn,
    status: b.subscriptionStatus,
    licenseCount: b.licenses.length,
    userEmail: b.user?.email
  })), null, 2))

  console.log('\n--- Recent Licenses ---')
  const licenses = await (prisma as any).license.findMany({
    take: 5,
    orderBy: { issuedAt: 'desc' },
    include: {
        business: true
    }
  })
  console.log(JSON.stringify(licenses.map((l: any) => ({
    id: l.id,
    businessName: l.business?.legalName,
    issuedAt: l.issuedAt
  })), null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
