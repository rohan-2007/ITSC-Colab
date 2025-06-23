import { Request, Response, Router } from 'express';
// import { User as PrismaUser } from '../../../../generated/gitreports';
import { prismaGit } from '../prisma';
import Contribution from '../../../client/src/pages/PastEvaluations';

const router = Router();

interface RequestBody {
  username: string;
}
interface RequestBody {
  username: string;
}

router.post(`/gitData`, async (
  req: Request<unknown, unknown, RequestBody>,
  res: Response,
) => {
  const request: RequestBody = req.body;

  try {
    const contributions = await prismaGit.contributions.findMany({
      where: { user_login: { contains: request.username } },
    });

    if (!contributions) {
      res.status(404).send(`Contributions not found`);
    }

    res.status(200).json({
      contributions,
      message: `Fetched git contributions`,
    });
  } catch (error) {
    console.error(`Git fetch error: `, error);
    if (!res.headersSent) {
      res.status(500).json({ error: `Internal server error` });
    }
  }
});

export default router;
