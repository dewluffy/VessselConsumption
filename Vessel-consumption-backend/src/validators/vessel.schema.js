import { z } from "zod";

export const assignUserSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(), // vesselId
  }),
  body: z.object({
    userId: z.coerce.number().int().positive(),
  }),
});
