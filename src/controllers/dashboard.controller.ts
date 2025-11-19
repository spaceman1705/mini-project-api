import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Extend Express Request type untuk include user dari JWT
interface AuthRequest extends Request {
  user: {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
    role: string;
  };
}

//CUSTOMER DASHBOARD
export async function getCustomerStats(req: Request, res: Response) {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user.id; // Dari JWT middleware

    // Count active tickets (transactions with DONE status)
    const activeTickets = await prisma.transaction.count({
      where: {
        userId,
        status: 'DONE',
        event: {
          endDate: {
            gte: new Date() // Event belum selesai
          }
        }
      }
    });

    // Count upcoming events
    const upcomingEvents = await prisma.transaction.count({
      where: {
        userId,
        status: 'DONE',
        event: {
          startDate: {
            gte: new Date()
          }
        }
      }
    });

    // Count favorites (asumsi ada field favorites di user atau event)
    // Jika tidak ada, bisa return 0 atau implement favorite feature
    const favorites = 0;

    res.json({
      message: "OK",
      data: {
        activeTickets,
        upcomingEvents,
        favorites
      }
    });
  } catch (error) {
    console.error("getCustomerStats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getCustomerUpcomingEvents(req: Request, res: Response) {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user.id;

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        status: 'DONE',
        event: {
          startDate: {
            gte: new Date()
          }
        }
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            category: true,
            location: true,
            startDate: true,
            endDate: true,
            bannerImg: true
          }
        },
        transactionItem: {
          include: {
            ticketType: true
          }
        }
      },
      orderBy: {
        event: {
          startDate: 'asc'
        }
      },
      take: 10
    });

    const events = transactions.map(t => ({
      id: t.event.id,
      title: t.event.title,
      slug: t.event.slug,
      category: t.event.category,
      location: t.event.location,
      startDate: t.event.startDate,
      endDate: t.event.endDate,
      bannerImg: t.event.bannerImg,
      ticketCount: t.transactionItem.reduce((sum, item) => sum + item.quantity, 0)
    }));

    res.json({
      message: "OK",
      data: events
    });
  } catch (error) {
    console.error("getCustomerUpcomingEvents error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

//ORGANIZER DASHBOARD
export async function getOrganizerStats(req: Request, res: Response) {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user.id;

    // Active events
    const activeEvents = await prisma.event.count({
      where: {
        organizerId: userId,
        status: 'PUBLISHED',
        endDate: {
          gte: new Date()
        }
      }
    });

    // Total attendees (sum of all transaction items quantities)
    const attendeesResult = await prisma.transactionItem.aggregate({
      where: {
        transaction: {
          event: {
            organizerId: userId
          },
          status: 'DONE'
        }
      },
      _sum: {
        quantity: true
      }
    });

    const totalAttendees = attendeesResult._sum.quantity || 0;

    // Total revenue
    const revenueResult = await prisma.transaction.aggregate({
      where: {
        event: {
          organizerId: userId
        },
        status: 'DONE'
      },
      _sum: {
        totalPrice: true
      }
    });

    const totalRevenue = revenueResult._sum.totalPrice || 0;

    // Tickets sold
    const ticketsSold = totalAttendees;

    res.json({
      message: "OK",
      data: {
        activeEvents,
        totalAttendees,
        totalRevenue,
        ticketsSold
      }
    });
  } catch (error) {
    console.error("getOrganizerStats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getOrganizerEvents(req: Request, res: Response) {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user.id;

    const events = await prisma.event.findMany({
      where: {
        organizerId: userId,
        status: {
          in: ['PUBLISHED', 'DRAFT']
        }
      },
      include: {
        _count: {
          select: {
            transaction: {
              where: {
                status: 'DONE'
              }
            }
          }
        },
        transaction: {
          where: {
            status: 'DONE'
          },
          select: {
            totalPrice: true,
            transactionItem: {
              select: {
                quantity: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    const eventsData = events.map(event => {
      const attendees = event.transaction.reduce((sum, t) => {
        return sum + t.transactionItem.reduce((itemSum, item) => itemSum + item.quantity, 0);
      }, 0);

      const revenue = event.transaction.reduce((sum, t) => sum + t.totalPrice, 0);

      return {
        id: event.id,
        title: event.title,
        status: event.status,
        startDate: event.startDate,
        attendees,
        revenue: `$${revenue.toFixed(2)}`,
        ticketsSold: attendees,
        totalTickets: event.availableSeats
      };
    });

    res.json({
      message: "OK",
      data: eventsData
    });
  } catch (error) {
    console.error("getOrganizerEvents error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

//ADMIN DASHBOARD
export async function getAdminStats(req: Request, res: Response) {
  try {
    // Total users
    const totalUsers = await prisma.user.count();

    // Active events
    const activeEvents = await prisma.event.count({
      where: {
        status: 'PUBLISHED',
        endDate: {
          gte: new Date()
        }
      }
    });

    // Platform revenue
    const revenueResult = await prisma.transaction.aggregate({
      where: {
        status: 'DONE'
      },
      _sum: {
        totalPrice: true
      }
    });

    const platformRevenue = revenueResult._sum.totalPrice || 0;

    // System health (mock - bisa diganti dengan real metrics)
    const systemHealth = 98;

    res.json({
      message: "OK",
      data: {
        totalUsers,
        activeEvents,
        platformRevenue,
        systemHealth
      }
    });
  } catch (error) {
    console.error("getAdminStats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getAdminRecentUsers(req: Request, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
        role: true,
        isVerified: true,
        createdAt: true
      }
    });

    const usersData = users.map(user => ({
      name: `${user.firstname} ${user.lastname}`,
      email: user.email,
      role: user.role,
      status: user.isVerified ? 'Active' : 'Pending',
      joined: formatTimeAgo(user.createdAt)
    }));

    res.json({
      message: "OK",
      data: usersData
    });
  } catch (error) {
    console.error("getAdminRecentUsers error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getAdminPendingEvents(req: Request, res: Response) {
  try {
    const events = await prisma.event.findMany({
      where: {
        status: 'DRAFT'
      },
      include: {
        organizer: {
          select: {
            firstname: true,
            lastname: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    const eventsData = events.map(event => ({
      id: event.id,
      title: event.title,
      organizer: `${event.organizer.firstname} ${event.organizer.lastname}`,
      status: 'Pending',
      submitted: formatTimeAgo(event.createdAt)
    }));

    res.json({
      message: "OK",
      data: eventsData
    });
  } catch (error) {
    console.error("getAdminPendingEvents error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getAdminUserGrowth(req: Request, res: Response) {
  try {
    // Get user registrations for last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const users = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: sixMonthsAgo
        }
      },
      select: {
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Group by month
    const monthlyData: { [key: string]: number } = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = months[date.getMonth()];
      monthlyData[monthKey] = 0;
    }

    // Count users per month
    users.forEach(user => {
      const monthKey = months[user.createdAt.getMonth()];
      if (monthlyData[monthKey] !== undefined) {
        monthlyData[monthKey]++;
      }
    });

    // Convert to array format
    const growthData = Object.entries(monthlyData).map(([month, count]) => ({
      month,
      users: count
    }));

    res.json({
      message: "OK",
      data: growthData
    });
  } catch (error) {
    console.error("getAdminUserGrowth error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Helper function
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  
  return Math.floor(seconds) + " seconds ago";
}