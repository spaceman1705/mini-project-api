import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import { createCustomError } from "../utils/customError";
import { getUserByEmail } from "./auth.service";
import { cloudinaryRemove, cloudinaryUpload } from "../utils/cloudnary";

async function recomputeEventFromTickets(
  tx: Prisma.TransactionClient,
  eventId: string
) {
  const tickets = await tx.ticketType.findMany({
    where: { eventId },
    select: {
      price: true,
      quota: true,
    },
  });

  if (!tickets.length) {
    return;
  }

  const totalQuota = tickets.reduce((sum, t) => sum + t.quota, 0);
  const minPrice = tickets.reduce(
    (min, t) => (t.price < min ? t.price : min),
    tickets[0].price
  );

  await tx.event.update({
    where: { id: eventId },
    data: {
      availableSeats: totalQuota,
      price: minPrice,
    },
  });
}

export async function createEvent(
  email: string,
  imgFile: Express.Multer.File | undefined,
  params: {
    title: string;
    description: string;
    category: string;
    location: string;
    startDate: string;
    endDate: string;
    price: number;
    availableSeats: number;
    slug: string;
    status?: "DRAFT" | "PUBLISHED" | "CANCELED" | "FINISHED";
  }
) {
  const uploaded = imgFile ? await cloudinaryUpload(imgFile) : null;
  const uploadUrl = uploaded?.secure_url;

  try {
    const user = await getUserByEmail(email);
    if (!user) throw createCustomError(401, "Invalid user");

    const start = new Date(params.startDate);
    const end = new Date(params.endDate);

    if (end <= start) {
      throw createCustomError(400, "End date must be after start date");
    }

    const event = await prisma.$transaction(async (tx) => {
      const createdEvent = await tx.event.create({
        data: {
          title: params.title,
          description: params.description,
          category: params.category,
          location: params.location,
          startDate: start,
          endDate: end,
          price: params.price,
          availableSeats: params.availableSeats,
          slug: params.slug,
          status: params.status ?? "DRAFT",
          bannerImg: uploadUrl,
          organizerId: user.id,
        },
      });

      await tx.ticketType.create({
        data: {
          eventId: createdEvent.id,
          name: "Regular",
          description: "Regular ticket",
          price: params.price,
          quota: params.availableSeats,
          availableQuota: params.availableSeats,
        },
      });

      return createdEvent;
    });

    return event;
  } catch (err) {
    if (uploadUrl) await cloudinaryRemove(uploadUrl);
    throw err;
  }
}

export async function updateEvent(id: string, params: Prisma.EventUpdateInput) {
  try {
    const start = params.startDate
      ? new Date(params.startDate as any)
      : undefined;
    const end = params.endDate ? new Date(params.endDate as any) : undefined;

    if (start && end && end <= start) {
      throw createCustomError(400, "End date must be after start date");
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        ...params,
        ...(start ? { startDate: start } : {}),
        ...(start ? { endDate: start } : {}),
      },
    });

    return event;
  } catch (err) {
    throw err;
  }
}

