import { z } from "zod";

const strOpt = (max) => z.string().max(max).optional();
const numOpt = z.coerce.number().finite().nonnegative().optional();
const intOpt = z.coerce.number().int().nonnegative().optional();
const boolOpt = z.boolean().optional();

const vesselBodySchema = z.object({
  // ── ทั่วไป
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  shortName: strOpt(20),
  exName: strOpt(100),
  type: strOpt(50),
  owner: strOpt(200),
  ownerAddress: strOpt(500),
  charterer: strOpt(200),

  // ── ทะเบียน
  imoNumber: strOpt(20),
  mmsi: strOpt(20),
  callSign: strOpt(20),
  registrationNo: strOpt(50),
  flag: strOpt(50),
  portOfRegistry: strOpt(100),
  classification: strOpt(50),
  yearBuilt: z.coerce.number().int().min(1900).max(2100).nullable().optional(),
  lastDrydock: z.coerce.date().optional(),

  // ── ขนาด
  loaMeters: numOpt,
  breadthMeters: numOpt,
  depthMeters: numOpt,
  draftSummer: numOpt,
  draftTropical: numOpt,
  draftTropicalFw: numOpt,
  draftAftFullLoad: numOpt,
  fwa: numOpt,
  lightShip: numOpt,
  dwtSummer: numOpt,
  dwtTropical: numOpt,
  tpc: numOpt,

  // ── Tonnage
  grt: numOpt,
  nrt: numOpt,

  // ── Speed
  normalSpeed: numOpt,
  normalFullRpm: numOpt,
  maximumSpeed: numOpt,
  maximumRpm: numOpt,

  // ── Main Engine
  mainEngineP: strOpt(200),
  mainEnginePKw: numOpt,
  mainEnginePCons: numOpt,
  mainEngineS: strOpt(200),
  mainEngineSKw: numOpt,
  mainEngineSCons: numOpt,
  mainEngineMaxCons: numOpt,

  // ── Generator
  generator1: strOpt(200),
  generator1Kw: numOpt,
  generator1Cons: numOpt,
  generator2: strOpt(200),
  generator2Kw: numOpt,
  generator2Cons: numOpt,
  auxEngine: strOpt(200),

  // ── Tank
  fuelBunkerTankCbm: numOpt,
  freshWaterTankCbm: numOpt,

  // ── Cargo
  containerStowageTeu: intOpt,
  maxCargoCapacityMt: numOpt,
  noOfCargoHold: intOpt,
  noOfRow: intOpt,
  reeferPoints: intOpt,
  dgApproved: boolOpt,
  maxTeus: intOpt,
  maxWeightMt: numOpt,

  // ── Contact
  contactEmail: strOpt(200),
  contactLine: strOpt(100),
  contactPhone: strOpt(50),
}).strict();

export const createVesselSchema = z.object({
  body: vesselBodySchema,
});

export const updateVesselSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
  body: vesselBodySchema.partial().strip(),
});

export const vesselIdParamSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
});

export const assignUserSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
  body: z.object({ userId: z.coerce.number().int().positive() }),
});