import { z } from "zod";

export const updatePostingSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    postingYear: z.coerce.number().int().min(2000).max(2100),
    postingMonth: z.coerce.number().int().min(1).max(12),
  }),
});
