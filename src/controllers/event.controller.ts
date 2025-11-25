import { Request, Response, NextFunction } from "express";
import {
  addTicketTypes,
  createEvent,
  createVoucher,
  getAllEvents,
  getEventBySlug,
  getEventCategories,
  getMyEvents,
  setEventStatus,
  updateEvent,
} from "../services/event.service";
import { Prisma } from "@prisma/client";
import { Token } from "../middlewares/auth.middleware";
import { toSlug } from "../lib/slug";
import { success } from "zod";
import { tr } from "zod/v4/locales";

export async function createEventController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    console.log("=== Create Event Request ===");
    console.log("Body (before parse):", req.body);
    console.log("File:", req.file);

    const user = req.user as Token;
    const body = req.body;
    const file = req.file as Express.Multer.File | undefined;

    const parsedBody = {
      ...body,
      price: parseFloat(body.price),
      availableSeats: parseInt(body.availableSeats),
    };

    console.log("Body (after parse):", parsedBody);

    const slug = toSlug(parsedBody.title);

    const data = await createEvent(user.email, file, {
      title: parsedBody.title,
      description: parsedBody.description,
      category: parsedBody.category,
      location: parsedBody.location,
      startDate: parsedBody.startDate,
      endDate: parsedBody.endDate,
      price: parsedBody.price,
      availableSeats: parsedBody.availableSeats,
      status: parsedBody.status,
      slug,
    });

    res.status(201).json({
      message: "OK",
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateEventController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const data = await updateEvent(id, req.body);

    res.json({
      message: "OK",
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function getEventBySlugController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { slug } = req.params;
    const data = await getEventBySlug(slug);

    res.json({
      message: "OK",
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function getAllEventsController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const {
      page,
      pageSize,
      q,
      title,
      category,
      location,
      date,
      start,
      end,
      minPrice,
      maxPrice,
      sort,
    } = req.query;
    const pageNum = page ? Number(page) : 1;
    const pageSizeNum = pageSize ? Number(pageSize) : 12;

    const filter: Prisma.EventWhereInput = {};

    if (q) {
      const qStr = String(q);
      filter.OR = [
        {
          title: {
            contains: qStr,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: qStr,
            mode: "insensitive",
          },
        },
        {
          location: {
            contains: qStr,
            mode: "insensitive",
          },
        },
      ];
    }
    if (title) {
      filter.title = String(title);
    }
    if (category) {
      filter.category = String(category);
    }
    if (location) {
      filter.location = String(location);
    }

    const now = new Date();

    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );
    const startOfTomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );
    const endOfTomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 2
    );

    if (date === "today") {
      filter.startDate = {
        gte: startOfToday,
        lt: endOfToday,
      };
    } else if (date === "tomorrow") {
      filter.startDate = {
        gte: startOfTomorrow,
        lt: endOfTomorrow,
      };
    } else if (date === "weekend") {
      const day = now.getDay();

      const startOfSaturday = new Date(startOfToday);
      startOfSaturday.setDate(startOfSaturday.getDate() + ((6 - day + 7) % 7));
      const endOfSunday = new Date(startOfSaturday);
      endOfSunday.setDate(startOfSaturday.getDate() + 2);

      filter.startDate = {
        gte: startOfSaturday,
        lt: endOfSunday,
      };
    } else if (date === "upcoming") {
      filter.startDate = {
        gte: now,
      };
    } else if (date === "range") {
      filter.startDate = {
        gte: new Date(String(start)),
        lte: new Date(String(end)),
      };
    }

    if (minPrice != null || maxPrice != null) {
      filter.price = {
        gte: minPrice != null ? Number(minPrice) : 0,
        lte: maxPrice != null ? Number(maxPrice) : Number.MAX_SAFE_INTEGER,
      };
    }

    const data = await getAllEvents(
      pageNum,
      pageSizeNum,
      filter,
      (sort as any) || "newest"
    );

    res.json({
      message: "OK",
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function getEventCategoriesController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const categories = await getEventCategories();

    res.json({
      message: "OK",
      data: categories,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyEventsController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.user as Token;
    const { page, pageSize, status } = req.query;
    const pageNum = page ? Number(page) : 1;
    const pageSizeNum = pageSize ? Number(pageSize) : 12;

    const data = await getMyEvents(
      user.email,
      pageNum,
      pageSizeNum,
      status as any
    );

    res.json({
      message: "OK",
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function publihsEventController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.user as Token;
    const { id } = req.params;

    const data = await setEventStatus(
      id,
      {
        email: user.email,
        role: user.role as any,
      },
      "PUBLISHED"
    );

    res.json({
      message: "OK",
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function cancelEventController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.user as Token;
    const { id } = req.params;

    const data = await setEventStatus(
      id,
      {
        email: user.email,
        role: user.role as any,
      },
      "CANCELED"
    );

    res.json({
      message: "OK",
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function createTicketTypesController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const { items } = req.body as {
      items: {
        name: string;
        description?: string;
        price: number;
        quota: number;
      }[];
    };

    const data = await addTicketTypes(id, items);

    res.status(201).json({
      message: "OK",
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function createVoucherController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const payload = req.body as {
      code: string;
      discountAmount: number;
      expiredAt: string;
      maxUsage?: number;
    };

    const data = await createVoucher(id, payload);

    res.status(201).json({
      message: "OK",
      data,
    });
  } catch (err) {
    next(err);
  }
}
