import { Request, Response, Router } from 'express';
import { prismaGit } from '../prisma';

const router = Router();

interface RequestBody {
  username: string;
}

router.post(`/gitData`, async (
  req: Request<unknown, unknown, RequestBody>,
  res: Response,
) => {
  const request = req.body;

  // contributions: Contributions[] - findMany returns an array of Contributions
  const contributions = await prismaGit.contributions.findMany({
    where: { user_login: request.username },
  });

  res.status(200).json({
    contributions,
    message: `Fetched git contributions`,
  });
});

export default router;
