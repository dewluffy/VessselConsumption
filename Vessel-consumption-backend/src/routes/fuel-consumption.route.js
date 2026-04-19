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

const READ_ROLES  = ["EMPLOYEE", "SUPERVISOR", "MANAGER", "ADMIN", "CHARTERER"];
const WRITE_ROLES = ["EMPLOYEE", "SUPERVISOR", "MANAGER", "ADMIN"];

// GET /api/voyages/:voyageId/fuel-consumption/previous-rob
router.get(
  "/voyages/:voyageId/fuel-consumption/previous-rob",
  authenticate,
  authorize(...READ_ROLES),
  validate(getFuelConsumptionSchema),
  fuelConsumptionController.getPreviousRob
);

// GET /api/voyages/:voyageId/fuel-consumption
router.get(
  "/voyages/:voyageId/fuel-consumption",
  authenticate,
  authorize(...READ_ROLES),
  validate(getFuelConsumptionSchema),
  fuelConsumptionController.getByVoyage
);

// PATCH /api/voyages/:voyageId/fuel-consumption/rob
router.patch(
  "/voyages/:voyageId/fuel-consumption/rob",
  authenticate,
  authorize(...WRITE_ROLES),
  validate(updateFuelRobSchema),
  fuelConsumptionController.updateRob
);

// POST /api/voyages/:voyageId/fuel-consumption/bunkers
router.post(
  "/voyages/:voyageId/fuel-consumption/bunkers",
  authenticate,
  authorize(...WRITE_ROLES),
  validate(createFuelBunkerSchema),
  fuelConsumptionController.createBunker
);

// PATCH /api/fuel-consumption/bunkers/:id
router.patch(
  "/fuel-consumption/bunkers/:id",
  authenticate,
  authorize(...WRITE_ROLES),
  validate(updateFuelBunkerSchema),
  fuelConsumptionController.updateBunker
);

// DELETE /api/fuel-consumption/bunkers/:id
router.delete(
  "/fuel-consumption/bunkers/:id",
  authenticate,
  authorize(...WRITE_ROLES),
  validate(deleteFuelBunkerSchema),
  fuelConsumptionController.deleteBunker
);

export default router;