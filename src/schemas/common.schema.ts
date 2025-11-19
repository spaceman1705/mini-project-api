import { z } from "zod";

export const fileSchema = z.object({
  fieldname: z.string(),
  originalname: z.string(),
  encoding: z.string(),
  mimetype: z.enum(["image/jpg", "image/jpeg", "image/png", "image/webp"]),
  size: z.number().max(1024 * 1024, "File size must be less than 1MB"),
  destination: z.string().optional(),
  filename: z.string().optional(),
  path: z.string().optional(),
  buffer: z.any().optional(),
});

export type FileUpload = z.infer<typeof fileSchema>;
