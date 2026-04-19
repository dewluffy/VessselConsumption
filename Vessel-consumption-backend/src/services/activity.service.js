import prisma from "../config/prisma.js";
import createError from "../utils/create-error.util.js";
import { activityBodySchema } from "../validators/activity.schema.js";

/**
 * ตรวจสิทธิ์เข้าถึง voyage:
 * - ต้องมี voyage จริง + active
 * - ถ้า role=EMPLOYEE ต้องถูก assign กับ vessel ของ voyage นั้น
 * - (แนะนำ) voyage ต้อง OPEN ถึงจะเพิ่ม/แก้ activity ได้
 */
const ensureVoyageAccess = async (voyageId, user, { requireOpen = false } = {}) => {
  const voyage = await prisma.voyage.findFirst({
    where: {
      id: voyageId,
      active: true,
      vessel: {
        active: true,
        ...(user.role === "EMPLOYEE"
          ? { assignments: { some: { userId: user.id, active: true } } }
          : {}),
      },
    },
    select: { id: true, status: true, vesselId: true },
  });

  if (!voyage) throw createError(404, "Voyage not found");

  if (requireOpen && voyage.status === "CLOSED") {
    throw createError(400, "Voyage is CLOSED");
  }

  return voyage;
};

const ensureActivityAccess = async (activityId, user) => {
  const activity = await prisma.activity.findFirst({
    where: {
      id: activityId,
      active: true,
      voyage: {
        active: true,
        vessel: {
          active: true,
          ...(user.role === "EMPLOYEE"
            ? { assignments: { some: { userId: user.id, active: true } } }
            : {}),
        },
      },
    },
    select: {
      id: true,
      type: true,
      startAt: true,
      endAt: true,
      containerCount: true,
      totalContainerWeight: true,
      reeferCount: true,
      mainEngineCount: true,
      mainEngineHours: true,
      generatorCount: true,
      generatorHours: true,
      fuelUsed: true,
      avgSpeed: true,
      remark: true,
      voyageId: true,
    },
  });

  if (!activity) throw createError(404, "Activity not found");
  return activity;
};

/**
 * PATCH แบบไม่ต้องส่ง type:
 * - ดึง type เดิมจาก DB
 * - merge existing + patch
 * - validate ด้วย discriminatedUnion ตาม type เดิม
 * - ไม่อนุญาตให้เปลี่ยน type
 */
const validatePatchByExistingType = (existing, patch) => {
  if (patch.type && patch.type !== existing.type) {
    throw createError(400, "Changing activity type is not allowed");
  }

  const merged = {
    type: existing.type,
    startAt: patch.startAt ?? existing.startAt,
    endAt: patch.endAt ?? existing.endAt,

    containerCount: patch.containerCount ?? existing.containerCount,
    totalContainerWeight: patch.totalContainerWeight ?? existing.totalContainerWeight,

    reeferCount: patch.reeferCount ?? existing.reeferCount,

    mainEngineCount: patch.mainEngineCount ?? existing.mainEngineCount,
    mainEngineHours: patch.mainEngineHours ?? existing.mainEngineHours,

    generatorCount: patch.generatorCount ?? existing.generatorCount,
    generatorHours: patch.generatorHours ?? existing.generatorHours,

    fuelUsed: patch.fuelUsed ?? existing.fuelUsed,

    avgSpeed: patch.avgSpeed ?? existing.avgSpeed,

    remark: patch.remark ?? existing.remark,
  };

  // ✅ บังคับ required fields ตาม type เดิม
  return activityBodySchema.parse(merged);
};

export const listByVoyage = async (voyageId, user) => {
  await ensureVoyageAccess(voyageId, user);

  return prisma.activity.findMany({
    where: { voyageId, active: true },
    orderBy: { startAt: "desc" },
  });
};

export const createActivity = async (voyageId, data, user) => {
  await ensureVoyageAccess(voyageId, user, { requireOpen: true });

  // data ผ่าน validate middleware มาแล้วก็จริง แต่ validate ซ้ำให้ชัวร์
  const parsed = activityBodySchema.parse(data);

  const d = new Date(parsed.startAt);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;

  return prisma.activity.create({
    data: {
      voyageId,
      type: parsed.type,
      startAt: parsed.startAt,
      endAt: parsed.endAt,
      year,
      month,

      containerCount: parsed.containerCount ?? null,
      totalContainerWeight: parsed.totalContainerWeight ?? null,

      reeferCount: parsed.reeferCount ?? null,

      mainEngineCount: parsed.mainEngineCount ?? null,
      mainEngineHours: parsed.mainEngineHours ?? null,

      generatorCount: parsed.generatorCount ?? null,
      generatorHours: parsed.generatorHours ?? null,

      fuelUsed: parsed.fuelUsed ?? null,

      avgSpeed: parsed.avgSpeed ?? null,

      remark: parsed.remark ?? null,

      createdById: user.id,
    },
  });
};

export const getById = async (id, user) => {
  // ใช้ ensureActivityAccess เพื่อเช็คสิทธิ์ด้วย
  const activity = await ensureActivityAccess(id, user);

  // ถ้าอยาก include ข้อมูล voyage/vessel เพิ่มได้
  return prisma.activity.findUnique({
    where: { id: activity.id },
    include: {
      voyage: {
        select: {
          id: true,
          voyNo: true,
          postingYear: true,
          postingMonth: true,
          vessel: { select: { id: true, code: true, name: true } },
        },
      },
      createdBy: { select: { id: true, name: true, email: true, role: true } },
    },
  });
};

export const updateActivity = async (id, patch, user) => {
  const existing = await ensureActivityAccess(id, user);

  // ถ้า voyage ปิดแล้ว ห้ามแก้ (แนะนำ)
  await ensureVoyageAccess(existing.voyageId, user, { requireOpen: true });

  const validated = validatePatchByExistingType(existing, patch);

  const d = new Date(validated.startAt);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;

  return prisma.activity.update({
    where: { id },
    data: {
      startAt: validated.startAt,
      endAt: validated.endAt,
      year,
      month,

      containerCount: validated.containerCount ?? null,
      totalContainerWeight: validated.totalContainerWeight ?? null,

      reeferCount: validated.reeferCount ?? null,

      mainEngineCount: validated.mainEngineCount ?? null,
      mainEngineHours: validated.mainEngineHours ?? null,

      generatorCount: validated.generatorCount ?? null,
      generatorHours: validated.generatorHours ?? null,

      fuelUsed: validated.fuelUsed ?? null,

      avgSpeed: validated.avgSpeed ?? null,

      remark: validated.remark ?? null,

      ...(typeof patch.active === "boolean" ? { active: patch.active } : {}),
    },
  });
};

export const removeActivity = async (id, user) => {
  const existing = await ensureActivityAccess(id, user);

  // ถ้า voyage ปิดแล้ว ห้ามลบ (แล้วแต่ policy)
  await ensureVoyageAccess(existing.voyageId, user, { requireOpen: true });

  return prisma.activity.update({
    where: { id },
    data: { active: false },
  });
};
