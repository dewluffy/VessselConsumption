import prisma from "../config/prisma.js";
import createError from "../utils/create-error.util.js";
import { activityBodySchema } from "../validators/activity.schema.js";

const isRestricted = (user) =>
  user.role === "EMPLOYEE" || user.role === "CHARTERER";

const ensureVoyageAccess = async (voyageId, user, { requireOpen = false } = {}) => {
  const voyage = await prisma.voyage.findFirst({
    where: {
      id: voyageId,
      active: true,
      vessel: {
        active: true,
        ...(isRestricted(user)
          ? { assignments: { some: { userId: user.id, active: true } } }
          : {}),
      },
    },
    select: { id: true, status: true, vesselId: true },
  });
  if (!voyage) throw createError(404, "Voyage not found");
  if (requireOpen && voyage.status === "CLOSED") throw createError(400, "Voyage is CLOSED");
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
          ...(isRestricted(user)
            ? { assignments: { some: { userId: user.id, active: true } } }
            : {}),
        },
      },
    },
    select: {
      id: true, type: true, startAt: true, endAt: true, voyageId: true,
      container20Count: true, container40Count: true,
      totalContainerWeight: true,
      draftFore: true, draftAft: true,
      berth: true, berthSub: true, anchorLocation: true,
      generator1Count: true, generator1Hours: true,
      generator2Count: true, generator2Hours: true,
      deckgenCount: true, deckgenHours: true,
      mainEngine1Count: true, mainEngine1Hours: true,
      mainEngine2Count: true, mainEngine2Hours: true,
      reeferCount: true, fuelUsed: true,
      avgSpeed: true, currentDirection: true, windDirection: true,
      remark: true,
    },
  });
  if (!activity) throw createError(404, "Activity not found");
  return activity;
};

const validatePatchByExistingType = (existing, patch) => {
  if (patch.type && patch.type !== existing.type) throw createError(400, "Changing activity type is not allowed");

  const merged = {
    type:    existing.type,
    startAt: patch.startAt ?? existing.startAt,
    endAt:   patch.endAt   ?? existing.endAt,

    container20Count:     patch.container20Count     ?? existing.container20Count,
    container40Count:     patch.container40Count     ?? existing.container40Count,
    totalContainerWeight: patch.totalContainerWeight ?? existing.totalContainerWeight,
    draftFore:      patch.draftFore      ?? existing.draftFore,
    draftAft:       patch.draftAft       ?? existing.draftAft,
    berth:          patch.berth          ?? existing.berth,
    berthSub:       patch.berthSub       ?? existing.berthSub,
    anchorLocation: patch.anchorLocation ?? existing.anchorLocation,

    generator1Count: patch.generator1Count ?? existing.generator1Count,
    generator1Hours: patch.generator1Hours ?? existing.generator1Hours,
    generator2Count: patch.generator2Count ?? existing.generator2Count,
    generator2Hours: patch.generator2Hours ?? existing.generator2Hours,
    deckgenCount:    patch.deckgenCount    ?? existing.deckgenCount,
    deckgenHours:    patch.deckgenHours    ?? existing.deckgenHours,

    mainEngine1Count: patch.mainEngine1Count ?? existing.mainEngine1Count,
    mainEngine1Hours: patch.mainEngine1Hours ?? existing.mainEngine1Hours,
    mainEngine2Count: patch.mainEngine2Count ?? existing.mainEngine2Count,
    mainEngine2Hours: patch.mainEngine2Hours ?? existing.mainEngine2Hours,

    reeferCount:      patch.reeferCount      ?? existing.reeferCount,
    fuelUsed:         patch.fuelUsed         ?? existing.fuelUsed,
    avgSpeed:         patch.avgSpeed         ?? existing.avgSpeed,
    currentDirection: patch.currentDirection ?? existing.currentDirection,
    windDirection:    patch.windDirection     ?? existing.windDirection,
    remark:           patch.remark           ?? existing.remark,
  };

  return activityBodySchema.parse(merged);
};

