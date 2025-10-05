/*
  Warnings:

  - Changed the type of `roomId` on the `Stroke` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "public"."Stroke" ADD COLUMN     "endX" DOUBLE PRECISION,
ADD COLUMN     "endY" DOUBLE PRECISION,
ADD COLUMN     "tool" TEXT,
DROP COLUMN "roomId",
ADD COLUMN     "roomId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Stroke" ADD CONSTRAINT "Stroke_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
