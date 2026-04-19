import express from "express";
import * as userController from "../controllers/user.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createUserSchema,
  listUsersSchema,
  updateUserSchema,
  userIdParamSchema,
} from "../validators/user.schema.js";

const router = express.Router();

const MANAGE_ROLES = ["SUPERVISOR", "MANAGER", "ADMIN"];

/**
 * List users
 * GET /api/users?q=&role=
 */
router.get(
  "/",
  authenticate,
  authorize(...MANAGE_ROLES),
  validate(listUsersSchema),
  userController.listUsers
);

/**
 * Get user by id
 * GET /api/users/:id
 */
router.get(
  "/:id",
  authenticate,
  authorize(...MANAGE_ROLES),
  validate(userIdParamSchema),
  userController.getUserById
);

/**
 * Create user
 * POST /api/users
 */
router.post(
  "/",
  authenticate,
  authorize(...MANAGE_ROLES),
  validate(createUserSchema),
  userController.createUser
);

/**
 * Update user
 * PATCH /api/users/:id
 */
router.patch(
  "/:id",
  authenticate,
  authorize(...MANAGE_ROLES),
  validate(updateUserSchema),
  userController.updateUser
);

/**
 * Delete user
 * DELETE /api/users/:id
 */
router.delete(
  "/:id",
  authenticate,
  authorize(...MANAGE_ROLES),
  validate(userIdParamSchema),
  userController.removeUser
);

export default router;
