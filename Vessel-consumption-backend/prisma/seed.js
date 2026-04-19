// prisma/seed.js
import prisma from "../src/config/prisma.js";
import bcrypt from "bcryptjs";



const pad3 = (n) => String(n).padStart(3, "0");
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max, d = 2) => Number((min + Math.random() * (max - min)).toFixed(d));
const addHours = (date, h) => new Date(date.getTime() + h * 3600000);
const addMinutes = (date, m) => new Date(date.getTime() + m * 60000);

function makeStartInMonth(year, month, dayOffset = 0) {
  const day  = Math.min(dayOffset + 1, 28);
  const hour = randInt(0, 23);
  const min  = [0, 10, 15, 20, 30, 40, 45, 50][randInt(0, 7)];
  return new Date(Date.UTC(year, month - 1, day, hour, min, 0));
}

// ── Activity builders ──────────────────────────────────────────────────────

function buildCargo(type, seg, userId) {
  const dur = Math.max(0.5, (seg.endAt - seg.startAt) / 3600000);
  const c20 = randInt(5, 40);
  const c40 = randInt(3, 20);
  const weight = randFloat((c20 + c40) * 8, (c20 + c40) * 18, 3);
  const g1h = dur, g2h = dur, dkh = dur * 0.5;
  const fuelUsed = Number((dur * (randFloat(40, 100) + randFloat(30, 80)) + randFloat(5, 20)).toFixed(2));
  const berthZone = ["BKK","LCB"][randInt(0,1)];
  const berthSubs = { BKK: ["BMT","STT 6","STT 4A","PAT 20G","TICT","TCT"], LCB: ["KLN","SCSP","PA1","PA2","A0","A1","B1","B2","C1","D1"] };
  const berthSub = berthSubs[berthZone][randInt(0, berthSubs[berthZone].length - 1)];
  return {
    type,
    startAt: seg.startAt, endAt: seg.endAt,
    year: seg.startAt.getUTCFullYear(), month: seg.startAt.getUTCMonth() + 1,
    active: true, createdById: userId,
    container20Count: c20, container40Count: c40,
    totalContainerWeight: weight,
    reeferCount: randInt(0, 6),
    generator1Count: 1, generator1Hours: g1h,
    generator2Count: 1, generator2Hours: g2h,
    deckgenCount: 1,    deckgenHours: dkh,
    draftFore: randFloat(3.0, 5.5, 2).toFixed(2),
    draftAft:  randFloat(3.5, 6.0, 2).toFixed(2),
    berth: berthZone, berthSub,
    fuelUsed,
    remark: null,
  };
}

function buildManoeuvring(seg, userId) {
  const dur = Math.max(0.5, (seg.endAt - seg.startAt) / 3600000);
  const fuelUsed = Number((dur * (randFloat(180, 380) + randFloat(40, 100))).toFixed(2));
  return {
    type: "MANOEUVRING",
    startAt: seg.startAt, endAt: seg.endAt,
    year: seg.startAt.getUTCFullYear(), month: seg.startAt.getUTCMonth() + 1,
    active: true, createdById: userId,
    reeferCount: randInt(0, 4),
    mainEngine1Count: 1, mainEngine1Hours: dur,
    mainEngine2Count: 1, mainEngine2Hours: dur,
    generator1Count: 1,  generator1Hours: dur,
    generator2Count: 1,  generator2Hours: dur,
    currentDirection: ["AGAINST","WITH"][randInt(0,1)],
    fuelUsed, remark: null,
  };
}

function buildFullSpeed(seg, userId) {
  const dur = Math.max(0.5, (seg.endAt - seg.startAt) / 3600000);
  const fuelUsed = Number((dur * (randFloat(200, 420) + randFloat(40, 100))).toFixed(2));
  return {
    type: "FULL_SPEED_AWAY",
    startAt: seg.startAt, endAt: seg.endAt,
    year: seg.startAt.getUTCFullYear(), month: seg.startAt.getUTCMonth() + 1,
    active: true, createdById: userId,
    reeferCount: randInt(0, 4),
    mainEngine1Count: 1, mainEngine1Hours: dur,
    mainEngine2Count: 1, mainEngine2Hours: dur,
    generator1Count: 1,  generator1Hours: dur,
    generator2Count: 1,  generator2Hours: dur,
    avgSpeed: randFloat(6.5, 14.0, 2),
    currentDirection: ["AGAINST","WITH"][randInt(0,1)],
    windDirection: ["N","NE","E","SE","S","SW","W","NW"][randInt(0,7)],
    fuelUsed, remark: null,
  };
}

