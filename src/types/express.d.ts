import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        firstname: string;
        lastname: string;
        role: string;
        iat?: number;
        exp?: number;
      };
    }
  }
}

export {};