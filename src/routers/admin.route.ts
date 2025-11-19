import { Router } from 'express';
import {
  //Event Management
  getAllEvents,
  getEventById,
  approveEvent,
  rejectEvent,
  deleteEvent,
  //User Management
  getAllUsers,
  updateUserRole,
  deleteUser,
  //Transaction Management
  getAllTransactions,
  updateTransactionStatus
} from '../controllers/admin.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { roleGuard } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticateToken);
router.use(roleGuard(['ADMIN']));

router.get('/events', getAllEvents);
router.get('/events/:eventId', getEventById);
router.patch('/events/:eventId/approve', approveEvent);
router.patch('/events/:eventId/reject', rejectEvent);
router.delete('/events/:eventId', deleteEvent);

router.get('/users', getAllUsers);
router.patch('/users/:userId/role', updateUserRole);
router.delete('/users/:userId', deleteUser);

router.get('/transactions', getAllTransactions);
router.patch('/transactions/:transactionId/status', updateTransactionStatus);

export default router;