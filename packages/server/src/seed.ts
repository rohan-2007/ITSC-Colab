import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();
import { Client as PgClient } from 'pg';
import { prisma } from './prisma';

interface PerformanceLevel {
  description: string;
  level: string;
}

interface ContributionRow {
  id: number;
  contribution_count: number;
  date: string;
  user_login: string;
}

interface RubricSeedData {
  displayOrder: number;
  name: string;
  performanceLevels: PerformanceLevel[];
  subItems: string[];
  title: string;
}

const src = new PgClient({ connectionString: process.env.DATABASE_GITREPORTS_URL });

async function main() {
  await src.connect();
  const { rows } = await src.query(`SELECT * FROM "contributions"`);
  const typedRows = rows as ContributionRow[];
  for (const row of typedRows) {
    await prisma.contributions.upsert({
      create: row,
      update: { contribution_count: row.contribution_count },
      where: { user_login_date: { date: row.date, user_login: row.user_login } },
    });
  }
  await src.end();
}

main().catch(() => {
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});

export const seedRubricData = async (): Promise<void> => {
  try {
    const rubricPath = path.join(__dirname, `..`, `config`, `default-rubric.json`);
    const rubricFileContent = fs.readFileSync(rubricPath, `utf-8`);
    const rubricData = JSON.parse(rubricFileContent) as RubricSeedData[];

    for (let i = 0; i < rubricData.length; i += 1) {
      const category = rubricData[i];
      const categoryId = i + 1;

      const existingCategory = await prisma.rubricCategory.findUnique({
        include: {
          levels: true,
          subItems: true,
        },
        where: { name: category.name },
      });

      if (!existingCategory) {
        await prisma.rubricCategory.create({
          data: {
            id: categoryId,
            displayOrder: category.displayOrder,
            levels: {
              create: category.performanceLevels.map((level, idx) => ({
                id: (categoryId * 100) + (idx + 1),
                description: level.description,
                level: level.level,
              })),
            },
            name: category.name,
            subItems: {
              create: category.subItems.map((item, idx) => ({
                id: (categoryId * 100) + (idx + 1),
                name: item,
              })),
            },
            title: category.title,
          },
        });
      } else {
        if (existingCategory.id !== categoryId) {
          await prisma.rubricCategory.update({
            data: { id: categoryId },
            where: { id: existingCategory.id },
          });
        }

        for (let levelIdx = 0; levelIdx < category.performanceLevels.length; levelIdx += 1) {
          const level = category.performanceLevels[levelIdx];
          const levelId = (categoryId * 100) + (levelIdx + 1);
          const existingLevel = existingCategory.levels.find(
            (l) => l.level === level.level && l.description === level.description,
          );

          if (!existingLevel) {
            await prisma.rubricPerformanceLevel.create({
              data: {
                id: levelId,
                description: level.description,
                level: level.level,
                rubricCategoryId: categoryId,
              },
            });
          } else if (existingLevel.id !== levelId) {
            await prisma.rubricPerformanceLevel.update({
              data: { id: levelId },
              where: { id: existingLevel.id },
            });
          }
        }

        for (let subIdx = 0; subIdx < category.subItems.length; subIdx += 1) {
          const item = category.subItems[subIdx];
          const itemId = (categoryId * 100) + (subIdx + 1);
          const existingSub = existingCategory.subItems.find((s) => s.name === item);

          if (!existingSub) {
            await prisma.rubricSubItem.create({
              data: {
                id: itemId,
                name: item,
                rubricCategoryId: categoryId,
              },
            });
          } else if (existingSub.id !== itemId) {
            await prisma.rubricSubItem.update({
              data: { id: itemId },
              where: { id: existingSub.id },
            });
          }
        }
      }
    }

    await prisma.$executeRaw`
  SELECT setval(
    pg_get_serial_sequence('"perf_review"."evaluation"', 'id'),
    (SELECT MAX(id) FROM "perf_review"."evaluation")
  )
`;
  } catch {
    process.exit(1);
  }
};
