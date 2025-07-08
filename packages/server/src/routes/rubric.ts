import { Request, Response, Router } from 'express';
import { prisma } from '../prisma';
import { limiter } from './auth';

const router = Router();

interface RubricRequestBody {
  addCategory?: boolean;
  addLevel?: boolean;
  addSubItem?: boolean;
  categoryId?: number;
  categoryTitle?: string;
  deletedCategory?: number;
  deletedLevel?: number;
  deletedSubItem?: number;
  description?: string;
  level?: string;
  levelId?: number;
  prevLevel?: string;
  reorderedLevelIds?: number[];
  subItem?: string;
  subItemId?: number;
}

router.get(`/rubric`, limiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const rubricCategories = await prisma.rubricCategory.findMany({
      include: {
        levels: {
          orderBy: {
            displayOrder: `asc`,
          },
          select: {
            id: true,
            description: true,
            displayOrder: true,
            level: true,
          },
          where: {
            deletedAt: null,
          },
        },
        subItems: {
          orderBy: {
            id: `asc`,
          },
          select: {
            id: true,
            name: true,
          },
          where: {
            deletedAt: null,
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

router.post(`/changeRubric`, limiter, async (req:
Request<unknown, unknown, RubricRequestBody>, res: Response): Promise<void> => {
  const {
    addCategory,
    addLevel,
    addSubItem,
    categoryId,
    categoryTitle,
    deletedLevel,
    deletedSubItem,
    description,
    level,
    levelId,
    prevLevel,
    reorderedLevelIds,
    subItem,
    subItemId,
  } = req.body;

  try {
    if (description && categoryId && levelId) {
      const updatedLevel = await prisma.rubricPerformanceLevel.update({
        data: { description },
        where: { id: levelId, rubricCategoryId: categoryId },
      });
      res.status(200).json({ message: `updated description`, updatedLevel });
      return;
    }

    if (level && prevLevel) {
      await prisma.rubricPerformanceLevel.updateMany({
        data: { level },
        where: { level: prevLevel },
      });
      res.status(200).json({ message: `updated level name` });
      return;
    }

    if (categoryTitle && categoryId) {
      const updatedCategoryName = await prisma.rubricCategory.update({
        data: { name: categoryTitle, title: categoryTitle },
        where: { id: categoryId },
      });
      res.status(200).json({ message: `updated category name`, updatedCategoryName });
      return;
    }

    if (subItem && subItemId) {
      const updatedSubItemName = await prisma.rubricSubItem.update({
        data: { name: subItem },
        where: { id: subItemId },
      });
      res.status(200).json({ message: `updated subItem name`, updatedSubItemName });
      return;
    }

    if (reorderedLevelIds && Array.isArray(reorderedLevelIds)) {
      const reorderedLevels = await prisma.rubricPerformanceLevel.findMany({
        select: { id: true, level: true },
        where: { id: { in: reorderedLevelIds } },
      });
      const idToLevelMap = new Map(reorderedLevels.map((l) => [ l.id, l.level ]));

      const updateOperations = reorderedLevelIds.map((id, index) => {
        const levelName = idToLevelMap.get(id);
        if (!levelName) {
          throw new Error(`Could not find level for id ${ id }`);
        }
        return prisma.rubricPerformanceLevel.updateMany({
          data: { displayOrder: index },
          where: { level: levelName },
        });
      });

      await prisma.$transaction(updateOperations);
      res.status(200).json({ message: `Level order updated successfully.` });
      return;
    }

    if (addLevel) {
      const categories = await prisma.rubricCategory.findMany({ where: { deletedAt: null } });
      if (categories.length === 0) {
        res.status(400).json({ message: `Cannot add a level without any categories.` });
        return;
      }

      const highestOrderLevel = await prisma.rubricPerformanceLevel.findFirst({
        orderBy: { displayOrder: `desc` },
        select: { displayOrder: true },
        where: { deletedAt: null, rubricCategoryId: categories[0].id },
      });
      const newDisplayOrder: number = Number(highestOrderLevel?.displayOrder ?? -1) + 1;

      const levelName = `New Level ${ newDisplayOrder + 1 }`;
      const createPromises = categories.map((cat) =>
        prisma.rubricPerformanceLevel.create({
          data: {
            description: ``,
            displayOrder: newDisplayOrder,
            level: levelName,
            rubricCategoryId: cat.id,
          },
        }));
      await Promise.all(createPromises);
      res.status(201).json({ message: `New level created` });
      return;
    }

    if (deletedLevel) {
      const levelToDelete = await prisma.rubricPerformanceLevel.findUnique({
        where: { id: deletedLevel },
      });
      if (!levelToDelete) {
        res.status(404).json({ message: `Level to delete not found` });
        return;
      }
      await prisma.rubricPerformanceLevel.updateMany({
        data: { deletedAt: new Date() },
        where: { level: levelToDelete.level },
      });
      res.status(200).json({ message: `Deleted level successfully` });
      return;
    }

    if (addCategory) {
      const highestOrderCategory = await prisma.rubricCategory.findFirst({ orderBy: { displayOrder: `desc` } });
      const newDisplayOrder = (highestOrderCategory?.displayOrder ?? -1) + 1;

      const newCategory = await prisma.rubricCategory.create({
        data: {
          displayOrder: newDisplayOrder,
          name: `New Criterion ${ newDisplayOrder + 1 }`,
          title: `New Criterion ${ newDisplayOrder + 1 }`,
        },
      });

      const levelTemplates = await prisma.rubricPerformanceLevel.findMany({
        orderBy: { displayOrder: `asc` },
        select: { displayOrder: true, level: true },
        where: { deletedAt: null, rubricCategoryId: 1 },
      });

      const createPromises = levelTemplates.map((template) =>
        prisma.rubricPerformanceLevel.create({
          data: {
            description: ``,
            displayOrder: Number(template.displayOrder),
            level: template.level,
            rubricCategoryId: newCategory.id,
          },
        }));
      await Promise.all(createPromises);
      res.status(201).json({ message: `Category created successfully` });
      return;
    }

    if (deletedSubItem) {
      await prisma.rubricSubItem.update({
        data: { deletedAt: new Date() },
        where: { id: deletedSubItem },
      });
      res.status(200).json({ message: `Deleted sub-item successfully` });
      return;
    }

    if (addSubItem && categoryId) {
      const newSubItem = await prisma.rubricSubItem.create({
        data: {
          name: `New Sub-Criterion`,
          rubricCategoryId: categoryId,
        },
      });
      res.status(201).json(newSubItem);
      return;
    }

    res.status(400).json({ error: `Invalid request` });
  } catch {
    res.status(500).json({ message: `Internal Server Error` });
  }
});

export default router;
