import { db } from "@/lib/db";
import { requireUser, unauthorized } from "@/lib/session";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user || user.role !== "super") return unauthorized();

  const { id } = await params;
  if (id === user.id) return Response.json({ error: "Cannot delete yourself." }, { status: 400 });

  const target = await db.user.findUnique({ where: { id } });
  if (!target) return Response.json({ error: "User not found." }, { status: 404 });
  if (target.role === "super") return Response.json({ error: "Cannot delete a super admin." }, { status: 400 });

  await db.user.delete({ where: { id } });
  return Response.json({ ok: true });
}
