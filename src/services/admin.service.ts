import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

//EVENT SERVICES
export async function getAllEventsService() {
  return await prisma.event.findMany({
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
}

export async function getEventByIdService(eventId: string) {
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
    throw new Error('EVENT_NOT_FOUND');
  }

  return event;
}

export async function approveEventService(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId }
  });

  if (!event) {
    throw new Error('EVENT_NOT_FOUND');
  }

  if (event.status !== 'DRAFT') {
    throw new Error('ONLY_DRAFT_CAN_BE_APPROVED');
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

  return updatedEvent;
}

export async function rejectEventService(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId }
  });

  if (!event) {
    throw new Error('EVENT_NOT_FOUND');
  }

  const updatedEvent = await prisma.event.update({
    where: { id: eventId },
    data: { status: 'CANCELED' },
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

  return updatedEvent;
}

export async function deleteEventService(eventId: string) {
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
    throw new Error('EVENT_NOT_FOUND');
  }

  // Check if event has transactions
  if (event._count.transaction > 0) {
    throw new Error('HAS_TRANSACTIONS');
  }

  await prisma.event.delete({
    where: { id: eventId }
  });

  return { id: eventId };
}

//USER SERVICES
export async function getAllUsersService() {
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
          review: true,
        }
      }
    },
  });

  // Map to match frontend expectations
  return users.map(user => ({
    ...user,
    _count: {
      event: user._count.event,
      transaction: user._count.transaction,
      review: user._count.review,
    }
  }));
}

export async function updateUserRoleService(userId: string, role: string) {
  const validRoles = ['ADMIN', 'ORGANIZER', 'CUSTOMER'];
  
  if (!validRoles.includes(role)) {
    throw new Error('INVALID_ROLE');
  }

  return await prisma.user.update({
    where: { id: userId },
    data: { role: role as any }
  });
}

export async function deleteUserService(userId: string, currentUserId: string) {
  // Cannot delete yourself
  if (userId === currentUserId) {
    throw new Error('CANNOT_DELETE_SELF');
  }

  await prisma.user.delete({
    where: { id: userId }
  });

  return { id: userId };
}

//TRANSACTION SERVICES
export async function getAllTransactionsService() {
  return await prisma.transaction.findMany({
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
}

export async function updateTransactionStatusService(transactionId: string, status: string) {
  const validStatuses = [
    'WAITING_PAYMENT',
    'WAITING_CONFIRMATION',
    'DONE',
    'REJECTED',
    'EXPIRED',
    'CANCELED'
  ];

  if (!validStatuses.includes(status)) {
    throw new Error('INVALID_STATUS');
  }

  const transaction = await prisma.transaction.update({
    where: { id: transactionId },
    data: { status: status as any }
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

  return transaction;
}