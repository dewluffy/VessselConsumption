import express from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createVoyageSchema,
  updateVoyageSchema,
  updateVoyageStatusSchema,
  listVoyagesByVesselSchema,
} from "../validators/voyage.schema.js";
import {updatePostingSchema} from "../validators/voyage-posting.schema.js";
import * as voyageController from "../controllers/voyage.controller.js";

const router = express.Router();

// EMPLOYEE ดูได้เฉพาะเรือที่ตัวเองถูก assign (เช็คใน service)
router.get(
  "/vessels/:vesselId/voyages",
  authenticate,
  authorize("EMPLOYEE", "SUPERVISOR", "MANAGER", "ADMIN"),
  validate(listVoyagesByVesselSchema),
  voyageController.listByVessel
);

// สร้าง voyage
router.post(
  "/vessels/:vesselId/voyages",
  authenticate,
  authorize("EMPLOYEE", "SUPERVISOR", "MANAGER", "ADMIN"),
  validate(createVoyageSchema),
  voyageController.createVoyage
);

// ดูรายละเอียด voyage (EMPLOYEE ได้เฉพาะของเรือที่ตัวเองถูก assign)
router.get(
  "/voyages/:id",
  authenticate,
  authorize("EMPLOYEE", "SUPERVISOR", "MANAGER", "ADMIN"),
  voyageController.getById
);

// แก้ไข voyage เฉพาะ role สูง
router.patch(
  "/voyages/:id",
  authenticate,
  authorize("SUPERVISOR", "MANAGER", "ADMIN"),
  validate(updateVoyageSchema),
  voyageController.update
);

router.patch(
  "/voyages/:id/posting",
  authenticate,
  authorize("SUPERVISOR", "MANAGER", "ADMIN"),
  validate(updatePostingSchema),
  voyageController.updatePosting
);

router.patch(
  "/voyages/:id/status",
  authenticate,
  authorize("EMPLOYEE", "SUPERVISOR", "MANAGER", "ADMIN"),
  validate(updateVoyageStatusSchema),
  voyageController.updateStatus
);

router.delete(
  "/voyages/:id",
  authenticate,
  authorize("SUPERVISOR", "MANAGER", "ADMIN"),
  voyageController.remove
);


export default router;
