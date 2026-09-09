import { db } from "@/lib/db";
import { requireUser, schoolScope, unauthorized, badRequest } from "@/lib/session";
import { messageSchema } from "@/lib/validations";

const envLive = () => !!process.env.WHATSAPP_API_KEY;

async function scopeLive(scope: string | null): Promise<boolean> {
  if (envLive()) return true;
  if (scope) {
    const s = await db.school.findUnique({ where: { id: scope }, select: { whatsappKey: true } });
    return !!s?.whatsappKey;
  }
  return (await db.school.count({ where: { whatsappKey: { not: "" } } })) > 0;
}

export async function GET() {
  const user = await requireUser();
  if (!user) return unauthorized();
  const scope = schoolScope(user);
  const messages = await db.messageLog.findMany({
    where: scope ? { schoolId: scope } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return Response.json({ messages, live: await scopeLive(scope) });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const scope = schoolScope(user);
  const body = await req.json().catch(() => null);
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid message.", parsed.error.flatten());
  const schoolId = scope ?? parsed.data.schoolId ?? null;
  // Live when the school connected its own key (or the platform key exists).
  const live = await scopeLive(schoolId);
  const msg = await db.messageLog.create({
    data: { ...parsed.data, status: live ? "Queued" : "Sent", schoolId },
  });
  return Response.json({ message: msg, live }, { status: 201 });
}
