"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const transaction_controller_1 = require("../controllers/transaction.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Organizer routes
router.get('/organizer', auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleGuard)(['ORGANIZER', 'ADMIN']), transaction_controller_1.getOrganizerTransactionsController);
router.get('/:id', auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleGuard)(['ORGANIZER', 'ADMIN']), transaction_controller_1.getTransactionByIdController);
router.patch('/:id/accept', auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleGuard)(['ORGANIZER', 'ADMIN']), transaction_controller_1.acceptTransactionController);
router.patch('/:id/reject', auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleGuard)(['ORGANIZER', 'ADMIN']), transaction_controller_1.rejectTransactionController);
router.post("/checkout", auth_middleware_1.authMiddleware, transaction_controller_1.checkoutController);
exports.default = router;