function buildAnchoring(seg, userId) {
  const dur = Math.max(0.5, (seg.endAt - seg.startAt) / 3600000);
  const fuelUsed = Number((dur * randFloat(40, 120)).toFixed(2));
  return {
    type: "ANCHORING",
    startAt: seg.startAt, endAt: seg.endAt,
    year: seg.startAt.getUTCFullYear(), month: seg.startAt.getUTCMonth() + 1,
    active: true, createdById: userId,
    container20Count: randInt(0, 5),
    container40Count: randInt(0, 3),
    reeferCount: randInt(0, 4),
    generator1Count: 1, generator1Hours: dur,
    generator2Count: 1, generator2Hours: dur,
    deckgenCount: 1,    deckgenHours: dur * 0.5,
    draftFore: randFloat(3.0, 5.5, 2).toFixed(2),
    draftAft:  randFloat(3.5, 6.0, 2).toFixed(2),
    anchorLocation: ["อ่าวไทย","ปากน้ำ","สมุทรปราการ","ชลบุรี","ระยอง"][randInt(0,4)],
    fuelUsed, remark: null,
  };
}

function buildOther(seg, userId) {
  return {
    type: "OTHER",
    startAt: seg.startAt, endAt: seg.endAt,
    year: seg.startAt.getUTCFullYear(), month: seg.startAt.getUTCMonth() + 1,
    active: true, createdById: userId,
    remark: ["ตรวจเช็คเครื่องยนต์","งานเอกสาร","รอสภาพอากาศ","ซ่อมบำรุง"][randInt(0,3)],
  };
}

// แบ่ง voyage เป็น 6 segments ครอบทุก activity type
function chunkVoyage(startAt, endAt) {
  const totalMin = Math.max(360, Math.floor((endAt - startAt) / 60000));
  const weights = [
    { type: "CARGO_LOAD",      w: 15 },
    { type: "MANOEUVRING",     w: 10 },
    { type: "FULL_SPEED_AWAY", w: 35 },
    { type: "ANCHORING",       w: 10 },
    { type: "CARGO_DISCHARGE", w: 15 },
    { type: "OTHER",           w: 5  },
  ];
  const wSum = weights.reduce((a, x) => a + x.w, 0);
  const mins = weights.map((x) => ({ type: x.type, minutes: Math.max(30, Math.floor((totalMin * x.w) / wSum)) }));

  // ปรับให้ sum = totalMin
  let diff = totalMin - mins.reduce((a, x) => a + x.minutes, 0);
  while (diff !== 0) {
    const idx = randInt(0, mins.length - 1);
    if (diff > 0) { mins[idx].minutes += 1; diff--; }
    else if (mins[idx].minutes > 30) { mins[idx].minutes -= 1; diff++; }
  }

  const segments = [];
  let cursor = new Date(startAt);
  for (const m of mins) {
    const s = cursor;
    const e = addMinutes(s, m.minutes);
    segments.push({ type: m.type, startAt: s, endAt: e });
    cursor = e;
  }
  segments[segments.length - 1].endAt = new Date(endAt);
  return segments;
}

