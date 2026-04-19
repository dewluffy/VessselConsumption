import prisma from "../config/prisma.js";

export const getMyVessels = async (userId) => {
  const vessels = await prisma.vessel.findMany({
    where: {
      active: true,
      assignments: {
        some: { userId, active: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return vessels;
};
