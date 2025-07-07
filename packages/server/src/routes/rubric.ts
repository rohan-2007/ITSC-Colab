import { Request, Response, Router } from 'express';
import { prisma } from '../prisma';
import { limiter } from './auth';

const router = Router();

interface RubricRequestBody {
  addCategory?: boolean;
  addLevel?: boolean;
  categoryId?: number;
  categoryTitle?: string;
  deletedCategory?: number;
  deletedLevel?: number;
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
          where: {
            deletedAt: null,
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
      where: {
        deletedAt: null,
      },
    });
    res.status(200).json(rubricCategories);
  } catch {
    res.status(500).json({ error: `Failed to fetch rubric data` });
  }
});

router.post(`/changeRubric`, limiter, async (req: Request<unknown, unknown, RubricRequestBody>, res: Response) => {
  const {
    addCategory,
    addLevel,
    categoryId,
    categoryTitle,
    deletedCategory,
    deletedLevel,
    description,
    level,
    levelId,
    prevLevel,
    subItem,
    subItemId,
  } = req.body;

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
        data: { name: categoryTitle, title: categoryTitle },
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
  } else if (addLevel) {
    try {
      const categories = await prisma.rubricCategory.findMany();
      const levelData = await prisma.rubricPerformanceLevel.findMany();
      const levels = levelData.filter((l) => l.rubricCategoryId === 1).length;

      let newLevel: any = null;

      for (const category of categories) {
        const created = await prisma.rubricPerformanceLevel.create({
          data: {
            id: category.id * 100 + levels + 1,
            description: ``,
            level: ``,
            rubricCategoryId: category.id,
          },
        });

        if (category.id === categories[0].id) {
          newLevel = created;
        }
      }

      res.status(200).json(newLevel);
      return;
    } catch (error) {
      res.status(500).json({ error, message: `Internal Server Error` });
      return;
    }
  } else if (deletedLevel) {
    try {
      const levelNumber = deletedLevel % 10;
      const time = new Date();

      await prisma.$executeRaw`
        UPDATE "perf_review"."rubricPerformanceLevel"
        SET "deletedAt" = ${ time }
        WHERE "id" % 10 = ${ levelNumber };
      `;

      res.status(200).json({ message: `deleted level successfully` });
      return;
    } catch (error) {
      res.status(500).json({ error, message: `Internal Server Error` });
      return;
    }
  } else if (addCategory) {
    try {
      const existingCategories = await prisma.rubricCategory.findMany();
      const newCategory = await prisma.rubricCategory.create({
        data: {
          displayOrder: existingCategories.length + 1,
          name: `new`,
          title: ``,
        },
      });

      const existingLevels = await prisma.rubricPerformanceLevel.findMany({
        select: { level: true },
        where: {
          deletedAt: null,
          rubricCategoryId: 1,
        },
      });

      await Promise.all(existingLevels.map((lvl, i) =>
        prisma.rubricPerformanceLevel.create({
          data: {
            id: newCategory.id * 100 + (i + 1),
            description: ``,
            level: lvl.level,
            rubricCategoryId: newCategory.id,
          },
        })));

      const fullCategory = await prisma.rubricCategory.findUnique({
        include: { levels: true },
        where: { id: newCategory.id },
      });

      res.status(200).json(fullCategory);
      return;
    } catch (err) {
      res.status(500).json({ err, message: `Failed to create rubric category` });
    }
    return;
  } else if (deletedCategory) {
    try {
      const time = new Date();

      await prisma.$executeRaw`
        UPDATE "perf_review"."rubricCategory"
        SET "deletedAt" = ${ time }
        WHERE "id" = ${ deletedCategory };
      `;

      res.status(200).json({ message: `deleted category successfully` });
      return;
    } catch (error) {
      res.status(500).json({ error, message: `Internal Server Error` });
      return;
    }
  }

  res.status(400).json({ error: `Invalid request` });
});

export default router;
