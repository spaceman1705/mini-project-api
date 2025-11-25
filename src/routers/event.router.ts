import { Router } from "express";
import {
  createEventController,
  updateEventController,
  getEventBySlugController,
  getAllEventsController,
  getEventCategoriesController,
  getMyEventsController,
  publihsEventController,
  cancelEventController,
  createTicketTypesController,
  createVoucherController,
  getMyEventsAdvancedController,
} from "../controllers/event.controller";
import { authMiddleware, roleGuard } from "../middlewares/auth.middleware";
import { uploader } from "../utils/uploader";
import { validateRequest } from "../middlewares/validate.middleware";
import {
  eventCreateSchema,
  ticketTypeCreateSchema,
  voucherCreateSchema,
} from "../schemas/event.schema";

export const eventRouter = Router();

eventRouter.post(
  "/",
  authMiddleware,
  roleGuard(["ADMIN", "ORGANIZER"]),
  uploader().single("bannerImg"),
  validateRequest(eventCreateSchema),
  createEventController
);

eventRouter.patch(
  "/:id",
  authMiddleware,
  roleGuard(["ADMIN", "ORGANIZER"]),
  validateRequest(eventCreateSchema),
  updateEventController
);

eventRouter.get("/", getAllEventsController);
eventRouter.get("/categories", getEventCategoriesController);

eventRouter.get(
  "/me",
  authMiddleware,
  roleGuard(["ADMIN", "ORGANIZER"]),
  getMyEventsController
);

eventRouter.get(
  "/me/adv",
  authMiddleware,
  roleGuard(["ADMIN", "ORGANIZER"]),
  getMyEventsAdvancedController
);

eventRouter.patch(
  "/:id/publish",
  authMiddleware,
  roleGuard(["ADMIN", "ORGANIZER"]),
  publihsEventController
);

eventRouter.patch(
  "/:id/cancel",
  authMiddleware,
  roleGuard(["ADMIN", "ORGANIZER"]),
  cancelEventController
);

eventRouter.post(
  "/:id/tickets",
  authMiddleware,
  roleGuard(["ADMIN", "ORGANIZER"]),
  validateRequest(ticketTypeCreateSchema),
  createTicketTypesController
);

eventRouter.post(
  "/:id/vouchers",
  authMiddleware,
  roleGuard(["ADMIN", "ORGANIZER"]),
  validateRequest(voucherCreateSchema),
  createVoucherController
);

eventRouter.get("/:slug", getEventBySlugController);

export default eventRouter;
