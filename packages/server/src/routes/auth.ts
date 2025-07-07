import { NextFunction, Request, Response, Router } from 'express';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
import { User as PrismaUser, Role, Team } from '../../../generated/prisma';
import { prisma } from '../prisma';

const router = Router();
export const requireRole = (allowedRoles: Role[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      res.status(401).json({ error: `Not authenticated` });
      return;
    }

    try {
      const user = await prisma.user.findUnique({
        select: { role: true },
        where: { id: req.session.userId },
      });
      if (!user) {
        res.status(404).json({ error: `User not found` });
        return;
      }

      if (!allowedRoles.includes(user.role)) {
        res.status(403).json({ error: `Forbidden: insufficient permissions` });
        return;
      }

      next();
    } catch {
      res.status(500).json({ error: `Internal server error` });
      return;
    }
  };

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    res.status(401).json({ error: `Not authenticated` });
    return;
  }
  next();
};

export const loginLimiter = rateLimit({
  legacyHeaders: false,
  max: 10,
  message: {
    error: `Too many requests, please slow down.`,
  },
  standardHeaders: true,
  windowMs: 10 * 1000,
});

export const limiter = rateLimit({
  legacyHeaders: false,
  max: 10,
  message: {
    error: `Too many requests, please slow down.`,
  },
  standardHeaders: true,
  windowMs: 1 * 1000,
});

export const meLimiter = rateLimit({
  legacyHeaders: false,
  max: 5,
  message: {
    error: `Too many requests, please slow down.`,
  },
  standardHeaders: true,
  windowMs: 500,
});

interface SignupRequestBody {
  email: string;
  name: string;
  password: string;
  role: keyof typeof Role;
  supervisorEmail?: string;
  teamName?: string;
}

router.post(`/signup`, loginLimiter, async (
  req: Request<unknown, unknown, SignupRequestBody>,
  res: Response,
) => {
  const { email, name, password, role, supervisorEmail, teamName } = req.body;

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { name },
        ],
      },
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
  } catch {
    if (!res.headersSent) {
      res.status(500).json({ error: `Internal server error` });
    }
  }
});

interface LoginRequestBody {
  email: string;
  password: string;
}

router.post(`/login`, loginLimiter, async (
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

    if (user.role === Role.STUDENT && !user.enabled) {
      res.status(403).json({ error: `Student account is disabled` });
      return;
    }

    if (!user.enabled) {
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
  } catch {
    if (!res.headersSent) {
      res.status(500).json({ error: `Internal server error` });
    }
  }
});

router.post(`/logout`, loginLimiter, (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
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

router.post(`/me`, meLimiter, requireAuth, async (
  req: Request<unknown, unknown, UserInfoBody>,
  res: Response,
) => {
  try {
    const user = await prisma.user.findUnique({
      include: { evaluationsGiven: true, evaluationsReceived: true, teams: true },
      where: { id: req.session.userId },
    });

    if (!user || !user.enabled) {
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

        const teams = await prisma.team.findMany({
          select: {
            id: true,
            leadSupervisor: { select: { name: true } },
            leadSupervisorId: true,
            name: true,
          },
          where: {
            id: { in: safeTeamIDs },
          },
        });

        res.status(200).json({
          message: `Fetched user info`,
          user: {
            id, createdAt, email, evaluationsCompleted, evaluationsGiven,
            evaluationsReceived, name, role, safeTeamIDs,
            supervisorId, supervisorName, teamNames, teams,
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
  } catch {
    if (!res.headersSent) {
      res.status(500).json({ error: `Internal server error` });
    }
  }
});

export default router;
