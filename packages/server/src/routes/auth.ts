import { Request, Response, Router } from 'express';
import bcrypt from 'bcrypt';
import { User as PrismaUser } from '../../../../generated/prisma';
import prisma from '../prisma';

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
const router = Router();
interface SignupRequestBody {
  email: string;
  name: string;
  password: string;
  roleId: number;
  supervisorId?: number;
  teamId?: number;
}

router.post(`/signup`, async (
  req: Request<unknown, unknown, SignupRequestBody>,
  res: Response,
) => {
  const { email, name, password, roleId } = req.body;

  try {
    const existingUser: PrismaUser | null = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(400).json({ error: `Email in use` });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser: PrismaUser = await prisma.user.create({
      data: { email, name, password: hashedPassword, roleId, supervisorId: null, teamId: null },
    });

    res.status(201).json({
      message: `User created`,
      user: { id: newUser.id, email: newUser.email, name: newUser.name },
    });
  } catch (err) {
    console.error(`Signup error:`, err);
    if (!res.headersSent) {
      res.status(500).json({ error: `Internal server error` });
    }
  }
});

interface LoginRequestBody {
  email: string;
  password: string;
}

router.post(`/login`, async (
  req: Request<unknown, unknown, LoginRequestBody>,
  res: Response,
) => {
  const { email, password } = req.body;

  try {
    const user: PrismaUser | null = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(404).json({ error: `User not found` });
      return;
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      res.status(401).json({ error: `Invalid credentials` });
      return;
    }

    res.status(200).json({
      message: `Login successful`,
      user: { id: user.id, name: user.name },
    });
  } catch (err) {
    console.error(`Login error:`, err);
    if (!res.headersSent) {
      res.status(500).json({ error: `Internal server error` });
    }
  }
});

export default router;
