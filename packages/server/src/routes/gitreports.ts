import { Request, Response, Router } from 'express';
import { prisma } from '../prisma';
import limiter from './auth';

const router = Router();

const _getCurrentSemesterInfo = (): { semester: string, year: number } => {
  const today = new Date();
  const year = today.getFullYear();
  const summerStart = new Date(year, 4, 12);
  const summerEnd = new Date(year, 7, 9);
  const fallStart = new Date(year, 7, 25);
  const fallEnd = new Date(year, 11, 5);
  const springStart = new Date(year, 0, 12);
  const springEnd = new Date(year, 3, 24);

  if (today >= summerStart && today <= summerEnd) {
    return { semester: `SUMMER`, year };
  }
  if (today >= fallStart && today <= fallEnd) {
    return { semester: `FALL`, year };
  }
  if (today >= springStart && today <= springEnd) {
    return { semester: `SPRING`, year };
  }

  return { semester: `UNKNOWN`, year };
};

const _getSemesterDateRange = (semester: string, year: number): { endDate: Date, startDate: Date } | null => {
  switch (semester) {
    case `SPRING`:
      return { endDate: new Date(year, 3, 24), startDate: new Date(year, 0, 12) };
    case `SUMMER`:
      return { endDate: new Date(year, 7, 9), startDate: new Date(year, 4, 12) };
    case `FALL`:
      return { endDate: new Date(year, 11, 5), startDate: new Date(year, 7, 25) };
    default:
      return null;
  }
};

const getMonthDateRange = (year: number): { endDate: Date, startDate: Date } | null => {
  const month = new Date().getMonth();
  return { endDate: new Date(year, month + 1, 1), startDate: new Date(year, month, 1) };
};

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

  // const { semester, year } = getCurrentSemesterInfo();
  const dateRange = getMonthDateRange(new Date().getFullYear());

  if (!dateRange) {
    res.status(200).json({
      data: { teamAverageContributions: [], userContributions: [] },
      message: `No active semester found.`,
    });
    return;
  }

  const { endDate, startDate } = dateRange;

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
    message: `Fetched git data for the current semester.`,
  });
  return;
});

export default router;