const buildActivityData = (parsed) => {
  const isCargo     = parsed.type === "CARGO_LOAD" || parsed.type === "CARGO_DISCHARGE";
  const isAnchoring = parsed.type === "ANCHORING";
  const isFSW       = parsed.type === "FULL_SPEED_AWAY";
  const isMano      = parsed.type === "MANOEUVRING";
  const isOther     = parsed.type === "OTHER";

  const hasContainer  = isCargo || isAnchoring;
  const hasDeckgen    = isCargo || isAnchoring;
  const hasDraft      = isCargo || isAnchoring;
  const hasMainEngine = isFSW   || isMano;
  const hasCurrent    = isFSW   || isMano;
  const hasGenerator  = !isOther;

  const n = (v) => v ?? null;

  return {
    type: parsed.type, startAt: parsed.startAt, endAt: parsed.endAt,

    container20Count:     hasContainer ? n(parsed.container20Count)     : null,
    container40Count:     hasContainer ? n(parsed.container40Count)     : null,
    totalContainerWeight: isCargo      ? n(parsed.totalContainerWeight) : null,

    draftFore:      hasDraft    ? n(parsed.draftFore)      : null,
    draftAft:       hasDraft    ? n(parsed.draftAft)       : null,
    berth:          isCargo     ? n(parsed.berth)          : null,
    berthSub:       isCargo     ? n(parsed.berthSub)       : null,
    anchorLocation: isAnchoring ? n(parsed.anchorLocation) : null,

    generator1Count: hasGenerator ? n(parsed.generator1Count) : null,
    generator1Hours: hasGenerator ? n(parsed.generator1Hours) : null,
    generator2Count: hasGenerator ? n(parsed.generator2Count) : null,
    generator2Hours: hasGenerator ? n(parsed.generator2Hours) : null,

    deckgenCount: hasDeckgen ? n(parsed.deckgenCount) : null,
    deckgenHours: hasDeckgen ? n(parsed.deckgenHours) : null,

    mainEngine1Count: hasMainEngine ? n(parsed.mainEngine1Count) : null,
    mainEngine1Hours: hasMainEngine ? n(parsed.mainEngine1Hours) : null,
    mainEngine2Count: hasMainEngine ? n(parsed.mainEngine2Count) : null,
    mainEngine2Hours: hasMainEngine ? n(parsed.mainEngine2Hours) : null,

    currentDirection: hasCurrent ? n(parsed.currentDirection) : null,
    windDirection:    isFSW      ? n(parsed.windDirection)    : null,

    reeferCount: n(parsed.reeferCount),
    fuelUsed:    n(parsed.fuelUsed),
    avgSpeed:    isFSW ? n(parsed.avgSpeed) : null,
    remark:      n(parsed.remark),
  };
};

export const listByVoyage = async (voyageId, user) => {
  await ensureVoyageAccess(voyageId, user);
  return prisma.activity.findMany({ where: { voyageId, active: true }, orderBy: { startAt: "desc" } });
};

export const createActivity = async (voyageId, data, user) => {
  if (user.role === "CHARTERER") throw createError(403, "Forbidden");
  await ensureVoyageAccess(voyageId, user, { requireOpen: true });
  const parsed = activityBodySchema.parse(data);
  const d = new Date(parsed.startAt);
  return prisma.activity.create({
    data: {
      voyageId,
      year:  d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      ...buildActivityData(parsed),
      createdById: user.id,
    },
  });
};

export const getById = async (id, user) => {
  const activity = await ensureActivityAccess(id, user);
  return prisma.activity.findUnique({
    where: { id: activity.id },
    include: {
      voyage: { select: { id: true, voyNo: true, postingYear: true, postingMonth: true, vessel: { select: { id: true, code: true, name: true } } } },
      createdBy: { select: { id: true, name: true, email: true, role: true } },
    },
  });
};

export const updateActivity = async (id, patch, user) => {
  if (user.role === "CHARTERER") throw createError(403, "Forbidden");
  const existing = await ensureActivityAccess(id, user);
  await ensureVoyageAccess(existing.voyageId, user, { requireOpen: true });
  const validated = validatePatchByExistingType(existing, patch);
  const d = new Date(validated.startAt);
  return prisma.activity.update({
    where: { id },
    data: {
      year:  d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      ...buildActivityData(validated),
      ...(typeof patch.active === "boolean" ? { active: patch.active } : {}),
    },
  });
};

export const removeActivity = async (id, user) => {
  if (user.role === "CHARTERER") throw createError(403, "Forbidden");
  const existing = await ensureActivityAccess(id, user);
  await ensureVoyageAccess(existing.voyageId, user, { requireOpen: true });
  return prisma.activity.update({ where: { id }, data: { active: false } });
};