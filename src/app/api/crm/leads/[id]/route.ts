import { db } from "@/lib/db";
import { requireUser, schoolScope, unauthorized, badRequest } from "@/lib/session";
import { STAGES_LEAD } from "@/lib/validations";

interface Ctx { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Ctx) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const scope = schoolScope(user);
  const { id } = await params;
  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead || (scope && lead.schoolId !== scope)) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (typeof body.stage === "string" && (STAGES_LEAD as readonly string[]).includes(body.stage)) {
    data.stage = body.stage;
  }
  if (typeof body.followUp === "string") data.followUp = body.followUp.slice(0, 20);
  if (typeof body.notes === "string") data.notes = body.notes.slice(0, 500);
  if (typeof body.phone === "string") data.phone = body.phone.slice(0, 20);
  if (Object.keys(data).length === 0) return badRequest("Nothing to update.");

  const updated = await db.lead.update({ where: { id }, data });
  let studentCreated = false;
  let sheetSynced = false;

  // Admitted → auto-create the student + welcome message. Zero re-entry.
  // Guard: never create a duplicate if the lead was re-opened and admitted again.
  if (data.stage === "Admitted" && lead.schoolId) {
    const childName = lead.childName || `${lead.parentName} (Child)`;
    const exists = await db.student.findFirst({
      where: { name: childName, schoolId: lead.schoolId, phone: lead.phone },
    });
    if (!exists) {
      await db.student.create({
        data: {
          name: childName, class: lead.childClass, schoolId: lead.schoolId,
          feeMonthly: 0, feeDue: 0, phone: lead.phone,
        },
      });
      await db.messageLog.create({
        data: {
          recipient: `${lead.parentName} (Parent)`, template: "Welcome (new admission)",
          language: "English", status: "Sent", schoolId: lead.schoolId,
        },
      });
      studentCreated = true;
    }
    // Auto Google Sheet sync (when the school connected its sheet webhook).
    const sch = await db.school.findUnique({ where: { id: lead.schoolId } });
    if (sch?.sheetWebhook) {
      try {
        const r = await fetch(sch.sheetWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            parentName: lead.parentName, phone: lead.phone, childName,
            childClass: lead.childClass, stage: "Admitted", source: lead.source,
            school: sch.name, admittedAt: new Date().toISOString().slice(0, 10),
          }),
        });
        sheetSynced = r.ok;
      } catch { sheetSynced = false; }
    }
  }
  return Response.json({ lead: updated, studentCreated, sheetSynced });
}
