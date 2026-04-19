import express from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import * as activityController from "../controllers/activity.controller.js";
import { createActivitySchema, updateActivitySchema } from "../validators/activity.schema.js";

const router = express.Router();

/**
 * List activities in a voyage
 * GET /api/voyages/:voyageId/activities
 */
router.get(
  "/voyages/:voyageId/activities",
  authenticate,
  authorize("EMPLOYEE", "SUPERVISOR", "MANAGER", "ADMIN"),
  activityController.listByVoyage
);

/**
 * Create activity in a voyage
 * POST /api/voyages/:voyageId/activities
 */
router.post(
  "/voyages/:voyageId/activities",
  authenticate,
  authorize("EMPLOYEE", "SUPERVISOR", "MANAGER", "ADMIN"),
  validate(createActivitySchema),
  activityController.create
);

/**
 * Get activity detail
 * GET /api/activities/:id
 */
router.get(
  "/activities/:id",
  authenticate,
  authorize("EMPLOYEE", "SUPERVISOR", "MANAGER", "ADMIN"),
  activityController.getById
);

/**
 * Update activity (PATCH แบบไม่ต้องส่ง type)
 * PATCH /api/activities/:id
 */
router.patch(
  "/activities/:id",
  authenticate,
  authorize("EMPLOYEE", "SUPERVISOR", "MANAGER", "ADMIN"),
  validate(updateActivitySchema),
  activityController.update
);

/**
 * Soft delete activity
 * DELETE /api/activities/:id
 */
router.delete(
  "/activities/:id",
  authenticate,
  authorize("EMPLOYEE", "SUPERVISOR", "MANAGER", "ADMIN"),
  activityController.remove
);

export default router;
