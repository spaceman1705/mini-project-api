"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileSchema = void 0;
const zod_1 = require("zod");
exports.fileSchema = zod_1.z.object({
    fieldname: zod_1.z.string(),
    originalname: zod_1.z.string(),
    encoding: zod_1.z.string(),
    mimetype: zod_1.z.enum(["image/jpg", "image/jpeg", "image/png", "image/webp"]),
    size: zod_1.z.number().max(1024 * 1024, "File size must be less than 1MB"),
    destination: zod_1.z.string().optional(),
    filename: zod_1.z.string().optional(),
    path: zod_1.z.string().optional(),
    buffer: zod_1.z.any().optional(),
});
