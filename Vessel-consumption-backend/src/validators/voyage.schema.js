import { z } from "zod";

export const createVoyageSchema = z.object({
  params: z.object({
    vesselId: z.coerce.number().int().positive(),
  }),
  body: z.object({
    voyNo: z.string().min(1),
    startAt: z.coerce.date(),
    endAt: z.coerce.date().optional(),

    postingYear: z.coerce.number().int().min(2000).max(2100),
    postingMonth: z.coerce.number().int().min(1).max(12),
  }),
});

export const updateVoyageSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    voyNo: z.string().min(1).optional(),
    startAt: z.coerce.date().optional(),
    endAt: z.coerce.date().optional(),
    status: z.enum(["OPEN", "CLOSED"]).optional(),
    active: z.boolean().optional(),
  }),
});

export const listVoyagesByVesselSchema = z.object({
  params: z.object({
    vesselId: z.coerce.number().int().positive(),
  }),
  query: z.object({
    year: z.coerce.number().int().min(2000).max(2100).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
  }),
});

export const updateVoyageStatusSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    status: z.enum(["OPEN", "CLOSED"]),
  }),
});