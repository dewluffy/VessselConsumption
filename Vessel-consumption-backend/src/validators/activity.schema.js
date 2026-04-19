import { z } from "zod";

/**
 * Helpers
 */
const intPos = z.coerce.number().int().nonnegative();
const intPosStrict = z.coerce.number().int().positive(); // >0
const numPos = z.coerce.number().finite().nonnegative();
const numPosStrict = z.coerce.number().finite().positive(); // >0

const baseTimeFields = {
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
};

const commonFields = {
  // shared
  reeferCount: intPos, // จำนวนตู้ Reefer
  mainEngineCount: intPosStrict, // เครื่องจักรใหญ่กี่เครื่อง
  mainEngineHours: numPos, // กี่ชม.
  generatorCount: intPosStrict, // เครื่องไฟกี่เครื่อง
  generatorHours: numPos, // กี่ชม.
  fuelUsed: numPos.optional(), // ยังไม่รู้สูตร - เก็บไว้ก่อน
  remark: z.string().max(500).optional(),
};

const cargoFields = {
  containerCount: intPosStrict, // จำนวนตู้
  totalContainerWeight: numPos, // น้ำหนักตู้ทั้งหมด
};

/**
 * Per-type schemas (Body only)
 * - ทุก type ต้องมี startAt + endAt
 * - field required แตกต่างกันตาม type
 */
const CargoLoadBody = z.object({
  type: z.literal("CARGO_LOAD"),
  ...baseTimeFields,
  ...cargoFields,
  ...commonFields,
}).strict();

const CargoDischargeBody = z.object({
  type: z.literal("CARGO_DISCHARGE"),
  ...baseTimeFields,
  ...cargoFields,
  ...commonFields,
}).strict();

const ManoeuvringBody = z.object({
  type: z.literal("MANOEUVRING"),
  ...baseTimeFields,
  // ไม่มี containerCount/weight
  ...commonFields,
}).strict();

const AnchoringBody = z.object({
  type: z.literal("ANCHORING"),
  ...baseTimeFields,
  ...commonFields,
}).strict();

const FullSpeedAwayBody = z.object({
  type: z.literal("FULL_SPEED_AWAY"),
  ...baseTimeFields,
  avgSpeed: numPosStrict, // ความเร็วเฉลี่ยตอน FSW
  ...commonFields,
}).strict();

const OtherBody = z.object({
  type: z.literal("OTHER"),
  ...baseTimeFields,
  remark: z.string().min(1).max(500), // OTHER บังคับมีรายละเอียด
  // field อื่นไม่บังคับ
}).strict();

/**
 * Discriminated Union
 */
export const activityBodySchema = z
  .discriminatedUnion("type", [
    CargoLoadBody,
    CargoDischargeBody,
    ManoeuvringBody,
    AnchoringBody,
    FullSpeedAwayBody,
    OtherBody,
  ])
  .superRefine((val, ctx) => {
    // ทุก type ต้อง endAt > startAt
    if (val.endAt <= val.startAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endAt"],
        message: "endAt must be greater than startAt",
      });
    }

    // กันค่าติดลบ (เผื่อ coerce มาแปลก ๆ)
    // (ตัว schema คุมไว้แล้ว แต่อันนี้เป็นกันพลาด)
    if ("mainEngineHours" in val && val.mainEngineHours < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["mainEngineHours"],
        message: "mainEngineHours must be >= 0",
      });
    }
    if ("generatorHours" in val && val.generatorHours < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["generatorHours"],
        message: "generatorHours must be >= 0",
      });
    }
  });

/**
 * Request schemas (params + body)
 */
export const createActivitySchema = z.object({
  params: z.object({
    voyageId: z.coerce.number().int().positive(),
  }),
  body: activityBodySchema,
});

export const updateActivitySchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z
    .object({
      // ให้ส่ง type ได้ แต่ไม่บังคับ (ส่วนใหญ่ไม่ต้องส่ง)
      type: z
        .enum([
          "CARGO_LOAD",
          "MANOEUVRING",
          "FULL_SPEED_AWAY",
          "ANCHORING",
          "CARGO_DISCHARGE",
          "OTHER",
        ])
        .optional(),

      startAt: z.coerce.date().optional(),
      endAt: z.coerce.date().optional(),

      containerCount: z.coerce.number().int().positive().optional(),
      totalContainerWeight: z.coerce.number().finite().nonnegative().optional(),

      reeferCount: z.coerce.number().int().nonnegative().optional(),

      mainEngineCount: z.coerce.number().int().positive().optional(),
      mainEngineHours: z.coerce.number().finite().nonnegative().optional(),

      generatorCount: z.coerce.number().int().positive().optional(),
      generatorHours: z.coerce.number().finite().nonnegative().optional(),

      fuelUsed: z.coerce.number().finite().nonnegative().optional(),

      avgSpeed: z.coerce.number().finite().positive().optional(),

      remark: z.string().max(500).optional(),

      active: z.boolean().optional(),
    })
    .strict(),
});