export async function getEventBySlug(slug: string) {
  try {
    const event = await prisma.event.findUnique({
      where: { slug },
      include: {
        organizer: {
          select: {
            id: true,
            email: true,
            firstname: true,
            lastname: true,
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

    return event;
  } catch (err) {
    throw err;
  }
}

export type PublishedSort =
  | "newest"
  | "oldest"
  | "price_asc"
  | "price_desc"
  | "popular";

export async function getAllEvents(
  page = 1,
  pageSize = 12,
  filter: Prisma.EventWhereInput,
  sort: PublishedSort = "newest"
) {
  try {
    if (filter.title) {
      filter.title = {
        contains: filter.title,
        mode: "insensitive",
      } as any;
      filter.location = {
        contains: filter.location,
        mode: "insensitive",
      } as any;
      filter.category = {
        contains: filter.category,
        mode: "insensitive",
      } as any;
    }

    const where: Prisma.EventWhereInput = { status: "PUBLISHED", ...filter };

    const orderBy: Prisma.EventOrderByWithRelationInput =
      sort === "oldest"
        ? { createdAt: "asc" }
        : sort === "price_asc"
        ? { price: "asc" }
        : sort === "price_desc"
        ? { price: "desc" }
        : { createdAt: "desc" };

    const [items, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          category: true,
          location: true,
          startDate: true,
          endDate: true,
          price: true,
          availableSeats: true,
          bannerImg: true,
          status: true,
        },
      }),
      prisma.event.count({ where }),
    ]);

    return {
      items,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (err) {
    throw err;
  }
}

export async function getEventCategories() {
  try {
    const rows = await prisma.event.findMany({
      select: {
        category: true,
      },
      distinct: ["category"],
      where: {
        status: "PUBLISHED",
      },
    });

    const categories = rows
      .map((row) => row.category)
      .filter((c) => !!c && c.trim().length > 0)
      .sort((a, b) => a.localeCompare(b));

    return categories;
  } catch (err) {
    throw err;
  }
}

export async function setEventStatus(
  id: string,
  user: {
    email: string;
    role: "ADMIN" | "ORGANIZER";
  },
  status: "DRAFT" | "PUBLISHED" | "CANCELED" | "FINISHED"
) {
  try {
    if (user.role !== "ADMIN") {
      const owner = await prisma.event.findFirst({
        where: {
          id,
          organizer: {
            email: user.email,
          },
        },
        select: {
          id: true,
        },
      });

      if (!owner) {
        throw createCustomError(404, "Event not found or not owned");
      }
    }

    return await prisma.event.update({
      where: { id },
      data: { status },
    });
  } catch (err) {
    throw err;
  }
}

export async function addTicketTypes(
  eventId: string,
  items: {
    name: string;
    description?: string;
    price: number;
    quota: number;
  }[]
) {
  try {
    return await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({
        where: { id: eventId },
        select: {
          id: true,
          availableSeats: true,
          price: true,
          ticketType: {
            select: {
              id: true,
              name: true,
              quota: true,
              availableQuota: true,
            },
          },
        },
      });

      if (!event) throw createCustomError(404, "Event not found");

      if (items.some((i) => i.name.toLowerCase() === "regular")) {
        throw createCustomError(
          400,
          "Regular ticket is created automatically and cannot be added manually"
        );
      }

      const regular = event.ticketType.find(
        (t) => t.name.toLowerCase() === "regular"
      );

      const currentNonRegularQuota = event.ticketType
        .filter((t) => t.name.toLowerCase() !== "regular")
        .reduce((sum, t) => sum + t.quota, 0);

      const newItemsQuota = items.reduce((sum, i) => sum + i.quota, 0);

      const newNonRegularQuota = currentNonRegularQuota + newItemsQuota;

      if (newNonRegularQuota > event.availableSeats) {
        throw createCustomError(
          400,
          "Total quota of special tickets exceeds event capacity"
        );
      }

      await Promise.all(
        items.map((i) =>
          tx.ticketType.create({
            data: {
              eventId,
              name: i.name,
              description: i.description ?? "",
              price: i.price,
              quota: i.quota,
              availableQuota: i.quota,
            },
          })
        )
      );

      const newRegularQuota = event.availableSeats - newNonRegularQuota;

      if (regular) {
        const alreadySold = regular.quota - regular.availableQuota;
        if (newRegularQuota < alreadySold) {
          throw createCustomError(
            400,
            `Cannot reduce Regular quota below already sold tickets (${alreadySold})`
          );
        }

        await tx.ticketType.update({
          where: { id: regular.id },
          data: {
            quota: newRegularQuota,
            availableQuota: newRegularQuota - alreadySold,
          },
        });
      } else {
        await tx.ticketType.create({
          data: {
            eventId,
            name: "Regular",
            description: "Regular ticket",
            price: event.price,
            quota: newRegularQuota,
            availableQuota: newRegularQuota,
          },
        });
      }

      await recomputeEventFromTickets(tx, eventId);

      const allTickets = await tx.ticketType.findMany({
        where: { eventId },
        orderBy: { name: "asc" },
      });

      return allTickets;
    });
  } catch (err) {
    throw err;
  }
}

export async function updateTicketType(
  eventId: string,
  ticketId: string,
  params: {
    name?: string;
    description?: string;
    price?: number;
    quota?: number;
  }
) {
  try {
    return await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({
        where: { id: eventId },
        select: {
          id: true,
          ticketType: {
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              quota: true,
              availableQuota: true,
            },
          },
        },
      });

      if (!event) {
        throw createCustomError(404, "Event not found");
      }

      const ticket = event.ticketType.find((t) => t.id === ticketId);
      if (!ticket) {
        throw createCustomError(404, "Ticket type not found");
      }

      const sold = ticket.quota - ticket.availableQuota;
      const newQuota = params.quota ?? ticket.quota;
      if (newQuota < sold) {
        throw createCustomError(
          400,
          `Cannot set quota below already sold tickets (${sold})`
        );
      }

      await tx.ticketType.update({
        where: { id: ticketId },
        data: {
          name: params.name ?? ticket.name,
          description: params.description ?? ticket.description,
          price: params.price ?? ticket.price,
          quota: newQuota,
          availableQuota: newQuota - sold,
        },
      });

      await recomputeEventFromTickets(tx, eventId);

      const allTickets = await tx.ticketType.findMany({
        where: { eventId },
        orderBy: { name: "asc" },
      });

      return allTickets;
    });
  } catch (err) {
    throw err;
  }
}

