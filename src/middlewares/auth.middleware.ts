import { Request, Response, NextFunction } from "express";
import { verify, JwtPayload } from "jsonwebtoken";
import jwt from 'jsonwebtoken';

import { createCustomError } from "../utils/customError";
import { SECRET_KEY } from "../config/env.config";

export interface Token {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  role: string;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: Token;
  }
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer "))
      throw createCustomError(401, "Unauthorized");

    const token = authHeader.split(" ")[1];
    const decoded = verify(token, SECRET_KEY) as Token;

    req.user = decoded;

    next();
  } catch (err) {
    next(err);
  }
}

export function roleGuard(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      if (!user) throw createCustomError(401, "invalid token");

      if (!allowedRoles.includes(user?.role))
        throw createCustomError(401, "Insufficient permissions");

      next();
    } catch (err) {
      next(err);
    }
  };
}

export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }

    const decoded = jwt.verify(token, secret) as Token;

    // Attach user to request
    req.user = {
      id: decoded.id || decoded.email, // Fallback to email if id not present
      email: decoded.email,
      firstname: decoded.firstname,
      lastname: decoded.lastname,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(403).json({ error: 'Invalid token' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}