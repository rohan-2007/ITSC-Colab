import { Request, Response, Router } from 'express';
import { JsonObject } from '@prisma/client/runtime/library';
import { User as _PrismaUser, Stage, User } from '../../../../generated/prisma';
import prisma from '../prisma';

const router = Router();

interface EvaluationBody {
  id: number;
  criteria: JsonObject; // or use Record<string, any> for stricter typing
  semester: string;
  stage: Stage;
  user: User;
  userId: number;
}

router.post(`/submitEval`, async (req: Request<unknown, unknown, EvaluationBody>, res: Response) => {
  const { criteria, semester, stage, userId } = req.body;
  // console.log(userId, semester, stage);
  // try{
  const newEval = await prisma.evaluation.create({
    data: {
      criteria,
      semester,
      stage,
      // user: null,
      userId,
    },
  });

  // console.log(newEval);

  res.status(201).json({
    eval: { id: newEval.id },
    message: `Eval created`,
  });
  // }
  // catch(err){
  //   console.error(`Signup error:`, err);
  //   if (!res.headersSent) {
  //     res.status(500).json({ error: `Internal server error` });
  //   }
  // }
});
