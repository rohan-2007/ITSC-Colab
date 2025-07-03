import { Request, Response, Router } from 'express';
import { prisma } from '../prisma';
import { limiter } from './auth';

const router = Router();

interface RubricRequestBody {
  categoryId?: number;
  description?: string;
  level?: string;
  levelId?: number;
  prevLevel?: string;
}

router.get(`/rubric`, limiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const rubricCategories = await prisma.rubricCategory.findMany({
      include: {
        levels: {
          select: {
            id: true,
            description: true,
            level: true,
          },
        },
        subItems: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        displayOrder: `asc`,
      },
    });
    res.status(200).json(rubricCategories);
  } catch {
    res.status(500).json({ error: `Failed to fetch rubric data` });
  }
});

router.post(`/changeRubric`, limiter, async (req: Request<unknown, unknown, RubricRequestBody>, res: Response) => {
  const { categoryId, description, level, levelId, prevLevel } = req.body;

  if (description && categoryId && levelId) {
    try {
      const updatedLevel = await prisma.rubricPerformanceLevel.update({
        data: { description },
        where: { id: levelId, rubricCategoryId: categoryId },
      });

      res.status(200).json({ message: `updated description`, updatedLevel });
      return;
    } catch {
      res.status(500).json({ error: `Internal Server Error` });
      return;
    }
  } else if (level) {
    try {
      const updatedLevel = await prisma.rubricPerformanceLevel.updateMany({
        data: { level },
        where: { level: prevLevel },
      });

      res.status(200).json({ message: `updated level name`, updatedLevel });
      return;
    } catch {
      res.status(500).json({ error: `Internal Server Error` });
      return;
    }
  }
});

export default router;
