import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import { createCustomError } from "../utils/customError";
import { getUserByEmail } from "./auth.service";
import { cloudinaryRemove, cloudinaryUpload } from "../utils/cloudnary";

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
    // Ambil user
    const user = await getUserByEmail(email);
    if (!user) throw createCustomError(401, "Invalid user");

    // Validasi tanggal
    const start = new Date(params.startDate);
    const end = new Date(params.endDate);
    if (end <= start) throw createCustomError(400, "End date must be after start date");

    // Buat event beserta ticketType default
    const event = await prisma.event.create({
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

        // TicketType default
        ticketType: {
          create: [
            {
              name: "Standard Ticket",
              description: "Default ticket",
              price: params.price,
              quota: params.availableSeats,
              availableQuota: params.availableSeats,
            },
          ],
        },
      },
      include: {
        ticketType: true, // supaya langsung dikembalikan ke frontend
      },
    });

    return event;
  } catch (err) {
    // Jika upload banner gagal, hapus dari Cloudinary
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
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true },
    });

    if (!event) throw createCustomError(404, "Event not found");

    return await prisma.$transaction(async (tx) => {
      const created = await Promise.all(
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

      const total = await tx.ticketType.aggregate({
        _sum: { quota: true },
        where: { eventId },
      });

      await tx.event.update({
        where: { id: event.id },
        data: {
          availableSeats: total._sum.quota ?? 0,
        },
      });

      return created;
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
