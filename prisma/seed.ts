import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" });
const db = new PrismaClient({ adapter });

async function main() {
  // Clean slate for demo seed
  await db.messageLog.deleteMany();
  await db.feeReceipt.deleteMany();
  await db.attendanceRecord.deleteMany();
  await db.examResult.deleteMany();
  await db.staffMember.deleteMany();
  await db.bus.deleteMany();
  await db.student.deleteMany();
  await db.user.deleteMany();
  await db.school.deleteMany();
  await db.siteSetting.deleteMany();

  const superPass = await bcrypt.hash("Admin@12345", 10);
  const schoolPass = await bcrypt.hash("School@12345", 10);

  const sch1 = await db.school.create({
    data: { name: "Guru Nanak Public School", city: "Ludhiana", students: 1240, plan: "Annual — Rs. 24,999", status: "Paid", trialDays: 0, due: 0, since: "2024", onboarding: JSON.stringify(["Account created", "Plan selected (Annual)", "12 classes added"]) },
  });
  const sch2 = await db.school.create({
    data: { name: "Akal Academy", city: "Amritsar", students: 860, plan: "Annual — Rs. 24,999", status: "Due", trialDays: 0, due: 182000, since: "2025", onboarding: JSON.stringify(["Account created", "Plan selected (Annual)"]) },
  });
  const sch3 = await db.school.create({
    data: { name: "City Montessori", city: "Jalandhar", students: 320, plan: "Trial", status: "Trial", trialDays: 6, due: 0, since: "2026", onboarding: JSON.stringify(["Account created", "Plan selected (Trial)", "12 classes added"]) },
  });
  const sch4 = await db.school.create({
    data: { name: "Dashmesh Model School", city: "Patiala", students: 540, plan: "Monthly — Rs. 2,499", status: "Paid", trialDays: 0, due: 0, since: "2025", onboarding: JSON.stringify(["Account created"]) },
  });

  await db.user.create({ data: { name: "Platform Owner", email: "owner@mecguracampus.com", passwordHash: superPass, role: "super" } });
  await db.user.create({ data: { name: "GNPS Admin", email: "school@gnps.com", passwordHash: schoolPass, role: "school", schoolId: sch1.id } });

  const pupils = [
    { name: "Arshdeep Singh", class: "10-A", schoolId: sch1.id, feeMonthly: 4500, feeDue: 4500, phone: "98140-11223", attendance: 92 },
    { name: "Simran Kaur", class: "10-A", schoolId: sch1.id, feeMonthly: 4500, feeDue: 0, phone: "98150-33445", attendance: 96 },
    { name: "Gurpreet Singh", class: "8-B", schoolId: sch1.id, feeMonthly: 3800, feeDue: 7600, phone: "98720-55667", attendance: 71 },
    { name: "Navjot Kaur", class: "5-A", schoolId: sch2.id, feeMonthly: 3200, feeDue: 3200, phone: "98155-77889", attendance: 88 },
    { name: "Harman Singh", class: "9-C", schoolId: sch2.id, feeMonthly: 4000, feeDue: 12000, phone: "98880-99001", attendance: 64 },
    { name: "Jasleen Kaur", class: "3-B", schoolId: sch3.id, feeMonthly: 2800, feeDue: 0, phone: "98140-22334", attendance: 98 },
    { name: "Manpreet Singh", class: "12-Sci", schoolId: sch4.id, feeMonthly: 5200, feeDue: 5200, phone: "98765-44332", attendance: 84 },
    { name: "Kirandeep Kaur", class: "7-A", schoolId: sch4.id, feeMonthly: 3500, feeDue: 0, phone: "98152-66778", attendance: 91 },
  ];
  const created: Record<string, string> = {};
  for (const p of pupils) {
    const s = await db.student.create({ data: p });
    created[p.name] = s.id;
  }

  await db.staffMember.createMany({
    data: [
      { name: "Harjeet Kaur", role: "Principal", schoolId: sch1.id, salary: 55000, status: "Paid" },
      { name: "Rajesh Kumar", role: "Mathematics Teacher", schoolId: sch1.id, salary: 32000, status: "Paid" },
      { name: "Amandeep Singh", role: "Accountant", schoolId: sch2.id, salary: 28000, status: "Pending" },
      { name: "Pooja Sharma", role: "English Teacher", schoolId: sch2.id, salary: 26000, status: "Pending" },
      { name: "Balwinder Singh", role: "Driver", schoolId: sch1.id, salary: 18000, status: "Paid" },
    ],
  });

  await db.bus.createMany({
    data: [
      { number: "PB-10-4521", route: "Model Town to School", kids: 42, status: "Live", position: 20, schoolId: sch1.id },
      { number: "PB-10-7834", route: "Civil Lines to School", kids: 38, status: "Live", position: 55, schoolId: sch1.id },
      { number: "PB-02-1190", route: "Cantt to School", kids: 35, status: "Offline", position: 80, schoolId: sch1.id },
      { number: "PB-10-9021", route: "Railway Road to School", kids: 29, status: "Live", position: 35, schoolId: sch1.id },
    ],
  });

  await db.feeReceipt.createMany({
    data: [
      { studentId: created["Simran Kaur"], studentName: "Simran Kaur", schoolId: sch1.id, schoolName: sch1.name, amount: 4500, date: new Date("2026-09-02"), mode: "UPI" },
      { studentId: created["Jasleen Kaur"], studentName: "Jasleen Kaur", schoolId: sch3.id, schoolName: sch3.name, amount: 2800, date: new Date("2026-09-03"), mode: "Cash" },
      { studentId: created["Kirandeep Kaur"], studentName: "Kirandeep Kaur", schoolId: sch4.id, schoolName: sch4.name, amount: 3500, date: new Date("2026-09-05"), mode: "Online" },
      { studentId: created["Navjot Kaur"], studentName: "Navjot Kaur", schoolId: sch2.id, schoolName: sch2.name, amount: 3200, date: new Date("2026-09-06"), mode: "UPI" },
    ],
  });

  await db.messageLog.createMany({
    data: [
      { recipient: "Gurpreet Singh (Parent)", template: "Fee Reminder", language: "Punjabi", status: "Delivered", schoolId: sch1.id },
      { recipient: "Class 10-A Parents (86)", template: "Result Published", language: "English", status: "Delivered", schoolId: sch1.id },
      { recipient: "Harman Singh (Parent)", template: "Low Attendance Alert", language: "Hindi", status: "Read", schoolId: sch2.id },
    ],
  });

  await db.siteSetting.createMany({
    data: [
      { key: "system_name", value: "MecguraCampus" },
      { key: "session", value: "2026-27" },
      { key: "default_language", value: "Punjabi + English" },
    ],
  });

  console.log("Seed complete: 4 schools, 8 students, 5 staff, 4 buses, 4 receipts, 2 users.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
