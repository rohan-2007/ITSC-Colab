import fs from 'fs';
import path from 'path';
import { prisma } from './prisma';

interface PerformanceLevel {
  description: string;
  level: string;
}

interface RubricSeedData {
  displayOrder: number;
  name: string;
  performanceLevels: PerformanceLevel[];
  subItems: string[];
  title: string;
}

export const seedRubricData = async (): Promise<void> => {
  try {
    const rubricPath = path.join(__dirname, `..`, `config`, `default-rubric.json`);
    const rubricFileContent = fs.readFileSync(rubricPath, `utf-8`);
    const rubricData = JSON.parse(rubricFileContent) as RubricSeedData[];

    for (const category of rubricData) {
      await prisma.rubricCategory.deleteMany({
        where: { name: category.name },
      });

      await prisma.rubricCategory.create({
        data: {
          displayOrder: category.displayOrder,
          levels: {
            create: category.performanceLevels.map((level) => ({
              description: level.description,
              level: level.level,
            })),
          },
          name: category.name,
          subItems: category.subItems,
          subSkills: {
            create: category.subItems.map((item) => ({
              name: item,
            })),
          },
          title: category.title,
        },
      });
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Failed to synchronize rubric data:`, error);
    process.exit(1);
  }
};
