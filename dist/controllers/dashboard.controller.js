"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomerStats = getCustomerStats;
exports.getCustomerUpcomingEvents = getCustomerUpcomingEvents;
exports.getCustomerRecentActivity = getCustomerRecentActivity;
exports.getOrganizerStats = getOrganizerStats;
exports.getOrganizerEvents = getOrganizerEvents;
exports.getOrganizerWeeklySales = getOrganizerWeeklySales;
exports.getOrganizerTransactions = getOrganizerTransactions;
exports.deleteOrganizerEvent = deleteOrganizerEvent;
exports.getAdminStats = getAdminStats;
exports.getAdminRecentUsers = getAdminRecentUsers;
exports.getAdminPendingEvents = getAdminPendingEvents;
exports.getAdminUserGrowth = getAdminUserGrowth;
const dashboard_service_1 = require("../services/dashboard.service");
//CUSTOMER CONTROLLERS
async function getCustomerStats(req, res) {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const stats = await (0, dashboard_service_1.getCustomerStatsService)(userId);
        res.json({
            message: "OK",
            data: stats
        });
    }
    catch (error) {
        console.error("getCustomerStats error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}
async function getCustomerUpcomingEvents(req, res) {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const events = await (0, dashboard_service_1.getCustomerUpcomingEventsService)(userId);
        res.json({
            message: "OK",
            data: events
        });
    }
    catch (error) {
        console.error("getCustomerUpcomingEvents error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}
async function getCustomerRecentActivity(req, res) {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const activities = await (0, dashboard_service_1.getCustomerRecentActivityService)(userId);
        res.json({
            message: "OK",
            data: activities
        });
    }
    catch (error) {
        console.error("getCustomerRecentActivity error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}
//ORGANIZER CONTROLLERS
async function getOrganizerStats(req, res) {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const stats = await (0, dashboard_service_1.getOrganizerStatsService)(userId);
        res.json({
            message: "OK",
            data: stats
        });
    }
    catch (error) {
        console.error("getOrganizerStats error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}
async function getOrganizerEvents(req, res) {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const events = await (0, dashboard_service_1.getOrganizerEventsService)(userId);
        res.json({
            message: "OK",
            data: events
        });
    }
    catch (error) {
        console.error("getOrganizerEvents error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}
async function getOrganizerWeeklySales(req, res) {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const sales = await (0, dashboard_service_1.getOrganizerWeeklySalesService)(userId);
        res.json({
            message: "OK",
            data: sales
        });
    }
    catch (error) {
        console.error("getOrganizerWeeklySales error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}
async function getOrganizerTransactions(req, res) {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const transactions = await (0, dashboard_service_1.getOrganizerTransactionsService)(userId);
        res.json({
            message: "OK",
            data: transactions
        });
    }
    catch (error) {
        console.error("getOrganizerTransactions error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}
async function deleteOrganizerEvent(req, res) {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const eventId = req.params.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const result = await (0, dashboard_service_1.deleteOrganizerEventService)(userId, eventId);
        res.json({
            message: "Event deleted successfully",
            data: result
        });
    }
    catch (error) {
        console.error("deleteOrganizerEvent error:", error);
        if (error.message === 'EVENT_NOT_FOUND') {
            return res.status(404).json({ message: "Event not found" });
        }
        if (error.message === 'UNAUTHORIZED') {
            return res.status(403).json({ message: "You can only delete your own events" });
        }
        if (error.message === 'HAS_TRANSACTIONS') {
            return res.status(400).json({
                message: "Cannot delete event with existing transactions. Please contact admin."
            });
        }
        res.status(500).json({ error: "Internal server error" });
    }
}
//ADMIN CONTROLLERS
async function getAdminStats(req, res) {
    try {
        const stats = await (0, dashboard_service_1.getAdminStatsService)();
        res.json({
            message: "OK",
            data: stats
        });
    }
    catch (error) {
        console.error("getAdminStats error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}
async function getAdminRecentUsers(req, res) {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const users = await (0, dashboard_service_1.getAdminRecentUsersService)(limit);
        res.json({
            message: "OK",
            data: users
        });
    }
    catch (error) {
        console.error("getAdminRecentUsers error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}
async function getAdminPendingEvents(req, res) {
    try {
        const events = await (0, dashboard_service_1.getAdminPendingEventsService)();
        res.json({
            message: "OK",
            data: events
        });
    }
    catch (error) {
        console.error("getAdminPendingEvents error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}
async function getAdminUserGrowth(req, res) {
    try {
        const growth = await (0, dashboard_service_1.getAdminUserGrowthService)();
        res.json({
            message: "OK",
            data: growth
        });
    }
    catch (error) {
        console.error("getAdminUserGrowth error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}
