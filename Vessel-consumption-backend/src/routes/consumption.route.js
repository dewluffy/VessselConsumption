import express from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import * as consumptionController from "../controllers/consumption.controller.js";
import {
  createConsumptionSchema,
  updateConsumptionSchema,
} from "../validators/consumption.schema.js";

const router = express.Router();

router.get(
  "/activities/:activityId/consumptions",
  authenticate,
  authorize("EMPLOYEE", "SUPERVISOR", "MANAGER", "ADMIN"),
  consumptionController.listByActivity
);

router.post(
  "/activities/:activityId/consumptions",
  authenticate,
  authorize("EMPLOYEE", "SUPERVISOR", "MANAGER", "ADMIN"),
  validate(createConsumptionSchema),
  consumptionController.create
);

router.patch(
  "/consumptions/:id",
  authenticate,
  authorize("EMPLOYEE", "SUPERVISOR", "MANAGER", "ADMIN"),
  validate(updateConsumptionSchema),
  consumptionController.update
);

router.delete(
  "/consumptions/:id",
  authenticate,
  authorize("EMPLOYEE", "SUPERVISOR", "MANAGER", "ADMIN"),
  consumptionController.remove
);

export default router;
