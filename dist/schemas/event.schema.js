"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.voucherCreateSchema = exports.ticketTypeCreateSchema = exports.eventUpdateSchema = exports.eventCreateSchema = exports.eventBody = void 0;
const zod_1 = __importDefault(require("zod"));
const common_schema_1 = require("./common.schema");
exports.eventBody = zod_1.default.object({
    title: zod_1.default.string().min(3, "Title must be at least 3 characters"),
    description: zod_1.default.string().min(10, "Description must be at least 10 characters"),
    category: zod_1.default.string().min(3, "Category must be at least 3 characters"),
    location: zod_1.default.string().min(3, "Location must be at least 3 characters"),
    startDate: zod_1.default.string().datetime(),
    endDate: zod_1.default.string().datetime(),
    price: zod_1.default.coerce.number().min(0),
    availableSeats: zod_1.default.coerce.number().int().min(0),
    status: zod_1.default.enum(["DRAFT", "PUBLISHED", "CANCELLED"]).optional(),
});
exports.eventCreateSchema = zod_1.default.object({
    body: exports.eventBody,
    file: common_schema_1.fileSchema.optional(),
});
exports.eventUpdateSchema = zod_1.default.object({
    body: exports.eventBody.partial(),
});
exports.ticketTypeCreateSchema = zod_1.default.object({
    body: zod_1.default.object({
        items: zod_1.default
            .array(zod_1.default.object({
            name: zod_1.default.string().min(2, "Name must be at least 2 characters"),
            description: zod_1.default.string().default(""),
            price: zod_1.default.coerce.number().min(0),
            quota: zod_1.default.coerce.number().int().min(1),
        }))
            .min(1),
    }),
});
exports.voucherCreateSchema = zod_1.default.object({
    body: zod_1.default.object({
        code: zod_1.default.string().min(3, "Code must be at least 3 characters"),
        discountAmount: zod_1.default.coerce.number().min(0),
        maxUsage: zod_1.default.coerce.number().int().min(1).optional(),
        expiredAt: zod_1.default.string().datetime(),
    }),
});
