/* eslint-disable no-console */
import { Request, Response, Router } from 'express';
import { Role, Semester } from '../../../generated/prisma';
import { prisma } from '../prisma';
import { limiter, requireAuth } from './auth';

const router = Router();
interface EvaluationResultBody {
  rubricCategoryId: number;
  rubricPerformanceLevelId: number;
}

interface EvaluationBody {
  results: EvaluationResultBody[];
  semester: keyof typeof Semester;
  studentId: number;
  supervisorId?: number;
  team: string;
  type: keyof typeof Role;
  year: number;
}

router.post(`/submitEval`, limiter, requireAuth, async (
  req: Request<unknown, unknown, EvaluationBody>,
  res: Response,
): Promise<void> => {
  try {
    const { results, semester, studentId, supervisorId, team, type, year } = req.body;
    console.log(`Creating evaluation with data:`, {
      semester,
      studentId,
      supervisorId,
      team,
      type,
      year,
    });

    if (
      Number(req.session.userId) !== studentId &&
      Number(req.session.userId) !== supervisorId
    ) {
      res.status(403).json({ error: `Forbidden: You are not authorized to submit this evaluation.` });
      return;
    }

    const newEval = await prisma.evaluation.create({
      data: {
        results: {
          createMany: {
            data: results.map((result) => ({
              rubricCategoryId: result.rubricCategoryId,
              rubricPerformanceLevelId: result.rubricPerformanceLevelId,
            })),
          },
        },
        semester,
        studentId,
        supervisorId: supervisorId ?? null,
        team,
        type,
        year,
      },
    });

    res.status(201).json({
      evaluationId: newEval.id,
      message: `Evaluation submitted successfully`,
    });
  } catch (error) {
    console.error(`Submit evaluation error:`, error);
    res.status(500).json({ error: `Internal server error` });
  }
});

router.get(`/getEval`, limiter, requireAuth, async (
  req: Request<unknown, unknown, unknown, { evaluationId?: number, userId?: number }>,
  res: Response,
): Promise<void> => {
  const evaluationId = req.query.evaluationId ? Number(req.query.evaluationId) : undefined;
  const targetUserId = req.query.userId ? Number(req.query.userId) : undefined;
  const sessionUserId = Number(req.session.userId);

  try {
    if (evaluationId) {
      const evalRecord = await prisma.evaluation.findUnique({
        include: {
          results: { include: { rubricPerformanceLevel: true } },
          student: { select: { id: true, email: true, name: true, supervisorId: true } },
          supervisor: { select: { id: true, email: true, name: true } },
        },
        where: { id: evaluationId },
      });

      if (!evalRecord) {
        res.status(404).json({ error: `Evaluation not found` });
        return;
      }

      if (evalRecord.studentId !== sessionUserId && evalRecord.student.supervisorId !== sessionUserId) {
        res.status(403).json({ error: `Forbidden: You are not authorized to view this evaluation.` });
        return;
      }

      res.status(200).json(evalRecord);
      return;
    }

    if (targetUserId) {
      const sessionUser = await prisma.user.findUnique({ where: { id: sessionUserId } });

      const isOwnRequest = targetUserId === sessionUserId;

      let isSupervisorRequest = false;
      if (sessionUser?.role === `SUPERVISOR`) {
        const student = await prisma.user.findUnique({ where: { id: targetUserId } });
        if (student?.supervisorId === sessionUserId) {
          isSupervisorRequest = true;
        }
      }

      if (!isOwnRequest && !isSupervisorRequest) {
        res.status(403).json({ error: `Forbidden: You are not authorized to retrieve these evaluations.` });
        return;
      }

      const evaluations = await prisma.evaluation.findMany({
        include: {
          results: true,
        },
        where: { studentId: targetUserId },
      });

      res.status(200).json(evaluations);
      return;
    }

    res.status(400).json({ error: `Provide either evaluationId or userId as query param` });
  } catch (error) {
    console.error(`Get evaluation error:`, error);
    res.status(500).json({ error: `Internal server error` });
  }
});

router.get(`/getSupervisorEvals`, limiter, requireAuth, async (
  req: Request<unknown, unknown, number>,
  res: Response,
) => {
  const targetId = Number(req.query.id);

  const evaluations = await prisma.evaluation.findMany({
    include: {
      results: true,
    },
    where: { supervisorId: targetId },
  });

  res.status(200).json(evaluations);
  return;
});

router.get(`/evalStatus`, requireAuth, async (req, res) => {
  const { semester, studentId, year } = req.query;

  const evaluations = await prisma.evaluation.findMany({
    where: {
      semester: semester as Semester,
      studentId: Number(studentId),
      year: Number(year),
    },
  });

  let studentCompleted = false;
  let supervisorCompleted = false;

  for (const ev of evaluations) {
    if (ev.type === `STUDENT`) {
      studentCompleted = true;
    }
    if (ev.type === `SUPERVISOR`) {
      supervisorCompleted = true;
    }
  }

  res.status(200).json({
    studentCompleted,
    supervisorCompleted,
  });
});

router.get(
  `/evalStatus/self`,
  limiter,
  requireAuth,
  async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const { semester, year } = req.query;
    const studentId = req.session.userId;

    if (!studentId || !semester || !year) {
      res.status(400).json({ error: `Missing required query parameters: studentId, semester, year` });
      return;
    }

    try {
      const evaluations = await prisma.evaluation.findMany({
        where: {
          semester: semester as Semester,
          studentId: Number(studentId),
          type: `STUDENT`,
          year: Number(year),
        },
      });
      const studentCompleted = evaluations.length > 0;

      res.status(200).json({ studentCompleted });
    } catch (error) {
      console.error(`Get self evaluation status error:`, error);
      res.status(500).json({ error: `Internal server error` });
    }
  },
);

router.get(`/supervisorEvals`, limiter, requireAuth, async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { semester, year } = req.query;
  const supervisorId = req.session.userId;

  if (!supervisorId || !semester || !year) {
    res.status(400).json({ error: `Missing required query parameters: semester, year` });
    return;
  }

  try {
    const myStudents = await prisma.user.findMany({
      select: { id: true },
      where: { supervisorId: Number(supervisorId) },
    });

    if (myStudents.length === 0) {
      res.status(200).json({});
      return;
    }
    const studentIds = myStudents.map((s) => s.id);

    const evaluations = await prisma.evaluation.findMany({
      select: {
        studentId: true,
        type: true,
      },
      where: {
        semester: semester as Semester,
        studentId: { in: studentIds },
        year: Number(year),
      },
    });

    const statuses: Record<number, { studentCompleted: boolean, supervisorCompleted: boolean }> = {};

    for (const id of studentIds) {
      statuses[id] = { studentCompleted: false, supervisorCompleted: false };
    }

    for (const ev of evaluations) {
      if (ev.type === `STUDENT`) {
        statuses[ev.studentId].studentCompleted = true;
      } else if (ev.type === `SUPERVISOR`) {
        statuses[ev.studentId].supervisorCompleted = true;
      }
    }

    res.status(200).json(statuses);
  } catch (error) {
    console.error(`Get supervisor evaluation statuses error:`, error);
    res.status(500).json({ error: `Internal server error` });
  }
});

export default router;
