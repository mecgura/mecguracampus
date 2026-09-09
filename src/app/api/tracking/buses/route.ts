import { db } from "@/lib/db";

/** Public minimal bus list for the driver app (no keys exposed). */
export async function GET() {
  const buses = await db.bus.findMany({
    orderBy: { number: "asc" },
    select: { id: true, number: true, route: true, status: true },
  });
  return Response.json({ buses });
}
