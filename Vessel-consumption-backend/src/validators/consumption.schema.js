import { z } from "zod";

const categoryEnum = z.enum(["FUEL", "LUBE", "WATER", "OTHER"]);
const unitEnum = z.enum(["LITER", "KG", "TON", "KWH", "OTHER"]);
const sourceEnum = z.enum(["MANUAL", "CALCULATED"]);

const scopeEnum = z.enum(["MAIN_ENGINE", "GENERATOR", "REEFER", "AUXILIARY", "OTHER"]);


export const createConsumptionSchema = z.object({
  params: z.object({
    activityId: z.coerce.number().int().positive(),
  }),
  body: z
    .object({
      category: categoryEnum,
      scope: scopeEnum, // ✅ required
      itemName: z.string().min(1).max(100),
      quantity: z.coerce.number().finite().positive(),
      unit: unitEnum,
      source: sourceEnum.optional(),
      remark: z.string().max(500).optional(),
    })
    .strict()
    .superRefine((val, ctx) => {
      // (แนะนำ) ถ้าเป็น WATER ไม่ควร scope เป็น MAIN_ENGINE/GENERATOR/REEFER ก็ได้
      if (val.category === "WATER" && ["MAIN_ENGINE", "GENERATOR", "REEFER"].includes(val.scope)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["scope"],
          message: "WATER should usually use scope AUXILIARY or OTHER",
        });
      }
    }),
});

export const updateConsumptionSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z
    .object({
      category: categoryEnum.optional(),
      scope: scopeEnum.optional(), // ✅ optional
      itemName: z.string().min(1).max(100).optional(),
      quantity: z.coerce.number().finite().positive().optional(),
      unit: unitEnum.optional(),
      source: sourceEnum.optional(),
      remark: z.string().max(500).optional(),
      active: z.boolean().optional(),
    })
    .strict(),
});
