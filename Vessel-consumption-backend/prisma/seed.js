// prisma/seed.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Utils
 */
const pad3 = (n) => String(n).padStart(3, "0");

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max, d = 2) =>
  Number((min + Math.random() * (max - min)).toFixed(d));

const addHours = (date, hours) => new Date(date.getTime() + hours * 3600 * 1000);
const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60 * 1000);

function makeRandomStartInMonth(year, month /* 1-12 */) {
  const day = randInt(1, 28);
  const hour = randInt(0, 23);
  const minute = [0, 10, 15, 20, 30, 40, 45, 50][randInt(0, 7)];
  return new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
}

function chunkVoyageIntoActivities(startAt, endAt) {
  // สร้าง segment เรียงเวลา ให้ครบทุก activity type
  const totalMin = Math.max(6 * 60, Math.floor((endAt - startAt) / 60000)); // อย่างน้อย 6 ชม.
  const weights = [
    { type: "CARGO_LOAD", w: 18 },
    { type: "MANOEUVRING", w: 10 },
    { type: "FULL_SPEED_AWAY", w: 40 },
    { type: "ANCHORING", w: 10 },
    { type: "CARGO_DISCHARGE", w: 18 },
    { type: "OTHER", w: 4 },
  ];
  const wSum = weights.reduce((a, x) => a + x.w, 0);

  // allocate minutes per type (ขั้นต่ำ 30 นาที)
  const mins = weights.map((x) => ({
    type: x.type,
    minutes: Math.max(30, Math.floor((totalMin * x.w) / wSum)),
  }));

  // ปรับ minute รวมให้พอดี totalMin
  let used = mins.reduce((a, x) => a + x.minutes, 0);
  let diff = totalMin - used;
  while (diff !== 0) {
    const idx = randInt(0, mins.length - 1);
    if (diff > 0) {
      mins[idx].minutes += 1;
      diff -= 1;
    } else {
      if (mins[idx].minutes > 30) {
        mins[idx].minutes -= 1;
        diff += 1;
      } else {
        // หาอันที่ลดได้
        const j = mins.findIndex((m) => m.minutes > 30);
        if (j === -1) break;
        mins[j].minutes -= 1;
        diff += 1;
      }
    }
  }

  // build timeline
  const segments = [];
  let cursor = new Date(startAt);
  for (const m of mins) {
    const s = cursor;
    const e = addMinutes(s, m.minutes);
    segments.push({ type: m.type, startAt: s, endAt: e, minutes: m.minutes });
    cursor = e;
  }

  // ถ้า cursor เลย endAt ให้ยึด endAt เป็นที่สุดท้าย
  segments[segments.length - 1].endAt = new Date(endAt);

  return segments;
}

function buildActivityPayload(seg, createdById) {
  const durationHours = Math.max(0.5, (seg.endAt - seg.startAt) / 3600000);

  const year = seg.startAt.getUTCFullYear();
  const month = seg.startAt.getUTCMonth() + 1;

  const common = {
    startAt: seg.startAt,
    endAt: seg.endAt,
    year,
    month,
    active: true,
    createdById,
  };

  if (seg.type === "OTHER") {
    return {
      type: "OTHER",
      ...common,
      remark: "งานอื่น ๆ / ตรวจเช็ค / เอกสาร",
    };
  }

  const reeferCount = randInt(0, 12);
  const mainEngineCount = randInt(1, 2);
  const generatorCount = randInt(1, 2);

  // ใช้ชั่วโมงเท่ากับ duration (ให้สมเหตุผล)
  const mainEngineHours = durationHours;
  const generatorHours = durationHours;

  // rate ลิตร/ชั่วโมง (ตั้งสมมติ)
  const meRate = randFloat(180, 420, 2);
  const genRate = randFloat(40, 120, 2);
  const reeferRate = reeferCount * randFloat(0.5, 2.0, 2); // เพิ่มตาม reefer

  const fuelUsed = Number((durationHours * (meRate + genRate) + reeferRate).toFixed(2));

  const base = {
    type: seg.type,
    ...common,
    reeferCount,
    mainEngineCount,
    mainEngineHours: mainEngineHours.toFixed(2),
    generatorCount,
    generatorHours: generatorHours.toFixed(2),
    fuelUsed: fuelUsed.toFixed(2),
    remark: null,
  };

  if (seg.type === "CARGO_LOAD" || seg.type === "CARGO_DISCHARGE") {
    const containerCount = randInt(10, 80);
    const totalContainerWeight = randFloat(containerCount * 8, containerCount * 18, 3); // น้ำหนักรวม
    return {
      ...base,
      containerCount,
      totalContainerWeight: totalContainerWeight.toFixed(3),
    };
  }

  if (seg.type === "FULL_SPEED_AWAY") {
    return {
      ...base,
      avgSpeed: randFloat(8.5, 15.5, 2).toFixed(2),
    };
  }

  // MANOEUVRING / ANCHORING
  return base;
}

