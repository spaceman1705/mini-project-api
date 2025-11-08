import { Request, Response, NextFunction } from "express";
import {
  verificationLinkService,
  verifyService,
  login,
} from "../services/auth.service";
import { Token } from "../middlewares/auth.middleware";

export async function verificationLinkController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { email } = req.body;
    await verificationLinkService(email);

    res.json({
      message: "A verification link has been sent to your email",
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization as string;
    const token = authHeader.split(" ")[1];

    const { email } = req.user as Token;
    const { firstname, lastname, password } = req.body;
    await verifyService(token, {
      email,
      firstname,
      lastname,
      password,
    });

    res.json({
      message: "Your account has been verified",
    });
  } catch (err) {
    next(err);
  }
}

export async function loginController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { email, password } = req.body;

    const data = await login(email, password);

    res.json({
      message: "OK",
      data,
    });
  } catch (err) {
    next(err);
  }
}