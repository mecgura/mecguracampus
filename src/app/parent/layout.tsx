import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const u = session?.user as unknown as
    | { name?: string; email?: string; role?: string }
    | undefined;
  if (!u?.email || (u.role !== "parent" && u.role !== "super")) redirect("/login?callbackUrl=/parent");

  async function doSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F7FAF7" }}>
      <header style={{ background: "#0C160D", color: "#fff", padding: "14px 18px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/parent" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "#fff" }}>
            <span className="mc-mark">M</span>
            <span><b>Parent App</b><br /><span className="small" style={{ color: "#9db3a0" }}>{u.name}</span></span>
          </Link>
          <form action={doSignOut}>
            <button className="btn btn-sm" style={{ background: "#ffffff18", color: "#fff" }} type="submit">Sign Out</button>
          </form>
        </div>
      </header>
      <main style={{ maxWidth: 860, margin: "0 auto", padding: "20px 14px 60px" }}>{children}</main>
    </div>
  );
}
