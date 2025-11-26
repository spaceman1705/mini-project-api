import z, { file } from "zod";
import { fileSchema } from "./common.schema";

export const eventBody = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(3, "Category must be at least 3 characters"),
  location: z.string().min(3, "Location must be at least 3 characters"),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  price: z.coerce.number().min(0),
  availableSeats: z.coerce.number().int().min(0),
  status: z.enum(["DRAFT", "PUBLISHED", "CANCELLED"]).optional(),
});

export const eventCreateSchema = z.object({
  body: eventBody,
  file: fileSchema.optional(),
});

export const eventUpdateSchema = z.object({
  body: eventBody.partial(),
});

export const ticketTypeCreateSchema = z.object({
  body: z.object({
    items: z
      .array(
        z.object({
          name: z.string().min(2, "Name must be at least 2 characters"),
          description: z.string().default(""),
          price: z.coerce.number().min(0),
          quota: z.coerce.number().int().min(1),
        })
      )
      .min(1),
  }),
});

export const voucherCreateSchema = z.object({
  body: z.object({
    code: z.string().min(3, "Code must be at least 3 characters"),
    discountAmount: z.coerce.number().min(0),
    maxUsage: z.coerce.number().int().min(1).optional(),
    expiredAt: z.string().datetime(),
  }),
});
