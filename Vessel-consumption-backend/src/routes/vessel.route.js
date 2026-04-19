import express from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createVesselSchema,
  updateVesselSchema,
  vesselIdParamSchema,
  assignUserSchema,
} from "../validators/vessel.schema.js";
import { unassignUserSchema } from "../validators/assignment.schema.js";
import * as vesselController from "../controllers/vessel.controller.js";

const router = express.Router();

const ALL_ROLES    = ["EMPLOYEE", "SUPERVISOR", "MANAGER", "ADMIN"];
const MANAGE_ROLES = ["SUPERVISOR", "MANAGER", "ADMIN"];

// ── Read (ทุก role) ────────────────────────────────────────────────────────
router.get(
  "/",
  authenticate,
  authorize(...ALL_ROLES),
  vesselController.getAll
);

router.get(
  "/:id",
  authenticate,
  authorize(...ALL_ROLES),
  validate(vesselIdParamSchema),
  vesselController.getById
);

// ── Write (SUPERVISOR ขึ้นไป) ──────────────────────────────────────────────
router.get(
  "/:id/assignments",
  authenticate,
  authorize(...MANAGE_ROLES),
  validate(vesselIdParamSchema),
  vesselController.getAssignments
);


router.post(
  "/",
  authenticate,
  authorize(...MANAGE_ROLES),
  validate(createVesselSchema),
  vesselController.create
);

router.patch(
  "/:id",
  authenticate,
  authorize(...MANAGE_ROLES),
  validate(updateVesselSchema),
  vesselController.update
);

router.delete(
  "/:id",
  authenticate,
  authorize(...MANAGE_ROLES),
  validate(vesselIdParamSchema),
  vesselController.remove
);

// ── Assignment ─────────────────────────────────────────────────────────────
router.post(
  "/:id/assign",
  authenticate,
  authorize(...MANAGE_ROLES),
  validate(assignUserSchema),
  vesselController.assignUser
);

router.delete(
  "/:vesselId/assignments/:userId",
  authenticate,
  authorize(...MANAGE_ROLES),
  validate(unassignUserSchema),
  vesselController.unassignUser
);



export default router;