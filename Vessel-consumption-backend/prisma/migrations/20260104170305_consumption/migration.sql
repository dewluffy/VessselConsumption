-- CreateTable
CREATE TABLE `Consumption` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `activityId` INTEGER NOT NULL,
    `category` ENUM('FUEL', 'LUBE', 'WATER', 'OTHER') NOT NULL,
    `itemName` VARCHAR(100) NOT NULL,
    `quantity` DECIMAL(14, 3) NOT NULL,
    `unit` ENUM('LITER', 'KG', 'TON', 'KWH', 'OTHER') NOT NULL,
    `source` ENUM('MANUAL', 'CALCULATED') NOT NULL DEFAULT 'MANUAL',
    `remark` VARCHAR(500) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdById` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Consumption_activityId_idx`(`activityId`),
    INDEX `Consumption_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Consumption` ADD CONSTRAINT `Consumption_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Consumption` ADD CONSTRAINT `Consumption_activityId_fkey` FOREIGN KEY (`activityId`) REFERENCES `Activity`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