async function ensureAdminUser() {
  let admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (admin) return admin;

  // fallback (กรณีไม่มี user เลย)
  let hash = "password";
  try {
    const bcrypt = (await import("bcrypt")).default;
    hash = await bcrypt.hash("Admin1234!", 10);
  } catch {
    // ถ้าไม่มี bcrypt ก็สร้างไม่ได้แบบ login ได้ (แต่ปกติคุณมี admin อยู่แล้ว)
  }

  admin = await prisma.user.create({
    data: {
      email: "admin@demo.local",
      password: hash,
      name: "Admin Demo",
      role: "ADMIN",
    },
  });

  return admin;
}

async function resetVoyageDataOnly() {
  // ลบข้อมูลที่เกี่ยวกับ voyage/activity/fuel ก่อน (ไม่ลบ user)
  await prisma.fuelBunkerEvent.deleteMany({});
  await prisma.fuelRob.deleteMany({});
  await prisma.consumption.deleteMany({}); // เผื่อมี
  await prisma.activity.deleteMany({});
  await prisma.voyage.deleteMany({});
  await prisma.vesselAssignment.deleteMany({});
  await prisma.vessel.deleteMany({});
}

async function main() {
  console.log("🔁 Reset voyage/activity/fuel data...");
  await resetVoyageDataOnly();

  const admin = await ensureAdminUser();
  console.log("👤 Using createdBy:", { id: admin.id, email: admin.email });

  console.log("🚢 Creating 4 vessels...");
  const vessels = await prisma.$transaction([
    prisma.vessel.create({
      data: { code: "VSL-001", name: "Vessel 001", type: "CONTAINER", active: true },
    }),
    prisma.vessel.create({
      data: { code: "VSL-002", name: "Vessel 002", type: "CONTAINER", active: true },
    }),
    prisma.vessel.create({
      data: { code: "VSL-003", name: "Vessel 003", type: "CONTAINER", active: true },
    }),
    prisma.vessel.create({
      data: { code: "VSL-004", name: "Vessel 004", type: "CONTAINER", active: true },
    }),
  ]);

  // เดือน 9/2025 ถึง 12/2025
  const months = [
    { y: 2025, m: 9 },
    { y: 2025, m: 10 },
    { y: 2025, m: 11 },
    { y: 2025, m: 12 },
  ];

  let totalVoy = 0;
  let totalAct = 0;

  console.log("🧾 Creating voyages + activities + fuel (Sep-Dec 2025)...");
  for (const v of vessels) {
    for (const mm of months) {
      const voyCount = randInt(20, 23);

      for (let i = 1; i <= voyCount; i++) {
        const startAt = makeRandomStartInMonth(mm.y, mm.m);
        const durationH = randInt(8, 36);
        const endAt = addHours(startAt, durationH);

        const voyNo = `${v.code}-${String(mm.y).slice(2)}${String(mm.m).padStart(2, "0")}-${pad3(i)}`;

        // activities
        const segments = chunkVoyageIntoActivities(startAt, endAt);
        const activitiesPayload = segments.map((seg) => buildActivityPayload(seg, admin.id));

        const consumed = activitiesPayload.reduce(
          (acc, a) => acc + (Number(a.fuelUsed ?? 0) || 0),
          0
        );

        // bunker events (0-2)
        const bunkerCount = randInt(0, 2);
        const bunkers = [];
        let bunkeredTotal = 0;
        for (let b = 0; b < bunkerCount; b++) {
          const at = addHours(startAt, randInt(1, Math.max(2, durationH - 1)));
          const amount = randFloat(800, 7000, 2);
          bunkeredTotal += amount;
          bunkers.push({
            at,
            amount,
            unit: "L",
            remark: "เติมน้ำมัน (DEMO)",
          });
        }

        // ROB
        let openingRob = randFloat(8000, 25000, 2);
        // กันไม่ให้ closing ติดลบ
        if (openingRob + bunkeredTotal - consumed < 0) {
          openingRob = consumed + 2000;
        }
        const closingRob = Number((openingRob + bunkeredTotal - consumed).toFixed(2));

        // create voyage with nested
        await prisma.voyage.create({
          data: {
            vesselId: v.id,
            voyNo,
            startAt,
            endAt,
            status: "CLOSED",
            active: true,

            postingYear: mm.y,
            postingMonth: mm.m,

            fuelRob: {
              create: {
                openingRob,
                closingRob,
                unit: "L",
              },
            },

            fuelBunkers: bunkers.length
              ? {
                  create: bunkers,
                }
              : undefined,

            activities: {
              create: activitiesPayload,
            },
          },
        });

        totalVoy += 1;
        totalAct += activitiesPayload.length;
      }

      console.log(`✅ ${v.code} - ${mm.m}/${mm.y}: created ${voyCount} voyages`);
    }
  }

  console.log("🎉 Done!");
  console.log("Summary:", { vessels: vessels.length, voyages: totalVoy, activities: totalAct });
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
