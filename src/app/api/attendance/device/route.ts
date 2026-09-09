import { db } from "@/lib/db";
import { badRequest } from "@/lib/session";
import { devicePushSchema } from "@/lib/validations";

/**
 * Biometric / PDS machine endpoint.
 * The on-premise agent (or vendor webhook) POSTs punches here with the device API key.
 * Matches machine user IDs (deviceCode) to students/staff and marks attendance.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = devicePushSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid push.", parsed.error.flatten());

  const device = await db.device.findUnique({ where: { apiKey: parsed.data.apiKey } });
  if (!device) return badRequest("Unknown device key.");

  const today = new Date().toISOString().slice(0, 10);
  let matched = 0;
  const unmatched: string[] = [];

  for (const rec of parsed.data.records) {
    const student = await db.student.findFirst({
      where: {
        deviceCode: rec.code,
        ...(device.schoolId ? { schoolId: device.schoolId } : {}),
      },
    });
    if (!student) { unmatched.push(rec.code); continue; }
    await db.attendanceRecord.upsert({
      where: { studentId_date: { studentId: student.id, date: today } },
      create: { studentId: student.id, date: today, present: true },
      update: { present: true },
    });
    matched++;
  }

  await db.device.update({
    where: { id: device.id },
    data: { lastSeen: new Date(), lastSummary: `${matched} matched, ${unmatched.length} unmatched on ${today}` },
  });
  return Response.json({ matched, unmatched: unmatched.slice(0, 50), date: today });
}
