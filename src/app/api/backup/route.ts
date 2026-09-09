import { readFile } from "fs/promises";
import { db } from "@/lib/db";
import { requireUser, unauthorized } from "@/lib/session";

/** Full data export for backups. Super admin only.
 *  ?format=json (all tables, works everywhere) or ?format=sqlite (local file copy). */
export async function GET(req: Request) {
  const user = await requireUser(["super"]);
  if (!user) return unauthorized();
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") ?? "json";
  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "sqlite" && (process.env.DATABASE_URL ?? "").startsWith("file:")) {
    const path = (process.env.DATABASE_URL as string).replace(/^file:/, "");
    try {
      const buf = await readFile(path.startsWith("./") ? path.slice(2) : path);
      await db.siteSetting.upsert({
        where: { key: "backup_last" },
        create: { key: "backup_last", value: new Date().toISOString() },
        update: { value: new Date().toISOString() },
      });
      return new Response(new Uint8Array(buf), {
        headers: {
          "Content-Type": "application/x-sqlite3",
          "Content-Disposition": `attachment; filename="mecguracampus-${stamp}.db"`,
        },
      });
    } catch { /* fall through to JSON */ }
  }

  const data = {
    exportedAt: new Date().toISOString(),
    schools: await db.school.findMany(),
    users: await db.user.findMany({ select: { id: true, name: true, email: true, role: true, schoolId: true, createdAt: true } }),
    students: await db.student.findMany(),
    staff: await db.staffMember.findMany(),
    buses: await db.bus.findMany(),
    receipts: await db.feeReceipt.findMany(),
    messages: await db.messageLog.findMany(),
    attendance: await db.attendanceRecord.findMany(),
    exams: await db.examResult.findMany(),
    jobs: await db.jobPosting.findMany(),
    applications: await db.application.findMany(),
    leads: await db.lead.findMany(),
    devices: await db.device.findMany(),
    notices: await db.notice.findMany(),
    slots: await db.timetableSlot.findMany(),
    menus: await db.mealMenu.findMany(),
    leaves: await db.staffLeave.findMany(),
    stars: await db.starPoint.findMany(),
    trips: await db.tripEvent.findMany(),
    voices: await db.voiceQueue.findMany(),
    sos: await db.sosAlert.findMany(),
    settings: await db.siteSetting.findMany(),
  };
  await db.siteSetting.upsert({
    where: { key: "backup_last" },
    create: { key: "backup_last", value: data.exportedAt },
    update: { value: data.exportedAt },
  });
  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="mecguracampus-${stamp}.json"`,
    },
  });
}
