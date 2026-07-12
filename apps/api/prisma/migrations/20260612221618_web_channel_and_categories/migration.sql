-- AlterEnum
ALTER TYPE "Channel" ADD VALUE 'WEB';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProductCategory" ADD VALUE 'SWEATER';
ALTER TYPE "ProductCategory" ADD VALUE 'CAP';
ALTER TYPE "ProductCategory" ADD VALUE 'PEN';
ALTER TYPE "ProductCategory" ADD VALUE 'SPORTSWEAR';
