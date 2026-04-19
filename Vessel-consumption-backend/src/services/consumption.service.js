import prisma from "../config/prisma.js";
import createError from "../utils/create-error.util.js";


/**
 * Policy definition
 */
const POLICY = {
  CARGO_LOAD: {
    required: [{ category: "FUEL", scope: "GENERATOR" }],
    allowed: [
      { category: "FUEL", scope: "GENERATOR" },
      { category: "FUEL", scope: "MAIN_ENGINE" },
      { category: "OTHER", scope: "REEFER" }, // kWh / reefer power
      { category: "LUBE", scope: "MAIN_ENGINE" },
      { category: "LUBE", scope: "GENERATOR" },
      { category: "WATER", scope: "AUXILIARY" },
      { category: "WATER", scope: "OTHER" },
      { category: "OTHER", scope: "OTHER" },
    ],
  },
  CARGO_DISCHARGE: {
    required: [{ category: "FUEL", scope: "GENERATOR" }],
    allowed: [
      { category: "FUEL", scope: "GENERATOR" },
      { category: "FUEL", scope: "MAIN_ENGINE" },
      { category: "OTHER", scope: "REEFER" },
      { category: "LUBE", scope: "MAIN_ENGINE" },
      { category: "LUBE", scope: "GENERATOR" },
      { category: "WATER", scope: "AUXILIARY" },
      { category: "WATER", scope: "OTHER" },
      { category: "OTHER", scope: "OTHER" },
    ],
  },
  MANOEUVRING: {
    required: [
      { category: "FUEL", scope: "MAIN_ENGINE" },
      { category: "FUEL", scope: "GENERATOR" },
    ],
    allowed: [
      { category: "FUEL", scope: "MAIN_ENGINE" },
      { category: "FUEL", scope: "GENERATOR" },
      { category: "LUBE", scope: "MAIN_ENGINE" },
      { category: "LUBE", scope: "GENERATOR" },
      { category: "WATER", scope: "AUXILIARY" },
      { category: "WATER", scope: "OTHER" },
      { category: "OTHER", scope: "OTHER" },
    ],
  },
  FULL_SPEED_AWAY: {
    required: [
      { category: "FUEL", scope: "MAIN_ENGINE" },
      { category: "FUEL", scope: "GENERATOR" },
    ],
    allowed: [
      { category: "FUEL", scope: "MAIN_ENGINE" },
      { category: "FUEL", scope: "GENERATOR" },
      { category: "OTHER", scope: "REEFER" }, // kWh
      { category: "LUBE", scope: "MAIN_ENGINE" },
      { category: "LUBE", scope: "GENERATOR" },
      { category: "WATER", scope: "AUXILIARY" },
      { category: "WATER", scope: "OTHER" },
      { category: "OTHER", scope: "OTHER" },
    ],
  },
  ANCHORING: {
    required: [{ category: "FUEL", scope: "GENERATOR" }],
    allowed: [
      { category: "FUEL", scope: "GENERATOR" },
      { category: "OTHER", scope: "REEFER" }, // kWh
      { category: "LUBE", scope: "GENERATOR" },
      { category: "WATER", scope: "AUXILIARY" },
      { category: "WATER", scope: "OTHER" },
      { category: "OTHER", scope: "OTHER" },
    ],
  },
  OTHER: {
    required: [],
    allowed: "ANY",
  },
};

const getPolicy = (activityType) => POLICY[activityType] ?? POLICY.OTHER;

const matchRule = (rule, data) => rule.category === data.category && rule.scope === data.scope;

const enforceCommonRules = (data) => {
  // FUEL ห้ามเป็น KWH
  if (data.category === "FUEL" && data.unit === "KWH") {
    throw createError(400, "FUEL cannot use unit KWH");
  }
  // kWh แนะนำ scope เป็น REEFER (ไม่บังคับ แต่ถ้าอยากบังคับ ให้เปลี่ยนเป็น throw)
  if (data.unit === "KWH" && !["REEFER", "OTHER"].includes(data.scope)) {
    throw createError(400, "KWH unit should use scope REEFER or OTHER");
  }
};

const enforcePolicyForActivity = (activityType, data) => {
  enforceCommonRules(data);

  const policy = getPolicy(activityType);

  if (policy.allowed === "ANY") return;

  const ok = policy.allowed.some((r) => matchRule(r, data));
  if (!ok) {
    throw createError(
      400,
      `Consumption not allowed for activity type ${activityType} (category=${data.category}, scope=${data.scope})`
    );
  }
};

