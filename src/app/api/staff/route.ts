import { db } from "@/lib/db";
import { requireUser, schoolScope, unauthorized, badRequest } from "@/lib/session";
import { staffSchema } from "@/lib/validations";

export async function GET() {
  const user = await requireUser();
  if (!user) return unauthorized();
  const scope = schoolScope(user);
  const staff = await db.staffMember.findMany({
    where: scope ? { schoolId: scope } : {},
    include: { school: { select: { name: true } } },
    orderBy: { name: "asc" },
  });
  return Response.json({ staff });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const scope = schoolScope(user);
  const body = await req.json().catch(() => null);

  if (body?.action === "payAll") {
    const where = scope ? { schoolId: scope, status: "Pending" } : { status: "Pending" };
    const result = await db.staffMember.updateMany({ where, data: { status: "Paid" } });
    return Response.json({ paid: result.count });
  }

  const parsed = staffSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid staff data.", parsed.error.flatten());
  if (scope && parsed.data.schoolId !== scope) return unauthorized();
  const member = await db.staffMember.create({ data: { ...parsed.data, role: parsed.data.role ?? "", status: "Pending" } });
  return Response.json({ staff: member }, { status: 201 });
}
