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

      let existingCategory;
      try {
        existingCategory = await prisma.rubricCategory.findUnique({
          include: {
            levels: true,
            subItems: true,
          },
          where: { name: category.name },
        });
      } catch {
        return;
      }

      // If no data or data is empty, use local contents
      if (
        !existingCategory ||
        !existingCategory.levels?.length ||
        !existingCategory.subItems?.length
      ) {
        try {
          // Upsert category from local file
          await prisma.rubricCategory.upsert({
            create: {
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
            update: {
              displayOrder: category.displayOrder,
              title: category.title,
            },
            where: { name: category.name },
          });
        } catch {
          return;
        }
      } else {
        // Otherwise, replace local contents with database
        try {
          // Overwrite local file with database data
          const dbCategory = await prisma.rubricCategory.findUnique({
            include: {
              levels: true,
              subItems: true,
            },
            where: { name: category.name },
          });
          if (dbCategory) {
            rubricData[i] = {
              displayOrder: dbCategory.displayOrder,
              name: dbCategory.name,
              performanceLevels: dbCategory.levels.map((l) => ({
                description: l.description,
                level: l.level,
              })),
              subItems: dbCategory.subItems.map((s) => s.name),
              title: dbCategory.title,
            };
            try {
              fs.writeFileSync(rubricPath, JSON.stringify(rubricData, null, 2), `utf-8`);
            } catch {
              return;
            }
          }
        } catch {
          return;
        }
      }
    }

    try {
      await prisma.$executeRaw`
        SELECT setval(
          pg_get_serial_sequence('"perf_review"."evaluation"', 'id'),
          (SELECT MAX(id) FROM "perf_review"."evaluation")
        )
      `;
    } catch {
      return;
    }
  } catch {
    process.exit(1);
  }
};
