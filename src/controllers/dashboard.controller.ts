import { Request, Response } from 'express';
import {
  getCustomerStatsService,
  getCustomerUpcomingEventsService,
  getCustomerRecentActivityService,
  getOrganizerStatsService,
  getOrganizerEventsService,
  getOrganizerWeeklySalesService,
  getOrganizerTransactionsService,
  deleteOrganizerEventService,
  getAdminStatsService,
  getAdminRecentUsersService,
  getAdminPendingEventsService,
  getAdminUserGrowthService
} from '../services/dashboard.service';

//CUSTOMER CONTROLLERS
export async function getCustomerStats(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const stats = await getCustomerStatsService(userId);

    res.json({
      message: "OK",
      data: stats
    });
  } catch (error) {
    console.error("getCustomerStats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getCustomerUpcomingEvents(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const events = await getCustomerUpcomingEventsService(userId);

    res.json({
      message: "OK",
      data: events
    });
  } catch (error) {
    console.error("getCustomerUpcomingEvents error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getCustomerRecentActivity(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const activities = await getCustomerRecentActivityService(userId);

    res.json({
      message: "OK",
      data: activities
    });
  } catch (error) {
    console.error("getCustomerRecentActivity error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

//ORGANIZER CONTROLLERS
export async function getOrganizerStats(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const stats = await getOrganizerStatsService(userId);

    res.json({
      message: "OK",
      data: stats
    });
  } catch (error) {
    console.error("getOrganizerStats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getOrganizerEvents(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const events = await getOrganizerEventsService(userId);

    res.json({
      message: "OK",
      data: events
    });
  } catch (error) {
    console.error("getOrganizerEvents error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getOrganizerWeeklySales(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const sales = await getOrganizerWeeklySalesService(userId);

    res.json({
      message: "OK",
      data: sales
    });
  } catch (error) {
    console.error("getOrganizerWeeklySales error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getOrganizerTransactions(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const transactions = await getOrganizerTransactionsService(userId);

    res.json({
      message: "OK",
      data: transactions
    });
  } catch (error) {
    console.error("getOrganizerTransactions error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function deleteOrganizerEvent(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const eventId = req.params.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await deleteOrganizerEventService(userId, eventId);

    res.json({
      message: "Event deleted successfully",
      data: result
    });
  } catch (error: any) {
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
export async function getAdminStats(req: Request, res: Response) {
  try {
    const stats = await getAdminStatsService();

    res.json({
      message: "OK",
      data: stats
    });
  } catch (error) {
    console.error("getAdminStats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getAdminRecentUsers(req: Request, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const users = await getAdminRecentUsersService(limit);

    res.json({
      message: "OK",
      data: users
    });
  } catch (error) {
    console.error("getAdminRecentUsers error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getAdminPendingEvents(req: Request, res: Response) {
  try {
    const events = await getAdminPendingEventsService();

    res.json({
      message: "OK",
      data: events
    });
  } catch (error) {
    console.error("getAdminPendingEvents error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getAdminUserGrowth(req: Request, res: Response) {
  try {
    const growth = await getAdminUserGrowthService();

    res.json({
      message: "OK",
      data: growth
    });
  } catch (error) {
    console.error("getAdminUserGrowth error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}