import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { requireUser, schoolScope, unauthorized, badRequest } from "@/lib/session";

export async function GET() {
  const user = await requireUser();
  if (!user) return unauthorized();
  const scope = schoolScope(user);
  const devices = await db.device.findMany({
    where: scope ? { schoolId: scope } : {},
    include: { school: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ devices });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const scope = schoolScope(user);
  const body = await req.json().catch(() => ({}));
  if (!body?.name || typeof body.name !== "string") return badRequest("Device name is required.");
  if (scope && body.schoolId && body.schoolId !== scope) return unauthorized();
  const device = await db.device.create({
    data: {
      name: String(body.name).slice(0, 80),
      type: body.type === "gps" ? "gps" : "biometric",
      schoolId: scope ?? body.schoolId ?? null,
      apiKey: randomBytes(20).toString("hex"),
    },
  });
  return Response.json({ device }, { status: 201 });
}
