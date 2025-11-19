import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

//EVENT MANAGEMENT

export async function getAllEvents(req: Request, res: Response) {
  try {
    const events = await prisma.event.findMany({
      include: {
        organizer: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true
          }
        },
        _count: {
          select: {
            transaction: true,
            review: true,
            ticketType: true,
            voucher: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

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

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
            profilePicture: true
          }
        },
        ticketType: true,
        voucher: true,
        transaction: {
          include: {
            user: {
              select: {
                firstname: true,
                lastname: true,
                email: true
              }
            },
            transactionItem: true
          }
        },
        review: {
          include: {
            user: {
              select: {
                firstname: true,
                lastname: true
              }
            }
          }
        },
        _count: {
          select: {
            transaction: true,
            review: true
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json({
      message: "OK",
      data: event
    });
  } catch (error) {
    console.error("getEventById error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function approveEvent(req: Request, res: Response) {
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (event.status !== 'DRAFT') {
      return res.status(400).json({ error: "Only draft events can be approved" });
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: { status: 'PUBLISHED' },
      include: {
        organizer: {
          select: {
            firstname: true,
            lastname: true,
            email: true
          }
        }
      }
    });

    // Send notification to organizer
    await prisma.notification.create({
      data: {
        userId: event.organizerId,
        title: "Event Approved",
        message: `Your event "${event.title}" has been approved and is now published.`,
        type: "SYSTEM"
      }
    });

    res.json({
      message: "Event approved successfully",
      data: updatedEvent
    });
  } catch (error) {
    console.error("approveEvent error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function rejectEvent(req: Request, res: Response) {
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: { status: 'CANCEL' },
      include: {
        organizer: {
          select: {
            firstname: true,
            lastname: true,
            email: true
          }
        }
      }
    });

    // Send notification to organizer
    await prisma.notification.create({
      data: {
        userId: event.organizerId,
        title: "Event Rejected",
        message: `Your event "${event.title}" has been rejected. Please contact support for more information.`,
        type: "SYSTEM"
      }
    });

    res.json({
      message: "Event rejected",
      data: updatedEvent
    });
  } catch (error) {
    console.error("rejectEvent error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function deleteEvent(req: Request, res: Response) {
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: {
            transaction: true
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Check if event has transactions
    if (event._count.transaction > 0) {
      return res.status(400).json({ 
        error: "Cannot delete event with existing transactions. Cancel it instead." 
      });
    }

    await prisma.event.delete({
      where: { id: eventId }
    });

    res.json({
      message: "Event deleted successfully"
    });
  } catch (error) {
    console.error("deleteEvent error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

//USER MANAGEMENT

export async function getAllUsers(req: Request, res: Response) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
        role: true,
        isVerified: true,
        profilePicture: true,
        createdAt: true,
        _count: {
          select: {
            event: true,
            transaction: true,
            review: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

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

    if (!['ADMIN', 'ORGANIZER', 'CUSTOMER'].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role }
    });

    res.json({
      message: "User role updated successfully",
      data: user
    });
  } catch (error) {
    console.error("updateUserRole error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const { userId } = req.params;

    // Cannot delete yourself
    if (!req.user || userId === req.user.id) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({
      message: "User deleted successfully"
    });
  } catch (error) {
    console.error("deleteUser error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

//TRANSACTION MANAGEMENT

export async function getAllTransactions(req: Request, res: Response) {
  try {
    const transactions = await prisma.transaction.findMany({
      include: {
        user: {
          select: {
            firstname: true,
            lastname: true,
            email: true
          }
        },
        event: {
          select: {
            title: true,
            slug: true,
            category: true
          }
        },
        transactionItem: {
          include: {
            ticketType: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

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

    const validStatuses = [
      'WAITING_PAYMENT',
      'WAITING_CONFIRMATION',
      'DONE',
      'REJECTED',
      'EXPIRED',
      'CANCELED'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const transaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: { status }
    });

    // Send notification to user
    await prisma.notification.create({
      data: {
        userId: transaction.userId,
        title: "Transaction Status Updated",
        message: `Your transaction status has been updated to ${status}`,
        type: "TRANSACTION"
      }
    });

    res.json({
      message: "Transaction status updated successfully",
      data: transaction
    });
  } catch (error) {
    console.error("updateTransactionStatus error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}