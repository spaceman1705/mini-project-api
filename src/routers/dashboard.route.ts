// backend/src/routes/dashboard.routes.ts
import { Router } from 'express';
import {
  getCustomerStats,
  getCustomerUpcomingEvents,
  getOrganizerStats,
  getOrganizerEvents,
  getOrganizerWeeklySales,
  getAdminStats,
  getAdminRecentUsers,
  getAdminPendingEvents,
  getAdminUserGrowth,
} from '../controllers/dashboard.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { roleGuard } from '../middlewares/role.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

//CUSTOMER ROUTES
router.get(
  '/customer/stats',
  roleGuard(['CUSTOMER']),
  getCustomerStats
);

router.get(
  '/customer/upcoming-events',
  roleGuard(['CUSTOMER']),
  getCustomerUpcomingEvents
);

//ORGANIZER ROUTES
router.get(
  '/organizer/stats',
  roleGuard(['ORGANIZER']),
  getOrganizerStats
);

router.get(
  '/organizer/events',
  roleGuard(['ORGANIZER']),
  getOrganizerEvents
);

router.get(
  '/organizer/weekly-sales',
  roleGuard(['ORGANIZER']),
  getOrganizerWeeklySales
);

//ADMIN ROUTES
router.get(
  '/admin/stats',
  roleGuard(['ADMIN']),
  getAdminStats
);

router.get(
  '/admin/recent-users',
  roleGuard(['ADMIN']),
  getAdminRecentUsers
);

router.get(
  '/admin/pending-events',
  roleGuard(['ADMIN']),
  getAdminPendingEvents
);

router.get(
  '/admin/user-growth',
  roleGuard(['ADMIN']),
  getAdminUserGrowth
);

export default router;