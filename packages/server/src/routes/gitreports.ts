import { Request, Response, Router } from 'express';
import { prisma } from '../prisma';
import limiter from './auth';

const router = Router();

interface RequestBody {
  teamIDs?: number[];
  username: string;
}

router.post(`/gitData`, limiter, async (
  req: Request<unknown, unknown, RequestBody>,
  res: Response,
) => {
  const { teamIDs, username } = req.body;

  if (!username) {
    res.status(400).json({ message: `No username provided` });
    return;
  }

  if (username && !teamIDs) {
    const allUserContributions = await prisma.contributions.findMany({
      where: {
        user_login: username,
      },
    });

    if (!allUserContributions) {
      res.status(404).json({
        message: `Could not find any user contributions`,
      });
      return;
    }

    res.status(200).json({
      contributions: allUserContributions,
      message: `Fetched all user contributions`,
    });
    return;
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const startDate = new Date(year, month, 1);
  const endDate = now;

  const dateFilter = {
    date: {
      gte: startDate,
      lte: endDate,
    },
  };

  const userContributions = await prisma.contributions.findMany({
    orderBy: {
      date: `asc`,
    },
    where: {
      user_login: username,
      ...dateFilter,
    },
  });

  let teamAverageContributions: Array<{ average_contributions: number, date: string }> = [];

  if (teamIDs && teamIDs.length > 0) {
    const teamMembers = await prisma.user.findMany({
      select: { name: true },
      where: {
        role: `STUDENT`,
        teams: { some: { id: { in: teamIDs } } },
      },
    });

    const teamMemberNames = teamMembers.map((member) => member.name);
    const teamMemberCount = teamMemberNames.length;

    if (teamMemberCount > 0) {
      const allTeamContributions = await prisma.contributions.findMany({
        where: {
          user_login: { in: teamMemberNames },
          ...dateFilter,
        },
      });

      const contributionsByDate = new Map<string, number>();
      allTeamContributions.forEach((contribution) => {
        const [ dateKey ] = contribution.date.toISOString().split(`T`);
        const currentCount = contributionsByDate.get(dateKey) || 0;
        contributionsByDate.set(dateKey, currentCount + contribution.contribution_count);
      });

      teamAverageContributions = Array.from(contributionsByDate.entries()).map(([ date, totalContributions ]) => ({
        average_contributions: totalContributions / teamMemberCount,
        date,
      }));
    }
  }

  res.status(200).json({
    data: { teamAverageContributions, userContributions },
    message: `Fetched git data for the current month.`,
  });
  return;
});

export default router;
