import { db } from "@/lib/db";
import { requireUser, schoolScope, unauthorized, badRequest } from "@/lib/session";

interface Ctx { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Ctx) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const scope = schoolScope(user);
  const { id } = await params;
  const job = await db.jobPosting.findUnique({ where: { id } });
  if (!job || (scope && job.schoolId !== scope)) return unauthorized();
  const body = await req.json().catch(() => ({}));
  if (body.status !== "Open" && body.status !== "Closed") return badRequest("Invalid status.");
  const updated = await db.jobPosting.update({ where: { id }, data: { status: body.status } });
  return Response.json({ job: updated });
}
