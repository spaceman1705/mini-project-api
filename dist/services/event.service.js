"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEvent = createEvent;
exports.updateEvent = updateEvent;
exports.getEventBySlug = getEventBySlug;
exports.getAllEvents = getAllEvents;
exports.getEventCategories = getEventCategories;
exports.setEventStatus = setEventStatus;
exports.addTicketTypes = addTicketTypes;
exports.createVoucher = createVoucher;
exports.getMyEvents = getMyEvents;
const prisma_1 = __importDefault(require("../lib/prisma"));
const customError_1 = require("../utils/customError");
const auth_service_1 = require("./auth.service");
const cloudnary_1 = require("../utils/cloudnary");
async function createEvent(email, imgFile, params) {
    var _a;
    const uploaded = imgFile ? await (0, cloudnary_1.cloudinaryUpload)(imgFile) : null;
    const uploadUrl = uploaded === null || uploaded === void 0 ? void 0 : uploaded.secure_url;
    try {
        const user = await (0, auth_service_1.getUserByEmail)(email);
        if (!user)
            throw (0, customError_1.createCustomError)(401, "Invalid user");
        const start = new Date(params.startDate);
        const end = new Date(params.endDate);
        if (end <= start) {
            throw (0, customError_1.createCustomError)(400, "End date must be after start date");
        }
        const event = await prisma_1.default.event.create({
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
                status: (_a = params.status) !== null && _a !== void 0 ? _a : "DRAFT",
                bannerImg: uploadUrl,
                organizerId: user.id,
            },
        });
        return event;
    }
    catch (err) {
        if (uploadUrl)
            await (0, cloudnary_1.cloudinaryRemove)(uploadUrl);
        throw err;
    }
}
async function updateEvent(id, params) {
    try {
        const start = params.startDate
            ? new Date(params.startDate)
            : undefined;
        const end = params.endDate ? new Date(params.endDate) : undefined;
        if (start && end && end <= start) {
            throw (0, customError_1.createCustomError)(400, "End date must be after start date");
        }
        const event = await prisma_1.default.event.update({
            where: { id },
            data: Object.assign(Object.assign(Object.assign({}, params), (start ? { startDate: start } : {})), (start ? { endDate: start } : {})),
        });
        return event;
    }
    catch (err) {
        throw err;
    }
}
async function getEventBySlug(slug) {
    try {
        const event = await prisma_1.default.event.findUnique({
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
            throw (0, customError_1.createCustomError)(404, "Event not found");
        }
        return event;
    }
    catch (err) {
        throw err;
    }
}
async function getAllEvents(page = 1, pageSize = 12, filter, sort = "newest") {
    try {
        if (filter.title) {
            filter.title = {
                contains: filter.title,
                mode: "insensitive",
            };
            filter.location = {
                contains: filter.location,
                mode: "insensitive",
            };
            filter.category = {
                contains: filter.category,
                mode: "insensitive",
            };
        }
        const where = Object.assign({ status: "PUBLISHED" }, filter);
        const orderBy = sort === "oldest"
            ? { createdAt: "asc" }
            : sort === "price_asc"
                ? { price: "asc" }
                : sort === "price_desc"
                    ? { price: "desc" }
                    : { createdAt: "desc" };
        const [items, total] = await Promise.all([
            prisma_1.default.event.findMany({
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
            prisma_1.default.event.count({ where }),
        ]);
        return {
            items,
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
        };
    }
    catch (err) {
        throw err;
    }
}
async function getEventCategories() {
    try {
        const rows = await prisma_1.default.event.findMany({
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
    }
    catch (err) {
        throw err;
    }
}
async function setEventStatus(id, user, status) {
    try {
        if (user.role !== "ADMIN") {
            const owner = await prisma_1.default.event.findFirst({
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
                throw (0, customError_1.createCustomError)(404, "Event not found or not owned");
            }
        }
        return await prisma_1.default.event.update({
            where: { id },
            data: { status },
        });
    }
    catch (err) {
        throw err;
    }
}
async function addTicketTypes(eventId, items) {
    try {
        const event = await prisma_1.default.event.findUnique({
            where: { id: eventId },
            select: { id: true },
        });
        if (!event)
            throw (0, customError_1.createCustomError)(404, "Event not found");
        return await prisma_1.default.$transaction(async (tx) => {
            var _a;
            const created = await Promise.all(items.map((i) => {
                var _a;
                return tx.ticketType.create({
                    data: {
                        eventId,
                        name: i.name,
                        description: (_a = i.description) !== null && _a !== void 0 ? _a : "",
                        price: i.price,
                        quota: i.quota,
                        availableQuota: i.quota,
                    },
                });
            }));
            const total = await tx.ticketType.aggregate({
                _sum: { quota: true },
                where: { eventId },
            });
            await tx.event.update({
                where: { id: event.id },
                data: {
                    availableSeats: (_a = total._sum.quota) !== null && _a !== void 0 ? _a : 0,
                },
            });
            return created;
        });
    }
    catch (err) {
        throw err;
    }
}
async function createVoucher(eventId, params) {
    try {
        const event = await prisma_1.default.event.findUnique({
            where: { id: eventId },
            select: { id: true },
        });
        if (!event)
            throw (0, customError_1.createCustomError)(404, "Event not found");
        const voucher = await prisma_1.default.voucher.create({
            data: {
                eventId,
                code: params.code,
                discountAmount: params.discountAmount,
                expiredAt: params.expiredAt,
                maxUsage: params.maxUsage,
            },
        });
        return voucher;
    }
    catch (err) {
        throw err;
    }
}
async function getMyEvents(userId, params) {
    const { page, pageSize, q, category, location, date, start, end, minPrice, maxPrice, status, sort, } = params;
    const filter = {
        organizerId: userId,
    };
    if (status && status !== "ALL")
        filter.status = status;
    if (q) {
        filter.OR = [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { location: { contains: q, mode: "insensitive" } },
        ];
    }
    if (category)
        filter.category = category;
    if (location)
        filter.location = location;
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
            gte: minPrice !== null && minPrice !== void 0 ? minPrice : 0,
            lte: maxPrice !== null && maxPrice !== void 0 ? maxPrice : Number.MAX_SAFE_INTEGER,
        };
    }
    const orderBy = sort === "oldest"
        ? { createdAt: "asc" }
        : sort === "price_asc"
            ? { price: "asc" }
            : sort === "price_desc"
                ? { price: "desc" }
                : { createdAt: "desc" };
    const [items, total] = await Promise.all([
        prisma_1.default.event.findMany({
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
        prisma_1.default.event.count({ where: filter }),
    ]);
    return {
        items,
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
    };
}
