"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEventController = createEventController;
exports.updateEventController = updateEventController;
exports.getEventBySlugController = getEventBySlugController;
exports.getAllEventsController = getAllEventsController;
exports.getEventCategoriesController = getEventCategoriesController;
exports.getMyEventsController = getMyEventsController;
exports.publihsEventController = publihsEventController;
exports.cancelEventController = cancelEventController;
exports.createTicketTypesController = createTicketTypesController;
exports.createVoucherController = createVoucherController;
const event_service_1 = require("../services/event.service");
const slug_1 = require("../lib/slug");
async function createEventController(req, res, next) {
    try {
        const user = req.user;
        const body = req.body;
        const file = req.file;
        const slug = (0, slug_1.toSlug)(body.title);
        const data = await (0, event_service_1.createEvent)(user.email, file, {
            title: body.title,
            description: body.description,
            category: body.category,
            location: body.location,
            startDate: body.startDate,
            endDate: body.endDate,
            price: Number(body.price),
            availableSeats: Number(body.availableSeats),
            status: body.status,
            slug,
        });
        res.status(201).json({
            message: "OK",
            data,
        });
    }
    catch (err) {
        next(err);
    }
}
async function updateEventController(req, res, next) {
    try {
        const { id } = req.params;
        const data = await (0, event_service_1.updateEvent)(id, req.body);
        res.json({
            message: "OK",
            data,
        });
    }
    catch (err) {
        next(err);
    }
}
async function getEventBySlugController(req, res, next) {
    try {
        const { slug } = req.params;
        const data = await (0, event_service_1.getEventBySlug)(slug);
        res.json({
            message: "OK",
            data,
        });
    }
    catch (err) {
        next(err);
    }
}
async function getAllEventsController(req, res, next) {
    try {
        const { page, pageSize, q, title, category, location, date, start, end, minPrice, maxPrice, sort, } = req.query;
        const pageNum = page ? Number(page) : 1;
        const pageSizeNum = pageSize ? Number(pageSize) : 12;
        const filter = {};
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
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const endOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
        if (date === "today") {
            filter.startDate = {
                gte: startOfToday,
                lt: endOfToday,
            };
        }
        else if (date === "tomorrow") {
            filter.startDate = {
                gte: startOfTomorrow,
                lt: endOfTomorrow,
            };
        }
        else if (date === "weekend") {
            const day = now.getDay();
            const startOfSaturday = new Date(startOfToday);
            startOfSaturday.setDate(startOfSaturday.getDate() + ((6 - day + 7) % 7));
            const endOfSunday = new Date(startOfSaturday);
            endOfSunday.setDate(startOfSaturday.getDate() + 2);
            filter.startDate = {
                gte: startOfSaturday,
                lt: endOfSunday,
            };
        }
        else if (date === "upcoming") {
            filter.startDate = {
                gte: now,
            };
        }
        else if (date === "range") {
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
        const data = await (0, event_service_1.getAllEvents)(pageNum, pageSizeNum, filter, sort || "newest");
        res.json({
            message: "OK",
            data,
        });
    }
    catch (err) {
        next(err);
    }
}
async function getEventCategoriesController(req, res, next) {
    try {
        const categories = await (0, event_service_1.getEventCategories)();
        res.json({
            message: "OK",
            data: categories,
        });
    }
    catch (err) {
        next(err);
    }
}
async function getMyEventsController(req, res, next) {
    try {
        const user = req.user;
        const params = {
            page: Number(req.query.page) || 1,
            pageSize: Number(req.query.pageSize) || 12,
            q: req.query.q,
            category: req.query.category,
            location: req.query.location,
            date: req.query.date,
            start: req.query.start,
            end: req.query.end,
            minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
            maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
            status: req.query.status,
            sort: req.query.sort,
        };
        const data = await (0, event_service_1.getMyEvents)(user.id, params);
        res.json({
            message: "OK",
            data,
        });
    }
    catch (err) {
        next(err);
    }
}
async function publihsEventController(req, res, next) {
    try {
        const user = req.user;
        const { id } = req.params;
        const data = await (0, event_service_1.setEventStatus)(id, {
            email: user.email,
            role: user.role,
        }, "PUBLISHED");
        res.json({
            message: "OK",
            data,
        });
    }
    catch (err) {
        next(err);
    }
}
async function cancelEventController(req, res, next) {
    try {
        const user = req.user;
        const { id } = req.params;
        const data = await (0, event_service_1.setEventStatus)(id, {
            email: user.email,
            role: user.role,
        }, "CANCELED");
        res.json({
            message: "OK",
            data,
        });
    }
    catch (err) {
        next(err);
    }
}
async function createTicketTypesController(req, res, next) {
    try {
        const { id } = req.params;
        const { items } = req.body;
        const data = await (0, event_service_1.addTicketTypes)(id, items);
        res.status(201).json({
            message: "OK",
            data,
        });
    }
    catch (err) {
        next(err);
    }
}
async function createVoucherController(req, res, next) {
    try {
        const { id } = req.params;
        const payload = req.body;
        const data = await (0, event_service_1.createVoucher)(id, payload);
        res.status(201).json({
            message: "OK",
            data,
        });
    }
    catch (err) {
        next(err);
    }
}
