import { db } from "@/lib/db";
import { requireUser, schoolScope, unauthorized, badRequest } from "@/lib/session";
import { noticeSchema } from "@/lib/validations";

export async function GET(req: Request) {
  const user = await requireUser(["super", "school", "parent"]);
  if (!user) return unauthorized();
  let schoolIds: string[] | undefined;
  if (user.role === "parent") {
    const kids = await db.student.findMany({ where: { parentId: user.id }, select: { schoolId: true } });
    schoolIds = [...new Set(kids.map((k) => k.schoolId))];
  } else {
    const scope = schoolScope(user);
    schoolIds = scope ? [scope] : undefined;
  }
  const { searchParams } = new URL(req.url);
  const audience = searchParams.get("audience") ?? "";
  const notices = await db.notice.findMany({
    where: {
      ...(schoolIds ? { schoolId: { in: schoolIds } } : {}),
      ...(audience ? { audience } : {}),
    },
    include: { school: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return Response.json({ notices });
}

export async function POST(req: Request) {
  const user = await requireUser(["super", "school"]);
  if (!user) return unauthorized();
  const scope = schoolScope(user);
  const body = await req.json().catch(() => null);
  const parsed = noticeSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid notice.", parsed.error.flatten());
  if (scope && parsed.data.schoolId && parsed.data.schoolId !== scope) return unauthorized();
  const schoolId = scope ?? parsed.data.schoolId ?? null;
  const notice = await db.notice.create({
    data: {
      title: parsed.data.title,
      body: parsed.data.body ?? "",
      audience: parsed.data.audience ?? "Parents",
      schoolId,
    },
  });
  // Optional: simultaneously log a WhatsApp broadcast for the same notice.
  if (parsed.data.sendWhatsapp) {
    await db.messageLog.create({
      data: {
        recipient: `All ${parsed.data.audience} (${schoolId ? "school" : "platform"})`,
        template: `Notice: ${parsed.data.title}`,
        language: "English",
        status: "Sent",
        schoolId,
      },
    });
  }
  return Response.json({ notice }, { status: 201 });
}