// ── Reset ──────────────────────────────────────────────────────────────────

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

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  await resetAll();

  // ── Users (ทุก role) ───────────────────────────────────────────────────────
  console.log("👤 สร้าง users...");
  const hash = async (pw) => bcrypt.hash(pw, 10);

  const users = await Promise.all([
    prisma.user.create({ data: { email: "admin@demo.local",      password: await hash("Admin1234!"),      name: "Admin Demo",      role: "ADMIN"      } }),
    prisma.user.create({ data: { email: "manager@demo.local",    password: await hash("Manager1234!"),    name: "Manager Demo",    role: "MANAGER"    } }),
    prisma.user.create({ data: { email: "supervisor@demo.local", password: await hash("Supervisor1234!"), name: "Supervisor Demo", role: "SUPERVISOR" } }),
    prisma.user.create({ data: { email: "employee@demo.local",   password: await hash("Employee1234!"),   name: "Employee Demo",   role: "EMPLOYEE"   } }),
    prisma.user.create({ data: { email: "charterer@demo.local",  password: await hash("Charterer1234!"),  name: "Charterer Demo",  role: "CHARTERER"  } }),
  ]);

  const [admin, , , employee] = users;
  console.log("✅ Users:", users.map((u) => `${u.role}(${u.email})`).join(", "));

  // ── Vessels (3 ลำ) ─────────────────────────────────────────────────────────
  console.log("🚢 สร้างเรือ 3 ลำ...");
  const vessels = await prisma.$transaction([
    prisma.vessel.create({ data: {
      code: "VSL-001", name: "SRI AMPHAN", shortName: "SAP",
      type: "CONTAINER VESSEL", active: true,
      imoNumber: "1068437", callSign: "HSB 8727",
      flag: "TG", portOfRegistry: "BANGKOK",
      grt: 1438, nrt: 739, dwtSummer: 1898,
      loaMeters: 49.98, breadthMeters: 15.80, depthMeters: 6.00,
      draftSummer: 3.60, containerStowageTeu: 120,
      mainEngineP: "Shandong Welfang / 350 kW", mainEnginePKw: 350, mainEnginePCons: 32,
      mainEngineS: "Zibo Z6170 ZLCZ / 350 kW",  mainEngineSKw: 350, mainEngineSCons: 32,
      generator1: "DEUTZ 226B TD226B-4C", generator1Kw: 50, generator1Cons: 7.5,
      generator2: "DEUTZ 226B TD226B-4C", generator2Kw: 50, generator2Cons: 7.5,
      charterer: "River Network Co.,Ltd.",
    }}),
    prisma.vessel.create({ data: {
      code: "VSL-002", name: "SRI SUKHOTHAI", shortName: "SSK",
      type: "CONTAINER VESSEL", active: true,
      flag: "TG", portOfRegistry: "BANGKOK",
      grt: 1520, nrt: 780, dwtSummer: 2100,
      loaMeters: 52.40, breadthMeters: 16.20, depthMeters: 6.50,
      draftSummer: 3.80, containerStowageTeu: 140,
      charterer: "River Network Co.,Ltd.",
    }}),
    prisma.vessel.create({ data: {
      code: "VSL-003", name: "SRI AYUTTHAYA", shortName: "SAY",
      type: "CONTAINER VESSEL", active: true,
      flag: "TG", portOfRegistry: "BANGKOK",
      grt: 1380, nrt: 710, dwtSummer: 1750,
      loaMeters: 48.50, breadthMeters: 15.40, depthMeters: 5.80,
      draftSummer: 3.40, containerStowageTeu: 110,
      charterer: "River Network Co.,Ltd.",
    }}),
  ]);
  console.log("✅ Vessels:", vessels.map((v) => v.name).join(", "));

  // assign employee ให้ทุกลำ
  await Promise.all(vessels.map((v) =>
    prisma.vesselAssignment.create({ data: { userId: employee.id, vesselId: v.id, active: true } })
  ));

  // ── Voyages + Activities + Fuel ────────────────────────────────────────────
  const months = [
    { y: 2026, m: 1 },
    { y: 2026, m: 2 },
    { y: 2026, m: 3 },
  ];

  const VOY_PER_MONTH = 20;
  let totalVoy = 0, totalAct = 0;

  console.log("🧾 สร้าง Voyages + Activities + Fuel (ม.ค.-มี.ค. 2026)...");

  for (const vessel of vessels) {
    for (const mm of months) {
      for (let i = 0; i < VOY_PER_MONTH; i++) {
        const startAt  = makeStartInMonth(mm.y, mm.m, i);
        const durationH = randInt(10, 40);
        const endAt    = addHours(startAt, durationH);

        const voyNo = `${vessel.code}-${String(mm.y).slice(2)}${String(mm.m).padStart(2,"0")}-${pad3(i+1)}`;

        // segments → activities
        const segments = chunkVoyage(startAt, endAt);
        const activitiesData = segments.map((seg) => {
          switch (seg.type) {
            case "CARGO_LOAD":      return buildCargo("CARGO_LOAD",      seg, admin.id);
            case "CARGO_DISCHARGE": return buildCargo("CARGO_DISCHARGE", seg, admin.id);
            case "MANOEUVRING":     return buildManoeuvring(seg, admin.id);
            case "FULL_SPEED_AWAY": return buildFullSpeed(seg, admin.id);
            case "ANCHORING":       return buildAnchoring(seg, admin.id);
            case "OTHER":           return buildOther(seg, admin.id);
            default:                return buildOther(seg, admin.id);
          }
        });

        // คำนวณ fuel consumed
        const consumed = activitiesData.reduce((acc, a) => acc + (Number(a.fuelUsed ?? 0) || 0), 0);

        // bunker events (0-2 ครั้ง)
        const bunkerCount = randInt(0, 2);
        const bunkers = [];
        let bunkeredTotal = 0;
        for (let b = 0; b < bunkerCount; b++) {
          const amount = randFloat(1000, 6000, 2);
          bunkeredTotal += amount;
          bunkers.push({
            at:     addHours(startAt, randInt(1, Math.max(2, durationH - 1))),
            amount, unit: "L",
            remark: "เติมน้ำมัน (DEMO)",
          });
        }

        // ROB
        let openingRob = randFloat(8000, 25000, 2);
        if (openingRob + bunkeredTotal - consumed < 0) openingRob = consumed + 3000;
        const closingRob = Number((openingRob + bunkeredTotal - consumed).toFixed(2));

        // create voyage with nested
        await prisma.voyage.create({
          data: {
            vesselId:     vessel.id,
            voyNo,
            startAt, endAt,
            status:       "CLOSED",
            active:       true,
            postingYear:  mm.y,
            postingMonth: mm.m,

            fuelRob: { create: { openingRob, closingRob, unit: "L" } },

            fuelBunkers: bunkers.length ? { create: bunkers } : undefined,

            activities: { create: activitiesData },
          },
        });

        totalVoy++;
        totalAct += activitiesData.length;
      }
      console.log(`  ✅ ${vessel.code} - ${mm.m}/${mm.y}: ${VOY_PER_MONTH} voyages`);
    }
  }

  console.log("\n🎉 Seed เสร็จสิ้น!");
  console.log(`📊 สรุป:`);
  console.log(`   - Users:      ${users.length} คน`);
  console.log(`   - Vessels:    ${vessels.length} ลำ`);
  console.log(`   - Voyages:    ${totalVoy} รายการ`);
  console.log(`   - Activities: ${totalAct} รายการ`);
  console.log(`\n🔑 Login credentials:`);
  users.forEach((u) => console.log(`   ${u.role.padEnd(12)} ${u.email}`));
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });