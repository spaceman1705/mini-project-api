import { Router } from "express";
import { getEventBySlugController } from "../controllers/event.controller";

export const eventRouter = Router();

eventRouter.get("/:slug", getEventBySlugController);

export default eventRouter;
