import Razorpay from "razorpay";

export const RAZORPAY_DEMO = !process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET;

let client: Razorpay | null = null;
export function razorpay() {
  if (RAZORPAY_DEMO) return null;
  if (!client) {
    client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }
  return client;
}

/** Creates a real Razorpay order when keys exist, otherwise a demo order object. */
export async function createFeeOrder(amountPaise: number, receipt: string) {
  const rzp = razorpay();
  if (!rzp) {
    return { id: `order_demo_${Date.now()}`, amount: amountPaise, currency: "INR", receipt, demo: true };
  }
  return rzp.orders.create({ amount: amountPaise, currency: "INR", receipt });
}
