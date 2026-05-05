// prisma/seed.js
import prisma from "../src/config/prisma.js";
import bcrypt from "bcryptjs";

async function resetAll() {
  console.log("🗑  ล้างข้อมูลทั้งหมด...");
  await prisma.fuelBunkerEvent.deleteMany({});
  await prisma.fuelRob.deleteMany({});
  await prisma.consumption.deleteMany({});
  await prisma.activity.deleteMany({});
  await prisma.voyage.deleteMany({});
  await prisma.vesselAssignment.deleteMany({});
  await prisma.vessel.deleteMany({});
  await prisma.user.deleteMany({});
  console.log("✅ ล้างข้อมูลเสร็จ");
}

async function main() {
  await resetAll();

  console.log("👤 สร้าง admin user...");
  const admin = await prisma.user.create({
    data: {
      email:    "admin@demo.local",
      password: await bcrypt.hash("Admin1234!", 10),
      name:     "Admin Demo",
      role:     "ADMIN",
    },
  });

  console.log(`✅ สร้างสำเร็จ: ${admin.role} (${admin.email})`);
  console.log(`\n🔑 Login: admin@demo.local / Admin1234!`);
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });