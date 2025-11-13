import { Router } from "express";
import {
  getProfileController,
  updateProfileController,
  updatePasswordController,
} from "../controllers/profile.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const profileRouter = Router();

profileRouter.get("/", authMiddleware, getProfileController);
profileRouter.patch("/", authMiddleware, updateProfileController);
profileRouter.patch("/password", authMiddleware, updatePasswordController);

export default profileRouter;
