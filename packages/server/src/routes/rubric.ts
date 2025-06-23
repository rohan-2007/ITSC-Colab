import { Router } from 'express';
import { prisma } from '../prisma';
import type { RubricCategory } from '../../../../generated/prisma';

const router = Router();
router.get(`/rubric/`, async (req, res) => {
  try {
    const rubricCategories: RubricCategory[] | null = await prisma.rubricCategory.findMany({
      orderBy: {
        displayOrder: `asc`,
      },
    });
    res.status(200).json(rubricCategories);
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error(`Failed to fetch rubric data:`, error);
    res.status(500).json({ error: `Internal server error while fetching rubric.` });
  }
});

export default router;
