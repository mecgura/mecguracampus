import { db } from "@/lib/db";
import { requireUser, schoolScope, unauthorized, badRequest } from "@/lib/session";
import { createFeeOrder, RAZORPAY_DEMO } from "@/lib/razorpay";

/** Creates a payment order for a student's dues. Demo mode without Razorpay keys. */
export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const scope = schoolScope(user);
  const body = await req.json().catch(() => null);
  const student = body?.studentId ? await db.student.findUnique({ where: { id: body.studentId } }) : null;
  if (!student || (scope && student.schoolId !== scope)) return unauthorized();

  const amount = Math.min(Number(body?.amount) || student.feeDue, student.feeDue);
  if (amount <= 0) return badRequest("No outstanding dues.");
  const order = await createFeeOrder(amount * 100, `fee_${student.id}_${Date.now()}`);
  return Response.json({
    order,
    demo: RAZORPAY_DEMO,
    amount,
    keyId: process.env.RAZORPAY_KEY_ID ?? null,
  });
}
