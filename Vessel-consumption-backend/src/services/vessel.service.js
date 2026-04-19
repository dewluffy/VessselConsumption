import prisma from "../config/prisma.js";
import createError from "../utils/create-error.util.js";

export const getAll = (user) => {
  const isEmployee = user.role === "EMPLOYEE";

  return prisma.vessel.findMany({
    where: {
      active: true,
      ...(isEmployee
        ? {
            assignments: {
              some: { userId: user.id, active: true },
            },
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      code: true,
      active: true,
      createdAt: true,
      updatedAt: true,
      assignments: {
        where: { active: true },
        take: 1, // 1 คน 1 ลำ
        select: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });
};



export const getById = async (id, user) => {
  const isEmployee = user.role === "EMPLOYEE";

  const vessel = await prisma.vessel.findFirst({
    where: {
      id,
      active: true,
      ...(isEmployee
        ? {
            assignments: {
              some: { userId: user.id, active: true },
            },
          }
        : {}),
    },
  });

  if (!vessel) throw createError(404, "Vessel not found");
  return vessel;
};

export const create = async (data) => {
  return prisma.vessel.create({ data });
};

export const update = async (id, data) => {
  return prisma.vessel.update({ where: { id }, data });
};

export const remove = async (id) => {
  return prisma.vessel.update({
    where: { id },
    data: { active: false },
  });
};

export const assignUser = async (vesselId, userId) => {
  const vessel = await prisma.vessel.findFirst({
    where: { id: vesselId, active: true },
    select: { id: true },
  });
  if (!vessel) throw createError(404, "Vessel not found");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) throw createError(404, "User not found");

  const assignment = await prisma.vesselAssignment.upsert({
    where: { userId_vesselId: { userId, vesselId } },
    update: { active: true },
    create: { userId, vesselId, active: true },
  });

  return { message: "Assigned successfully", assignment };
};

export const unassignUser = async (vesselId, userId) => {
  // หา assignment ที่ active อยู่
  const assignment = await prisma.vesselAssignment.findUnique({
    where: { userId_vesselId: { userId, vesselId } },
  });

  if (!assignment || assignment.active === false) {
    throw createError(404, "Assignment not found");
  }

  const updated = await prisma.vesselAssignment.update({
    where: { userId_vesselId: { userId, vesselId } },
    data: { active: false },
  });

  return { message: "Unassigned successfully", assignment: updated };
};
