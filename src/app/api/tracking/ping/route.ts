import { db } from "@/lib/db";
import { badRequest } from "@/lib/session";
import { pingSchema } from "@/lib/validations";

/** Driver app heartbeat — public endpoint secured by the per-bus driver key. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = pingSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid ping.", parsed.error.flatten());

  const bus = await db.bus.findUnique({ where: { id: parsed.data.busId } });
  if (!bus || !bus.driverKey || bus.driverKey !== parsed.data.key) {
    return badRequest("Invalid bus or driver key.");
  }
  const ping = await db.busPing.create({
    data: {
      busId: bus.id,
      lat: parsed.data.lat,
      lng: parsed.data.lng,
      speed: parsed.data.speed ?? 0,
      position: parsed.data.position,
    },
  });
  if (bus.status !== "Live" || bus.position !== parsed.data.position) {
    await db.bus.update({ where: { id: bus.id }, data: { status: "Live", position: parsed.data.position } });
  }
  // Retain only the latest 200 pings per bus.
  const extra = await db.busPing.findMany({ where: { busId: bus.id }, orderBy: { at: "desc" }, skip: 200, select: { id: true } });
  if (extra.length) await db.busPing.deleteMany({ where: { id: { in: extra.map((p) => p.id) } } });
  return Response.json({ ok: true, at: ping.at });
}
