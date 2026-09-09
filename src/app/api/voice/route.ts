import { db } from "@/lib/db";
import { requireUser, schoolScope, unauthorized, badRequest } from "@/lib/session";
import { voiceSchema } from "@/lib/validations";

export async function GET() {
  const user = await requireUser(["super", "school"]);
  if (!user) return unauthorized();
  const scope = schoolScope(user);
  const queue = await db.voiceQueue.findMany({
    where: scope ? { schoolId: scope } : {},
    include: { school: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return Response.json({ queue });
}

/** Queue a voice reminder. Played via phone TTS today; provider auto-call next. */
export async function POST(req: Request) {
  const user = await requireUser(["super", "school"]);
  if (!user) return unauthorized();
  const scope = schoolScope(user);
  const body = await req.json().catch(() => null);
  const parsed = voiceSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid voice message.", parsed.error.flatten());
  if (scope && parsed.data.schoolId && parsed.data.schoolId !== scope) return unauthorized();
  const item = await db.voiceQueue.create({
    data: {
      recipient: parsed.data.recipient,
      text: parsed.data.text,
      language: parsed.data.language ?? "Punjabi",
      status: "Queued",
      schoolId: scope ?? parsed.data.schoolId ?? null,
    },
  });
  await db.messageLog.create({
    data: {
      recipient: parsed.data.recipient, template: `Voice: ${parsed.data.text.slice(0, 60)}…`,
      language: parsed.data.language ?? "Punjabi", status: "Queued",
      schoolId: scope ?? parsed.data.schoolId ?? null,
    },
  });
  return Response.json({ item }, { status: 201 });
}
