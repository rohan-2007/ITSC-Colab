import { Request, Response, Router } from 'express';
import { JsonObject } from '@prisma/client/runtime/library';
import { Role, Semester } from '../../../../generated/prisma';
import { prisma } from '../prisma';
import { requireAuth } from './auth';

const router = Router();

interface EvaluationBody {
  criteria: JsonObject;
  evaluationType: keyof typeof Role;
  semester: keyof typeof Semester;
  studentId: number;
  supervisorId?: number;
  team: string;
  year: number;
}

router.post(`/submitEval`, requireAuth, async (
  req: Request<unknown, unknown, EvaluationBody>,
  res: Response,
): Promise<void> => {
  try {
    const { criteria, evaluationType, semester, studentId, supervisorId, team, year } = req.body;
    const user = await prisma.user.findUnique({
      where: { id: studentId },
    });

    if (!user) {
      res.status(404).json({ error: `User not found` });
      return;
    }

    if (![ studentId, supervisorId ].includes(Number(req.session.userId))) {
      res.status(403).json({ error: `Forbidden: You are not authorized to submit this evaluation.` });
      return;
    }

    const newEval = await prisma.evaluation.create({
      data: {
        criteria,
        semester,
        studentId,
        supervisorId: supervisorId || null,
        team,
        type: evaluationType,
        year,
      },
    });

    res.status(201).json({
      eval: {
        id: newEval.id,
        createdAt: newEval.createdAt,
        semester,
        studentId,
        supervisorId,
      },
      message: `Evaluation submitted successfully`,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Submit evaluation error:`, error);
    res.status(500).json({ error: `Internal server error` });
  }
});

router.get(`/getEval`, requireAuth, async (
  req: Request<unknown, unknown, unknown, { evaluationId?: number, userId?: number }>,
  res: Response,
): Promise<void> => {
  const evaluationId = req.query.evaluationId ? Number(req.query.evaluationId) : undefined;
  const userId = req.query.userId ? Number(req.query.userId) : undefined;

  try {
    if (evaluationId) {
      const evalRecord = await prisma.evaluation.findUnique({
        include: {
          student: true,
          supervisor: true,
        },
        where: { id: evaluationId },
      });

      if (!evalRecord) {
        res.status(404).json({ error: `Evaluation not found` });
        return;
      }

      if (evalRecord.studentId !== userId || evalRecord.supervisorId !== userId) {
        res.status(404).json({ error: `Access Forbidden` });
        return;
      }

      res.status(200).json(evalRecord);
      return;
    }

    if (userId) {
      const evaluations = await prisma.evaluation.findMany({
        where: { studentId: userId },
      });

      if (!evaluations) {
        res.status(404).json({ error: `evaluation records not found` });
      }

      res.status(200).json(evaluations);
      return;
    }

    res.status(400).json({ error: `Provide either evaluationId or userId as query param` });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Get evaluation error:`, error);
    res.status(500).json({ error: `Internal server error` });
  }
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
      // eslint-disable-next-line no-console
      console.error(`Get self evaluation status error:`, error);
      res.status(500).json({ error: `Internal server error` });
    }
  },
);

router.get(`/supervisorEvals`, requireAuth, async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { semester, year } = req.query;
  const supervisorId = req.session.userId;

  if (!supervisorId || !semester || !year) {
    res.status(400).json({ error: `Missing required query parameters: semester, year` });
  }

  try {
    const myStudents = await prisma.user.findMany({
      select: { id: true },
      where: { supervisorId: Number(supervisorId) },
    });

    if (myStudents.length === 0) {
      res.status(200).json({});
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
    // eslint-disable-next-line no-console
    console.error(`Get supervisor evaluation statuses error:`, error);
    res.status(500).json({ error: `Internal server error` });
  }
});

export default router;
