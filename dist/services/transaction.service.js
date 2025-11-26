"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrganizerTransactions = getOrganizerTransactions;
exports.getTransactionById = getTransactionById;
exports.acceptTransaction = acceptTransaction;
exports.rejectTransaction = rejectTransaction;
exports.checkoutService = checkoutService;
const client_1 = require("@prisma/client");
const customError_1 = require("../utils/customError");
const prisma = new client_1.PrismaClient();
async function getOrganizerTransactions(organizerId) {
    return await prisma.transaction.findMany({
        where: {
            event: {
                organizerId: organizerId
            }
        },
        include: {
            user: {
                select: {
                    id: true,
                    firstname: true,
                    lastname: true,
                    email: true
                }
            },
            event: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    startDate: true,
                    location: true
                }
            },
            transactionItem: {
                include: {
                    ticketType: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
}
async function getTransactionById(transactionId, organizerId) {
    const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: {
            user: {
                select: {
                    id: true,
                    firstname: true,
                    lastname: true,
                    email: true,
                    profilePicture: true
                }
            },
            event: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    startDate: true,
                    endDate: true,
                    location: true,
                    organizerId: true
                }
            },
            transactionItem: {
                include: {
                    ticketType: {
                        select: {
                            name: true,
                            description: true,
                            price: true
                        }
                    }
                }
            },
            coupon: true,
            voucher: true
        }
    });
    if (!transaction) {
        throw (0, customError_1.createCustomError)(404, 'Transaction not found');
    }
    // Verify ownership
    if (transaction.event.organizerId !== organizerId) {
        throw (0, customError_1.createCustomError)(403, 'You can only view transactions for your own events');
    }
    return transaction;
}
async function acceptTransaction(transactionId, organizerId) {
    // 1. Dapatkan Transaksi dan Event untuk validasi kepemilikan dan status
    const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: {
            event: {
                select: {
                    organizerId: true,
                },
            },
        },
    });
    if (!transaction) {
        throw (0, customError_1.createCustomError)(404, "Transaction not found");
    }
    // 2. Validasi Kepemilikan (Hanya organizer event terkait yang bisa menyetujui)
    if (transaction.event.organizerId !== organizerId) {
        throw (0, customError_1.createCustomError)(403, "Forbidden: You are not the organizer of this event");
    }
    // 3. Validasi Status Transaksi (Hanya bisa menyetujui yang masih menunggu)
    if (transaction.status !== "WAITING_CONFIRMATION") {
        throw (0, customError_1.createCustomError)(400, `Cannot accept transaction with status: ${transaction.status}`);
    }
    // 4. Update Status Transaksi ke ACCEPTED
    const updatedTransaction = await prisma.transaction.update({
        where: { id: transactionId },
        data: {
            status: 'DONE', // Gunakan status yang sesuai di skema Anda
        },
        include: {
            transactionItem: true,
            event: true,
        }
    });
    return updatedTransaction;
}
async function rejectTransaction(transactionId, organizerId, reason) {
    const transaction = await getTransactionById(transactionId, organizerId);
    if (transaction.status !== 'WAITING_CONFIRMATION') {
        throw (0, customError_1.createCustomError)(400, 'Only transactions with WAITING_CONFIRMATION status can be rejected');
    }
    const updatedTransaction = await prisma.transaction.update({
        where: { id: transactionId },
        data: {
            status: 'REJECTED'
        },
        include: {
            user: true,
            event: true
        }
    });
    // Restore ticket quota
    for (const item of transaction.transactionItem) {
        if (item.ticketTypeId) {
            await prisma.ticketType.update({
                where: { id: item.ticketTypeId },
                data: {
                    availableQuota: {
                        increment: item.quantity
                    }
                }
            });
        }
    }
    // Send notification to user
    await prisma.notification.create({
        data: {
            userId: updatedTransaction.userId,
            title: 'Payment Rejected',
            message: `Your payment for "${updatedTransaction.event.title}" has been rejected. ${reason ? `Reason: ${reason}` : 'Please contact support for more information.'}`,
            type: 'TRANSACTION'
        }
    });
    return updatedTransaction;
}
async function checkoutService({ userId, eventId, ticketTypeId, quantity, }) {
    // 1. Get Ticket Type
    const ticket = await prisma.ticketType.findUnique({
        where: { id: ticketTypeId },
    });
    if (!ticket) {
        throw (0, customError_1.createCustomError)(404, "Ticket type not found");
    }
    // 2. Check quota
    if (ticket.availableQuota < quantity) {
        throw (0, customError_1.createCustomError)(400, "Not enough ticket quota");
    }
    // 3. Reduce quota
    await prisma.ticketType.update({
        where: { id: ticketTypeId },
        data: {
            availableQuota: {
                decrement: quantity,
            },
        },
    });
    const totalPrice = ticket.price * quantity;
    // 4. Create transaction
    const transaction = await prisma.transaction.create({
        data: {
            userId,
            eventId,
            status: "WAITING_CONFIRMATION",
            totalPrice,
        },
    });
    // 5. Create transaction item
    await prisma.transactionItem.create({
        data: {
            transactionId: transaction.id,
            ticketTypeId,
            quantity,
            price: ticket.price,
            subtotal: quantity * ticket.price,
        },
    });
    // 6. Return with detail
    return await prisma.transaction.findUnique({
        where: { id: transaction.id },
        include: {
            transactionItem: {
                include: { ticketType: true },
            },
            event: true,
        },
    });
}
