import { Request, Response, Router } from 'express';
import { prisma } from '../prisma';
import { limiter } from './auth';

const router = Router();

interface RubricRequestBody {
  categoryId?: number;
  categoryTitle?: string;
  description?: string;
  level?: string;
  levelId?: number;
  prevLevel?: string;
  subItem?: string;
  subItemId?: number;
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
  const { categoryId, categoryTitle, description, level, levelId, prevLevel, subItem, subItemId } = req.body;

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
  } else if (categoryTitle) {
    try {
      const updatedCategoryName = await prisma.rubricCategory.update({
        data: { title: categoryTitle },
        where: { id: categoryId },
      });

      res.status(200).json({ message: `updated category name`, updatedCategoryName });
      return;
    } catch {
      res.status(500).json({ error: `Internal Server Error` });
      return;
    }
  } else if (subItem && subItemId) {
    try {
      const updatedSubItemName = await prisma.rubricSubItem.update({
        data: { name: subItem },
        where: { id: subItemId },
      });

      res.status(200).json({ message: `updated subItem name`, updatedSubItemName });
      return;
    } catch {
      res.status(500).json({ error: `Internal Server Error` });
      return;
    }
  }
});

export default router;
