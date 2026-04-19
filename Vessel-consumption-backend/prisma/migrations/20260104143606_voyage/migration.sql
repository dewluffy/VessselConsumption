-- CreateTable
CREATE TABLE `Voyage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vesselId` INTEGER NOT NULL,
    `voyNo` VARCHAR(191) NOT NULL,
    `startAt` DATETIME(3) NOT NULL,
    `endAt` DATETIME(3) NULL,
    `status` ENUM('OPEN', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Voyage_vesselId_idx`(`vesselId`),
    UNIQUE INDEX `Voyage_vesselId_voyNo_key`(`vesselId`, `voyNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Voyage` ADD CONSTRAINT `Voyage_vesselId_fkey` FOREIGN KEY (`vesselId`) REFERENCES `Vessel`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
