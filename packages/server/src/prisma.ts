// This file is a Prisma singleton. Use this to reference Prisma.
import { PrismaClient } from '../../../generated/prisma';

export const prisma = new PrismaClient();

export default prisma;
