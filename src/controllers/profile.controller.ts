import { Request, Response, NextFunction } from "express";
import {
  getProfileService,
  updateProfileService,
  updatePasswordService,
} from "../services/profile.service";

export async function getProfileController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) throw new Error("User not authenticated");
    const userId = req.user.id;
    const result = await getProfileService(userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateProfileController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) throw new Error("User not authenticated");
    const userId = req.user.id;
    const result = await updateProfileService(userId, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function updatePasswordController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) throw new Error("User not authenticated");
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;
    const result = await updatePasswordService(userId, oldPassword, newPassword);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
