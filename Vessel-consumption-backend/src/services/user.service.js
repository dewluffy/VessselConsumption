import prisma from "../config/prisma.js";
import createError from "../utils/create-error.util.js";
import bcrypt from "bcryptjs";

/**
 * Return safe user fields (no password)
 */
const userSelectSafe = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
  updatedAt: true,
};

export const listUsers = async (query) => {
  const q = (query?.q ?? "").trim();
  const role = (query?.role ?? "").trim();
  const unassigned = query?.unassigned === true;
  const minimal = query?.minimal === true;

  const where = {
    ...(q
      ? {
          OR: [
            { email: { contains: q } },
            { name: { contains: q } },
            { role: { contains: q } },
          ],
        }
      : {}),
    ...(role ? { role } : {}),
    ...(unassigned
      ? {
          // ✅ ยังไม่ถูก assign (ไม่มี assignment active)
          assignments: { none: { active: true } },
        }
      : {}),
  };

  // ✅ ถ้าใช้ทำ dropdown ให้ส่งข้อมูลเท่าที่จำเป็น (เบา + เร็ว)
  const selectMinimal = {
    id: true,
    email: true,
    name: true,
    role: true,
  };

  const selectFull = {
    id: true,
    email: true,
    name: true,
    role: true,
    createdAt: true,
    updatedAt: true,
    assignments: {
      where: { active: true },
      select: {
        vessel: { select: { id: true, name: true, code: true } },
      },
    },
  };

  return prisma.user.findMany({
    where,
    select: minimal ? selectMinimal : selectFull,
    orderBy: { id: "desc" },
  });
};


export const getUserById = async (id) => {
  const userId = Number(id);
  if (!userId) throw createError(400, "Invalid user id");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelectSafe,
  });

  if (!user) throw createError(404, "User not found");
  return user;
};

export const createUser = async (data) => {
  const email = data.email?.trim();
  const name = data.name?.trim() || null;
  const role = data.role;
  const password = data.password;

  // ป้องกันเคสซ้ำ
  const existed = await prisma.user.findUnique({ where: { email } });
  if (existed) throw createError(409, "Email already exists");

  const hashed = await bcrypt.hash(password, 10);

  const created = await prisma.user.create({
    data: {
      email,
      name,
      role,
      password: hashed,
    },
    select: userSelectSafe,
  });

  return created;
};

export const updateUser = async (id, data) => {
  const userId = Number(id);
  if (!userId) throw createError(400, "Invalid user id");

  // ensure exists
  const existed = await prisma.user.findUnique({ where: { id: userId } });
  if (!existed) throw createError(404, "User not found");

  // ถ้ามีการเปลี่ยน email ต้องกันชน
  if (data.email) {
    const email = data.email.trim();
    const emailOwner = await prisma.user.findUnique({ where: { email } });
    if (emailOwner && emailOwner.id !== userId) {
      throw createError(409, "Email already exists");
    }
  }

  const updateData = {
    ...(data.email ? { email: data.email.trim() } : {}),
    ...(data.name !== undefined ? { name: data.name?.trim() || null } : {}),
    ...(data.role ? { role: data.role } : {}),
  };

  // ถ้าต้องการ reset password
  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 10);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: userSelectSafe,
  });

  return updated;
};

export const removeUser = async (id) => {
  const userId = Number(id);
  if (!userId) throw createError(400, "Invalid user id");

  // กันลบตัวเอง (optional)
  // จะเช็คใน controller ก็ได้

  try {
    await prisma.user.delete({ where: { id: userId } });
    return { message: "User deleted" };
  } catch (err) {
    // FK constraint (เช่นมี assignment/activity/consumption ผูกอยู่) จะลบไม่ได้
    // Prisma code มักเป็น P2003
    if (err?.code === "P2003") {
      throw createError(400, "Cannot delete user because it is referenced by other records");
    }
    throw err;
  }
};
