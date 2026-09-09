import { db } from "@/lib/db";
import { requireUser, schoolScope, unauthorized } from "@/lib/session";

export async function GET() {
  const user = await requireUser();
  if (!user) return unauthorized();
  const scope = schoolScope(user);
  const buses = await db.bus.findMany({
    where: scope ? { schoolId: scope } : {},
    include: { school: { select: { name: true } } },
    orderBy: { number: "asc" },
  });
  return Response.json({ buses });
}
