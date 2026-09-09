import { db } from "@/lib/db";
import { requireUser, schoolScope, unauthorized, badRequest } from "@/lib/session";
import { attendanceSchema } from "@/lib/validations";

export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const scope = schoolScope(user);
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  const schoolId = searchParams.get("schoolId") ?? "";
  if (scope && schoolId && schoolId !== scope) return unauthorized();
  const effective = scope ?? (schoolId || undefined);

  const students = await db.student.findMany({
    where: effective ? { schoolId: effective } : {},
    include: { school: { select: { name: true } } },
    orderBy: { name: "asc" },
    take: 500,
  });
  const records = await db.attendanceRecord.findMany({
    where: { date, studentId: { in: students.map((s) => s.id) } },
  });
  const map = new Map(records.map((r) => [r.studentId, r.present]));
  return Response.json({
    date,
    students: students.map((s) => ({
      id: s.id, name: s.name, class: s.class, school: s.school.name,
      attendance: s.attendance, present: map.get(s.id) ?? s.attendance >= 75,
    })),
  });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const scope = schoolScope(user);
  const body = await req.json().catch(() => null);
  const parsed = attendanceSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid attendance.", parsed.error.flatten());

  const ids = parsed.data.records.map((r) => r.studentId);
  const allowed = await db.student.findMany({ where: { id: { in: ids } }, select: { id: true, schoolId: true } });
  if (scope && allowed.some((s) => s.schoolId !== scope)) return unauthorized();
  if (allowed.length !== ids.length) return badRequest("Unknown student in records.");

  await db.$transaction(
    parsed.data.records.map((r) =>
      db.attendanceRecord.upsert({
        where: { studentId_date: { studentId: r.studentId, date: parsed.data.date } },
        create: { studentId: r.studentId, date: parsed.data.date, present: r.present },
        update: { present: r.present },
      })
    )
  );
  const absent = parsed.data.records.filter((r) => !r.present).length;
  return Response.json({ saved: parsed.data.records.length, absent });
}
