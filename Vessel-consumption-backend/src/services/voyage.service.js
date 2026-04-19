import prisma from "../config/prisma.js";
import createError from "../utils/create-error.util.js";
import { validateVoyageConsumptionsBeforeClose } from "./consumption.service.js";


const ensureVesselAccess = async (vesselId, user) => {
  const isEmployee = user.role === "EMPLOYEE";

  const vessel = await prisma.vessel.findFirst({
    where: {
      id: vesselId,
      active: true,
      ...(isEmployee
        ? {
            assignments: {
              some: { userId: user.id, active: true },
            },
          }
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
    ...(filter?.year ? { postingYear: filter.year } : {}),
    ...(filter?.month ? { postingMonth: filter.month } : {}),
  };

  return prisma.voyage.findMany({
    where,
    orderBy: { startAt: "desc" },
  });
};

export const createVoyage = async (vesselId, data, user) => {
  await ensureVesselAccess(vesselId, user);

  if (data.endAt && data.endAt < data.startAt) {
    throw createError(400, "endAt must be greater than startAt");
  }

  // ✅ rule สำหรับ EMPLOYEE: posting ต้องตรงกับ startAt หรือ endAt
  if (user.role === "EMPLOYEE") {
    const s = new Date(data.startAt);
    const startY = s.getUTCFullYear();
    const startM = s.getUTCMonth() + 1;

    let ok = data.postingYear === startY && data.postingMonth === startM;

    if (data.endAt) {
      const e = new Date(data.endAt);
      const endY = e.getUTCFullYear();
      const endM = e.getUTCMonth() + 1;
      ok = ok || (data.postingYear === endY && data.postingMonth === endM);
    }

    if (!ok) {
      throw createError(
        400,
        "For EMPLOYEE, posting period must match startAt month or endAt month"
      );
    }
  }

  // (แนะนำ) กัน VOY OPEN ซ้อนในเรือลำเดียวกัน
  const openVoy = await prisma.voyage.findFirst({
    where: { vesselId, active: true, status: "OPEN" },
    select: { id: true },
  });
  if (openVoy) throw createError(400, "This vessel already has an OPEN voyage");

  try {
    return await prisma.voyage.create({
      data: {
        vesselId,
        voyNo: data.voyNo,
        startAt: data.startAt,
        endAt: data.endAt,
        postingYear: data.postingYear,
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
        ...(user.role === "EMPLOYEE"
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
  // ดึง voyage + เช็ค access ผ่าน vessel
  const existing = await prisma.voyage.findFirst({
    where: {
      id,
      active: true,
      vessel: {
        active: true,
        ...(user.role === "EMPLOYEE"
          ? { assignments: { some: { userId: user.id, active: true } } }
          : {}),
      },
    },
    select: { id: true, startAt: true, endAt: true },
  });

  if (!existing) throw createError(404, "Voyage not found");

  const startAt = data.startAt ?? existing.startAt;
  const endAt = data.endAt ?? existing.endAt;

  if (endAt && startAt && endAt < startAt) {
    throw createError(400, "endAt must be greater than startAt");
  }

  return prisma.voyage.update({
    where: { id },
    data,
  });
};

export const updateStatus = async (id, status, user) => {
  // หา voyage + ตรวจสิทธิ์ผ่าน vessel assignment (ถ้าเป็น EMPLOYEE)
  const voyage = await prisma.voyage.findFirst({
    where: {
      id,
      active: true,
      vessel: {
        active: true,
        ...(user.role === "EMPLOYEE"
          ? { assignments: { some: { userId: user.id, active: true } } }
          : {}),
      },
    },
    select: { id: true, status: true },
  });

  if (!voyage) throw createError(404, "Voyage not found");

  // กันการเปลี่ยนเป็นค่าเดิม
  if (voyage.status === status) {
    throw createError(400, "Voyage status is already set");
  }

  if (status === "CLOSED") {
  const problems = await validateVoyageConsumptionsBeforeClose(voyage.id);
  if (problems.length) {
  throw createError(400, "Cannot close voyage: missing required consumptions");
}
}
  // อัปเดตสถานะ
  return prisma.voyage.update({
    where: { id: voyage.id },
    data: { status },
  });
};

export const updatePosting = async (id, data) => {
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
    data: {
      postingYear: data.postingYear,
      postingMonth: data.postingMonth,
    },
  });
};

export const remove = async (id) => {
  const voy = await prisma.voyage.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!voy) throw createError(404, "Voyage not found");

  try {
    await prisma.voyage.delete({ where: { id } });
    return { message: "Voyage deleted" };
  } catch (err) {
    // ถ้าติด foreign key (มี activity/consumption ผูกอยู่)
    if (err?.code === "P2003") {
      throw createError(409, "Cannot delete voyage because it has related records");
    }
    throw err;
  }
};