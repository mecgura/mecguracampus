import { db } from "@/lib/db";
import { requireUser, unauthorized } from "@/lib/session";

export async function GET() {
  const user = await requireUser();
  if (!user) return unauthorized();
  const settings = await db.siteSetting.findMany({ orderBy: { key: "asc" } });
  return Response.json({ settings });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user || user.role !== "super") return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.key || typeof body.value !== "string") {
    return Response.json({ error: "key and value are required." }, { status: 400 });
  }
  const setting = await db.siteSetting.upsert({
    where: { key: String(body.key) },
    create: { key: String(body.key), value: body.value },
    update: { value: body.value },
  });
  return Response.json({ setting });
}
