import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ConsoleShell } from "@/components/console-shell";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const u = session?.user as unknown as
    | { name?: string; email?: string; role?: string; schoolName?: string | null }
    | undefined;
  if (!u?.email || (u.role !== "super" && u.role !== "school")) redirect("/login");

  return (
    <ConsoleShell
      user={{
        name: u.name ?? "User",
        email: u.email,
        role: u.role as "super" | "school",
        schoolName: u.schoolName ?? null,
      }}
    >
      {children}
    </ConsoleShell>
  );
}
