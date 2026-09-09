import { db } from "@/lib/db";
import { requireUser, schoolScope, unauthorized, badRequest } from "@/lib/session";
import { studentSchema } from "@/lib/validations";

export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const scope = schoolScope(user);
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").toLowerCase();
  const schoolId = searchParams.get("schoolId") ?? "";

  if (scope && schoolId && schoolId !== scope) return unauthorized();
  const effectiveSchool = scope ?? (schoolId || undefined);

  const students = await db.student.findMany({
    where: effectiveSchool ? { schoolId: effectiveSchool } : {},
    include: { school: { select: { name: true } } },
    orderBy: { name: "asc" },
    take: 500,
  });
  const rows = students.filter(
    (s) => !q || (s.name + " " + s.class).toLowerCase().includes(q)
  );
  return Response.json({ students: rows });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const scope = schoolScope(user);
  const body = await req.json().catch(() => null);
  const parsed = studentSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid student data.", parsed.error.flatten());
  if (scope && parsed.data.schoolId !== scope) return unauthorized();

  const school = await db.school.findUnique({ where: { id: parsed.data.schoolId } });
  if (!school || (scope && school.id !== scope)) return badRequest("School not found.");

  const student = await db.student.create({
    data: {
      name: parsed.data.name,
      class: parsed.data.class ?? "",
      schoolId: parsed.data.schoolId,
      feeMonthly: parsed.data.feeMonthly,
      feeDue: parsed.data.feeMonthly,
      phone: parsed.data.phone ?? "",
    },
  });
  await db.messageLog.create({
    data: {
      recipient: `${student.name} (Parent)`,
      template: "Welcome (new admission)",
      language: "English",
      status: "Sent",
      schoolId: student.schoolId,
    },
  });
  return Response.json({ student }, { status: 201 });
}
