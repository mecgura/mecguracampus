import { db } from "@/lib/db";
import { requireUser, schoolScope, unauthorized, badRequest } from "@/lib/session";
import { schoolSchema } from "@/lib/validations";

export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const scope = schoolScope(user);
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").toLowerCase();
  const status = searchParams.get("status") ?? "";

  const schools = await db.school.findMany({
    where: scope ? { id: scope } : {},
    orderBy: { createdAt: "asc" },
  });
  const rows = schools.filter(
    (s) => (!q || (s.name + " " + s.city).toLowerCase().includes(q)) && (!status || s.status === status)
  );
  return Response.json({ schools: rows });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user || user.role !== "super") return unauthorized();
  const body = await req.json().catch(() => null);
  const parsed = schoolSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid school data.", parsed.error.flatten());

  const isTrial = (parsed.data.plan || "Trial").startsWith("Trial");
  const school = await db.school.create({
    data: {
      name: parsed.data.name,
      city: parsed.data.city ?? "",
      kind: parsed.data.kind ?? "School",
      students: parsed.data.students,
      plan: parsed.data.plan || "Trial",
      status: isTrial ? "Trial" : "Paid",
      trialDays: isTrial ? 7 : 0,
      since: "2026",
      onboarding: JSON.stringify(["Account created"]),
    },
  });
  return Response.json({ school }, { status: 201 });
}
