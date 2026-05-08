/*
  Warnings:

  - The values [ADMIN,OPERATOR] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[gpsDeviceId]` on the table `Vehicle` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `collegeId` to the `Route` table without a default value. This is not possible if the table is not empty.
  - Added the required column `collegeId` to the `Trip` table without a default value. This is not possible if the table is not empty.
  - Added the required column `collegeId` to the `Vehicle` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'TRANSPORT_ADMIN', 'DRIVER', 'STUDENT', 'PARENT', 'STAFF');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
COMMIT;

-- AlterTable
ALTER TABLE "Route" ADD COLUMN     "collegeId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "collegeId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "collegeId" TEXT;

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "collegeId" TEXT NOT NULL,
ADD COLUMN     "gpsDeviceId" TEXT;

-- CreateTable
CREATE TABLE "College" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "College_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "College_domain_key" ON "College"("domain");

-- CreateIndex
CREATE INDEX "Route_collegeId_idx" ON "Route"("collegeId");

-- CreateIndex
CREATE INDEX "Trip_collegeId_idx" ON "Trip"("collegeId");

-- CreateIndex
CREATE INDEX "User_collegeId_idx" ON "User"("collegeId");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_gpsDeviceId_key" ON "Vehicle"("gpsDeviceId");

-- CreateIndex
CREATE INDEX "Vehicle_collegeId_idx" ON "Vehicle"("collegeId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
