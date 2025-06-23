import { Request, Response, Router } from 'express';
import { prisma } from '../prisma';

const router = Router();
router.get(`/rubric`, async (req: Request, res: Response): Promise<void> => {
  try {
    const rubricCategories = await prisma.rubricCategory.findMany({
      include: {
        levels: true, // Include the related performance levels
        subSkills: true, // Include the related sub-skills
      },
      orderBy: {
        displayOrder: `asc`, // Order categories by the specified display order
      },
    });
    res.status(200).json(rubricCategories);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error fetching rubric data:`, error);
    res.status(500).json({ error: `Internal server error` });
  }
});

export default router;
