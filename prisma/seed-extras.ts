import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// One-off extras seed — ADDITIVE ONLY, never deletes.
const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" });
const db = new PrismaClient({ adapter });

async function main() {
  const sch1 = await db.school.findFirst({ where: { name: { contains: "Guru Nanak" } } });
  const sch2 = await db.school.findFirst({ where: { name: { contains: "Akal" } } });
  if (!sch1) throw new Error("Base seed missing — run db:seed first.");

  // Driver keys on buses
  const buses = await db.bus.findMany();
  for (const b of buses) {
    if (!b.driverKey) {
      await db.bus.update({ where: { id: b.id }, data: { driverKey: "DRV-" + b.number.slice(-4) } });
    }
  }

  // Biometric device + machine codes on two students
  const existing = await db.device.findFirst({ where: { apiKey: "bio-demo-key-1" } });
  if (!existing) {
    await db.device.create({
      data: { name: "Main Gate Fingerprint", type: "biometric", schoolId: sch1.id, apiKey: "bio-demo-key-1", lastSummary: "Seeded — connect the agent to go live" },
    });
  }
  await db.student.updateMany({ where: { name: "Arshdeep Singh" }, data: { deviceCode: "STU-101" } });
  await db.student.updateMany({ where: { name: "Gurpreet Singh" }, data: { deviceCode: "STU-103" } });

  // Hiring demo
  const jobCount = await db.jobPosting.count();
  if (jobCount === 0) {
    const job = await db.jobPosting.create({
      data: { title: "Mathematics Teacher", schoolId: sch1.id, jobType: "Teacher", salary: "32000", status: "Open" },
    });
    await db.application.createMany({
      data: [
        { jobId: job.id, name: "Sandeep Kaur", phone: "98140-00011", qualification: "M.Sc Maths, B.Ed", experience: "6 years", stage: "Interview", score: 82 },
        { jobId: job.id, name: "Vikram Singh", phone: "98140-00022", qualification: "M.Sc Maths", experience: "2 years", stage: "Screening", score: 64 },
        { jobId: job.id, name: "Meena Rani", phone: "98140-00033", qualification: "B.Sc, B.Ed", experience: "9 years", stage: "Demo", score: 88 },
      ],
    });
  }

  // CRM demo
  const leadCount = await db.lead.count();
  if (leadCount === 0 && sch2) {
    await db.lead.createMany({
      data: [
        { parentName: "Kuldeep Singh", phone: "98150-11111", childName: "Eknoor Singh", childClass: "1-A", schoolId: sch2.id, source: "Walk-in", stage: "Visit Scheduled", followUp: "2026-09-10", notes: "Visited once, fee discussion pending" },
        { parentName: "Rani Kaur", phone: "98150-22222", childName: "Gursewak Singh", childClass: "6-B", schoolId: sch2.id, source: "Referral", stage: "Contacted", followUp: "2026-09-09", notes: "Neighbour of existing parent" },
        { parentName: "Mohd. Salim", phone: "98150-33333", childName: "Ayan", childClass: "3-A", schoolId: sch2.id, source: "Online", stage: "New", followUp: "2026-09-11", notes: "Website enquiry" },
      ],
    });
  }

  // Demo tuition centre — proves small institutes fit the same platform
  const tut = await db.school.findFirst({ where: { name: "Bright Future Tuition Centre" } });
  if (!tut) {
    await db.school.create({
      data: {
        name: "Bright Future Tuition Centre", city: "Ludhiana", kind: "Tuition Centre",
        students: 120, plan: "Micro — Rs. 999", status: "Paid", trialDays: 0, due: 0,
        since: "2026", onboarding: JSON.stringify(["Account created", "Plan selected (Micro)"]),
      },
    });
  }

  // One live ping so tracking shows movement
  const b1 = buses[0];
  if (b1) {
    await db.busPing.create({ data: { busId: b1.id, speed: 28, position: b1.position } });
  }

  console.log("Extras seed complete: ATS jobs, CRM leads, biometric device, driver keys, live ping.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
