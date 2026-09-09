import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";

// Additive routine seed. Never deletes.
const url = process.env.DATABASE_URL ?? "file:./dev.db";
const adapter = url.startsWith("postgres")
  ? new PrismaPg({ connectionString: url })
  : new PrismaBetterSqlite3({ url });
const db = new PrismaClient({ adapter });

const PERIODS = [
  { start: "09:00", end: "09:40", subject: "Mathematics", teacher: "Rajesh Kumar" },
  { start: "09:40", end: "10:20", subject: "English", teacher: "Pooja Sharma" },
  { start: "10:20", end: "11:00", subject: "Science", teacher: "Rajesh Kumar" },
  { start: "11:00", end: "11:20", subject: "Break", teacher: "" },
  { start: "11:20", end: "12:00", subject: "Punjabi", teacher: "Harjeet Kaur" },
  { start: "12:00", end: "12:40", subject: "Social Science", teacher: "Pooja Sharma" },
  { start: "12:40", end: "13:20", subject: "Lunch", teacher: "" },
  { start: "13:20", end: "14:00", subject: "Computer", teacher: "Amandeep Singh" },
  { start: "14:00", end: "14:40", subject: "Sports", teacher: "Balwinder Singh" },
];

const TIFFIN = [
  "Rajma + Rice + Salad", "Dal + Roti + Fruit", "Veg Biryani + Raita",
  "Chole + Rice + Salad", "Paneer + Roti + Fruit", "Poori + Aloo + Halwa",
];

async function main() {
  const sch1 = await db.school.findFirst({ where: { name: { contains: "Guru Nanak" } } });
  if (!sch1) throw new Error("Base seed missing.");

  if ((await db.timetableSlot.count({ where: { schoolId: sch1.id } })) === 0) {
    for (let day = 1; day <= 5; day++) {
      for (let i = 0; i < PERIODS.length; i++) {
        await db.timetableSlot.create({
          data: { schoolId: sch1.id, day, periodNo: i + 1, ...PERIODS[i], className: "10-A" },
        });
      }
    }
  }
  if ((await db.mealMenu.count({ where: { schoolId: sch1.id } })) === 0) {
    for (let day = 1; day <= 6; day++) {
      await db.mealMenu.create({ data: { schoolId: sch1.id, day, meal: "Lunch", items: TIFFIN[day - 1] } });
    }
  }
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const rajesh = await db.staffMember.findFirst({ where: { name: "Rajesh Kumar" } });
  if (rajesh && (await db.staffLeave.count({ where: { staffId: rajesh.id, date: today } })) === 0) {
    await db.staffLeave.create({
      data: { staffId: rajesh.id, schoolId: sch1.id, date: today, reason: "Family function", substitute: "Pooja Sharma", status: "Approved" },
    });
  }
  const arsh = await db.student.findFirst({ where: { name: "Arshdeep Singh" } });
  if (arsh && (await db.starPoint.count({ where: { studentId: arsh.id } })) === 0) {
    await db.starPoint.createMany({
      data: [
        { studentId: arsh.id, schoolId: sch1.id, points: 2, note: "Excellent maths test", givenBy: "Rajesh Kumar", date: today },
        { studentId: arsh.id, schoolId: sch1.id, points: 1, note: "Helped a junior", givenBy: "Harjeet Kaur", date: today },
      ],
    });
  }
  console.log("Routine seed complete: timetable, tiffin, leave, stars.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
