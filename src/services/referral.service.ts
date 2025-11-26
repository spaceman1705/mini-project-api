import prisma from "../lib/prisma";

export async function handleReferral(referrerCode: string, newUserId: string) {
  const referrer = await prisma.user.findUnique({
    where: { refferalCode: referrerCode },
  });

  if (!referrer) return null;

  // Tambah 10.000 poin
  await prisma.point.create({
    data: {
      amount: 10000,
      pointType: "EARNED",
      description: "Referral Bonus",
      expiredAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      userId: referrer.id,
    },
  });

  const defaultEvent = await prisma.event.findFirst();
  if (!defaultEvent) return null;

  // Buat voucher untuk user baru
  await prisma.voucher.create({
    data: {
      code: `DISC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      discountAmount: 5000,
      expiredAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      eventId: defaultEvent.id,
    },
  });
}
