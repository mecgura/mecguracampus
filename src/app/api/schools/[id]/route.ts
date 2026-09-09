import { db } from "@/lib/db";
import { requireUser, unauthorized, badRequest } from "@/lib/session";

interface Ctx { params: Promise<{ id: string }> }

/** Super admin: toggle Paid/Trial/Due <-> Off, record SaaS payment, update onboarding/status.
 *  School admin: may only update their OWN school's sheetWebhook. */
export async function PATCH(req: Request, { params }: Ctx) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const isSelf = user.role === "school" && user.schoolId === id;

  const school = await db.school.findUnique({ where: { id } });
  if (!school) return badRequest("School not found.");
  if (user.role !== "super" && !isSelf) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if (typeof body.sheetWebhook === "string" && (user.role === "super" || isSelf)) {
    data.sheetWebhook = body.sheetWebhook.slice(0, 300);
  }
  if (user.role === "super") {
    if (body.action === "toggle") {
      data.status = school.status === "Off" ? (school.due > 0 ? "Due" : school.trialDays > 0 ? "Trial" : "Paid") : "Off";
    }
    if (body.action === "collectSaaS") {
      data.due = 0;
      data.status = "Paid";
    }
    if (typeof body.onboarding === "string") data.onboarding = body.onboarding;
    if (typeof body.status === "string" && ["Trial", "Paid", "Due", "Off"].includes(body.status)) {
      data.status = body.status;
    }
  }
  if (Object.keys(data).length === 0) return badRequest("Nothing to update.");

  const updated = await db.school.update({ where: { id }, data });
  return Response.json({ school: updated });
}
