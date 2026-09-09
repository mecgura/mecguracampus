import { db } from "@/lib/db";
import { requireUser, schoolScope, unauthorized, badRequest } from "@/lib/session";
import { tripSchema, TRIP_KINDS } from "@/lib/validations";

const KIND_LABEL: Record<string, string> = {
  TRIP_START: "Bus left for school",
  SCHOOL_REACHED: "Bus reached school",
  RETURN_START: "Bus started return trip",
  STOP_DROPPED: "Child dropped at stop",
};

export async function GET(req: Request) {
  const user = await requireUser(["super", "school", "parent"]);
  if (!user) return unauthorized();
  const { searchParams } = new URL(req.url);
  const busId = searchParams.get("busId") ?? "";
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
  const events = await db.tripEvent.findMany({
    where: {
      ...(busId ? { busId } : {}),
      ...(schoolId ? { schoolId } : {}),
    },
    include: { bus: { select: { number: true } } },
    orderBy: { at: "desc" },
    take: 50,
  });
  return Response.json({ events });
}

/** Driver-authenticated trip update. STOP_DROPPED auto-messages the parent. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = tripSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid trip update.", parsed.error.flatten());
  if (!(TRIP_KINDS as readonly string[]).includes(parsed.data.kind)) return badRequest("Invalid kind.");

  const bus = await db.bus.findUnique({
    where: { id: parsed.data.busId },
    include: { school: { select: { id: true, name: true } } },
  });
  if (!bus || !bus.driverKey || bus.driverKey !== parsed.data.key) {
    return badRequest("Invalid bus or driver key.");
  }

  let studentName = parsed.data.studentName ?? "";
  if (parsed.data.studentId) {
    const st = await db.student.findUnique({ where: { id: parsed.data.studentId } });
    if (st) studentName = st.name;
  }

  const event = await db.tripEvent.create({
    data: {
      busId: bus.id, schoolId: bus.schoolId,
      kind: parsed.data.kind, note: parsed.data.note ?? "",
      studentId: parsed.data.studentId || null, studentName,
    },
  });

  // The safety promise: every drop notifies the parent instantly.
  if (parsed.data.kind === "STOP_DROPPED" && studentName) {
    await db.messageLog.create({
      data: {
        recipient: `${studentName} (Parent)`,
        template: `Bus Drop Reached — ${parsed.data.note || bus.route}`,
        language: "Punjabi",
        status: "Sent",
        schoolId: bus.schoolId,
      },
    });
  }
  if (parsed.data.kind === "SCHOOL_REACHED") {
    await db.bus.update({ where: { id: bus.id }, data: { position: 100 } });
  }
  return Response.json({ event, label: KIND_LABEL[parsed.data.kind] }, { status: 201 });
}
