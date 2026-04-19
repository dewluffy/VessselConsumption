import { z } from "zod";

const intPos = z.coerce.number().int().nonnegative();
const intPosStrict = z.coerce.number().int().positive();
const numPos = z.coerce.number().finite().nonnegative();
const numPosStrict = z.coerce.number().finite().positive();

const baseTimeFields = {
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
};

const generatorFields = {
  generator1Count: intPosStrict,
  generator1Hours: numPos,
  generator2Count: intPosStrict,
  generator2Hours: numPos,
};

const deckgenFields = {
  deckgenCount: intPos,
  deckgenHours: numPos,
};

const draftFields = {
  draftFore: z.string().max(20).optional(),
  draftAft: z.string().max(20).optional(),
};

const currentDirectionField = {
  currentDirection: z.enum(["AGAINST", "WITH"]).optional(),
};

const mainEngine12Fields = {
  mainEngine1Count: intPosStrict,
  mainEngine1Hours: numPos,
  mainEngine2Count: intPosStrict,
  mainEngine2Hours: numPos,
};

/**
 * Cargo work fields (LOAD & DISCHARGE — identical)
 */
const cargoWorkFields = {
  container20Count: intPos,
  container40Count: intPos,
  totalContainerWeight: numPos,
  ...generatorFields,
  ...deckgenFields,
  reeferCount: intPos,
  ...draftFields,
  berth: z.enum(["BKK", "LCB"]).optional(),
  berthSub: z.string().max(20).optional(),
  fuelUsed: numPos.optional(),
  remark: z.string().max(500).optional(),
};

const CargoLoadBody = z.object({
  type: z.literal("CARGO_LOAD"),
  ...baseTimeFields,
  ...cargoWorkFields,
}).strict();

const CargoDischargeBody = z.object({
  type: z.literal("CARGO_DISCHARGE"),
  ...baseTimeFields,
  ...cargoWorkFields,
}).strict();

const AnchoringBody = z.object({
  type: z.literal("ANCHORING"),
  ...baseTimeFields,
  container20Count: intPos,
  container40Count: intPos,
  reeferCount: intPos,
  ...generatorFields,
  ...deckgenFields,
  ...draftFields,
  anchorLocation: z.string().max(200).optional(),
  fuelUsed: numPos.optional(),
  remark: z.string().max(500).optional(),
}).strict();

const ManoeuvringBody = z.object({
  type: z.literal("MANOEUVRING"),
  ...baseTimeFields,
  reeferCount: intPos,
  ...mainEngine12Fields,
  ...generatorFields,
  ...currentDirectionField,
  fuelUsed: numPos.optional(),
  remark: z.string().max(500).optional(),
}).strict();

const FullSpeedAwayBody = z.object({
  type: z.literal("FULL_SPEED_AWAY"),
  ...baseTimeFields,
  avgSpeed: numPosStrict, // หน่วย: นอต
  reeferCount: intPos,
  ...mainEngine12Fields,
  ...generatorFields,
  ...currentDirectionField,
  windDirection: z.enum(["N", "NE", "E", "SE", "S", "SW", "W", "NW"]).optional(),
  fuelUsed: numPos.optional(),
  remark: z.string().max(500).optional(),
}).strict();

const OtherBody = z.object({
  type: z.literal("OTHER"),
  ...baseTimeFields,
  remark: z.string().min(1).max(500),
}).strict();

/**
 * Discriminated Union
 */
export const activityBodySchema = z
  .discriminatedUnion("type", [
    CargoLoadBody,
    CargoDischargeBody,
    AnchoringBody,
    ManoeuvringBody,
    FullSpeedAwayBody,
    OtherBody,
  ])
  .superRefine((val, ctx) => {
    if (val.endAt <= val.startAt) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endAt"], message: "endAt must be greater than startAt" });
    }
    const hourFields = ["mainEngine1Hours", "mainEngine2Hours", "generator1Hours", "generator2Hours", "deckgenHours"];
    for (const f of hourFields) {
      if (f in val && val[f] < 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [f], message: `${f} must be >= 0` });
      }
    }
  });

export const createActivitySchema = z.object({
  params: z.object({ voyageId: z.coerce.number().int().positive() }),
  body: activityBodySchema,
});

export const updateActivitySchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
  body: z.object({
    type: z.enum(["CARGO_LOAD", "CARGO_DISCHARGE", "MANOEUVRING", "FULL_SPEED_AWAY", "ANCHORING", "OTHER"]).optional(),
    startAt: z.coerce.date().optional(),
    endAt: z.coerce.date().optional(),

    // Cargo / Anchoring
    container20Count: z.coerce.number().int().nonnegative().optional(),
    container40Count: z.coerce.number().int().nonnegative().optional(),
    totalContainerWeight: z.coerce.number().finite().nonnegative().optional(),
    berth: z.enum(["BKK", "LCB"]).optional(),
    berthSub: z.string().max(20).optional(),
    anchorLocation: z.string().max(200).optional(),

    // Draft
    draftFore: z.string().max(20).optional(),
    draftAft: z.string().max(20).optional(),

    // Generator
    generator1Count: z.coerce.number().int().positive().optional(),
    generator1Hours: z.coerce.number().finite().nonnegative().optional(),
    generator2Count: z.coerce.number().int().positive().optional(),
    generator2Hours: z.coerce.number().finite().nonnegative().optional(),

    // Deckgen
    deckgenCount: z.coerce.number().int().nonnegative().optional(),
    deckgenHours: z.coerce.number().finite().nonnegative().optional(),

    // Main engine 1/2
    mainEngine1Count: z.coerce.number().int().positive().optional(),
    mainEngine1Hours: z.coerce.number().finite().nonnegative().optional(),
    mainEngine2Count: z.coerce.number().int().positive().optional(),
    mainEngine2Hours: z.coerce.number().finite().nonnegative().optional(),

    // Common
    reeferCount: z.coerce.number().int().nonnegative().optional(),
    fuelUsed: z.coerce.number().finite().nonnegative().optional(),
    avgSpeed: z.coerce.number().finite().positive().optional(),
    currentDirection: z.enum(["AGAINST", "WITH"]).optional(),
    windDirection: z.enum(["N", "NE", "E", "SE", "S", "SW", "W", "NW"]).optional(),
    remark: z.string().max(500).optional(),
    active: z.boolean().optional(),
  }).strict(),
});