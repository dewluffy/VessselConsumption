-- CreateEnum
CREATE TYPE "ConsumptionScope" AS ENUM ('MAIN_ENGINE', 'GENERATOR', 'REEFER', 'AUXILIARY', 'OTHER');

-- CreateEnum
CREATE TYPE "ConsumptionCategory" AS ENUM ('FUEL', 'LUBE', 'WATER', 'OTHER');

-- CreateEnum
CREATE TYPE "ConsumptionUnit" AS ENUM ('LITER', 'KG', 'TON', 'KWH', 'OTHER');

-- CreateEnum
CREATE TYPE "ConsumptionSource" AS ENUM ('MANUAL', 'CALCULATED');

-- CreateEnum
CREATE TYPE "VoyageStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('EMPLOYEE', 'SUPERVISOR', 'MANAGER', 'ADMIN', 'CHARTERER');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('CARGO_LOAD', 'MANOEUVRING', 'FULL_SPEED_AWAY', 'ANCHORING', 'CARGO_DISCHARGE', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vessel" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "name" TEXT NOT NULL,
    "shortName" VARCHAR(20),
    "exName" VARCHAR(100),
    "type" VARCHAR(50),
    "owner" VARCHAR(200),
    "ownerAddress" VARCHAR(500),
    "charterer" VARCHAR(200),
    "imoNumber" VARCHAR(20),
    "mmsi" VARCHAR(20),
    "callSign" VARCHAR(20),
    "registrationNo" VARCHAR(50),
    "flag" VARCHAR(50),
    "portOfRegistry" VARCHAR(100),
    "classification" VARCHAR(50),
    "yearBuilt" INTEGER,
    "lastDrydock" TIMESTAMP(3),
    "loaMeters" DECIMAL(8,3),
    "breadthMeters" DECIMAL(8,3),
    "depthMeters" DECIMAL(8,3),
    "draftSummer" DECIMAL(8,3),
    "draftTropical" DECIMAL(8,3),
    "draftTropicalFw" DECIMAL(8,3),
    "draftAftFullLoad" DECIMAL(8,3),
    "fwa" DECIMAL(8,3),
    "lightShip" DECIMAL(10,3),
    "dwtSummer" DECIMAL(10,3),
    "dwtTropical" DECIMAL(10,3),
    "tpc" DECIMAL(8,3),
    "grt" DECIMAL(12,2),
    "nrt" DECIMAL(12,2),
    "normalSpeed" DECIMAL(6,2),
    "normalFullRpm" DECIMAL(8,2),
    "maximumSpeed" DECIMAL(6,2),
    "maximumRpm" DECIMAL(8,2),
    "mainEngineP" VARCHAR(200),
    "mainEnginePKw" DECIMAL(10,2),
    "mainEnginePCons" DECIMAL(8,2),
    "mainEngineS" VARCHAR(200),
    "mainEngineSKw" DECIMAL(10,2),
    "mainEngineSCons" DECIMAL(8,2),
    "mainEngineMaxCons" DECIMAL(8,2),
    "generator1" VARCHAR(200),
    "generator1Kw" DECIMAL(8,2),
    "generator1Cons" DECIMAL(8,2),
    "generator2" VARCHAR(200),
    "generator2Kw" DECIMAL(8,2),
    "generator2Cons" DECIMAL(8,2),
    "auxEngine" VARCHAR(200),
    "fuelBunkerTankCbm" DECIMAL(10,3),
    "freshWaterTankCbm" DECIMAL(10,3),
    "containerStowageTeu" INTEGER,
    "maxTeus" INTEGER,
    "maxCargoCapacityMt" DECIMAL(10,3),
    "maxWeightMt" DECIMAL(10,3),
    "noOfCargoHold" INTEGER,
    "noOfRow" INTEGER,
    "reeferPoints" INTEGER,
    "dgApproved" BOOLEAN,
    "contactEmail" VARCHAR(200),
    "contactLine" VARCHAR(100),
    "contactPhone" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vessel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VesselAssignment" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "vesselId" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VesselAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Voyage" (
    "id" SERIAL NOT NULL,
    "vesselId" INTEGER NOT NULL,
    "voyNo" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "status" "VoyageStatus" NOT NULL DEFAULT 'OPEN',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "postingYear" INTEGER NOT NULL,
    "postingMonth" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Voyage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" SERIAL NOT NULL,
    "voyageId" INTEGER NOT NULL,
    "type" "ActivityType" NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "reeferCount" INTEGER,
    "fuelUsed" DECIMAL(12,2),
    "generator1Count" INTEGER,
    "generator1Hours" DECIMAL(10,2),
    "generator2Count" INTEGER,
    "generator2Hours" DECIMAL(10,2),
    "deckgenCount" INTEGER,
    "deckgenHours" DECIMAL(10,2),
    "mainEngine1Count" INTEGER,
    "mainEngine1Hours" DECIMAL(10,2),
    "mainEngine2Count" INTEGER,
    "mainEngine2Hours" DECIMAL(10,2),
    "container20Count" INTEGER,
    "container40Count" INTEGER,
    "totalContainerWeight" DECIMAL(14,3),
    "draftFore" VARCHAR(20),
    "draftAft" VARCHAR(20),
    "berth" VARCHAR(10),
    "berthSub" VARCHAR(20),
    "anchorLocation" VARCHAR(200),
    "avgSpeed" DECIMAL(10,2),
    "currentDirection" VARCHAR(20),
    "windDirection" VARCHAR(10),
    "remark" VARCHAR(500),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consumption" (
    "id" SERIAL NOT NULL,
    "activityId" INTEGER NOT NULL,
    "category" "ConsumptionCategory" NOT NULL,
    "itemName" VARCHAR(100) NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL,
    "unit" "ConsumptionUnit" NOT NULL,
    "source" "ConsumptionSource" NOT NULL DEFAULT 'MANUAL',
    "remark" VARCHAR(500),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "scope" "ConsumptionScope" NOT NULL DEFAULT 'OTHER',
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consumption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuelRob" (
    "id" SERIAL NOT NULL,
    "voyageId" INTEGER NOT NULL,
    "openingRob" DECIMAL(14,2) NOT NULL,
    "closingRob" DECIMAL(14,2) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'L',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FuelRob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuelBunkerEvent" (
    "id" SERIAL NOT NULL,
    "voyageId" INTEGER NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'L',
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FuelBunkerEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Vessel_code_key" ON "Vessel"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Vessel_imoNumber_key" ON "Vessel"("imoNumber");

-- CreateIndex
CREATE INDEX "VesselAssignment_userId_idx" ON "VesselAssignment"("userId");

-- CreateIndex
CREATE INDEX "VesselAssignment_vesselId_idx" ON "VesselAssignment"("vesselId");

-- CreateIndex
CREATE UNIQUE INDEX "VesselAssignment_userId_vesselId_key" ON "VesselAssignment"("userId", "vesselId");

-- CreateIndex
CREATE INDEX "Voyage_vesselId_idx" ON "Voyage"("vesselId");

-- CreateIndex
CREATE INDEX "Voyage_postingYear_postingMonth_idx" ON "Voyage"("postingYear", "postingMonth");

-- CreateIndex
CREATE UNIQUE INDEX "Voyage_vesselId_voyNo_key" ON "Voyage"("vesselId", "voyNo");

-- CreateIndex
CREATE INDEX "Activity_voyageId_idx" ON "Activity"("voyageId");

-- CreateIndex
CREATE INDEX "Activity_year_month_idx" ON "Activity"("year", "month");

-- CreateIndex
CREATE INDEX "Consumption_activityId_idx" ON "Consumption"("activityId");

-- CreateIndex
CREATE INDEX "Consumption_category_idx" ON "Consumption"("category");

-- CreateIndex
CREATE UNIQUE INDEX "FuelRob_voyageId_key" ON "FuelRob"("voyageId");

-- CreateIndex
CREATE INDEX "FuelBunkerEvent_voyageId_at_idx" ON "FuelBunkerEvent"("voyageId", "at");

-- AddForeignKey
ALTER TABLE "VesselAssignment" ADD CONSTRAINT "VesselAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VesselAssignment" ADD CONSTRAINT "VesselAssignment_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "Vessel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voyage" ADD CONSTRAINT "Voyage_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "Vessel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_voyageId_fkey" FOREIGN KEY ("voyageId") REFERENCES "Voyage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consumption" ADD CONSTRAINT "Consumption_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consumption" ADD CONSTRAINT "Consumption_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelRob" ADD CONSTRAINT "FuelRob_voyageId_fkey" FOREIGN KEY ("voyageId") REFERENCES "Voyage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelBunkerEvent" ADD CONSTRAINT "FuelBunkerEvent_voyageId_fkey" FOREIGN KEY ("voyageId") REFERENCES "Voyage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
