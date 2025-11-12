import { Router } from "express";

import authRouter from "./auth.route";
import { eventRouter } from "./event.router";

const router = Router();

router.use("/auth", authRouter);
router.use("/events", eventRouter);

export default router;
