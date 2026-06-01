/*
  Warnings:

  - Added the required column `productId` to the `ActiveCartItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ActiveCartItem" ADD COLUMN     "productId" TEXT NOT NULL;