const computeMissingRequired = (policy, existingList) => {
  if (!policy.required?.length) return [];
  return policy.required.filter((need) => {
    return !existingList.some((x) => x.category === need.category && x.scope === need.scope && x.active === true);
  });
};

/**
 * Access helpers
 */
const ensureActivityAccess = async (activityId, user, { requireOpen = false } = {}) => {
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
      voyage: { select: { id: true, status: true } },
    },
  });

  if (!activity) throw createError(404, "Activity not found");
  if (requireOpen && activity.voyage.status === "CLOSED") throw createError(400, "Voyage is CLOSED");

  return activity;
};

const ensureConsumptionAccess = async (id, user, { requireOpen = false } = {}) => {
  const consumption = await prisma.consumption.findFirst({
    where: {
      id,
      active: true,
      activity: {
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
    },
    select: {
      id: true,
      activityId: true,
      category: true,
      scope: true,
      unit: true,
      activity: { select: { type: true, voyage: { select: { status: true } } } },
    },
  });

  if (!consumption) throw createError(404, "Consumption not found");
  if (requireOpen && consumption.activity.voyage.status === "CLOSED") throw createError(400, "Voyage is CLOSED");

  return consumption;
};

/**
 * CRUD
 */
export const listByActivity = async (activityId, user) => {
  await ensureActivityAccess(activityId, user);

  return prisma.consumption.findMany({
    where: { activityId, active: true },
    orderBy: { createdAt: "desc" },
  });
};

export const create = async (activityId, data, user) => {
  const activity = await ensureActivityAccess(activityId, user, { requireOpen: true });

  // ✅ ล็อกตาม type
  enforcePolicyForActivity(activity.type, data);

  const created = await prisma.consumption.create({
    data: {
      activityId,
      category: data.category,
      scope: data.scope,
      itemName: data.itemName,
      quantity: data.quantity,
      unit: data.unit,
      source: data.source ?? "MANUAL",
      remark: data.remark,
      createdById: user.id,
    },
  });

  // (optional) ส่ง missing required กลับไปให้ UI เตือน
  const policy = getPolicy(activity.type);
  if (policy.allowed !== "ANY") {
    const list = await prisma.consumption.findMany({
      where: { activityId, active: true },
      select: { category: true, scope: true, active: true },
    });
    const missing = computeMissingRequired(policy, list);
    return { created, missingRequired: missing };
  }

  return { created, missingRequired: [] };
};

export const update = async (id, patch, user) => {
  const existing = await ensureConsumptionAccess(id, user, { requireOpen: true });

  // merge เพื่อเช็ค rule หลัง patch (ใช้ค่าเดิมถ้าไม่ส่งมา)
  const merged = {
    category: patch.category ?? existing.category,
    scope: patch.scope ?? existing.scope,
    unit: patch.unit ?? existing.unit,
  };

  // ✅ ล็อกตาม type ของ activity เดิม
  enforcePolicyForActivity(existing.activity.type, merged);

  return prisma.consumption.update({
    where: { id },
    data: {
      ...(patch.category ? { category: patch.category } : {}),
      ...(patch.scope ? { scope: patch.scope } : {}),
      ...(patch.itemName ? { itemName: patch.itemName } : {}),
      ...(typeof patch.quantity === "number" ? { quantity: patch.quantity } : {}),
      ...(patch.unit ? { unit: patch.unit } : {}),
      ...(patch.source ? { source: patch.source } : {}),
      ...(patch.remark !== undefined ? { remark: patch.remark } : {}),
      ...(typeof patch.active === "boolean" ? { active: patch.active } : {}),
    },
  });
};

export const remove = async (id, user) => {
  await ensureConsumptionAccess(id, user, { requireOpen: true });

  return prisma.consumption.update({
    where: { id },
    data: { active: false },
  });
};

/**
 * ✅ ใช้ตอนปิด VOY: ตรวจว่า activity แต่ละอัน “required consumptions” ครบ
 */
export const validateVoyageConsumptionsBeforeClose = async (voyageId) => {
  const activities = await prisma.activity.findMany({
    where: { voyageId, active: true },
    select: { id: true, type: true },
  });

  const problems = [];

  for (const a of activities) {
    const policy = getPolicy(a.type);
    if (policy.allowed === "ANY") continue;

    const list = await prisma.consumption.findMany({
      where: { activityId: a.id, active: true },
      select: { category: true, scope: true, active: true },
    });

    const missing = computeMissingRequired(policy, list);
    if (missing.length) {
      problems.push({ activityId: a.id, type: a.type, missing });
    }
  }

  return problems;
};
