import { db } from "@/lib/db";
import { requireUser, schoolScope, unauthorized, badRequest } from "@/lib/session";
import { slotSchema } from "@/lib/validations";

export async function GET(req: Request) {
  const user = await requireUser(["super", "school", "parent"]);
  if (!user) return unauthorized();
  const { searchParams } = new URL(req.url);
  let schoolId = searchParams.get("schoolId") ?? "";
  if (user.role === "parent") {
    const kids = await db.student.findMany({ where: { parentId: user.id }, select: { schoolId: true } });
    const allowed = [...new Set(kids.map((k) => k.schoolId))];
    if (schoolId && !allowed.includes(schoolId)) return unauthorized();
    if (!schoolId) schoolId = allowed[0] ?? "";
  } else {
    const scope = schoolScope(user);
    if (scope && schoolId && schoolId !== scope) return unauthorized();
    if (!schoolId) schoolId = scope ?? "";
  }
  const day = Number(searchParams.get("day") ?? "-1");
  const slots = await db.timetableSlot.findMany({
    where: { ...(schoolId ? { schoolId } : {}), ...(day >= 0 ? { day } : {}) },
    orderBy: [{ day: "asc" }, { periodNo: "asc" }],
    take: 500,
  });
  return Response.json({ slots });
}

export async function POST(req: Request) {
  const user = await requireUser(["super", "school"]);
  if (!user) return unauthorized();
  const scope = schoolScope(user);
  const body = await req.json().catch(() => null);
  const parsed = slotSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid period.", parsed.error.flatten());
  if (scope && parsed.data.schoolId && parsed.data.schoolId !== scope) return unauthorized();
  const slot = await db.timetableSlot.create({
    data: {
      schoolId: scope ?? parsed.data.schoolId ?? null,
      day: parsed.data.day, periodNo: parsed.data.periodNo,
      start: parsed.data.start, end: parsed.data.end,
      subject: parsed.data.subject, teacher: parsed.data.teacher ?? "",
      className: parsed.data.className ?? "",
    },
  });
  return Response.json({ slot }, { status: 201 });
}

export async function DELETE(req: Request) {
  const user = await requireUser(["super", "school"]);
  if (!user) return unauthorized();
  const scope = schoolScope(user);
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") ?? "";
  const slot = await db.timetableSlot.findUnique({ where: { id } });
  if (!slot || (scope && slot.schoolId !== scope)) return unauthorized();
  await db.timetableSlot.delete({ where: { id } });
  return Response.json({ ok: true });
}
