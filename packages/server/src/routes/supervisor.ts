import { Request, Response, Router } from 'express';
import bcrypt from 'bcrypt';
import { User as PrismaUser, Role, Team } from '../../../generated/prisma';
import { prisma } from '../prisma';
import { limiter, requireAuth, requireRole } from './auth';

const router = Router();

router.post(`/students`, limiter, requireRole([ Role.SUPERVISOR ]), async (
  req: Request<unknown, unknown>,
  res: Response,
) => {
  try {
    type UserWithTeams = PrismaUser & { teams: Team[] };

    const user: UserWithTeams | null = await prisma.user.findUnique({
      include: { teams: true },
      where: { id: req.session.userId },
    });

    if (!user) {
      res.status(404).json({ error: `User not found` });
      return;
    }

    const includeDisabled = req.query.includeDisabled === `true`;
    const filtered = req.query.filtered === `true`; // NOTE: corrected logic

    let teamIds: number[] = [];

    if (filtered) {
      teamIds = user.teams.map((team) => team.id);
    }

    const students = await prisma.user.findMany({
      include: { teams: true },
      where: {
        role: Role.STUDENT,
        ...(includeDisabled ? {} : { enabled: true }),
        ...(filtered ?
            {
              teams: {
                some: {
                  id: { in: teamIds },
                },
              },
            } :
            {}),
      },
    });

    res.status(200).json({
      message: `Fetched students`,
      students,
    });
  } catch {
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
      where: { enabled: true, role: Role.SUPERVISOR },
    });
    res.status(200).json({
      message: `Fetched supervisors`,
      supervisors,
    });
  } catch {
    if (!res.headersSent) {
      res.status(500).json({ error: `Internal server error` });
    }
  }
});
interface StudentInfoChange {
  email?: string;
  enabled?: boolean;
  name?: string;
  newPassword?: string;
  userId: number;
}

router.post(`/createUser`, limiter, requireRole([ Role.SUPERVISOR ]), async (
  req: Request<unknown, unknown, {
    email: string; enabled?: boolean;
    name: string; password: string; role: Role; supervisorId?: number;
  }>,
  res: Response,
) => {
  const { email, enabled = true, name, password, role } = req.body;

  if (!email || !name || !password || !role || (role === Role.STUDENT && !req.body.supervisorId)) {
    res.status(400).json({ error: `Missing required fields` });
    return;
  }

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { name },
        ],
      },
    });
    if (existingUser) {
      res.status(409).json({ error: `User with this email/name already exists` });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        enabled,
        name,
        password: hashedPassword,
        role,
        supervisorId: req.body.supervisorId || null,
      },
    });

    res.status(201).json({
      message: `User created successfully`,
      user: {
        id: newUser.id,
        email: newUser.email,
        enabled: newUser.enabled,
        name: newUser.name,
        role: newUser.role,
        supervisorId: newUser.supervisorId,
      },
    });
  } catch {
    if (!res.headersSent) {
      res.status(500).json({ error: `Internal server error` });
    }
  }
});

router.post(`/setUserInfo`, limiter, requireRole([ Role.SUPERVISOR ]), async (
  req: Request<unknown, unknown, StudentInfoChange>,
  res: Response,
) => {
  const { email, enabled, name, newPassword: password, userId } = req.body;

  try {
    const user: PrismaUser | null = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ error: `User not found` });
      return;
    }

    const updateData: Partial<PrismaUser> & { disabledAt?: Date } = {};

    if (updateData.enabled || !updateData.enabled) {
      updateData.enabled = enabled;
      if (enabled === false) {
        updateData.disabledAt = new Date();
      } else {
        updateData.disabledAt = undefined;
      }
    }

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
  } catch {
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
        const members = await prisma.user.findMany({
          where: {
            id: { in: team.members.map((m: { id: number }) => m.id) },
            OR: [
              { role: { not: Role.STUDENT } },
              { enabled: true, role: Role.STUDENT },
            ],
          },
        });

        let primarySupervisorName = `None`;
        if (team.leadSupervisorId) {
          const supervisor = await prisma.user.findUnique({
            where: { id: team.leadSupervisorId },
          });
          primarySupervisorName = supervisor?.name || `None`;
        }
        return {
          id: team.id,
          memberIDs: members.map((m) => m.id),
          name: team.name,
          primarySupervisorId: team.leadSupervisorId,
          primarySupervisorName,
        };
      }),
    );

    res.status(200).json({ teams: formattedTeams });
  } catch {
    if (!res.headersSent) {
      res.status(500).json({ error: `Internal server error` });
    }
  }
});
interface TeamInfoChange {
  id: number;
  memberIDs: number[];
  name: string;
  primarySupervisorId?: number;
}

router.post(`/setTeamInfo`, limiter, requireRole([ Role.SUPERVISOR ]), async (
  req: Request<unknown, unknown, TeamInfoChange>,
  res: Response,
) => {
  const { id, memberIDs, name, primarySupervisorId } = req.body;

  try {
    const team: Team | null = await prisma.team.findUnique({
      where: { id },
    });

    if (!team) {
      res.status(404).json({ error: `Team not found` });
      return;
    }

    const allMemberIDs = new Set(memberIDs);
    if (typeof primarySupervisorId === `number`) {
      allMemberIDs.add(primarySupervisorId);
    }

    const enabledMemberIDs = await prisma.user.findMany({
      select: { id: true },
      where: {
        id: { in: Array.from(allMemberIDs) },
        OR: [
          { role: { not: Role.STUDENT } },
          { enabled: true, role: Role.STUDENT },
        ],
      },
    });

    const updateData: {
      leadSupervisor?: { connect: { id: number } };
    } = {};

    if (typeof primarySupervisorId === `number`) {
      updateData.leadSupervisor = {
        connect: { id: primarySupervisorId },
      };
    }

    const updatedTeam = await prisma.team.update({
      data: {
        ...(updateData.leadSupervisor && { leadSupervisor: updateData.leadSupervisor }),
        members: {
          set: enabledMemberIDs.map((u) => ({ id: u.id })),
        },
        name,
      },
      where: { id },
    });

    res.status(200).json({
      message: `Successfully set team info!`,
      team: updatedTeam,
    });
  } catch {
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
    const enabledMemberIDs = await prisma.user.findMany({
      select: { id: true },
      where: {
        id: { in: memberIDs },
        OR: [
          { role: { not: Role.STUDENT } },
          { enabled: true, role: Role.STUDENT },
        ],
      },
    });

    const newTeam = await prisma.team.create({
      data: {
        members: {
          connect: enabledMemberIDs.map((u) => ({ id: u.id })),
        },
        name,
      },
    });

    res.status(201).json({ message: `Team created`, team: newTeam });
  } catch {
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
  } catch {
    res.status(500).json({ error: `Internal server error` });
  }
});

export default router;