export async function deleteTicketType(eventId: string, ticketId: string) {
  try {
    return await prisma.$transaction(async (tx) => {
      const ticket = await tx.ticketType.findUnique({
        where: { id: ticketId },
        select: {
          id: true,
          eventId: true,
          name: true,
          quota: true,
          availableQuota: true,
        },
      });

      if (!ticket || ticket.eventId !== eventId) {
        throw createCustomError(404, "Ticket type not found");
      }

      const sold = ticket.quota - ticket.availableQuota;
      if (sold > 0) {
        throw createCustomError(
          400,
          "Cannot delete ticket type that already has sold tickets"
        );
      }

      await tx.ticketType.delete({
        where: { id: ticketId },
      });

      await recomputeEventFromTickets(tx, eventId);

      const allTickets = await tx.ticketType.findMany({
        where: { eventId },
        orderBy: { name: "asc" },
      });

      return allTickets;
    });
  } catch (err) {
    throw err;
  }
}

export async function createVoucher(
  eventId: string,
  params: {
    code: string;
    discountAmount: number;
    expiredAt: string;
    maxUsage?: number;
  }
) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true },
    });

    if (!event) throw createCustomError(404, "Event not found");

    const voucher = await prisma.voucher.create({
      data: {
        eventId,
        code: params.code,
        discountAmount: params.discountAmount,
        expiredAt: params.expiredAt,
        maxUsage: params.maxUsage,
      },
    });

    return voucher;
  } catch (err) {
    throw err;
  }
}

export async function getMyEvents(
  userId: string,
  params: {
    page: number;
    pageSize: number;
    q?: string;
    category?: string;
    location?: string;
    date?: "today" | "weekend" | "month" | "upcoming";
    start?: string;
    end?: string;
    minPrice?: number;
    maxPrice?: number;
    status?: string;
    sort?: "newest" | "oldest" | "price_asc" | "price_desc";
  }
) {
  const {
    page,
    pageSize,
    q,
    category,
    location,
    date,
    start,
    end,
    minPrice,
    maxPrice,
    status,
    sort,
  } = params;

  const filter: Prisma.EventWhereInput = {
    organizerId: userId,
  };

  if (status && status !== "ALL") filter.status = status as any;

  if (q) {
    filter.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { location: { contains: q, mode: "insensitive" } },
    ];
  }

  if (category) filter.category = category;
  if (location) filter.location = location;

  const now = new Date();

  if (date === "today") {
    const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endDay = new Date(startDay);
    endDay.setDate(endDay.getDate() + 1);
    filter.startDate = { gte: startDay, lt: endDay };
  }

  if (date === "weekend") {
    const day = now.getDay();
    const startSat = new Date(now);
    startSat.setDate(now.getDate() + ((6 - day + 7) % 7));
    const endSun = new Date(startSat);
    endSun.setDate(startSat.getDate() + 2);
    filter.startDate = { gte: startSat, lt: endSun };
  }

  if (date === "month") {
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    filter.startDate = { gte: startMonth, lt: endMonth };
  }

  if (date === "upcoming") {
    filter.startDate = { gte: now };
  }

  if (start || end) {
    filter.startDate = {
      gte: start ? new Date(start) : undefined,
      lte: end ? new Date(end) : undefined,
    };
  }

  if (minPrice || maxPrice) {
    filter.price = {
      gte: minPrice ?? 0,
      lte: maxPrice ?? Number.MAX_SAFE_INTEGER,
    };
  }

  const orderBy: Prisma.EventOrderByWithRelationInput =
    sort === "oldest"
      ? { createdAt: "asc" }
      : sort === "price_asc"
      ? { price: "asc" }
      : sort === "price_desc"
      ? { price: "desc" }
      : { createdAt: "desc" };

  const [items, total] = await Promise.all([
    prisma.event.findMany({
      where: filter,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        startDate: true,
        endDate: true,
        price: true,
        availableSeats: true,
        bannerImg: true,
        category: true,
        location: true,
        createdAt: true,
      },
    }),
    prisma.event.count({ where: filter }),
  ]);

  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}
