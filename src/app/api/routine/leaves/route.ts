import { db } from "@/lib/db";
import { requireUser, schoolScope, unauthorized, badRequest } from "@/lib/session";
import { leaveSchema } from "@/lib/validations";

export async function GET(req: Request) {
  const user = await requireUser(["super", "school", "parent"]);
  if (!user) return unauthorized();
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? "";
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
  const leaves = await db.staffLeave.findMany({
    where: {
      ...(schoolId ? { schoolId } : {}),
      ...(date ? { date } : {}),
      ...(user.role === "parent" ? { status: "Approved" } : {}),
    },
    include: { staff: { select: { name: true, role: true } } },
    orderBy: { date: "desc" },
    take: 100,
  });
  return Response.json({ leaves });
}

export async function POST(req: Request) {
  const user = await requireUser(["super", "school"]);
  if (!user) return unauthorized();
  const scope = schoolScope(user);
  const body = await req.json().catch(() => null);
  const parsed = leaveSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid leave.", parsed.error.flatten());
  const staff = await db.staffMember.findUnique({ where: { id: parsed.data.staffId } });
  if (!staff || (scope && staff.schoolId !== scope)) return unauthorized();
  const leave = await db.staffLeave.create({
    data: {
      staffId: staff.id, schoolId: staff.schoolId, date: parsed.data.date,
      reason: parsed.data.reason ?? "", substitute: parsed.data.substitute ?? "",
      status: user.role === "super" ? "Approved" : "Pending",
    },
  });
  return Response.json({ leave }, { status: 201 });
}

export async function PATCH(req: Request) {
  const user = await requireUser(["super", "school"]);
  if (!user) return unauthorized();
  const scope = schoolScope(user);
  const body = await req.json().catch(() => ({}));
  const leave = await db.staffLeave.findUnique({ where: { id: body.id } });
  if (!leave || (scope && leave.schoolId !== scope)) return unauthorized();
  if (body.status !== "Approved" && body.status !== "Rejected") return badRequest("Invalid status.");
  const updated = await db.staffLeave.update({
    where: { id: body.id },
    data: { status: body.status, substitute: typeof body.substitute === "string" ? body.substitute : leave.substitute },
  });
  return Response.json({ leave: updated });
}
