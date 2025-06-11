import { NextFunction, Request, Response, Router } from 'express';
import bcrypt from 'bcrypt';
import { User as PrismaUser } from '../../../../generated/prisma';
import prisma from '../prisma';

// middleware auth
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    res.status(401).json({ error: `Not authenticated` });
    return;
  }
  next();
};

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
const router = Router();

router.post(`/students`, requireAuth, async (
  req: Request<unknown, unknown>,
  res: Response,
) => {
  try {
    const user: PrismaUser | null = await prisma.user.findUnique({
      where: { id: req.session.userId },
    });

    if (!user) {
      res.status(404).json({ error: `User not found` });
      return;
    }
    const students = await prisma.user.findMany({
      where: { supervisorId: user.id },
    });
    res.status(200).json({
      message: `Fetched students`,
      students,
    });
  } catch (err) {
    console.error(`Fetch error:`, err);
    if (!res.headersSent) {
      res.status(500).json({ error: `Internal server error` });
    }
  }
});

interface StudentInfoChange {
  email: string;
  name: string;
  password?: string;
  userId: number;
}

router.post(`/setUserInfo`, requireAuth, async (
  req: Request<unknown, unknown, StudentInfoChange>,
  res: Response,
) => {
  const { email, name, password, userId } = req.body;
  let hashedPassword = password;
  try {
    const user: PrismaUser | null = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ error: `User not found` });
      return;
    }

    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    } else {
      hashedPassword = user.password;
    }

    await prisma.user.update({
      data: {
        email,
        name,
        password: hashedPassword,
      },
      where: { id: userId },
    });

    res.status(200).json({
      message: `Successfully set user info!`,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (err) {
    console.error(`Fetch error:`, err);
    if (!res.headersSent) {
      res.status(500).json({ error: `Internal server error` });
    }
  }
});

export default router;
