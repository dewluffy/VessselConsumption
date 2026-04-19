import prisma from "../config/prisma.js";
import createError from "../utils/create-error.util.js";

const isEmployee = (user) => user.role === "EMPLOYEE";

const assertVoyageAccess = async (voyageId, user) => {
  // privileged เห็นได้หมด
  if (!isEmployee(user)) {
    const v = await prisma.voyage.findUnique({ where: { id: voyageId }, select: { id: true } });
    if (!v) throw createError(404, "Voyage not found");
    return;
  }

  // employee ต้องเป็น voy ของเรือที่ assign
  const v = await prisma.voyage.findFirst({
    where: {
      id: voyageId,
      vessel: {
        active: true,
        assignments: { some: { userId: user.id, active: true } },
      },
    },
    select: { id: true },
  });

  if (!v) throw createError(403, "Forbidden");
};

export const getFuelConsumption = async (voyageId, user) => {
  await assertVoyageAccess(voyageId, user);

  // ROB
  const rob = await prisma.fuelRob.findUnique({
    where: { voyageId },
    select: { openingRob: true, closingRob: true, unit: true },
  });

  // Bunkers
  const bunkers = await prisma.fuelBunkerEvent.findMany({
    where: { voyageId },
    orderBy: { at: "asc" },
    select: { id: true, at: true, amount: true, unit: true, remark: true, createdAt: true },
  });

  // Consumed from activities + summary by type
  const activities = await prisma.activity.findMany({
    where: { voyageId, active: true },
    select: { type: true, fuelUsed: true },
  });

  let consumedFromActivities = 0;
  const byActivityType = {};

  for (const a of activities) {
    const used = Number(a.fuelUsed ?? 0) || 0;
    consumedFromActivities += used;
    byActivityType[a.type] = (byActivityType[a.type] ?? 0) + used;
  }

  return {
    rob: rob ?? { openingRob: 0, closingRob: 0, unit: "L" },
    bunkers,
    computed: {
      consumedFromActivities,
      byActivityType,
    },
  };
};

export const upsertFuelRob = async (voyageId, user, data) => {
  await assertVoyageAccess(voyageId, user);

  const existing = await prisma.fuelRob.findUnique({ where: { voyageId }, select: { id: true } });

  if (!existing) {
    return prisma.fuelRob.create({
      data: {
        voyageId,
        openingRob: data.openingRob ?? 0,
        closingRob: data.closingRob ?? 0,
        unit: "L",
      },
      select: { openingRob: true, closingRob: true, unit: true },
    });
  }

  return prisma.fuelRob.update({
    where: { voyageId },
    data: {
      ...(data.openingRob !== undefined ? { openingRob: data.openingRob } : {}),
      ...(data.closingRob !== undefined ? { closingRob: data.closingRob } : {}),
    },
    select: { openingRob: true, closingRob: true, unit: true },
  });
};

export const createFuelBunker = async (voyageId, user, data) => {
  await assertVoyageAccess(voyageId, user);

  return prisma.fuelBunkerEvent.create({
    data: {
      voyageId,
      at: data.at,
      amount: data.amount,
      unit: "L",
      remark: data.remark,
    },
    select: { id: true, at: true, amount: true, unit: true, remark: true, createdAt: true },
  });
};

const assertBunkerAccessById = async (id, user) => {
  const bunker = await prisma.fuelBunkerEvent.findUnique({
    where: { id },
    select: { id: true, voyageId: true },
  });
  if (!bunker) throw createError(404, "Bunker event not found");

  await assertVoyageAccess(bunker.voyageId, user);
  return bunker;
};

export const updateFuelBunker = async (id, user, data) => {
  await assertBunkerAccessById(id, user);

  return prisma.fuelBunkerEvent.update({
    where: { id },
    data: {
      ...(data.at !== undefined ? { at: data.at } : {}),
      ...(data.amount !== undefined ? { amount: data.amount } : {}),
      ...(data.remark !== undefined ? { remark: data.remark } : {}),
    },
    select: { id: true, at: true, amount: true, unit: true, remark: true, createdAt: true },
  });
};

export const deleteFuelBunker = async (id, user) => {
  await assertBunkerAccessById(id, user);
  await prisma.fuelBunkerEvent.delete({ where: { id } });
  return { message: "Deleted successfully" };
};
