import { db } from "@/lib/db";
import { requireUser, schoolScope, unauthorized, badRequest } from "@/lib/session";

interface Ctx { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Ctx) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const scope = schoolScope(user);
  const { id } = await params;
  const member = await db.staffMember.findUnique({ where: { id } });
  if (!member || (scope && member.schoolId !== scope)) return unauthorized();
  const body = await req.json().catch(() => ({}));
  if (body.action !== "pay" && body.status !== "Paid") return badRequest("Nothing to update.");
  const updated = await db.staffMember.update({ where: { id }, data: { status: "Paid" } });
  return Response.json({ staff: updated });
}
