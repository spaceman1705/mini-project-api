import { Request, Response, NextFunction } from "express";
import { getEventBySlug } from "../services/event.service";

export async function getEventBySlugController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { slug } = req.params;
    const data = await getEventBySlug(slug);

    res.json({
      message: "OK",
      data,
    });
  } catch (err) {
    next(err);
  }
}
