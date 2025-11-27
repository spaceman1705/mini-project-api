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
import { authenticateToken, roleGuard } from '../middlewares/auth.middleware';


const router = Router();

// Middleware global untuk semua route admin
router.use(authenticateToken);
router.use(roleGuard(['ADMIN']));

// Event Management
router.get('/events', getAllEvents);
router.get('/events/:eventId', getEventById);
router.patch('/events/:eventId/approve', approveEvent);
router.patch('/events/:eventId/reject', rejectEvent);
router.delete('/events/:eventId', deleteEvent);

// User Management
router.get('/users', getAllUsers);
router.patch('/users/:userId/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// Transaction Management
router.get('/transactions', getAllTransactions);
router.patch('/transactions/:transactionId/status', updateTransactionStatus);

export default router;