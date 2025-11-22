import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

//CUSTOMER SERVICES
export async function getCustomerStatsService(userId: string) {
  const [activeTickets, upcomingEvents, favorites] = await Promise.all([
    prisma.transaction.count({
      where: {
        userId: userId,
        status: 'DONE'
      }
    }),
    prisma.transaction.count({
      where: {
        userId: userId,
        event: {
          startDate: {
            gte: new Date()
          }
        }
      }
    }),
    Promise.resolve(0)
  ]);

  return {
    activeTickets,
    upcomingEvents,
    favorites
  };
}

export async function getCustomerUpcomingEventsService(userId: string) {
  const transactions = await prisma.transaction.findMany({
    where: {
      userId: userId,
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
          startDate: true,
          endDate: true,
          location: true,
          bannerImg: true
        }
      }
    },
    orderBy: {
      event: {
        startDate: 'asc'
      }
    },
    take: 5
  });

  return transactions.map(t => t.event);
}

export async function getCustomerRecentActivityService(userId: string) {
  return await prisma.transaction.findMany({
    where: {
      userId: userId
    },
    include: {
      event: {
        select: {
          title: true,
          startDate: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 10
  });
}

//ORGANIZER SERVICES
export async function getOrganizerStatsService(userId: string) {
  const [events, transactions] = await Promise.all([
    prisma.event.findMany({
      where: { 
        organizerId: userId
      },
      include: {
        _count: {
          select: {
            transaction: true
          }
        }
      }
    }),
    prisma.transaction.findMany({
      where: {
        event: {
          organizerId: userId
        },
        status: 'DONE'
      },
      select: {
        totalPrice: true
      }
    })
  ]);

  const activeEvents = events.filter(e => 
    e.status === 'PUBLISHED' && new Date(e.endDate) >= new Date()
  ).length;

  const totalRevenue = transactions.reduce((sum, t) => sum + t.totalPrice, 0);
  const ticketsSold = transactions.length;
  const totalAttendees = ticketsSold;

  return {
    activeEvents,
    totalAttendees,
    totalRevenue,
    ticketsSold
  };
}

export async function getOrganizerEventsService(userId: string) {
  return await prisma.event.findMany({
    where: { 
      organizerId: userId
    },
    include: {
      _count: {
        select: {
          transaction: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

export async function getOrganizerWeeklySalesService(userId: string) {
  const today = new Date();
  const lastWeek = new Date(today);
  lastWeek.setDate(today.getDate() - 7);

  const transactions = await prisma.transaction.findMany({
    where: {
      event: {
        organizerId: userId
      },
      status: 'DONE',
      createdAt: {
        gte: lastWeek
      }
    },
    select: {
      createdAt: true
    }
  });

  // Group by day
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const salesByDay = daysOfWeek.map(day => ({ day, sales: 0 }));

  transactions.forEach(t => {
    const dayIndex = new Date(t.createdAt).getDay();
    salesByDay[dayIndex].sales += 1;
  });

  // Reorder to start from Monday
  const reorderedSales = [
    salesByDay[1], // Mon
    salesByDay[2], // Tue
    salesByDay[3], // Wed
    salesByDay[4], // Thu
    salesByDay[5], // Fri
    salesByDay[6], // Sat
    salesByDay[0], // Sun
  ];

  return reorderedSales;
}

export async function getOrganizerTransactionsService(userId: string) {
  return await prisma.transaction.findMany({
    where: {
      event: {
        organizerId: userId
      }
    },
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
          title: true
        }
      },
      transactionItem: {
        select: {
          quantity: true,
          price: true,
          subtotal: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 10
  });
}

export async function deleteOrganizerEventService(userId: string, eventId: string) {
  // Check if event exists and belongs to this organizer
  const event = await prisma.event.findUnique({
    where: { id: eventId }
  });

  if (!event) {
    throw new Error('EVENT_NOT_FOUND');
  }

  if (event.organizerId !== userId) {
    throw new Error('UNAUTHORIZED');
  }

  // Check if event has transactions
  const transactionCount = await prisma.transaction.count({
    where: { eventId: eventId }
  });

  if (transactionCount > 0) {
    throw new Error('HAS_TRANSACTIONS');
  }

  // Delete event (cascade will handle related records)
  await prisma.event.delete({
    where: { id: eventId }
  });

  return { id: eventId };
}

//ADMIN SERVICES
export async function getAdminStatsService() {
  const [totalUsers, activeEvents, transactions] = await Promise.all([
    prisma.user.count(),
    prisma.event.count({
      where: {
        status: 'PUBLISHED',
        endDate: {
          gte: new Date()
        }
      }
    }),
    prisma.transaction.findMany({
      where: {
        status: 'DONE'
      },
      select: {
        totalPrice: true
      }
    })
  ]);

  const platformRevenue = transactions.reduce((sum, t) => sum + t.totalPrice, 0);
  const systemHealth = 100;

  return {
    totalUsers,
    activeEvents,
    platformRevenue,
    systemHealth
  };
}

export async function getAdminRecentUsersService(limit: number = 10) {
  return await prisma.user.findMany({
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
}

export async function getAdminPendingEventsService() {
  return await prisma.event.findMany({
    where: {
      status: 'DRAFT'
    },
    include: {
      organizer: {
        select: {
          firstname: true,
          lastname: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

export async function getAdminUserGrowthService() {
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
    }
  });

  // Group by month
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const usersByMonth = new Map();

  users.forEach(user => {
    const month = months[new Date(user.createdAt).getMonth()];
    usersByMonth.set(month, (usersByMonth.get(month) || 0) + 1);
  });

  // Get last 6 months
  const result = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const month = months[date.getMonth()];
    result.push({
      month,
      users: usersByMonth.get(month) || 0
    });
  }

  return result;
}