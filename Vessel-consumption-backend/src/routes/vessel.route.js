import express from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { unassignUserSchema } from "../validators/assignment.schema.js";
import { validate } from "../middlewares/validate.middleware.js";
import { assignUserSchema } from "../validators/vessel.schema.js";
import * as vesselController from "../controllers/vessel.controller.js";

const router = express.Router();

// 👁 ทุก role ดูได้
router.get(
  "/",
  authenticate,
  authorize("EMPLOYEE", "SUPERVISOR", "MANAGER", "ADMIN"),
  vesselController.getAll
);

router.get(
  "/:id",
  authenticate,
  authorize("EMPLOYEE", "SUPERVISOR", "MANAGER", "ADMIN"),
  vesselController.getById
);

// ✏️ เฉพาะระดับบน
router.post(
  "/",
  authenticate,
  authorize("SUPERVISOR", "MANAGER", "ADMIN"),
  vesselController.create
);

router.patch(
  "/:id",
  authenticate,
  authorize("SUPERVISOR", "MANAGER", "ADMIN"),
  vesselController.update
);

// ❌ delete เฉพาะ admin
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  vesselController.remove
);

router.post(
  "/:id/assign",
  authenticate,
  authorize("SUPERVISOR", "MANAGER", "ADMIN"),
  validate(assignUserSchema),
  vesselController.assignUser
);

router.delete(
  "/:vesselId/assign/:userId",
  authenticate,
  authorize("SUPERVISOR", "MANAGER", "ADMIN"),
  validate(unassignUserSchema),
  vesselController.unassignUser
);

export default router;
