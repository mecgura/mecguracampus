"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface School {
  id: string; name: string; city: string; kind: string; students: number;
  plan: string; status: string; trialDays: number; due: number;
}

export default function SchoolsPage() {
  const [rows, setRows] = useState<School[]>([]);
  const [q, setQ] = useState("");
  const [f, setF] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [kind, setKind] = useState("School");
  const [count, setCount] = useState("300");
  const [plan, setPlan] = useState("Trial — 7 days free");

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/schools?q=${encodeURIComponent(q)}&status=${encodeURIComponent(f)}`);
    if (r.ok) setRows((await r.json()).schools);
    setLoading(false);
  }, [q, f]);

  useEffect(() => { load(); }, [load]);

  async function add() {
    if (name.trim().length < 2) return;
    const r = await fetch("/api/schools", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), city, kind, students: Number(count) || 0, plan }),
    });
    if (r.ok) { setShowAdd(false); setName(""); setCity(""); load(); }
  }

  async function toggle(id: string) {
    await fetch(`/api/schools/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle" }),
    });
    load();
  }

  return (
    <div>
      <div className="mc-top">
        <div>
          <h1>All Schools</h1>
          <p>Every tenant&apos;s plan, payments and access. Non-payment → suspend in one click.</p>
        </div>
        <div className="mc-actions">
          <Link className="btn btn-o" href="/console/onboarding">Setup Wizard</Link>
          <button className="btn btn-g" onClick={() => setShowAdd(true)} type="button">+ Add School</button>
        </div>
      </div>
      <div className="card">
        <div className="toolbar">
          <input className="inp" placeholder="Search schools…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="inp" value={f} onChange={(e) => setF(e.target.value)}>
            <option value="">All statuses</option>
            <option>Paid</option><option>Due</option><option>Trial</option><option>Off</option>
          </select>
        </div>
        {loading ? <div className="skel" /> : (
          <div style={{ overflowX: "auto" }}>
            <table className="tbl">
              <tbody>
                <tr><th>School</th><th>Students</th><th>Plan</th><th>Status</th><th>Actions</th></tr>
                {rows.map((s) => (
                  <tr key={s.id}>
                    <td><b>{s.name}</b> {s.kind && s.kind !== "School" ? <span className="bdg b">{s.kind}</span> : null}<br /><span className="small">{s.city}</span></td>
                    <td>{s.students}</td>
                    <td>{s.plan}</td>
                    <td>{s.status === "Paid" ? <span className="bdg g">Paid</span> : s.status === "Due" ? <span className="bdg a">Due</span> : s.status === "Off" ? <span className="bdg r">Suspended</span> : <span className="bdg gr">Trial — {s.trialDays}d</span>}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <Link className="btn btn-o btn-sm" href="/console/onboarding">Setup</Link>{" "}
                      <button className="btn btn-o btn-sm" onClick={() => toggle(s.id)} type="button">
                        {s.status === "Off" ? "Activate" : "Suspend"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {showAdd ? (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99, padding: 16 }}>
          <div className="card" style={{ width: "100%", maxWidth: 520 }}>
            <h2>New School (30 Seconds)</h2>
            <div className="fld"><label>School name</label><input className="inp" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sant Isher Public School" /></div>
            <div className="frow">
              <div className="fld"><label>City</label><input className="inp" value={city} onChange={(e) => setCity(e.target.value)} /></div>
              <div className="fld"><label>Students (approx.)</label><input className="inp" type="number" value={count} onChange={(e) => setCount(e.target.value)} /></div>
            </div>
            <div className="fld"><label>Type</label>
              <select className="inp" value={kind} onChange={(e) => setKind(e.target.value)}>
                <option>School</option>
                <option>Tuition Centre</option>
                <option>Coaching Institute</option>
                <option>College</option>
                <option>Playway</option>
                <option>Other</option>
              </select>
            </div>
            <div className="fld"><label>Plan</label>
              <select className="inp" value={plan} onChange={(e) => setPlan(e.target.value)}>
                <option>Trial — 7 days free</option>
                <option>Monthly — Rs. 2,499</option>
                <option>Annual — Rs. 24,999 (2 months free)</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-g" onClick={add} type="button">Add School</button>
              <button className="btn btn-o" onClick={() => setShowAdd(false)} type="button">Cancel</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
