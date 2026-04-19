import { z } from "zod";

export const unassignUserSchema = z.object({
  params: z.object({
    vesselId: z.coerce.number().int().positive(),
    userId: z.coerce.number().int().positive(),
  }),
});
