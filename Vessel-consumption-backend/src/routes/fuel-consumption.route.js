import express from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import * as fuelConsumptionController from "../controllers/fuel-consumption.controller.js";
import {
  getFuelConsumptionSchema,
  updateFuelRobSchema,
  createFuelBunkerSchema,
  updateFuelBunkerSchema,
  deleteFuelBunkerSchema,
} from "../validators/fuel-consumption.schema.js";

const router = express.Router();

// GET /api/voyages/:voyageId/fuel-consumption
router.get(
  "/voyages/:voyageId/fuel-consumption",
  authenticate,
  authorize("EMPLOYEE", "SUPERVISOR", "MANAGER", "ADMIN"),
  validate(getFuelConsumptionSchema),
  fuelConsumptionController.getByVoyage
);

// PATCH /api/voyages/:voyageId/fuel-consumption/rob
router.patch(
  "/voyages/:voyageId/fuel-consumption/rob",
  authenticate,
  authorize("EMPLOYEE", "SUPERVISOR", "MANAGER", "ADMIN"),
  validate(updateFuelRobSchema),
  fuelConsumptionController.updateRob
);

// POST /api/voyages/:voyageId/fuel-consumption/bunkers
router.post(
  "/voyages/:voyageId/fuel-consumption/bunkers",
  authenticate,
  authorize("EMPLOYEE", "SUPERVISOR", "MANAGER", "ADMIN"),
  validate(createFuelBunkerSchema),
  fuelConsumptionController.createBunker
);

// PATCH /api/fuel-consumption/bunkers/:id
router.patch(
  "/fuel-consumption/bunkers/:id",
  authenticate,
  authorize("EMPLOYEE", "SUPERVISOR", "MANAGER", "ADMIN"),
  validate(updateFuelBunkerSchema),
  fuelConsumptionController.updateBunker
);

// DELETE /api/fuel-consumption/bunkers/:id
router.delete(
  "/fuel-consumption/bunkers/:id",
  authenticate,
  authorize("EMPLOYEE", "SUPERVISOR", "MANAGER", "ADMIN"),
  validate(deleteFuelBunkerSchema),
  fuelConsumptionController.deleteBunker
);

export default router;
