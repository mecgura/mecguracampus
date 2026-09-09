import { db } from "@/lib/db";

/** Public live positions — powers the parent tracking link. No login required. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const only = searchParams.get("busId") ?? "";
  const buses = await db.bus.findMany({
    where: only ? { id: only } : {},
    orderBy: { number: "asc" },
    include: { pings: { orderBy: { at: "desc" }, take: 1 } },
  });
  return Response.json({
    buses: buses.map((b) => ({
      id: b.id, number: b.number, route: b.route, kids: b.kids, status: b.status,
      position: b.pings[0]?.position ?? b.position,
      speed: b.pings[0]?.speed ?? 0,
      at: b.pings[0]?.at ?? null,
    })),
  });
}
