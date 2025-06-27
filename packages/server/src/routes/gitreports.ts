import { Request, Response, Router } from 'express';
import { prisma } from '../prisma';
import limiter from './auth';

const router = Router();

// --- NEW HELPER FUNCTIONS ---

/**
 * Determines the current semester name ('SPRING', 'SUMMER', 'FALL') and year.
 */
const getCurrentSemesterInfo = (): { semester: string, year: number } => {
  const today = new Date();
  const year = today.getFullYear();
  // Using the same date boundaries as the frontend for consistency
  const summerStart = new Date(year, 4, 12); // May 12
  const summerEnd = new Date(year, 7, 9); // Aug 9
  const fallStart = new Date(year, 7, 25); // Aug 25
  const fallEnd = new Date(year, 11, 5); // Dec 5
  const springStart = new Date(year, 0, 12); // Jan 12
  const springEnd = new Date(year, 3, 24); // Apr 24

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

/**
 * Returns the start and end dates for a given semester and year.
 */
const getSemesterDateRange = (semester: string, year: number): { endDate: Date, startDate: Date } | null => {
  switch (semester) {
    case `SPRING`:
      return { endDate: new Date(year, 3, 24), startDate: new Date(year, 0, 12) };
    case `SUMMER`:
      return { endDate: new Date(year, 7, 9), startDate: new Date(year, 4, 12) };
    case `FALL`:
      return { endDate: new Date(year, 11, 5), startDate: new Date(year, 7, 25) };
    default:
      return null; // Return null if the semester is not valid
  }
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

  // 1. Determine the current semester's date range
  const { semester, year } = getCurrentSemesterInfo();
  const dateRange = getSemesterDateRange(semester, year);

  // If we are not in a valid semester, return empty data.
  if (!dateRange) {
    res.status(200).json({
      data: { teamAverageContributions: [], userContributions: [] },
      message: `No active semester found.`,
    });
    return;
  }

  const { endDate, startDate } = dateRange;

  // 2. Build the date filter for the Prisma query
  const dateFilter = {
    date: {
      gte: startDate, // gte: Greater than or equal to
      lte: endDate, // lte: Less than or equal to
    },
  };

  // 3. Fetch individual user's contributions for the current semester
  const userContributions = await prisma.contributions.findMany({
    orderBy: {
      date: `asc`,
    },
    where: {
      user_login: username,
      ...dateFilter, // Apply the date filter
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
      // 4. Fetch team contributions for the current semester
      const allTeamContributions = await prisma.contributions.findMany({
        where: {
          user_login: { in: teamMemberNames },
          ...dateFilter, // Apply the same date filter
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
