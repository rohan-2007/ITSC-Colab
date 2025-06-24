/* eslint-disable no-console */
import { NextFunction, Request, Response, Router } from 'express';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
import { User as PrismaUser, Role, Team } from '../../../../generated/prisma';
import { prisma } from '../prisma';

const router = Router();
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    res.status(401).json({ error: `Not authenticated` });
    return;
  }
  next();
};

export const limiter = rateLimit({
  legacyHeaders: false,
  max: 10,
  message: {
    error: `Too many requests, please slow down.`,
  },
  standardHeaders: true,
  windowMs: 10 * 1000,
});

interface SignupRequestBody {
  email: string;
  name: string;
  password: string;
  role: keyof typeof Role;
  supervisorEmail?: string;
  teamName?: string;
}

router.post(`/signup`, limiter, async (
  req: Request<unknown, unknown, SignupRequestBody>,
  res: Response,
) => {
  const { email, name, password, role, supervisorEmail, teamName } = req.body;

  try {
    const existingUser: PrismaUser | null = await prisma.user.findUnique({
      where: { email },
    });

    let supervisorId: number | null = null;

    if (supervisorEmail && typeof supervisorEmail === `string`) {
      const supervisor = await prisma.user.findUnique({ where: { email: supervisorEmail } });
      if (!supervisor) {
        res.status(400).json({ error: `Supervisor with email '${ supervisorEmail }' not found` });
        return;
      }
      supervisorId = supervisor.id;
    }
    const teamConnect = [];
    if (teamName && typeof teamName === `string`) {
      const team = await prisma.team.findUnique({ where: { name: teamName } });
      if (!team) {
        res.status(400).json({ error: `Team with name '${ teamName }' not found` });
        return;
      }
      teamConnect.push({ id: team.id });
    }

    if (!Object.values(Role).includes(role as Role)) {
      res.status(400).json({ error: `Invalid role` });
      return;
    }

    if (existingUser) {
      res.status(400).json({ error: `Email in use` });
      return;
    }
    if (role === `SUPERVISOR`) {
      supervisorId = null;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser: PrismaUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role,
        supervisorId,
        teams: {
          connect: teamConnect,
        },
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

router.post(`/login`, limiter, async (
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

router.post(`/logout`, limiter, (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(`Session destruction failed:`, err);
      return res.status(500).json({ message: `Could not log out` });
    }

    res.clearCookie(`connect.sid`, {
      httpOnly: true,
      path: `/`,
      sameSite: `lax`,
      secure: process.env.NODE_ENV === `production`,
    });

    return res.sendStatus(204);
  });
});

interface UserInfoBody {
  returnData?: boolean;
}

router.post(`/me`, limiter, requireAuth, async (
  req: Request<unknown, unknown, UserInfoBody>,
  res: Response,
) => {
  try {
    const user = await prisma.user.findUnique({
      include: { evaluationsGiven: true, evaluationsReceived: true, teams: true },
      where: { id: req.session.userId },
    });

    if (!user) {
      res.status(404).json({ error: `User not found` });
      return;
    }

    if (user.id !== req.session.userId) {
      res.status(403).json({ error: `Forbidden` });
      return;
    }
    let teamMap: Team[] = [];
    if (user.teams.length > 0) {
      teamMap = user.teams;
    }
    if (req.body) {
      if (req.body.returnData) {
        const teamNames = teamMap.map((t) => t.name);
        const safeTeamIDs = teamMap.map((t) => t.id);

        const createdAt = user.createdAt.toISOString();
        const { id, email, evaluationsGiven, evaluationsReceived, name, role } = user;
        const supervisorId = user.supervisorId || null;
        const supervisor = await prisma.user.findUnique({
          where: { id: supervisorId || -1 },
        });
        const supervisorName = supervisor ? supervisor.name : `Not Assigned`;
        interface Evaluation {
          type: Role;
          [key: string]: any;
        };
        let evaluationsCompleted: Evaluation[] = [];

        if (role === Role.STUDENT && Array.isArray(user.evaluationsReceived)) {
          evaluationsCompleted = (user.evaluationsReceived as Evaluation[]).filter(
            (e: Evaluation) => e?.type === Role.STUDENT,
          );
        } else if (role === Role.SUPERVISOR && Array.isArray(user.evaluationsGiven)) {
          evaluationsCompleted = (user.evaluationsGiven as Evaluation[]).filter(
            (e: Evaluation) => e?.type === Role.SUPERVISOR,
          );
        }

        res.status(200).json({
          message: `Fetched user info`,
          user: {
            id, createdAt, email, evaluationsCompleted, evaluationsGiven,
            evaluationsReceived, name, role, safeTeamIDs,
            supervisorId, supervisorName, teamNames,
          },
        });
      } else {
        res.status(200).json({
          message: `User session found, no data requested`,
          sessionActive: true,
        });
        return;
      }
    } else {
      res.status(200).json({
        message: `User session found`,
        sessionActive: true,
      });
      return;
    }
  } catch (err) {
    console.error(`Fetch error:`, err);
    if (!res.headersSent) {
      res.status(500).json({ error: `Internal server error` });
    }
  }
});

export default router;
