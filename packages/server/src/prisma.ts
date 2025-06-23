// This file is a Prisma singleton. Use this to reference Prisma.
import { PrismaClient as PrismaClientMain } from '../../../generated/prisma';
import { PrismaClient as PrismaClientGitreports } from '../../../generated/prisma';

export const prisma = new PrismaClientMain();
export const prismaGit = new PrismaClientGitreports();

export default prisma;
