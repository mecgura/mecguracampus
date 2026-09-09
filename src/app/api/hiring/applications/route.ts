import { db } from "@/lib/db";
import { requireUser, schoolScope, unauthorized, badRequest } from "@/lib/session";
import { applicationSchema } from "@/lib/validations";

export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const scope = schoolScope(user);
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId") ?? "";
  const job = jobId ? await db.jobPosting.findUnique({ where: { id: jobId } }) : null;
  if (jobId && (!job || (scope && job.schoolId !== scope))) return unauthorized();
  const applications = await db.application.findMany({
    where: {
      ...(jobId ? { jobId } : {}),
      ...(scope ? { job: { schoolId: scope } } : {}),
    },
    include: { job: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
    take: 300,
  });
  return Response.json({ applications });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const scope = schoolScope(user);
  const body = await req.json().catch(() => null);
  const parsed = applicationSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid application.", parsed.error.flatten());
  const job = await db.jobPosting.findUnique({ where: { id: parsed.data.jobId } });
  if (!job || job.status !== "Open" || (scope && job.schoolId !== scope)) {
    return badRequest("This position is not open.");
  }
  const application = await db.application.create({ data: { ...parsed.data, stage: "Applied" } });
  return Response.json({ application }, { status: 201 });
}
