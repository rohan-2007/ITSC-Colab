import { NextFunction, Request, Response, Router } from 'express';
import bcrypt from 'bcrypt';
import { User as PrismaUser, Team } from '../../../../generated/prisma';
import prisma from '../prisma';
// import { Prisma } from '@prisma/client';

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
      include: { teams: true },
      where: { supervisorId: { not: null } },
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

router.post(`/supervisors`, requireAuth, async (
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
    const supervisors = await prisma.user.findMany({
      include: { teams: true },
      where: { supervisorId: null },
    });
    res.status(200).json({
      message: `Fetched supervisors`,
      supervisors,
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

router.post(`/teams`, requireAuth, async (
  req: Request<unknown, unknown>,
  res: Response,
) => {
  try {
    const user: PrismaUser | null = await prisma.user.findUnique({
      where: { id: req.session.userId },
    });

    if (!user || user.role !== `SUPERVISOR`) {
      res.status(404).json({ error: `User not a supervisor or not found` });
      return;
    }
    const teams = await prisma.team.findMany({ include: { members: true } });

    const formattedTeams = teams.map((team) => {
      const members = team.members as Array<{ id: number }>;
      return {
        id: team.id,
        memberIDs: members.map((m) => m.id),
        name: team.name,
      };
    });

    res.status(200).json({ teams: formattedTeams });
  } catch (err) {
    console.error(`Fetch error:`, err);
    if (!res.headersSent) {
      res.status(500).json({ error: `Internal server error` });
    }
  }
});

interface TeamInfoChange {
  id: number;
  memberIDs: number[];
  name: string;
}

router.post(`/setTeamInfo`, requireAuth, async (
  req: Request<unknown, unknown, TeamInfoChange>,
  res: Response,
) => {
  const { id, memberIDs, name } = req.body;

  try {
    const team: Team | null = await prisma.team.findUnique({
      where: { id },
    });

    if (!team) {
      res.status(404).json({ error: `Team not found` });
      return;
    }

    await prisma.team.update({
      data: {
        members: {
          set: memberIDs.map((id2) => ({ id: id2 })),
        },
        name,
      },
      where: { id },
    });

    res.status(200).json({
      message: `Successfully set team info!`,
      team,
    });
  } catch (err) {
    console.error(`Fetch error:`, err);
    if (!res.headersSent) {
      res.status(500).json({ error: `Internal server error` });
    }
  }
});

interface NewTeamRequest {
  memberIDs: number[];
  name: string;
}

router.post(`/createTeam`, requireAuth, async (
  req: Request<unknown, unknown, NewTeamRequest>,
  res: Response,
) => {
  const { memberIDs, name } = req.body;
  try {
    const newTeam = await prisma.team.create({
      data: {
        members: {
          connect: memberIDs.map((id) => ({ id })),
        },
        name,
      },
    });

    res.status(201).json({ message: `Team created`, team: newTeam });
  } catch (err) {
    console.error(`Create team error:`, err);
    res.status(500).json({ error: `Internal server error` });
  }
});

router.delete(`/deleteTeam/:id`, requireAuth, async (
  req: Request<{ id: string }, unknown>,
  res: Response,
) => {
  const id = Number(req.params.id);
  try {
    await prisma.team.delete({ where: { id } });
    res.status(200).json({ message: `Team deleted` });
  } catch (err) {
    console.error(`Delete team error:`, err);
    res.status(500).json({ error: `Internal server error` });
  }
});

router.post(`/criteriaData`, async (
  req: Request<unknown, unknown>,
  res: Response,
) => {
  try {
    const criteria = await prisma.criteria.findMany({
      include: {
        criteriaLevels: {
          include: {
            level: true,
          },
        },
        subCriteria: true,
      },
    });
    res.status(200).json({
      criteria,
      message: `Fetched criteria data`,
    });
  } catch (err) {
    console.error(`Criteria fetch error: `, err);
    res.status(500).json({ error: `Internal server error` });
  }
});

export default router;
