"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllEvents = getAllEvents;
exports.getEventById = getEventById;
exports.approveEvent = approveEvent;
exports.rejectEvent = rejectEvent;
exports.deleteEvent = deleteEvent;
exports.getAllUsers = getAllUsers;
exports.updateUserRole = updateUserRole;
exports.deleteUser = deleteUser;
exports.getAllTransactions = getAllTransactions;
exports.updateTransactionStatus = updateTransactionStatus;
const admin_service_1 = require("../services/admin.service");
//EVENT CONTROLLERS
async function getAllEvents(req, res) {
    try {
        const events = await (0, admin_service_1.getAllEventsService)();
        res.json({
            message: "OK",
            data: events,
        });
    }
    catch (error) {
        console.error("getAllEvents error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}
async function getEventById(req, res) {
    try {
        const { eventId } = req.params;
        const event = await (0, admin_service_1.getEventByIdService)(eventId);
        res.json({
            message: "OK",
            data: event,
        });
    }
    catch (error) {
        console.error("getEventById error:", error);
        if (error.message === "EVENT_NOT_FOUND") {
            return res.status(404).json({ error: "Event not found" });
        }
        res.status(500).json({ error: "Internal server error" });
    }
}
async function approveEvent(req, res) {
    try {
        const { eventId } = req.params;
        const updatedEvent = await (0, admin_service_1.approveEventService)(eventId);
        res.json({
            message: "Event approved successfully",
            data: updatedEvent,
        });
    }
    catch (error) {
        console.error("approveEvent error:", error);
        if (error.message === "EVENT_NOT_FOUND") {
            return res.status(404).json({ error: "Event not found" });
        }
        if (error.message === "ONLY_DRAFT_CAN_BE_APPROVED") {
            return res
                .status(400)
                .json({ error: "Only draft events can be approved" });
        }
        res.status(500).json({ error: "Internal server error" });
    }
}
async function rejectEvent(req, res) {
    try {
        const { eventId } = req.params;
        const updatedEvent = await (0, admin_service_1.rejectEventService)(eventId);
        res.json({
            message: "Event rejected",
            data: updatedEvent,
        });
    }
    catch (error) {
        console.error("rejectEvent error:", error);
        if (error.message === "EVENT_NOT_FOUND") {
            return res.status(404).json({ error: "Event not found" });
        }
        res.status(500).json({ error: "Internal server error" });
    }
}
async function deleteEvent(req, res) {
    try {
        const { eventId } = req.params;
        await (0, admin_service_1.deleteEventService)(eventId);
        res.json({
            message: "Event deleted successfully",
        });
    }
    catch (error) {
        console.error("deleteEvent error:", error);
        if (error.message === "EVENT_NOT_FOUND") {
            return res.status(404).json({ error: "Event not found" });
        }
        if (error.message === "HAS_TRANSACTIONS") {
            return res.status(400).json({
                error: "Cannot delete event with existing transactions. Cancel it instead.",
            });
        }
        res.status(500).json({ error: "Internal server error" });
    }
}
//USER CONTROLLERS
async function getAllUsers(req, res) {
    console.log("🔵 getAllUsers endpoint HIT!");
    console.log("User from token:", req.user);
    try {
        console.log("🟢 Fetching users from database...");
        const users = await (0, admin_service_1.getAllUsersService)();
        console.log("✅ Users fetched successfully:", users.length);
        res.json({
            message: "OK",
            data: users,
        });
    }
    catch (error) {
        console.error("getAllUsers error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}
async function updateUserRole(req, res) {
    try {
        const { userId } = req.params;
        const { role } = req.body;
        const user = await (0, admin_service_1.updateUserRoleService)(userId, role);
        res.json({
            message: "User role updated successfully",
            data: user,
        });
    }
    catch (error) {
        console.error("updateUserRole error:", error);
        if (error.message === "INVALID_ROLE") {
            return res.status(400).json({ error: "Invalid role" });
        }
        res.status(500).json({ error: "Internal server error" });
    }
}
async function deleteUser(req, res) {
    var _a;
    try {
        const { userId } = req.params;
        const currentUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!currentUserId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        await (0, admin_service_1.deleteUserService)(userId, currentUserId);
        res.json({
            message: "User deleted successfully",
        });
    }
    catch (error) {
        console.error("deleteUser error:", error);
        if (error.message === "CANNOT_DELETE_SELF") {
            return res.status(400).json({ error: "Cannot delete your own account" });
        }
        res.status(500).json({ error: "Internal server error" });
    }
}
//TRANSACTION CONTROLLERS
async function getAllTransactions(req, res) {
    try {
        const transactions = await (0, admin_service_1.getAllTransactionsService)();
        res.json({
            message: "OK",
            data: transactions,
        });
    }
    catch (error) {
        console.error("getAllTransactions error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}
async function updateTransactionStatus(req, res) {
    try {
        const { transactionId } = req.params;
        const { status } = req.body;
        const transaction = await (0, admin_service_1.updateTransactionStatusService)(transactionId, status);
        res.json({
            message: "Transaction status updated successfully",
            data: transaction,
        });
    }
    catch (error) {
        console.error("updateTransactionStatus error:", error);
        if (error.message === "INVALID_STATUS") {
            return res.status(400).json({ error: "Invalid status" });
        }
        res.status(500).json({ error: "Internal server error" });
    }
}
