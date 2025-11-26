"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllEventsService = getAllEventsService;
exports.getEventByIdService = getEventByIdService;
exports.approveEventService = approveEventService;
exports.rejectEventService = rejectEventService;
exports.deleteEventService = deleteEventService;
exports.getAllUsersService = getAllUsersService;
exports.updateUserRoleService = updateUserRoleService;
exports.deleteUserService = deleteUserService;
exports.getAllTransactionsService = getAllTransactionsService;
exports.updateTransactionStatusService = updateTransactionStatusService;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
//EVENT SERVICES
async function getAllEventsService() {
    return await prisma.event.findMany({
        include: {
            organizer: {
                select: {
                    id: true,
                    firstname: true,
                    lastname: true,
                    email: true,
                },
            },
            _count: {
                select: {
                    transaction: true,
                    review: true,
                    ticketType: true,
                    voucher: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}
async function getEventByIdService(eventId) {
    const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
            organizer: {
                select: {
                    id: true,
                    firstname: true,
                    lastname: true,
                    email: true,
                    profilePicture: true,
                },
            },
            ticketType: true,
            voucher: true,
            transaction: {
                include: {
                    user: {
                        select: {
                            firstname: true,
                            lastname: true,
                            email: true,
                        },
                    },
                    transactionItem: true,
                },
            },
            review: {
                include: {
                    user: {
                        select: {
                            firstname: true,
                            lastname: true,
                        },
                    },
                },
            },
            _count: {
                select: {
                    transaction: true,
                    review: true,
                },
            },
        },
    });
    if (!event) {
        throw new Error("EVENT_NOT_FOUND");
    }
    return event;
}
async function approveEventService(eventId) {
    const event = await prisma.event.findUnique({
        where: { id: eventId },
    });
    if (!event) {
        throw new Error("EVENT_NOT_FOUND");
    }
    if (event.status !== "DRAFT") {
        throw new Error("ONLY_DRAFT_CAN_BE_APPROVED");
    }
    const updatedEvent = await prisma.event.update({
        where: { id: eventId },
        data: { status: "PUBLISHED" },
        include: {
            organizer: {
                select: {
                    firstname: true,
                    lastname: true,
                    email: true,
                },
            },
        },
    });
    // Send notification to organizer
    await prisma.notification.create({
        data: {
            userId: event.organizerId,
            title: "Event Approved",
            message: `Your event "${event.title}" has been approved and is now published.`,
            type: "SYSTEM",
        },
    });
    return updatedEvent;
}
async function rejectEventService(eventId) {
    const event = await prisma.event.findUnique({
        where: { id: eventId },
    });
    if (!event) {
        throw new Error("EVENT_NOT_FOUND");
    }
    const updatedEvent = await prisma.event.update({
        where: { id: eventId },
        data: { status: "CANCELED" },
        include: {
            organizer: {
                select: {
                    firstname: true,
                    lastname: true,
                    email: true,
                },
            },
        },
    });
    // Send notification to organizer
    await prisma.notification.create({
        data: {
            userId: event.organizerId,
            title: "Event Rejected",
            message: `Your event "${event.title}" has been rejected. Please contact support for more information.`,
            type: "SYSTEM",
        },
    });
    return updatedEvent;
}
async function deleteEventService(eventId) {
    const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
            _count: {
                select: {
                    transaction: true,
                },
            },
        },
    });
    if (!event) {
        throw new Error("EVENT_NOT_FOUND");
    }
    // Check if event has transactions
    if (event._count.transaction > 0) {
        throw new Error("HAS_TRANSACTIONS");
    }
    await prisma.event.delete({
        where: { id: eventId },
    });
    return { id: eventId };
}
//USER SERVICES
async function getAllUsersService() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
            role: true,
            isVerified: true,
            profilePicture: true,
            createdAt: true,
            _count: {
                select: {
                    event: true,
                    transaction: true,
                    review: true,
                },
            },
        },
    });
    // Map to match frontend expectations
    return users.map((user) => (Object.assign(Object.assign({}, user), { _count: {
            event: user._count.event,
            transaction: user._count.transaction,
            review: user._count.review,
        } })));
}
async function updateUserRoleService(userId, role) {
    const validRoles = ["ADMIN", "ORGANIZER", "CUSTOMER"];
    if (!validRoles.includes(role)) {
        throw new Error("INVALID_ROLE");
    }
    return await prisma.user.update({
        where: { id: userId },
        data: { role: role },
    });
}
async function deleteUserService(userId, currentUserId) {
    // Cannot delete yourself
    if (userId === currentUserId) {
        throw new Error("CANNOT_DELETE_SELF");
    }
    await prisma.user.delete({
        where: { id: userId },
    });
    return { id: userId };
}
//TRANSACTION SERVICES
async function getAllTransactionsService() {
    return await prisma.transaction.findMany({
        include: {
            user: {
                select: {
                    firstname: true,
                    lastname: true,
                    email: true,
                },
            },
            event: {
                select: {
                    title: true,
                    slug: true,
                    category: true,
                },
            },
            transactionItem: {
                include: {
                    ticketType: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}
async function updateTransactionStatusService(transactionId, status) {
    const validStatuses = [
        "WAITING_PAYMENT",
        "WAITING_CONFIRMATION",
        "DONE",
        "REJECTED",
        "EXPIRED",
        "CANCELED",
    ];
    if (!validStatuses.includes(status)) {
        throw new Error("INVALID_STATUS");
    }
    const transaction = await prisma.transaction.update({
        where: { id: transactionId },
        data: { status: status },
    });
    // Send notification to user
    await prisma.notification.create({
        data: {
            userId: transaction.userId,
            title: "Transaction Status Updated",
            message: `Your transaction status has been updated to ${status}`,
            type: "TRANSACTION",
        },
    });
    return transaction;
}
