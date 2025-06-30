/*
  Warnings:

  - You are about to drop the column `semester` on the `Evaluation` table. All the data in the column will be lost.
  - You are about to drop the column `stage` on the `Evaluation` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `user` table. All the data in the column will be lost.
  - Added the required column `semesterId` to the `Evaluation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supervisorId` to the `Evaluation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Evaluation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Team` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roleId` to the `user` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `user` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Evaluation" DROP CONSTRAINT "Evaluation_userId_fkey";

-- DropForeignKey
ALTER TABLE "user" DROP CONSTRAINT "user_supervisorId_fkey";

-- DropForeignKey
ALTER TABLE "user" DROP CONSTRAINT "user_teamId_fkey";

-- AlterTable
ALTER TABLE "Evaluation" DROP COLUMN "semester",
DROP COLUMN "stage",
ADD COLUMN     "semesterId" INTEGER NOT NULL,
ADD COLUMN     "supervisorId" INTEGER NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'SELF',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "user" DROP COLUMN "role",
ADD COLUMN     "roleId" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropEnum
DROP TYPE "Role";

-- DropEnum
DROP TYPE "Stage";

-- CreateTable
CREATE TABLE "Semester" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Semester_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Semester_name_key" ON "Semester"("name");

-- CreateIndex
CREATE UNIQUE INDEX "role_name_key" ON "role"("name");
