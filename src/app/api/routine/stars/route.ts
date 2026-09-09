import { db } from "@/lib/db";
import { requireUser, schoolScope, unauthorized, badRequest } from "@/lib/session";
import { starSchema } from "@/lib/validations";

export async function GET(req: Request) {
  const user = await requireUser(["super", "school", "parent"]);
  if (!user) return unauthorized();
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId") ?? "";
  if (user.role === "parent") {
    const kid = studentId ? await db.student.findUnique({ where: { id: studentId } }) : null;
    if (!kid || kid.parentId !== user.id) return unauthorized();
    const stars = await db.starPoint.findMany({ where: { studentId }, orderBy: { createdAt: "desc" }, take: 30 });
    return Response.json({ stars, total: stars.reduce((a, s) => a + s.points, 0) });
  }
  const scope = schoolScope(user);
  const stars = await db.starPoint.findMany({
    where: {
      ...(studentId ? { studentId } : {}),
      ...(scope ? { schoolId: scope } : {}),
    },
    include: { student: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return Response.json({ stars });
}

export async function POST(req: Request) {
  const user = await requireUser(["super", "school"]);
  if (!user) return unauthorized();
  const scope = schoolScope(user);
  const body = await req.json().catch(() => null);
  const parsed = starSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid star.", parsed.error.flatten());
  const student = await db.student.findUnique({ where: { id: parsed.data.studentId } });
  if (!student || (scope && student.schoolId !== scope)) return unauthorized();
  const star = await db.starPoint.create({
    data: {
      studentId: student.id, schoolId: student.schoolId,
      points: parsed.data.points, note: parsed.data.note ?? "",
      givenBy: parsed.data.givenBy || user.name,
      date: new Date().toISOString().slice(0, 10),
    },
  });
  return Response.json({ star }, { status: 201 });
}
