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
    console.log("🟡 roleGuard executing for roles:", allowedRoles);
    console.log("🟡 User role:", req.user?.role);
    
    try {
      const user = req.user;

      if (!user) {
        console.log("❌ No user in request");
        throw createCustomError(401, "invalid token");
      }

      if (!allowedRoles.includes(user?.role)) {
        console.log("❌ User role not in allowed roles");
        throw createCustomError(401, "Insufficient permissions");
      }

      console.log("✅ Role guard passed");
      next();
    } catch (err) {
      console.error("❌ Role guard error:", err);
      next(err);
    }
  };
}

export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.log("🟢 authenticateToken executing...");
  
  try {
    const authHeader = req.headers.authorization;
    console.log("Auth header exists:", !!authHeader);
    
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      console.log("❌ No token provided");
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    const decoded = jwt.verify(token, SECRET_KEY) as Token;

    req.user = {
      id: decoded.id || decoded.email,
      email: decoded.email,
      firstname: decoded.firstname,
      lastname: decoded.lastname,
      role: decoded.role,
    };

    console.log("✅ Token verified, user:", req.user.email, "role:", req.user.role);
    next();
  } catch (error) {
    console.error("❌ authenticateToken error:", error);
    
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