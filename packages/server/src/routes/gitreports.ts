import { Request, Response, Router } from 'express';
// import { User as PrismaUser } from '../../../../generated/prisma';
import { Contribution } from '@prisma/client';
import { prisma } from '../prisma';
// import Contribution from '../../../client/src/pages/PastEvaluations';

const router = Router();

interface RequestBody {
  username: string;
}

router.post(`/gitData`, async (
  req: Request<unknown, unknown, RequestBody>,
  res: Response,
) => {
  const { username } = req.body;

  const data: Contribution[] = await prisma.contributions.findMany({
    where: {
      user_login: {
        contains: username,
      },
    },
  });

  res.status(200).json({ data, message: `Fetched git data` });
  return;
});

export default router;
