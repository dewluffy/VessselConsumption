import { z } from "zod";

const floatNonNeg = z.coerce.number().finite().min(0);
const floatPos = z.coerce.number().finite().positive();

export const getFuelConsumptionSchema = z.object({
  params: z.object({
    voyageId: z.coerce.number().int().positive(),
  }),
});

export const updateFuelRobSchema = z.object({
  params: z.object({
    voyageId: z.coerce.number().int().positive(),
  }),
  body: z
    .object({
      openingRob: floatNonNeg.optional(),
      closingRob: floatNonNeg.optional(),
    })
    .refine((v) => v.openingRob !== undefined || v.closingRob !== undefined, {
      message: "openingRob or closingRob is required",
      path: ["openingRob"],
    }),
});

export const createFuelBunkerSchema = z.object({
  params: z.object({
    voyageId: z.coerce.number().int().positive(),
  }),
  body: z.object({
    at: z.coerce.date(),
    amount: floatPos,
    remark: z.string().max(500).optional(),
  }),
});

export const updateFuelBunkerSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z
    .object({
      at: z.coerce.date().optional(),
      amount: floatPos.optional(),
      remark: z.string().max(500).optional(),
    })
    .refine((v) => Object.keys(v).length > 0, {
      message: "At least one field is required",
    }),
});

export const deleteFuelBunkerSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});
