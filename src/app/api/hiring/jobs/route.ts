import { db } from "@/lib/db";
import { requireUser, schoolScope, unauthorized, badRequest } from "@/lib/session";
import { jobSchema } from "@/lib/validations";

export async function GET() {
  const user = await requireUser();
  if (!user) return unauthorized();
  const scope = schoolScope(user);
  const jobs = await db.jobPosting.findMany({
    where: scope ? { schoolId: scope } : {},
    include: { _count: { select: { applications: true } }, school: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ jobs });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const scope = schoolScope(user);
  const body = await req.json().catch(() => null);
  const parsed = jobSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid job.", parsed.error.flatten());
  const schoolId = scope ?? parsed.data.schoolId ?? null;
  if (scope && parsed.data.schoolId && parsed.data.schoolId !== scope) return unauthorized();
  const job = await db.jobPosting.create({
    data: {
      title: parsed.data.title,
      schoolId,
      jobType: parsed.data.jobType ?? "Teacher",
      salary: parsed.data.salary ?? "",
    },
  });
  return Response.json({ job }, { status: 201 });
}
