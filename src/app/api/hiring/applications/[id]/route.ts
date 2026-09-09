import { db } from "@/lib/db";
import { requireUser, schoolScope, unauthorized, badRequest } from "@/lib/session";
import { STAGES_APPLICATION } from "@/lib/validations";

interface Ctx { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Ctx) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const scope = schoolScope(user);
  const { id } = await params;
  const app = await db.application.findUnique({ where: { id }, include: { job: true } });
  if (!app || (scope && app.job.schoolId !== scope)) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (typeof body.stage === "string" && (STAGES_APPLICATION as readonly string[]).includes(body.stage)) {
    data.stage = body.stage;
  }
  if (typeof body.score === "number") data.score = Math.max(0, Math.min(100, body.score));
  if (typeof body.notes === "string") data.notes = body.notes.slice(0, 500);
  if (Object.keys(data).length === 0) return badRequest("Nothing to update.");

  const updated = await db.application.update({ where: { id }, data });
  // Hired → auto-create staff record so payroll is ready on day one.
  if (data.stage === "Hired" && app.job.schoolId) {
    await db.staffMember.create({
      data: {
        name: app.name, role: app.job.title, schoolId: app.job.schoolId,
        salary: Number(app.job.salary.replace(/[^0-9]/g, "")) || 0, status: "Pending",
      },
    });
  }
  return Response.json({ application: updated, hired: data.stage === "Hired" });
}
