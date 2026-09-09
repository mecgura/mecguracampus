import { db } from "@/lib/db";
import { requireUser, schoolScope, unauthorized, badRequest } from "@/lib/session";
import { createFeeOrder } from "@/lib/razorpay";

/** Creates a payment order for a student's dues.
 *  Uses the school's own Razorpay keys when set, platform keys otherwise. */
export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const scope = schoolScope(user);
  const body = await req.json().catch(() => null);
  const student = body?.studentId
    ? await db.student.findUnique({
        where: { id: body.studentId },
        include: { school: { select: { id: true, razorpayKeyId: true, razorpayKeySecret: true } } },
      })
    : null;
  if (!student || (scope && student.schoolId !== scope)) return unauthorized();

  const amount = Math.min(Number(body?.amount) || student.feeDue, student.feeDue);
  if (amount <= 0) return badRequest("No outstanding dues.");
  const keys =
    student.school?.razorpayKeyId && student.school?.razorpayKeySecret
      ? { keyId: student.school.razorpayKeyId, keySecret: student.school.razorpayKeySecret }
      : null;
  const order = await createFeeOrder(amount * 100, `fee_${student.id}_${Date.now()}`, keys);
  const demo = !keys && !process.env.RAZORPAY_KEY_ID;
  return Response.json({
    order,
    demo,
    amount,
    via: keys ? "school" : "platform",
  });
}
