import { Request, Response, NextFunction } from 'express';
import {
  getOrganizerTransactions,
  getTransactionById,
  acceptTransaction,
  rejectTransaction,
  checkoutService
} from '../services/transaction.service';
import { Token } from '../middlewares/auth.middleware';
import prisma from '../lib/prisma';

// Reusable function to fetch DB user from token
async function getDbUser(token: Token) {
  return prisma.user.findUnique({
    where: { email: token.email }
  });
}

export async function getOrganizerTransactionsController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.user as Token;
    const dbUser = await getDbUser(user);

    if (!dbUser) return res.status(401).json({ message: 'User not found' });

    const transactions = await getOrganizerTransactions(dbUser.id);

    res.json({ message: 'OK', data: transactions });
  } catch (err) {
    next(err);
  }
}

export async function getTransactionByIdController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.user as Token;
    const dbUser = await getDbUser(user);
    if (!dbUser) return res.status(401).json({ message: 'User not found' });

    const transaction = await getTransactionById(req.params.id, dbUser.id);

    res.json({ message: 'OK', data: transaction });
  } catch (err) {
    next(err);
  }
}

export async function acceptTransactionController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params; // Ambil transaction ID dari URL path
    const user = req.user as Token; // Ambil user (organizer) ID dari middleware

    if (!id) {
      throw createCustomError(400, "Transaction ID is required");
    }
    
    // Panggil service untuk memproses persetujuan
    const data = await acceptTransaction(id, user.id);

    res.status(200).json({
      message: "Transaction successfully accepted and ticket confirmed",
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function rejectTransactionController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.user as Token;
    const dbUser = await getDbUser(user);
    if (!dbUser) return res.status(401).json({ message: 'User not found' });

    const transaction = await rejectTransaction(
      req.params.id,
      dbUser.id,
      req.body.reason
    );

    res.json({ message: 'Payment rejected', data: transaction });
  } catch (err) {
    next(err);
  }
}

export async function checkoutController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.user as Token;
    const { eventId, ticketTypeId, quantity } = req.body;

    if (!ticketTypeId) {
       // Jika tiketTypeId tidak ada di body, kita cegah Prisma error 
       throw createCustomError(400, "Ticket Type ID is missing from the request body.");
    }

    const result = await checkoutService({
      userId: user.id,
      eventId,
      ticketTypeId,
      quantity,
    });

    res.status(201).json({
      message: "Checkout successful",
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

function createCustomError(arg0: number, arg1: string) {
  throw new Error('Function not implemented.');
}
