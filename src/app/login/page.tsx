"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, getSession } from "next-auth/react";

const FEATURES = [
  { ico: "💰", label: "Fees, dues and AI collection risk — in one place" },
  { ico: "🚌", label: "Live transport tracking for every bus" },
  { ico: "📋", label: "Attendance, exams and daily routine automated" },
  { ico: "💬", label: "WhatsApp updates straight to parents" },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/console";
  const errParam = searchParams.get("error") ?? "";
  const [serverError, setServerError] = useState(
    errParam === "unauthorized"
      ? "Please sign in to access that page."
      : errParam
        ? "Session expired or access denied. Please sign in again."
        : ""
  );
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setServerError("");
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setServerError("Invalid email or password. Please try again.");
      return;
    }
    // Role-based landing: parents go to the Parent App, everyone else
    // goes where they were headed. No more bounce-back confusion.
    const session = await getSession();
    const role = (session?.user as unknown as { role?: string } | undefined)?.role;
    router.push(role === "parent" ? "/parent" : callbackUrl);
    router.refresh();
  }

  return (
    <div className="auth-shell">
      <aside className="auth-side">
        <div className="auth-brand">
          <span className="mc-mark" style={{ width: 44, height: 44, fontSize: 20 }}>M</span>
          <span>
            <b>MecguraCampus</b>
            <small>School Management OS</small>
          </span>
        </div>
        <div className="auth-pitch">
          <h2>Run your whole campus from one dashboard.</h2>
          <p>Fees, attendance, transport, staff and parents — connected in real time, built for Indian schools.</p>
          <ul className="auth-features">
            {FEATURES.map((f) => (
              <li key={f.label}>
                <span className="fico">{f.ico}</span>
                {f.label}
              </li>
            ))}
          </ul>
        </div>
        <p className="auth-foot">© {new Date().getFullYear()} MecguraCampus · Powered by MECGURA</p>
      </aside>

      <div className="auth-form-side">
        <div className="auth-card">
          <h1>Welcome back</h1>
          <p className="sub">Sign in to your campus dashboard.</p>

          {serverError ? <p className="alert err" role="alert">{serverError}</p> : null}

          <form onSubmit={onSubmit} noValidate>
            <div className="fld">
              <label htmlFor="email">Email</label>
              <div className="auth-inp-wrap">
                <span className="fico2">✉️</span>
                <input id="email" className="inp" type="email" autoComplete="email" placeholder="you@school.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>
            <div className="fld">
              <label htmlFor="password">Password</label>
              <div className="auth-inp-wrap">
                <span className="fico2">🔒</span>
                <input id="password" className="inp" type="password" autoComplete="current-password" placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </div>
            <button className="btn btn-g auth-submit" disabled={loading} type="submit">
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <details className="auth-demo">
            <summary>Demo credentials (for evaluation)</summary>
            <div className="auth-demo-body">
              <div>Super Admin — <b>owner@mecguracampus.com</b> / Admin@12345</div>
              <div>School Admin — <b>school@gnps.com</b> / School@12345</div>
              <div>Parent — <b>parent.arshdeep@example.com</b> / Parent@12345</div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="auth-shell" />}>
      <LoginForm />
    </Suspense>
  );
}
