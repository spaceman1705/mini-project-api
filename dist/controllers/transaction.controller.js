"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrganizerTransactionsController = getOrganizerTransactionsController;
exports.getTransactionByIdController = getTransactionByIdController;
exports.acceptTransactionController = acceptTransactionController;
exports.rejectTransactionController = rejectTransactionController;
exports.checkoutController = checkoutController;
const transaction_service_1 = require("../services/transaction.service");
const prisma_1 = __importDefault(require("../lib/prisma"));
// Reusable function to fetch DB user from token
async function getDbUser(token) {
    return prisma_1.default.user.findUnique({
        where: { email: token.email }
    });
}
async function getOrganizerTransactionsController(req, res, next) {
    try {
        const user = req.user;
        const dbUser = await getDbUser(user);
        if (!dbUser)
            return res.status(401).json({ message: 'User not found' });
        const transactions = await (0, transaction_service_1.getOrganizerTransactions)(dbUser.id);
        res.json({ message: 'OK', data: transactions });
    }
    catch (err) {
        next(err);
    }
}
async function getTransactionByIdController(req, res, next) {
    try {
        const user = req.user;
        const dbUser = await getDbUser(user);
        if (!dbUser)
            return res.status(401).json({ message: 'User not found' });
        const transaction = await (0, transaction_service_1.getTransactionById)(req.params.id, dbUser.id);
        res.json({ message: 'OK', data: transaction });
    }
    catch (err) {
        next(err);
    }
}
async function acceptTransactionController(req, res, next) {
    try {
        const { id } = req.params; // Ambil transaction ID dari URL path
        const user = req.user; // Ambil user (organizer) ID dari middleware
        if (!id) {
            throw createCustomError(400, "Transaction ID is required");
        }
        // Panggil service untuk memproses persetujuan
        const data = await (0, transaction_service_1.acceptTransaction)(id, user.id);
        res.status(200).json({
            message: "Transaction successfully accepted and ticket confirmed",
            data,
        });
    }
    catch (err) {
        next(err);
    }
}
async function rejectTransactionController(req, res, next) {
    try {
        const user = req.user;
        const dbUser = await getDbUser(user);
        if (!dbUser)
            return res.status(401).json({ message: 'User not found' });
        const transaction = await (0, transaction_service_1.rejectTransaction)(req.params.id, dbUser.id, req.body.reason);
        res.json({ message: 'Payment rejected', data: transaction });
    }
    catch (err) {
        next(err);
    }
}
async function checkoutController(req, res, next) {
    try {
        const user = req.user;
        const { eventId, ticketTypeId, quantity } = req.body;
        if (!ticketTypeId) {
            // Jika tiketTypeId tidak ada di body, kita cegah Prisma error 
            throw createCustomError(400, "Ticket Type ID is missing from the request body.");
        }
        const result = await (0, transaction_service_1.checkoutService)({
            userId: user.id,
            eventId,
            ticketTypeId,
            quantity,
        });
        res.status(201).json({
            message: "Checkout successful",
            data: result,
        });
    }
    catch (err) {
        next(err);
    }
}
function createCustomError(arg0, arg1) {
    throw new Error('Function not implemented.');
}
