import { db } from "@/lib/db";
import { requireUser, schoolScope, unauthorized, badRequest } from "@/lib/session";

interface Ctx { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Ctx) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const scope = schoolScope(user);
  const { id } = await params;
  const bus = await db.bus.findUnique({ where: { id } });
  if (!bus || (scope && bus.schoolId !== scope)) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (body.status === "Live" || body.status === "Offline") data.status = body.status;
  if (typeof body.position === "number") data.position = Math.max(0, Math.min(100, body.position));
  if (Object.keys(data).length === 0) return badRequest("Nothing to update.");
  const updated = await db.bus.update({ where: { id }, data });
  return Response.json({ bus: updated });
}
