// prisma/seed.ts
// Run with: npx prisma db seed
// Adds a couple of test reviewers and a handful of reviews on existing
// businesses, so you and the frontend dev have real data to work against.
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const businesses = await prisma.business.findMany({ take: 3 });
  if (businesses.length === 0) {
    console.log('No businesses found — seed the Listings module first.');
    return;
  }

  const passwordHash = await bcrypt.hash('password123', 10);

  const reviewers = await Promise.all(
    ['Seed Reviewer One', 'Seed Reviewer Two', 'Seed Reviewer Three'].map(
      (name, i) =>
        prisma.user.upsert({
          where: { email: `seed.reviewer${i + 1}@test.com` },
          update: {},
          create: {
            name,
            email: `seed.reviewer${i + 1}@test.com`,
            passwordHash,
          },
        }),
    ),
  );

  const sampleComments = [
    { rating: 5, comment: 'Excellent service, highly recommend!' },
    { rating: 4, comment: 'Really good, would come back.' },
    { rating: 3, comment: 'Decent, but nothing special.' },
  ];

  for (const business of businesses) {
    for (let i = 0; i < reviewers.length; i++) {
      const reviewer = reviewers[i];
      if (reviewer.id === business.ownerId) continue;

      await prisma.review.upsert({
        where: {
          businessId_userId: { businessId: business.id, userId: reviewer.id },
        },
        update: {},
        create: {
          businessId: business.id,
          userId: reviewer.id,
          ...sampleComments[i],
        },
      });
    }

    const agg = await prisma.review.aggregate({
      where: { businessId: business.id },
      _avg: { rating: true },
    });
    await prisma.business.update({
      where: { id: business.id },
      data: { rating: agg._avg.rating ?? 0 },
    });
  }

  console.log(`Seeded reviews for ${businesses.length} business(es).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });