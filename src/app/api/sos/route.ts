import { db } from "@/lib/db";
import { requireUser, schoolScope, unauthorized, badRequest } from "@/lib/session";
import { sosSchema } from "@/lib/validations";

export async function GET() {
  const user = await requireUser(["super", "school"]);
  if (!user) return unauthorized();
  const scope = schoolScope(user);
  const alerts = await db.sosAlert.findMany({
    where: scope ? { schoolId: scope } : {},
    include: { bus: { select: { number: true } }, school: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return Response.json({
    alerts,
    open: alerts.filter((a) => a.status === "Open").length,
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = sosSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid SOS.", parsed.error.flatten());

  // Driver path: busId + key required. Console path: logged-in staff.
  let bus = parsed.data.busId ? await db.bus.findUnique({ where: { id: parsed.data.busId } }) : null;
  if (parsed.data.busId) {
    if (!bus || !bus.driverKey || bus.driverKey !== parsed.data.key) {
      return badRequest("Invalid bus or driver key.");
    }
  }
  let schoolId: string | null = bus?.schoolId ?? null;
  if (!bus) {
    const user = await requireUser(["super", "school"]);
    if (!user) return unauthorized();
    schoolId = schoolScope(user);
  }
  const alert = await db.sosAlert.create({
    data: {
      busId: bus?.id ?? null, schoolId,
      raisedBy: parsed.data.raisedBy || "Driver",
      note: parsed.data.note ?? "", status: "Open",
    },
  });
  await db.messageLog.create({
    data: {
      recipient: `School Office (${bus?.number ?? "campus"})`,
      template: `SOS: ${parsed.data.note || "Emergency"} — ${parsed.data.raisedBy}`,
      language: "English", status: "Sent", schoolId,
    },
  });
  return Response.json({ alert }, { status: 201 });
}

export async function PATCH(req: Request) {
  const user = await requireUser(["super", "school"]);
  if (!user) return unauthorized();
  const scope = schoolScope(user);
  const body = await req.json().catch(() => ({}));
  const alert = await db.sosAlert.findUnique({ where: { id: body.id } });
  if (!alert || (scope && alert.schoolId !== scope)) return unauthorized();
  const updated = await db.sosAlert.update({ where: { id: body.id }, data: { status: "Resolved" } });
  return Response.json({ alert: updated });
}
