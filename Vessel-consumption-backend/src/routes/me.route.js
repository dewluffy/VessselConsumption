import express from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import * as meController from "../controllers/me.controller.js";

const router = express.Router();

// ทุก role เรียกได้ (แต่ employee จะได้เฉพาะของตัวเองอยู่แล้ว)
router.get(
  "/vessels",
  authenticate,
  authorize("EMPLOYEE", "SUPERVISOR", "MANAGER", "ADMIN"),
  meController.getMyVessels
);

export default router;
