-- AlterTable
ALTER TABLE `fuelbunkerevent` MODIFY `amount` DECIMAL(14, 2) NOT NULL;

-- AlterTable
ALTER TABLE `fuelrob` MODIFY `openingRob` DECIMAL(14, 2) NOT NULL,
    MODIFY `closingRob` DECIMAL(14, 2) NOT NULL;

-- AddForeignKey
ALTER TABLE `Consumption` ADD CONSTRAINT `Consumption_activityId_fkey` FOREIGN KEY (`activityId`) REFERENCES `Activity`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
