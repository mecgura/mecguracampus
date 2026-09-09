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
  const [notices, buses, messages] = await Promise.all([
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
  ]);
  return Response.json({
    parent: { name: user.name, email: user.email },
    kids: kids.map((k) => ({
      id: k.id, name: k.name, class: k.class, school: k.school.name, schoolId: k.school.id,
      feeMonthly: k.feeMonthly, feeDue: k.feeDue, phone: k.phone, attendance: k.attendance,
      exams: k.exams, receipts: k.receipts,
    })),
    notices, buses, messages,
  });
}
