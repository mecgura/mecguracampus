import { db } from "@/lib/db";
import { requireUser, unauthorized, badRequest } from "@/lib/session";
import { userSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";

export async function GET() {
  const user = await requireUser();
  if (!user) return unauthorized();
  const isSuper = user.role === "super";

  const users = await db.user.findMany({
    where: isSuper ? {} : { schoolId: user.schoolId },
    include: { school: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      schoolName: u.school?.name ?? null,
      schoolId: u.schoolId,
      createdAt: u.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user || user.role !== "super") return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = userSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid user data.", parsed.error.flatten());

  const { name, email, password, role, schoolId } = parsed.data;
  const emailNorm = email.toLowerCase().trim();

  const exists = await db.user.findUnique({ where: { email: emailNorm } });
  if (exists) return badRequest("A user with this email already exists.");

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = await db.user.create({
    data: {
      name,
      email: emailNorm,
      passwordHash,
      role,
      schoolId: schoolId || null,
    },
  });

  return Response.json({ user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } }, { status: 201 });
}
