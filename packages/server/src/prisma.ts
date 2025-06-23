// This file is a Prisma singleton. Use this to reference Prisma.
import { PrismaClient } from '../../../generated/prisma';
// import { PrismaClient as PrismaClientGitreports } from '../../../generated/prisma';

export const prisma = new PrismaClient();
// export const prismaGit = new PrismaClientGitreports();

export default prisma;
