import fs from 'fs';
import path from 'path';
import { prisma } from './prisma';

interface RubricSeedData {
  descriptionCompetitive: string;
  descriptionInProgress: string;
  descriptionStarting: string;
  displayOrder: number;
  name: string;
  subItems: string[];
  title: string;
}

export const seedRubricData = async (): Promise<void> => {
  try {
    const count = await prisma.rubricCategory.count();
    if (count > 0) {
      // eslint-disable-next-line no-console
      console.log(`Rubric data already exists. Skipping seed.`);
      return;
    }

    // eslint-disable-next-line no-console
    console.log(`No rubric data found. Seeding from default-rubric.json...`);
    const rubricPath = path.join(__dirname, `..`, `config`, `default-rubric.json`);
    const rubricFileContent = fs.readFileSync(rubricPath, `utf-8`);
    const rubricData = JSON.parse(rubricFileContent) as RubricSeedData[];
    await prisma.$transaction(
      rubricData.map((category) => prisma.rubricCategory.create({ data: category })),
    );

    // eslint-disable-next-line no-console
    console.log(`Rubric data seeded successfully.`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Failed to seed rubric data:`, error);
    process.exit(1);
  }
};
