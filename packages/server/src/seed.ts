// /* THIS FILE AUTO GENERATES THE RUBRIC DATABASE BASED OFF
// OF THE CONFIG/DEFAULT-RUBRIC.JSON
// PLEASE UPDATE, it is wrong
// */

// // /prisma/seed.ts
// import fs from 'fs';
// import path from 'path';
// import { prisma } from './prisma';

// interface PerformanceLevel {
//   description: string;
//   level: string;
// }

// interface RubricSeedData {
//   displayOrder: number;
//   name: string;
//   performanceLevels: PerformanceLevel[];
//   subItems: string[];
//   title: string;
// }

// export const seedRubricData = async (): Promise<void> => {
//   try {
//     const rubricPath = path.join(__dirname, `..`, `config`, `default-rubric.json`);
//     const rubricFileContent = fs.readFileSync(rubricPath, `utf-8`);
//     const rubricData = JSON.parse(rubricFileContent) as RubricSeedData[];
//     for (const category of rubricData) {
//       // Using a transaction to ensure that deleting and creating happens together.
//       // The `onDelete: Cascade` in your schema will automatically remove old
//       // subItems and performanceLevels when the parent category is deleted.
//       await prisma.$transaction(async (tx) => {
//         await tx.rubricCategory.deleteMany({
//           where: { name: category.name },
//         });

//         await tx.rubricCategory.create({
//           data: {
//             displayOrder: category.displayOrder,
//             // UPDATED: Create related RubricPerformanceLevel records using the 'levels' relation
//             levels: {
//               create: category.performanceLevels.map((level) => ({
//                 description: level.description,
//                 level: level.level,
//               })),
//             },
//             name: category.name,
//             // UPDATED: Create related RubricSubItem records using the 'subItems' relation
//             subItems: {
//               create: category.subItems.map((itemName) => ({
//                 name: itemName,
//               })),
//             },
//             title: category.title,
//           },
//         });
//       });
//     }
//   } catch (error) {
//     // eslint-disable-next-line no-console
//     console.error(`Failed to synchronize rubric data:`, error);
//     process.exit(1);
//   }
// };
