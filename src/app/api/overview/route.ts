import { db } from "@/lib/db";
import { requireUser, schoolScope, unauthorized } from "@/lib/session";

function riskOf(due: number, att: number) {
  let score = 0;
  if (due >= 10000) score += 45;
  else if (due >= 5000) score += 30;
  else if (due > 0) score += 15;
  if (att < 70) score += 30;
  else if (att < 85) score += 12;
  return Math.min(98, score + 8);
}

export async function GET() {
  const user = await requireUser();
  if (!user) return unauthorized();
  const scope = schoolScope(user);

  const schoolWhere = scope ? { id: scope } : {};
  const schools = await db.school.findMany({ where: schoolWhere, orderBy: { createdAt: "asc" } });
  const schoolIds = schools.map((s) => s.id);

  const [studentCount, receipts, buses, debtors] = await Promise.all([
    db.student.count({ where: { schoolId: { in: schoolIds } } }),
    db.feeReceipt.findMany({ where: { schoolId: { in: schoolIds } } }),
    db.bus.findMany({ where: scope ? { schoolId: scope } : {} }),
    db.student.findMany({
      where: { schoolId: { in: schoolIds }, feeDue: { gt: 0 } },
      include: { school: { select: { name: true } } },
      orderBy: { feeDue: "desc" },
      take: 10,
    }),
  ]);

  const collected = receipts.reduce((a, r) => a + r.amount, 0);
  const liveBuses = buses.filter((b) => b.status === "Live").length;
  const activeStudents = schools.reduce((a, s) => a + s.students, 0);

  return Response.json({
    totals: {
      schools: schools.length,
      students: activeStudents,
      studentRecords: studentCount,
      collected,
      receipts: receipts.length,
      liveBuses: `${liveBuses} / ${buses.length}`,
      offlineBus: buses.find((b) => b.status !== "Live")?.number ?? null,
    },
    schools: schools.map((s) => ({
      id: s.id, name: s.name, city: s.city, students: s.students,
      plan: s.plan, status: s.status, trialDays: s.trialDays, due: s.due,
    })),
    risk: debtors
      .map((s) => ({
        id: s.id, name: s.name, class: s.class, school: s.school.name,
        due: s.feeDue, risk: riskOf(s.feeDue, s.attendance),
      }))
      .sort((a, b) => b.risk - a.risk)
      .slice(0, 5),
    funnel: [
      { k: "Enquiry", v: 186 }, { k: "Visit", v: 94 }, { k: "Admission", v: 61 }, { k: "Fees Paid", v: 55 },
    ],
    happiness: 87,
  });
}
