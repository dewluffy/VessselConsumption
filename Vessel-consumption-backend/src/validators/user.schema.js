import { z } from "zod";

const roles = z.enum(["EMPLOYEE", "SUPERVISOR", "MANAGER", "ADMIN"]);

const boolQuery = z.preprocess((v) => {
  if (v === "true") return true;
  if (v === "false") return false;
  return v;
}, z.boolean());

export const userIdParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

/**
 * GET /api/users?q=&role=
 */
export const listUsersSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    role: roles.optional(),
    unassigned: boolQuery.optional(),
    minimal: boolQuery.optional(),
  }),
});

/**
 * POST /api/users
 * admin/manager create
 */
export const createUserSchema = z.object({
  body: z
    .object({
      email: z.string().email(),
      name: z.string().max(100).optional(),
      role: roles,
      password: z.string().min(6),
    })
    .strict(),
});

/**
 * PATCH /api/users/:id
 */
export const updateUserSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z
    .object({
      email: z.string().email().optional(),
      name: z.string().max(100).nullable().optional(),
      role: roles.optional(),
      password: z.string().min(6).optional(), // reset password
    })
    .strict(),
});
