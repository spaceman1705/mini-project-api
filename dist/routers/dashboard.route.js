"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/dashboard.routes.ts
const express_1 = require("express");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticateToken);
//CUSTOMER ROUTES
router.get('/customer/stats', (0, role_middleware_1.roleGuard)(['CUSTOMER']), dashboard_controller_1.getCustomerStats);
router.get('/customer/upcoming-events', (0, role_middleware_1.roleGuard)(['CUSTOMER']), dashboard_controller_1.getCustomerUpcomingEvents);
//ORGANIZER ROUTES
router.get('/organizer/stats', (0, role_middleware_1.roleGuard)(['ORGANIZER']), dashboard_controller_1.getOrganizerStats);
router.get('/organizer/events', (0, role_middleware_1.roleGuard)(['ORGANIZER']), dashboard_controller_1.getOrganizerEvents);
router.get('/organizer/weekly-sales', (0, role_middleware_1.roleGuard)(['ORGANIZER']), dashboard_controller_1.getOrganizerWeeklySales);
//ADMIN ROUTES
router.get('/admin/stats', (0, role_middleware_1.roleGuard)(['ADMIN']), dashboard_controller_1.getAdminStats);
router.get('/admin/recent-users', (0, role_middleware_1.roleGuard)(['ADMIN']), dashboard_controller_1.getAdminRecentUsers);
router.get('/admin/pending-events', (0, role_middleware_1.roleGuard)(['ADMIN']), dashboard_controller_1.getAdminPendingEvents);
router.get('/admin/user-growth', (0, role_middleware_1.roleGuard)(['ADMIN']), dashboard_controller_1.getAdminUserGrowth);
exports.default = router;
