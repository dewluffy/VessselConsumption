-- CreateTable
CREATE TABLE `VesselAssignment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `vesselId` INTEGER NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `VesselAssignment_userId_idx`(`userId`),
    INDEX `VesselAssignment_vesselId_idx`(`vesselId`),
    UNIQUE INDEX `VesselAssignment_userId_vesselId_key`(`userId`, `vesselId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `VesselAssignment` ADD CONSTRAINT `VesselAssignment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VesselAssignment` ADD CONSTRAINT `VesselAssignment_vesselId_fkey` FOREIGN KEY (`vesselId`) REFERENCES `Vessel`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
