import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validations";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 12 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        const user = await db.user.findUnique({
          where: { email: email.toLowerCase().trim() },
          include: { school: { select: { id: true, name: true } } },
        });
        if (!user || (user.role !== "super" && user.role !== "school" && user.role !== "parent")) return null;
        if (user.role === "school" && !user.schoolId) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          name: user.name ?? "User",
          email: user.email,
          role: user.role,
          schoolId: user.schoolId,
          schoolName: user.school?.name ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "school";
        token.schoolId = (user as { schoolId?: string | null }).schoolId ?? null;
        token.schoolName = (user as { schoolName?: string | null }).schoolName ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const u = session.user as unknown as Record<string, unknown>;
        u.id = token.id as string;
        u.role = (token.role as string) ?? "school";
        u.schoolId = (token.schoolId as string | null) ?? null;
        u.schoolName = (token.schoolName as string | null) ?? null;
      }
      return session;
    },
  },
});
