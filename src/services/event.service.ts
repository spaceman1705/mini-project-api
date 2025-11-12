import prisma from "../lib/prisma";
import { createCustomError } from "../utils/customError";

export async function getEventBySlug(slug: string) {
  try {
    const event = prisma.event.findUnique({
      where: { slug },
      include: {
        organizer: {
          select: {
            id: true,
            email: true,
            firstname: true,
          },
        },
        ticketType: true,
        voucher: {
          where: {
            expiredAt: {
              gt: new Date(),
            },
          },
        },
        review: {
          select: {
            rating: true,
            comment: true,
            createdAt: true,
          },
        },
      },
    });

    if (!event) {
      throw createCustomError(404, "Event not found");
    }
  } catch (err) {
    throw err;
  }
}
