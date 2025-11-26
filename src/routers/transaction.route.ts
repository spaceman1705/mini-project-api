import { Router } from 'express';
import {
  getOrganizerTransactionsController,
  getTransactionByIdController,
  acceptTransactionController,
  rejectTransactionController,
  checkoutController
} from '../controllers/transaction.controller';
import { authMiddleware, roleGuard } from '../middlewares/auth.middleware';

const router = Router();

// Organizer routes
router.get(
  '/organizer',
  authMiddleware,
  roleGuard(['ORGANIZER', 'ADMIN']),
  getOrganizerTransactionsController
);

router.get(
  '/:id',
  authMiddleware,
  roleGuard(['ORGANIZER', 'ADMIN']),
  getTransactionByIdController
);

router.patch(
  '/:id/accept',
  authMiddleware,
  roleGuard(['ORGANIZER', 'ADMIN']),
  acceptTransactionController
);

router.patch(
  '/:id/reject',
  authMiddleware,
  roleGuard(['ORGANIZER', 'ADMIN']),
  rejectTransactionController
);

router.post("/checkout", authMiddleware, checkoutController);

export default router;