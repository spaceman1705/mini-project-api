"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Middleware global untuk semua route admin
router.use(auth_middleware_1.authenticateToken);
router.use((0, auth_middleware_1.roleGuard)(['ADMIN']));
// Event Management
router.get('/events', admin_controller_1.getAllEvents);
router.get('/events/:eventId', admin_controller_1.getEventById);
router.patch('/events/:eventId/approve', admin_controller_1.approveEvent);
router.patch('/events/:eventId/reject', admin_controller_1.rejectEvent);
router.delete('/events/:eventId', admin_controller_1.deleteEvent);
// User Management
router.get('/users', admin_controller_1.getAllUsers);
router.patch('/users/:id/role', admin_controller_1.updateUserRole);
router.delete('/users/:id', admin_controller_1.deleteUser);
// Transaction Management
router.get('/transactions', admin_controller_1.getAllTransactions);
router.patch('/transactions/:transactionId/status', admin_controller_1.updateTransactionStatus);
exports.default = router;
