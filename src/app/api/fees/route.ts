import { db } from "@/lib/db";
import { requireUser, schoolScope, unauthorized, badRequest } from "@/lib/session";
import { feeCollectSchema, messageSchema } from "@/lib/validations";

/** List receipts (scoped) + collect a fee (creates receipt, reduces dues, logs WhatsApp receipt). */
export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const scope = schoolScope(user);
  const receipts = await db.feeReceipt.findMany({
    where: scope ? { schoolId: scope } : {},
    orderBy: { date: "desc" },
    take: 200,
  });
  return Response.json({ receipts });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const scope = schoolScope(user);
  const body = await req.json().catch(() => null);

  // AI / manual reminder → just logs a WhatsApp message
  if (body?.reminderFor) {
    const parsed = messageSchema.safeParse({
      recipient: body.reminderFor,
      template: "AI Fee Reminder",
      language: "Punjabi",
    });
    if (!parsed.success) return badRequest("Invalid reminder.");
    const msg = await db.messageLog.create({ data: { ...parsed.data, status: "Sent", schoolId: scope } });
    return Response.json({ message: msg }, { status: 201 });
  }

  const parsed = feeCollectSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid payment.", parsed.error.flatten());

  const student = await db.student.findUnique({
    where: { id: parsed.data.studentId },
    include: { school: { select: { id: true, name: true } } },
  });
  if (!student || (scope && student.schoolId !== scope)) return unauthorized();

  const amount = Math.min(parsed.data.amount, student.feeDue);
  if (amount <= 0) return badRequest("No outstanding dues for this student.");

  const [receipt] = await db.$transaction([
    db.feeReceipt.create({
      data: {
        studentId: student.id,
        studentName: student.name,
        schoolId: student.schoolId,
        schoolName: student.school.name,
        amount,
        mode: parsed.data.mode,
      },
    }),
    db.student.update({ where: { id: student.id }, data: { feeDue: student.feeDue - amount } }),
    db.messageLog.create({
      data: {
        recipient: `${student.name} (Parent)`,
        template: "Payment Receipt",
        language: "Punjabi",
        status: "Delivered",
        schoolId: student.schoolId,
      },
    }),
  ]);
  return Response.json({ receipt }, { status: 201 });
}
