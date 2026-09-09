import { auth } from "@/auth";

export type Role = "super" | "school" | "parent";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  schoolId: string | null;
}

export async function requireUser(allowed: Role[] = ["super", "school"]): Promise<SessionUser | null> {
  const session = await auth();
  const u = session?.user as unknown as
    | { id?: string; email?: string; name?: string; role?: string; schoolId?: string | null }
    | undefined;
  if (!u?.id || !u?.email || !u.role || !(allowed as string[]).includes(u.role)) return null;
  return {
    id: u.id,
    email: u.email,
    name: u.name ?? "User",
    role: u.role as Role,
    schoolId: u.schoolId ?? null,
  };
}

/** Scope helper: school admins only ever see their own school's rows. */
export function schoolScope(user: SessionUser): string | null {
  return user.role === "super" ? null : user.schoolId;
}

export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export function badRequest(message: string, details?: unknown) {
  return Response.json({ error: message, details }, { status: 400 });
}
