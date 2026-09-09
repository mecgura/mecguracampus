import { db } from "@/lib/db";
import { requireUser, schoolScope, unauthorized, badRequest } from "@/lib/session";
import { leadSchema } from "@/lib/validations";

export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const scope = schoolScope(user);
  const { searchParams } = new URL(req.url);
  const stage = searchParams.get("stage") ?? "";
  const leads = await db.lead.findMany({
    where: {
      ...(scope ? { schoolId: scope } : {}),
      ...(stage ? { stage } : {}),
    },
    include: { school: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 300,
  });
  const today = new Date().toISOString().slice(0, 10);
  return Response.json({
    leads,
    followUpDue: leads.filter((l) => l.followUp && l.followUp <= today && !["Admitted", "Lost"].includes(l.stage)).length,
  });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const scope = schoolScope(user);
  const body = await req.json().catch(() => null);
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid enquiry.", parsed.error.flatten());
  if (scope && parsed.data.schoolId && parsed.data.schoolId !== scope) return unauthorized();
  const lead = await db.lead.create({
    data: {
      parentName: parsed.data.parentName,
      phone: parsed.data.phone ?? "",
      childName: (body?.childName as string) ?? "",
      childClass: parsed.data.childClass ?? "",
      schoolId: scope ?? parsed.data.schoolId ?? null,
      source: parsed.data.source ?? "Walk-in",
      followUp: parsed.data.followUp ?? "",
      notes: parsed.data.notes ?? "",
      stage: "New",
    },
  });
  return Response.json({ lead }, { status: 201 });
}
