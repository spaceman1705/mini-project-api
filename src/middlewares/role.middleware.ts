import { Request, Response, NextFunction } from 'express';

type Role = 'ADMIN' | 'ORGANIZER' | 'CUSTOMER';

export function roleGuard(allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const userRole = req.user.role.toUpperCase();

    if (!allowedRoles.includes(userRole as Role)) {
      res.status(403).json({ 
        error: 'Forbidden',
        message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`
      });
      return;
    }

    next();
  };
}

// Helper untuk check specific role
export function isAdmin(req: Request): boolean {
  return req.user?.role.toUpperCase() === 'ADMIN';
}

export function isOrganizer(req: Request): boolean {
  return req.user?.role.toUpperCase() === 'ORGANIZER';
}

export function isCustomer(req: Request): boolean {
  return req.user?.role.toUpperCase() === 'CUSTOMER';
}