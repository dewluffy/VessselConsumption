import prisma from "../config/prisma.js";
import createError from "../utils/create-error.util.js";

const vesselSelect = {
  id: true, code: true, name: true, shortName: true, exName: true,
  type: true, owner: true, ownerAddress: true, charterer: true, active: true,
  imoNumber: true, mmsi: true, callSign: true, registrationNo: true,
  flag: true, portOfRegistry: true, classification: true,
  yearBuilt: true, lastDrydock: true,
  loaMeters: true, breadthMeters: true, depthMeters: true,
  draftSummer: true, draftTropical: true, draftTropicalFw: true,
  draftAftFullLoad: true, fwa: true, lightShip: true,
  dwtSummer: true, dwtTropical: true, tpc: true,
  grt: true, nrt: true,
  normalSpeed: true, normalFullRpm: true, maximumSpeed: true, maximumRpm: true,
  mainEngineP: true, mainEnginePKw: true, mainEnginePCons: true,
  mainEngineS: true, mainEngineSKw: true, mainEngineSCons: true,
  mainEngineMaxCons: true,
  generator1: true, generator1Kw: true, generator1Cons: true,
  generator2: true, generator2Kw: true, generator2Cons: true,
  auxEngine: true,
  fuelBunkerTankCbm: true, freshWaterTankCbm: true,
  containerStowageTeu: true, maxCargoCapacityMt: true,
  noOfCargoHold: true, noOfRow: true, reeferPoints: true, dgApproved: true,
  contactEmail: true, contactLine: true, contactPhone: true,
  createdAt: true, updatedAt: true,
};

const isRestricted = (user) =>
  user.role === "EMPLOYEE" || user.role === "CHARTERER";

export const getAll = async (user) => {
  const where = {
    active: true,
    ...(isRestricted(user)
      ? { assignments: { some: { userId: user.id, active: true } } }
      : {}),
  };

  return prisma.vessel.findMany({
    where,
    select: vesselSelect,
    orderBy: { name: "asc" },
  });
};

export const getById = async (id, user) => {
  const where = {
    id,
    active: true,
    ...(isRestricted(user)
      ? { assignments: { some: { userId: user.id, active: true } } }
      : {}),
  };

  const vessel = await prisma.vessel.findFirst({ where, select: vesselSelect });
  if (!vessel) throw createError(404, "Vessel not found");
  return vessel;
};

export const create = async (data) => {
  const exists = await prisma.vessel.findUnique({ where: { code: data.code } });
  if (exists) throw createError(409, `Vessel code "${data.code}" already exists`);

  if (data.imoNumber) {
    const imoExists = await prisma.vessel.findUnique({ where: { imoNumber: data.imoNumber } });
    if (imoExists) throw createError(409, `IMO number "${data.imoNumber}" already exists`);
  }

  return prisma.vessel.create({ data, select: vesselSelect });
};

export const update = async (id, data) => {
  const vessel = await prisma.vessel.findUnique({ where: { id } });
  if (!vessel) throw createError(404, "Vessel not found");

  if (data.code && data.code !== vessel.code) {
    const exists = await prisma.vessel.findUnique({ where: { code: data.code } });
    if (exists) throw createError(409, `Vessel code "${data.code}" already exists`);
  }

  if (data.imoNumber && data.imoNumber !== vessel.imoNumber) {
    const exists = await prisma.vessel.findUnique({ where: { imoNumber: data.imoNumber } });
    if (exists) throw createError(409, `IMO number "${data.imoNumber}" already exists`);
  }

  return prisma.vessel.update({ where: { id }, data, select: vesselSelect });
};

export const remove = async (id) => {
  const vessel = await prisma.vessel.findUnique({ where: { id } });
  if (!vessel) throw createError(404, "Vessel not found");

  return prisma.vessel.update({
    where: { id },
    data: { active: false },
  });
};

export const assignUser = async (vesselId, userId) => {
  const vessel = await prisma.vessel.findUnique({ where: { id: vesselId } });
  if (!vessel) throw createError(404, "Vessel not found");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw createError(404, "User not found");

  return prisma.vesselAssignment.upsert({
    where:  { userId_vesselId: { userId, vesselId } },
    update: { active: true },
    create: { userId, vesselId, active: true },
  });
};

export const unassignUser = async (vesselId, userId) => {
  const assignment = await prisma.vesselAssignment.findUnique({
    where: { userId_vesselId: { userId, vesselId } },
  });
  if (!assignment) throw createError(404, "Assignment not found");

  return prisma.vesselAssignment.update({
    where:  { userId_vesselId: { userId, vesselId } },
    data:   { active: false },
  });
};

export const getAssignments = async (vesselId) => {
  const vessel = await prisma.vessel.findUnique({ where: { id: vesselId } });
  if (!vessel) throw createError(404, "Vessel not found");

  return prisma.vesselAssignment.findMany({
    where:   { vesselId, active: true },
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
    orderBy: { createdAt: "asc" },
  });
};