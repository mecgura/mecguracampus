"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, getSession } from "next-auth/react";

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
    <div className="login-card">
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <span className="mc-mark" style={{ width: 48, height: 48, fontSize: 24, margin: "0 auto" }}>M</span>
        <h1 style={{ fontSize: 22, marginTop: 12 }}>Sign In</h1>
        <p className="small">Owner, school and parent access.</p>
      </div>
      {serverError ? <p className="alert err" role="alert">{serverError}</p> : null}
      <form onSubmit={onSubmit} noValidate>
        <div className="fld">
          <label htmlFor="email">Email</label>
          <input id="email" className="inp" type="email" autoComplete="email" placeholder="owner@mecguracampus.com"
            value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="fld">
          <label htmlFor="password">Password</label>
          <input id="password" className="inp" type="password" autoComplete="current-password" placeholder="••••••••"
            value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button className="btn btn-g" style={{ width: "100%", height: 48 }} disabled={loading} type="submit">
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>
      <div className="alert info mt">
        Demo accounts — Super: <b>owner@mecguracampus.com / Admin@12345</b>
        <br />School: <b>school@gnps.com / School@12345</b>
        <br />Parent: <b>parent.arshdeep@example.com / Parent@12345</b>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="login-wrap">
      <Suspense fallback={<p className="small">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
