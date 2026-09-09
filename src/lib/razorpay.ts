import Razorpay from "razorpay";

export interface KeyPair { keyId: string; keySecret: string }

/** Platform-level keys from env (fallback). */
export function envRazorpay(): KeyPair | null {
  const id = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  return id && secret ? { keyId: id, keySecret: secret } : null;
}

export function clientFor(keys: KeyPair | null): Razorpay | null {
  if (!keys) return null;
  return new Razorpay({ key_id: keys.keyId, key_secret: keys.keySecret });
}

export interface SchoolKeys {
  razorpayKeyId: string;
  razorpayKeySecret: string;
}

/** Institute keys win; platform env is the fallback. */
export function resolveRazorpay(school: SchoolKeys | null): KeyPair | null {
  if (school?.razorpayKeyId && school?.razorpayKeySecret) {
    return { keyId: school.razorpayKeyId, keySecret: school.razorpayKeySecret };
  }
  return envRazorpay();
}

/** Creates a real Razorpay order when keys resolve, otherwise a demo order object.
 *  Invalid/rejected keys fall back to demo instead of crashing the request. */
export async function createFeeOrder(amountPaise: number, receipt: string, keys?: KeyPair | null) {
  const rzp = clientFor(keys ?? envRazorpay());
  if (!rzp) {
    return { id: `order_demo_${Date.now()}`, amount: amountPaise, currency: "INR", receipt, demo: true };
  }
  try {
    return await rzp.orders.create({ amount: amountPaise, currency: "INR", receipt });
  } catch {
    return { id: `order_demo_${Date.now()}`, amount: amountPaise, currency: "INR", receipt, demo: true, keyError: true };
  }
}
