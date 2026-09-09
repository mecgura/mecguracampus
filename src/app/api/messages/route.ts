import { db } from "@/lib/db";
import { requireUser, schoolScope, unauthorized, badRequest } from "@/lib/session";
import { messageSchema } from "@/lib/validations";

const LIVE = !!process.env.WHATSAPP_API_KEY;

export async function GET() {
  const user = await requireUser();
  if (!user) return unauthorized();
  const scope = schoolScope(user);
  const messages = await db.messageLog.findMany({
    where: scope ? { schoolId: scope } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return Response.json({ messages, live: LIVE });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const scope = schoolScope(user);
  const body = await req.json().catch(() => null);
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid message.", parsed.error.flatten());
  const schoolId = scope ?? parsed.data.schoolId ?? null;
  // Without a provider key we queue + mark Sent (demo mode), exactly like the preview.
  const msg = await db.messageLog.create({
    data: { ...parsed.data, status: LIVE ? "Queued" : "Sent", schoolId },
  });
  return Response.json({ message: msg, live: LIVE }, { status: 201 });
}
