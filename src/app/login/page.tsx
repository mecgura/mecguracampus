"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/console";
  const wasUnauthorized = searchParams.get("error") === "unauthorized";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(
    wasUnauthorized ? "Please sign in to access the console." : ""
  );
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError("Invalid email or password. Please try again.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="login-card">
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <span className="mc-mark" style={{ width: 48, height: 48, fontSize: 24, margin: "0 auto" }}>M</span>
        <h1 style={{ fontSize: 22, marginTop: 12 }}>Console Sign In</h1>
        <p className="small">MecguraCampus owner and school access only.</p>
      </div>
      {error ? <p className="alert err" role="alert">{error}</p> : null}
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
