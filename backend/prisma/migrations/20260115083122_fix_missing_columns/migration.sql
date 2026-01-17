-- CreateEnum
CREATE TYPE "DefaultView" AS ENUM ('LIST', 'BOARD');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "isTimeBased" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reminders" JSONB;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "defaultView" "DefaultView" NOT NULL DEFAULT 'LIST';
