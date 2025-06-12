import { Request, Response, Router } from 'express';
import { JsonObject } from '@prisma/client/runtime/library';
import { Role, Semester } from '../../../../generated/prisma';
import prisma from '../prisma';
import { requireAuth } from './auth';

const router = Router();

interface EvaluationBody {
  criteria: JsonObject;
  evaluationType: keyof typeof Role;
  semester: keyof typeof Semester;
  studentId: number;
  supervisorId?: number;
  year: number;
}

router.post(`/submitEval`, requireAuth, async (
  req: Request<unknown, unknown, EvaluationBody>,
  res: Response,
): Promise<void> => {
  try {
    const { criteria, evaluationType, semester, studentId, supervisorId, year } = req.body;
    const user = await prisma.user.findUnique({
      where: { id: studentId },
    });

    if (!user) {
      res.status(404).json({ error: `User not found` });
      return;
    }

    if (Number(req.session.userId) !== studentId && Number(req.session.userId) !== supervisorId) {
      res.status(404).json({ error: `You cannot submit an evaluation you are not part of! ` });
    }

    const newEval = await prisma.evaluation.create({
      data: {
        criteria,
        semester,
        studentId,
        supervisorId: supervisorId || null,
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
  // console.log(`in getEval`);
  // const { evaluationId, userId } = req.query;
  const evaluationId = req.query.evaluationId ? Number(req.query.evaluationId) : undefined;
  const userId = req.query.userId ? Number(req.query.userId) : undefined;

  // console.log(`${ evaluationId } ${ userId }`);

  try {
    if (evaluationId) {
      // console.log(`evaluationId`);
      const evalRecord = await prisma.evaluation.findUnique({
        where: { id: evaluationId },
      });

      if (!evalRecord) {
        res.status(404).json({ error: `Evaluation not found` });
        return;
      }

      // Authorization check, supervisor or user can access
      if (evalRecord.studentId !== userId || evalRecord.supervisorId !== userId) {
        res.status(404).json({ error: `Access Forbidden` });
        return;
      }

      res.status(200).json(evalRecord);
      return;
    }

    if (userId) {
      // console.log(`in userId${ userId }`);
      const evaluations = await prisma.evaluation.findMany({
        // orderBy: { createdAt: `desc` },
        where: { studentId: userId },
      });

      // console.log(`evals: ${ JSON.stringify(evaluations) }`);
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

export default router;
