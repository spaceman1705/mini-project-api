"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toSlug = toSlug;
exports.eventSlug = eventSlug;
const prisma_1 = __importDefault(require("./prisma"));
function toSlug(input) {
    return input
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}
async function eventSlug(title) {
    const base = toSlug(title);
    let slug = base;
    let i = 1;
    while (await prisma_1.default.event.findUnique({
        where: { slug },
    })) {
        i++;
        slug = `${base}-${i}`;
    }
    return slug;
}
