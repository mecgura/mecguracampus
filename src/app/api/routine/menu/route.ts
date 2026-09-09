import { db } from "@/lib/db";
import { requireUser, schoolScope, unauthorized, badRequest } from "@/lib/session";
import { menuSchema } from "@/lib/validations";

export async function GET(req: Request) {
  const user = await requireUser(["super", "school", "parent"]);
  if (!user) return unauthorized();
  const { searchParams } = new URL(req.url);
  let schoolId = searchParams.get("schoolId") ?? "";
  if (user.role === "parent") {
    const kids = await db.student.findMany({ where: { parentId: user.id }, select: { schoolId: true } });
    const allowed = [...new Set(kids.map((k) => k.schoolId))];
    if (schoolId && !allowed.includes(schoolId)) return unauthorized();
    if (!schoolId) schoolId = allowed[0] ?? "";
  } else {
    const scope = schoolScope(user);
    if (scope && schoolId && schoolId !== scope) return unauthorized();
    if (!schoolId) schoolId = scope ?? "";
  }
  const menus = await db.mealMenu.findMany({
    where: schoolId ? { schoolId } : {},
    orderBy: [{ day: "asc" }],
    take: 14,
  });
  return Response.json({ menus });
}

export async function POST(req: Request) {
  const user = await requireUser(["super", "school"]);
  if (!user) return unauthorized();
  const scope = schoolScope(user);
  const body = await req.json().catch(() => null);
  const parsed = menuSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid menu.", parsed.error.flatten());
  if (scope && parsed.data.schoolId && parsed.data.schoolId !== scope) return unauthorized();
  const schoolId = scope ?? parsed.data.schoolId ?? null;
  // One menu per school/day/meal — update if it exists.
  const existing = schoolId
    ? await db.mealMenu.findFirst({ where: { schoolId, day: parsed.data.day, meal: parsed.data.meal ?? "Lunch" } })
    : null;
  const menu = existing
    ? await db.mealMenu.update({ where: { id: existing.id }, data: { items: parsed.data.items } })
    : await db.mealMenu.create({
        data: { schoolId, day: parsed.data.day, meal: parsed.data.meal ?? "Lunch", items: parsed.data.items },
      });
  return Response.json({ menu }, { status: 201 });
}
