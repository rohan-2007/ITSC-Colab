import { NextFunction, Request, Response, Router } from 'express';
import bcrypt from 'bcrypt';
import { User as PrismaUser, Role } from '../../../../generated/prisma';
import prisma from '../prisma';
// middleware auth
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  console.log("in requireAuth");
  if (!req.session.userId) {
    res.status(401).json({ error: `Not authenticated` });
    return;
  }
  next();
};

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
const router = Router();
interface SignupRequestBody {
  email: string;
  name: string;
  password: string;
  role: keyof typeof Role;
  supervisorEmail?: string;
  teamName?: string;
}

router.post(`/signup`, async (
  req: Request<unknown, unknown, SignupRequestBody>,
  res: Response,
) => {
  const { email, name, password, role, supervisorEmail, teamName } = req.body;

  try {
    const existingUser: PrismaUser | null = await prisma.user.findUnique({
      where: { email },
    });

    let supervisorId: number | null = null;
    let teamId: number | null = null;

    if (supervisorEmail && typeof supervisorEmail === `string`) {
      const supervisor = await prisma.user.findUnique({ where: { email: supervisorEmail } });
      if (!supervisor) {
        res.status(400).json({ error: `Supervisor with email '${ supervisorEmail }' not found` });
        return;
      }
      supervisorId = supervisor.id;
    }

    // Validate team
    if (teamName && typeof teamName === `string`) {
      const team = await prisma.team.findUnique({ where: { name: teamName } });
      if (!team) {
        res.status(400).json({ error: `Team with name '${ teamName }' not found` });
        return;
      }
      teamId = team.id;
    }

    if (!Object.values(Role).includes(role as Role)) {
      res.status(400).json({ error: `Invalid role` });
      return;
    }

    if (existingUser) {
      res.status(400).json({ error: `Email in use` });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const supervisorIdClean = Number(supervisorId);
    const teamIdClean = Number(teamId);

    const newUser: PrismaUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role,
        supervisorId: supervisorIdClean,
        teamId: teamIdClean,
      },
    });
    req.session.userId = newUser.id;
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
    req.session.userId = user.id;
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

interface UserInfoBody {
  returnData?: boolean;
}

router.post(`/me`, requireAuth, async (
  req: Request<unknown, unknown, UserInfoBody>,
  res: Response,
) => {
  // eslint-disable-next-line no-console
  console.time(`/me total`);
  try {
    // eslint-disable-next-line no-console
    console.log(`[${ new Date().toISOString() }] /me hit`);
    // eslint-disable-next-line no-console
    console.time(`findUnique user`);
    const user: PrismaUser | null = await prisma.user.findUnique({
      where: { id: req.session.userId },
    });
    // eslint-disable-next-line no-console
    console.timeEnd(`findUnique user`);

    console.log("after user fetch");

    if (!user) {
      console.log("User not found");
      res.status(404).json({ error: `User not found` });
      return;
    }

    if (user.id !== req.session.userId) {
      console.log("Forbidden");
      res.status(403).json({ error: `Forbidden` });
      return;
    }
    if (req.body) {
      console.log("llllll", req.body.returnData);
      if (req.body.returnData) {
        res.status(200).json({
          message: `Fetched user info`,
          user: { email: user.email, name: user.name, role: user.role,supervisorId:user.supervisorId, userId: user.id },
        });
      }
    } else {
      console.log("user session found");
      res.status(200).json({
        message: `User session found`,
        sessionActive: true,
      });
    }
  } catch (err) {
    console.error(`Fetch error:`, err);
    if (!res.headersSent) {
      res.status(500).json({ error: `Internal server error` });
    }
  }
  // eslint-disable-next-line no-console
  console.timeEnd(`/me total`);
});

export default router;
