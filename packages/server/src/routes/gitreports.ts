import { Request, Response, Router } from 'express';
// import { User as PrismaUser } from '../../../../generated/prisma';
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

  const data = await prisma.contributions.findMany({
    where: {
      user_login: {
        contains: username,
      },
    },
  });
});

export default router;
