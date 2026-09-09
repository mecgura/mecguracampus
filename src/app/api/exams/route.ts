import { db } from "@/lib/db";
import { requireUser, schoolScope, unauthorized, badRequest } from "@/lib/session";
import { examSchema } from "@/lib/validations";

export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId") ?? "";
  if (!studentId) return badRequest("studentId is required.");
  const student = await db.student.findUnique({ where: { id: studentId } });
  const scope = schoolScope(user);
  if (!student || (scope && student.schoolId !== scope)) return unauthorized();
  const results = await db.examResult.findMany({ where: { studentId }, orderBy: { subject: "asc" } });
  return Response.json({ student, results });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const scope = schoolScope(user);
  const body = await req.json().catch(() => null);

  // Bulk save: { studentId, term, marks: { Subject: number } }
  if (body?.marks && typeof body.marks === "object") {
    const student = await db.student.findUnique({ where: { id: body.studentId } });
    if (!student || (scope && student.schoolId !== scope)) return unauthorized();
    const term = typeof body.term === "string" ? body.term : "Final";
    const entries = Object.entries(body.marks as Record<string, number>);
    await db.$transaction(
      entries.map(([subject, marks]) =>
        db.examResult.upsert({
          where: { studentId_subject_term: { studentId: student.id, subject, term } },
          create: { studentId: student.id, subject, marks: Number(marks) || 0, term },
          update: { marks: Number(marks) || 0 },
        })
      )
    );
    await db.messageLog.create({
      data: {
        recipient: `${student.name} (Parent)`, template: "Result Published",
        language: "English", status: "Sent", schoolId: student.schoolId,
      },
    });
    return Response.json({ saved: entries.length });
  }

  const parsed = examSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid marks.", parsed.error.flatten());
  const student = await db.student.findUnique({ where: { id: parsed.data.studentId } });
  if (!student || (scope && student.schoolId !== scope)) return unauthorized();
  const result = await db.examResult.upsert({
    where: { studentId_subject_term: { studentId: student.id, subject: parsed.data.subject, term: parsed.data.term ?? "Final" } },
    create: { ...parsed.data, term: parsed.data.term ?? "Final" },
    update: { marks: parsed.data.marks },
  });
  return Response.json({ result }, { status: 201 });
}
