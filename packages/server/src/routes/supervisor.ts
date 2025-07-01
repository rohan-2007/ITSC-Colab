import { Request, Response, Router } from 'express';
import bcrypt from 'bcrypt';
import { User as PrismaUser, Role, Team } from '../../../generated/prisma';
import { prisma } from '../prisma';
import { limiter, requireAuth, requireRole } from './auth';

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
const router = Router();

router.post(`/students`, limiter, requireRole([ Role.SUPERVISOR ]), async (
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
      where: { role: Role.STUDENT },
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

router.post(`/supervisors`, limiter, requireAuth, async (
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
      where: { role: Role.SUPERVISOR },
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
  email?: string;
  name?: string;
  newPassword?: string;
  userId: number;
}

router.post(`/setUserInfo`, limiter, requireRole([ Role.SUPERVISOR ]), async (
  req: Request<unknown, unknown, StudentInfoChange>,
  res: Response,
) => {
  const { email, name, newPassword: password, userId } = req.body;

  try {
    const user: PrismaUser | null = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ error: `User not found` });
      return;
    }

    const updateData: Partial<PrismaUser> = {};

    if (email && email.trim() !== ``) {
      updateData.email = email;
    }
    if (name && name.trim() !== ``) {
      updateData.name = name;
    }
    if (password && password.trim() !== ``) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ error: `No valid fields to update` });
      return;
    }

    const updatedUser = await prisma.user.update({
      data: updateData,
      where: { id: userId },
    });

    res.status(200).json({
      message: `Successfully set user info!`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
      },
    });
  } catch (err) {
    console.error(`Fetch error:`, err);
    if (!res.headersSent) {
      res.status(500).json({ error: `Internal server error` });
    }
  }
});

router.post(`/teams`, limiter, requireAuth, async (
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

    const formattedTeams = await Promise.all(
      teams.map(async (team) => {
        const members = team.members as Array<{ id: number }>;
        let leadSupervisorName = `None`;
        if (team.leadSupervisorId) {
          const supervisor = await prisma.user.findUnique({
            where: { id: team.leadSupervisorId as number },
          });
          leadSupervisorName = supervisor?.name || `None`;
        }
        return {
          id: team.id,
          leadSupervisorId: team.leadSupervisorId as number | null,
          leadSupervisorName,
          memberIDs: members.map((m) => m.id),
          name: team.name,
        };
      }),
    );

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
  leadSupervisorId?: number;
  memberIDs: number[];
  name: string;
}

router.post(`/setTeamInfo`, limiter, requireRole([ Role.SUPERVISOR ]), async (
  req: Request<unknown, unknown, TeamInfoChange>,
  res: Response,
) => {
  const { id, leadSupervisorId, memberIDs, name } = req.body;

  try {
    const team: Team | null = await prisma.team.findUnique({
      where: { id },
    });

    if (!team) {
      res.status(404).json({ error: `Team not found` });
      return;
    }

    const updateData: {
      leadSupervisor?: { connect: { id: number } };
    } = {};

    if (typeof leadSupervisorId === `number`) {
      updateData.leadSupervisor = {
        connect: { id: leadSupervisorId },
      };
    }

    const updatedTeam = await prisma.team.update({
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
      team: updatedTeam,
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

router.post(`/createTeam`, limiter, requireRole([ Role.SUPERVISOR ]), async (
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

router.delete(`/deleteTeam/:id`, limiter, requireRole([ Role.SUPERVISOR ]), async (
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

export default router;
