import { Request, Response, Router } from 'express';
import { JsonObject } from '@prisma/client/runtime/library';
import { Stage } from '../../../../generated/prisma';
import prisma from '../prisma';

const router = Router();

interface EvaluationBody {
  id?: number;
  criteria: JsonObject;
  semester: string;
  stage: Stage;
  supervisorId: number;
  userId: number;
}

router.post(`/submitEval`, async (
  req: Request<unknown, unknown, EvaluationBody>,
  res: Response,
): Promise<void> => {
  try {
    const { criteria, semester, stage, userId } = req.body;

    const user = await prisma.user.findUnique({
      include: { supervisor: true },
      where: { id: userId },
    });

    if (!user || !user.supervisor) {
      res.status(404).json({ error: `User or supervisor not found` });
      return;
    }

    const newEval = await prisma.evaluation.create({
      data: {
        criteria,
        semester,
        stage,
        supervisor: { connect: { id: user.supervisor.id } },
        user: { connect: { id: user.id } },
      },
    }) as {
      id: number;
      createdAt: Date;
      semester: string;
      stage: Stage;
      supervisorId: number;
      userId: number;
    };

    res.status(201).json({
      eval: {
        id: newEval.id,
        createdAt: newEval.createdAt,
        semester: newEval.semester,
        stage: newEval.stage,
        supervisorId: newEval.supervisorId,
        userId: newEval.userId,
      },
      message: `Evaluation submitted successfully`,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Submit evaluation error:`, error);
    res.status(500).json({ error: `Internal server error` });
  }
});

router.get(`/getEval`, async (
  req: Request<unknown, unknown, unknown, { evaluationId?: string, userId?: string }>,
  res: Response,
): Promise<void> => {
  const { evaluationId, userId } = req.query;

  try {
    if (evaluationId) {
      const evalRecord = await prisma.evaluation.findUnique({
        include: { supervisor: true, user: true },
        where: { id: parseInt(evaluationId, 10) },
      });

      if (!evalRecord) {
        res.status(404).json({ error: `Evaluation not found` });
        return;
      }

      res.status(200).json(evalRecord);
      return;
    }

    if (userId) {
      const evaluations = await prisma.evaluation.findMany({
        include: { supervisor: true, user: true },
        orderBy: { createdAt: `desc` },
        where: { userId: parseInt(userId) },
      });
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

export default router;
