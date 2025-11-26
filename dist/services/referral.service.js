"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleReferral = handleReferral;
const prisma_1 = __importDefault(require("../lib/prisma"));
async function handleReferral(referrerCode, newUserId) {
    const referrer = await prisma_1.default.user.findUnique({
        where: { refferalCode: referrerCode },
    });
    if (!referrer)
        return null;
    // Tambah 10.000 poin
    await prisma_1.default.point.create({
        data: {
            amount: 10000,
            pointType: "EARNED",
            description: "Referral Bonus",
            expiredAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            userId: referrer.id,
        },
    });
    const defaultEvent = await prisma_1.default.event.findFirst();
    if (!defaultEvent)
        return null;
    // Buat voucher untuk user baru
    await prisma_1.default.voucher.create({
        data: {
            code: `DISC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            discountAmount: 5000,
            expiredAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            eventId: defaultEvent.id,
        },
    });
}
