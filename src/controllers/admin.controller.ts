import { Request, Response } from 'express';
import {
  // Event Services
  getAllEventsService,
  getEventByIdService,
  approveEventService,
  rejectEventService,
  deleteEventService,
  // User Services
  getAllUsersService,
  updateUserRoleService,
  deleteUserService,
  // Transaction Services
  getAllTransactionsService,
  updateTransactionStatusService
} from '../services/admin.service';

//EVENT CONTROLLERS
export async function getAllEvents(req: Request, res: Response) {
  try {
    const events = await getAllEventsService();

    res.json({
      message: "OK",
      data: events
    });
  } catch (error) {
    console.error("getAllEvents error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getEventById(req: Request, res: Response) {
  try {
    const { eventId } = req.params;
    const event = await getEventByIdService(eventId);

    res.json({
      message: "OK",
      data: event
    });
  } catch (error: any) {
    console.error("getEventById error:", error);

    if (error.message === 'EVENT_NOT_FOUND') {
      return res.status(404).json({ error: "Event not found" });
    }

    res.status(500).json({ error: "Internal server error" });
  }
}

export async function approveEvent(req: Request, res: Response) {
  try {
    const { eventId } = req.params;
    const updatedEvent = await approveEventService(eventId);

    res.json({
      message: "Event approved successfully",
      data: updatedEvent
    });
  } catch (error: any) {
    console.error("approveEvent error:", error);

    if (error.message === 'EVENT_NOT_FOUND') {
      return res.status(404).json({ error: "Event not found" });
    }

    if (error.message === 'ONLY_DRAFT_CAN_BE_APPROVED') {
      return res.status(400).json({ error: "Only draft events can be approved" });
    }

    res.status(500).json({ error: "Internal server error" });
  }
}

export async function rejectEvent(req: Request, res: Response) {
  try {
    const { eventId } = req.params;
    const updatedEvent = await rejectEventService(eventId);

    res.json({
      message: "Event rejected",
      data: updatedEvent
    });
  } catch (error: any) {
    console.error("rejectEvent error:", error);

    if (error.message === 'EVENT_NOT_FOUND') {
      return res.status(404).json({ error: "Event not found" });
    }

    res.status(500).json({ error: "Internal server error" });
  }
}

export async function deleteEvent(req: Request, res: Response) {
  try {
    const { eventId } = req.params;
    await deleteEventService(eventId);

    res.json({
      message: "Event deleted successfully"
    });
  } catch (error: any) {
    console.error("deleteEvent error:", error);

    if (error.message === 'EVENT_NOT_FOUND') {
      return res.status(404).json({ error: "Event not found" });
    }

    if (error.message === 'HAS_TRANSACTIONS') {
      return res.status(400).json({ 
        error: "Cannot delete event with existing transactions. Cancel it instead." 
      });
    }

    res.status(500).json({ error: "Internal server error" });
  }
}

//USER CONTROLLERS
export async function getAllUsers(req: Request, res: Response) {
  console.log("🔵 getAllUsers endpoint HIT!");
  console.log("User from token:", req.user);

  try {
    console.log("🟢 Fetching users from database...");
    const users = await getAllUsersService();
    console.log("✅ Users fetched successfully:", users.length);

    res.json({
      message: "OK",
      data: users
    });
  } catch (error) {
    console.error("getAllUsers error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function updateUserRole(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const user = await updateUserRoleService(userId, role);

    res.json({
      message: "User role updated successfully",
      data: user
    });
  } catch (error: any) {
    console.error("updateUserRole error:", error);

    if (error.message === 'INVALID_ROLE') {
      return res.status(400).json({ error: "Invalid role" });
    }

    res.status(500).json({ error: "Internal server error" });
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await deleteUserService(userId, currentUserId);

    res.json({
      message: "User deleted successfully"
    });
  } catch (error: any) {
    console.error("deleteUser error:", error);

    if (error.message === 'CANNOT_DELETE_SELF') {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    res.status(500).json({ error: "Internal server error" });
  }
}

//TRANSACTION CONTROLLERS
export async function getAllTransactions(req: Request, res: Response) {
  try {
    const transactions = await getAllTransactionsService();

    res.json({
      message: "OK",
      data: transactions
    });
  } catch (error) {
    console.error("getAllTransactions error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function updateTransactionStatus(req: Request, res: Response) {
  try {
    const { transactionId } = req.params;
    const { status } = req.body;

    const transaction = await updateTransactionStatusService(transactionId, status);

    res.json({
      message: "Transaction status updated successfully",
      data: transaction
    });
  } catch (error: any) {
    console.error("updateTransactionStatus error:", error);

    if (error.message === 'INVALID_STATUS') {
      return res.status(400).json({ error: "Invalid status" });
    }

    res.status(500).json({ error: "Internal server error" });
  }
}
