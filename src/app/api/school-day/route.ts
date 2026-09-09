import { db } from "@/lib/db";
import { requireUser, schoolScope, unauthorized } from "@/lib/session";

/** LIVE school day — what is happening RIGHT NOW at a school.
 *  Powers the parent app's "today" view: session status, current period,
 *  today's tiffin, teachers on leave (with substitutes). */
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
  if (!schoolId) return Response.json({ error: "schoolId required" }, { status: 400 });

  // Asia/Kolkata day + time, zero-padded for string comparison.
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const day = now.getDay();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const t = `${hh}:${mm}`;
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const [slots, menus, leaves, school] = await Promise.all([
    db.timetableSlot.findMany({ where: { schoolId, day }, orderBy: { periodNo: "asc" } }),
    db.mealMenu.findMany({ where: { schoolId, day } }),
    db.staffLeave.findMany({
      where: { schoolId, date: today, status: "Approved" },
      include: { staff: { select: { name: true, role: true } } },
    }),
    db.school.findUnique({ where: { id: schoolId }, select: { name: true } }),
  ]);

  let status = "Holiday";
  let current: (typeof slots)[number] | null = null;
  let next: (typeof slots)[number] | null = null;
  let minsLeft = 0;
  if (slots.length) {
    const toMin = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));
    const nowM = toMin(t);
    current = slots.find((s) => nowM >= toMin(s.start) && nowM < toMin(s.end)) ?? null;
    next = slots.find((s) => toMin(s.start) > nowM) ?? null;
    if (current) {
      status = "In Session";
      minsLeft = toMin(current.end) - nowM;
    } else if (next) {
      status = nowM < toMin(slots[0].start) ? "Starts Soon" : "Break";
    } else {
      status = "School Over";
    }
  }

  return Response.json({
    school: school?.name ?? "",
    date: today,
    time: t,
    status,
    current: current ? { ...current } : null,
    minsLeft,
    next: next ? { ...next } : null,
    periods: slots,
    tiffin: menus,
    leavesOn: leaves.map((l) => ({
      name: l.staff.name, role: l.staff.role, reason: l.reason, substitute: l.substitute || "—",
    })),
  });
}
