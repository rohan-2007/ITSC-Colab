import { Request, Response, Router } from 'express';
import { prisma } from '../prisma';
import limiter from './auth';

const router = Router();

interface RequestBody {
  username: string;
}

router.post(`/gitData`, limiter, async (
  req: Request<unknown, unknown, RequestBody>,
  res: Response,
) => {
  const { username } = req.body;

  if (!username) {
    res.status(400).json({ message: `No username provided` });
    return;
  }

  const data = await prisma.contributions.findMany({
    where: {
      user_login: username,
    },
  });

  res.status(200).json({ data, message: `Fetched git data` });
  return;
});

export default router;
