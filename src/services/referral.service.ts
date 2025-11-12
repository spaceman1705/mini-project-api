import prisma from "../lib/prisma";

export async function handleReferral(referrerCode: string, newUserId: string) {
  const referrer = await prisma.user.findUnique({
    where: { referralCode: referrerCode },
  });

  if (!referrer) return null;

  // Tambah 10.000 poin
  await prisma.pointsHistory.create({
    data: {
      points: 10000,
      source: "Referral Bonus",
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 bulan
      userId: referrer.id,
    },
  });

  // Tambah balance di User
  await prisma.user.update({
    where: { id: referrer.id },
    data: { pointsBalance: { increment: 10000 } },
  });

  // Buat voucher untuk user baru
  await prisma.voucher.create({
    data: {
      code: `DISC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      discountAmount: 5000,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      userId: newUserId,
    },
  });
}
