import { Request, Response, Router } from 'express';
import { JsonObject } from '@prisma/client/runtime/library';
import { Role, Semester } from '../../../../generated/prisma';
import prisma from '../prisma';
import { requireAuth } from './auth';
import { json } from 'stream/consumers';

const router = Router();

interface EvaluationBody {
  criteria: JsonObject;
  evaluationType: keyof typeof Role;
  semester: keyof typeof Semester;
  supervisorId?: number;
  userId: number;
}

router.post(`/submitEval`, requireAuth, async (
  req: Request<unknown, unknown, EvaluationBody>,
  res: Response,
): Promise<void> => {
  try {
    const { criteria, evaluationType, semester, supervisorId, userId } = req.body;
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ error: `User not found` });
      return;
    }

    const newEval = await prisma.evaluation.create({
      data: {
        criteria,
        semester,
        supervisorId: supervisorId || null,
        type: evaluationType,
        userId,
      },
    });

    res.status(201).json({
      eval: {
        id: newEval.id,
        createdAt: newEval.createdAt,
        semester,
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

router.get(`/getEval`, requireAuth, async (
  req: Request<unknown, unknown, unknown, { evaluationId?: number, userId?: number }>,
  res: Response,
): Promise<void> => {

  console.log("in getEval");
  const { evaluationId, userId } = req.query;
  console.log(evaluationId + " " + userId);

  try {
    if (evaluationId) {
      console.log("evaluationId");
      const evalRecord = await prisma.evaluation.findUnique({
        where: { id: evaluationId },
      });

      if (!evalRecord) {
        res.status(404).json({ error: `Evaluation not found` });
        return;
      }

      // Authorization check, supervisor or user can access
      if (evalRecord.userId !== userId || evalRecord.supervisorId !== userId) {
        res.status(404).json({ error: `Access Forbidden` });
        return;
      }

      res.status(200).json(evalRecord);
      return;
    }

    if (userId) {
      console.log("in userId" + userId);
      const evaluations = await prisma.evaluation.findMany({
        orderBy: { createdAt: 'desc' },
        where: { userId:Number(userId) },
      });

      console.log(`evals: ` + evaluations);
      if(!evaluations){
        res.status(404).json({ error: `evaluation records not found`});
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

export default router;
