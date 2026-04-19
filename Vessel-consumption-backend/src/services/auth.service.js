import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";

export const login = async (email, password) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Invalid credentials");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error("Invalid credentials");

  return user;
};

export const getMe = async (userId) => {
  const id = Number(userId);
  if (!id) throw createError(401, "Unauthorized");

  const me = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  if (!me) throw createError(404, "User not found");
  if (me.active === false) throw createError(403, "User is inactive");

  return me;
};