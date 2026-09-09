import { db } from "@/lib/db";
import { requireUser, unauthorized } from "@/lib/session";

/** Parent home — only their own linked children, with dues, results, notices, buses. */
export async function GET() {
  const user = await requireUser(["parent", "super"]);
  if (!user) return unauthorized();

  const kids = await db.student.findMany({
    where: user.role === "parent" ? { parentId: user.id } : {},
    include: {
      school: { select: { id: true, name: true } },
      exams: { orderBy: { subject: "asc" } },
      receipts: { orderBy: { date: "desc" }, take: 5 },
    },
    orderBy: { name: "asc" },
    take: 20,
  });
  const schoolIds = [...new Set(kids.map((k) => k.schoolId))];
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const [notices, buses, messages, presence, stars] = await Promise.all([
    db.notice.findMany({
      where: { schoolId: { in: schoolIds } },
      include: { school: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    db.bus.findMany({ where: { schoolId: { in: schoolIds } }, orderBy: { number: "asc" } }),
    db.messageLog.findMany({
      where: {
        OR: kids.flatMap((k) => [
          { recipient: { contains: k.name } },
          { recipient: { contains: "Parents" } },
        ]),
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    db.attendanceRecord.findMany({ where: { date: today, studentId: { in: kids.map((k) => k.id) } } }),
    db.starPoint.findMany({
      where: { studentId: { in: kids.map((k) => k.id) } },
      include: { student: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);
  const presentMap = new Map(presence.map((p) => [p.studentId, p.present]));
  const starMap = new Map<string, number>();
  stars.forEach((s) => starMap.set(s.studentId, (starMap.get(s.studentId) ?? 0) + s.points));
  return Response.json({
    parent: { name: user.name, email: user.email },
    today,
    kids: kids.map((k) => ({
      id: k.id, name: k.name, class: k.class, school: k.school.name, schoolId: k.school.id,
      feeMonthly: k.feeMonthly, feeDue: k.feeDue, phone: k.phone, attendance: k.attendance,
      presentToday: presentMap.has(k.id) ? presentMap.get(k.id) : null,
      stars: starMap.get(k.id) ?? 0,
      exams: k.exams, receipts: k.receipts,
    })),
    notices, buses, messages, stars,
  });
}
