import prisma from "../config/prisma.js";
import createError from "../utils/create-error.util.js";
import { validateVoyageConsumptionsBeforeClose } from "./consumption.service.js";

const isRestricted = (user) =>
  user.role === "EMPLOYEE" || user.role === "CHARTERER";

const ensureVesselAccess = async (vesselId, user) => {
  const vessel = await prisma.vessel.findFirst({
    where: {
      id: vesselId,
      active: true,
      ...(isRestricted(user)
        ? { assignments: { some: { userId: user.id, active: true } } }
        : {}),
    },
    select: { id: true },
  });
  if (!vessel) throw createError(404, "Vessel not found");
  return vessel;
};

export const listByVessel = async (vesselId, user, filter) => {
  await ensureVesselAccess(vesselId, user);

  const where = {
    vesselId,
    active: true,
    ...(filter?.year  ? { postingYear:  filter.year  } : {}),
    ...(filter?.month ? { postingMonth: filter.month } : {}),
  };

  return prisma.voyage.findMany({ where, orderBy: { startAt: "desc" } });
};

export const createVoyage = async (vesselId, data, user) => {
  if (user.role === "CHARTERER") throw createError(403, "Forbidden");

  await ensureVesselAccess(vesselId, user);

  if (data.endAt && data.endAt < data.startAt) {
    throw createError(400, "endAt must be greater than startAt");
  }

  if (user.role === "EMPLOYEE") {
    const s = new Date(data.startAt);
    const startY = s.getUTCFullYear();
    const startM = s.getUTCMonth() + 1;

    let ok = data.postingYear === startY && data.postingMonth === startM;

    if (data.endAt) {
      const e = new Date(data.endAt);
      ok = ok || (data.postingYear === e.getUTCFullYear() && data.postingMonth === e.getUTCMonth() + 1);
    }

    if (!ok) throw createError(400, "For EMPLOYEE, posting period must match startAt month or endAt month");
  }

  const openVoy = await prisma.voyage.findFirst({
    where: { vesselId, active: true, status: "OPEN" },
    select: { id: true },
  });
  if (openVoy) throw createError(400, "This vessel already has an OPEN voyage");

  try {
    return await prisma.voyage.create({
      data: {
        vesselId,
        voyNo:        data.voyNo,
        startAt:      data.startAt,
        endAt:        data.endAt,
        postingYear:  data.postingYear,
        postingMonth: data.postingMonth,
      },
    });
  } catch {
    throw createError(409, "Voyage number already exists for this vessel");
  }
};

export const getById = async (id, user) => {
  const voyage = await prisma.voyage.findFirst({
    where: {
      id,
      active: true,
      vessel: {
        active: true,
        ...(isRestricted(user)
          ? { assignments: { some: { userId: user.id, active: true } } }
          : {}),
      },
    },
    include: { vessel: { select: { id: true, code: true, name: true } } },
  });

  if (!voyage) throw createError(404, "Voyage not found");
  return voyage;
};

export const updateVoyage = async (id, data, user) => {
  if (user.role === "CHARTERER") throw createError(403, "Forbidden");

  const existing = await prisma.voyage.findFirst({
    where: {
      id,
      active: true,
      vessel: {
        active: true,
        ...(isRestricted(user)
          ? { assignments: { some: { userId: user.id, active: true } } }
          : {}),
      },
    },
    select: { id: true, startAt: true, endAt: true },
  });

  if (!existing) throw createError(404, "Voyage not found");

  const startAt = data.startAt ?? existing.startAt;
  const endAt   = data.endAt   ?? existing.endAt;

  if (endAt && startAt && endAt < startAt) {
    throw createError(400, "endAt must be greater than startAt");
  }

  return prisma.voyage.update({ where: { id }, data });
};

export const updateStatus = async (id, status, user) => {
  if (user.role === "CHARTERER") throw createError(403, "Forbidden");

  const voyage = await prisma.voyage.findFirst({
    where: {
      id,
      active: true,
      vessel: {
        active: true,
        ...(isRestricted(user)
          ? { assignments: { some: { userId: user.id, active: true } } }
          : {}),
      },
    },
    select: { id: true, status: true },
  });

  if (!voyage) throw createError(404, "Voyage not found");

  if (voyage.status === status) throw createError(400, "Voyage status is already set");

  if (status === "CLOSED") {
    // const problems = await validateVoyageConsumptionsBeforeClose(voyage.id);
    // if (problems.length) throw createError(400, "Cannot close voyage: missing required consumptions");
  }

  return prisma.voyage.update({ where: { id: voyage.id }, data: { status } });
};

export const updatePosting = async (id, data, user) => {
  if (user.role === "CHARTERER") throw createError(403, "Forbidden");

  const voyage = await prisma.voyage.findFirst({
    where: { id, active: true },
    select: { id: true, postingYear: true, postingMonth: true },
  });

  if (!voyage) throw createError(404, "Voyage not found");

  if (voyage.postingYear === data.postingYear && voyage.postingMonth === data.postingMonth) {
    throw createError(400, "Posting period is already set");
  }

  return prisma.voyage.update({
    where: { id },
    data:  { postingYear: data.postingYear, postingMonth: data.postingMonth },
  });
};

export const remove = async (id, user) => {
  if (user.role === "CHARTERER") throw createError(403, "Forbidden");

  const voy = await prisma.voyage.findUnique({ where: { id }, select: { id: true } });
  if (!voy) throw createError(404, "Voyage not found");

  try {
    await prisma.voyage.delete({ where: { id } });
    return { message: "Voyage deleted" };
  } catch (err) {
    if (err?.code === "P2003") throw createError(409, "Cannot delete voyage because it has related records");
    throw err;
  }
};