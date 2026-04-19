/*
  Warnings:

  - You are about to drop the column `containerCount` on the `activity` table. All the data in the column will be lost.
  - You are about to drop the column `generatorCount` on the `activity` table. All the data in the column will be lost.
  - You are about to drop the column `generatorHours` on the `activity` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `activity` DROP COLUMN `containerCount`,
    DROP COLUMN `generatorCount`,
    DROP COLUMN `generatorHours`,
    ADD COLUMN `berth` VARCHAR(10) NULL,
    ADD COLUMN `container20Count` INTEGER NULL,
    ADD COLUMN `container40Count` INTEGER NULL,
    ADD COLUMN `deckgenCount` INTEGER NULL,
    ADD COLUMN `deckgenHours` DECIMAL(10, 2) NULL,
    ADD COLUMN `draftAft` VARCHAR(20) NULL,
    ADD COLUMN `draftFore` VARCHAR(20) NULL,
    ADD COLUMN `generator1Count` INTEGER NULL,
    ADD COLUMN `generator1Hours` DECIMAL(10, 2) NULL,
    ADD COLUMN `generator2Count` INTEGER NULL,
    ADD COLUMN `generator2Hours` DECIMAL(10, 2) NULL;
