/*
  Warnings:

  - You are about to drop the column `semesterId` on the `Evaluation` table. All the data in the column will be lost.
  - You are about to drop the column `roleId` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `Semester` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `role` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `semester` to the `Evaluation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role` to the `user` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Semester" AS ENUM ('SPRING', 'SUMMER', 'FALL');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPERVISOR', 'STUDENT');

-- AlterTable
ALTER TABLE "Evaluation" DROP COLUMN "semesterId",
ADD COLUMN     "semester" "Semester" NOT NULL;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "memberIDs" INTEGER[];

-- AlterTable
ALTER TABLE "user" DROP COLUMN "roleId",
ADD COLUMN     "role" "Role" NOT NULL;

-- DropTable
DROP TABLE "Semester";

-- DropTable
DROP TABLE "role";
