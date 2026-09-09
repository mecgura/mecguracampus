"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

export interface ConsoleUser {
  name: string;
  email: string;
  role: "super" | "school";
  schoolName: string | null;
}

const NAV: { href: string; label: string; ico: string; super?: boolean; isNew?: boolean }[] = [
  { href: "/console", label: "Super Dashboard", ico: "📊", super: true },
  { href: "/console/onboarding", label: "New School Setup", ico: "🚀", super: true, isNew: true },
  { href: "/console/schools", label: "All Schools", ico: "🏫", super: true },
  { href: "/console/students", label: "Students", ico: "🎓" },
  { href: "/console/staff", label: "Staff & Payroll", ico: "👨‍🏫" },
  { href: "/console/import", label: "Sheet Import", ico: "📥", super: true, isNew: true },
  { href: "/console/fees", label: "Fees + AI Predictor", ico: "💰", isNew: true },
  { href: "/console/attendance", label: "Attendance", ico: "📋" },
  { href: "/console/routine", label: "Daily Routine", ico: "🗓️", isNew: true },
  { href: "/console/exams", label: "Exams & Report Card", ico: "🏆" },
  { href: "/console/transport", label: "Transport GPS", ico: "🚌" },
  { href: "/console/devices", label: "Devices", ico: "📡", isNew: true },
  { href: "/console/hiring", label: "Hiring ATS", ico: "🧑‍🏫", isNew: true },
  { href: "/console/admissions", label: "Admissions CRM", ico: "🤝", isNew: true },
  { href: "/console/messages", label: "WhatsApp Center", ico: "💬", isNew: true },
  { href: "/console/reports", label: "Reports & AI Insights", ico: "📈" },
  { href: "/console/billing", label: "Plans & Billing", ico: "💳", super: true },
  { href: "/console/settings", label: "Settings", ico: "⚙️", super: true },
];

export function ConsoleShell({ user, children }: { user: ConsoleUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const links = NAV.filter((n) => !n.super || user.role === "super");

  return (
    <div className="mc-shell">
      <aside className="mc-side">
        <Link className="mc-brand" href="/console">
          <span className="mc-mark">M</span>
          <span>
            <b>MecguraCampus</b>
            <small>{user.role === "super" ? "Super Admin" : user.schoolName ?? "School"}</small>
          </span>
        </Link>
        <nav className="mc-nav" aria-label="Console">
          {links.map((n) => {
            const active = n.href === "/console" ? pathname === "/console" : pathname.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined} className={active ? "on" : ""}>
                <span className="ico">{n.ico}</span>
                {n.label}
                {n.isNew ? <span className="mc-new">NEW</span> : null}
              </Link>
            );
          })}
        </nav>
        <div className="mc-side-foot">
          <p style={{ color: "#c9d8cb", marginBottom: 4 }}>{user.name}</p>
          <p style={{ marginBottom: 10 }}>{user.email}</p>
          <button className="btn btn-sm" style={{ background: "#ffffff18", color: "#fff", width: "100%" }}
            onClick={() => signOut({ callbackUrl: "/login" })} type="button">
            Sign Out
          </button>
        </div>
      </aside>
      <main className="mc-main">{children}</main>
    </div>
  );
}
