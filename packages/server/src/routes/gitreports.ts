import { Request, Response, Router } from 'express';
import { prisma } from '../prisma';

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

  res.status(200).json({ data, message: `Fetched git data` });
  return;
});

export default router;
