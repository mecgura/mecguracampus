"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Overview {
  totals: { schools: number; students: number; collected: number; receipts: number; liveBuses: string; offlineBus: string | null };
  schools: { id: string; name: string; city: string; students: number; plan: string; status: string; trialDays: number; due: number }[];
  risk: { id: string; name: string; class: string; school: string; due: number; risk: number }[];
  funnel: { k: string; v: number }[];
  happiness: number;
}

function inr(n: number) {
  if (n >= 100000) return "Rs. " + (n / 100000).toFixed(1) + "L";
  return "Rs. " + n.toLocaleString("en-IN");
}

export default function ConsoleHome() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/overview")
      .then(async (r) => {
        if (!r.ok) throw new Error();
        setData(await r.json());
      })
      .catch(() => setError("Could not load dashboard data."));
  }, []);

  if (error) return <p className="alert err" role="alert">{error}</p>;
  if (!data) {
    return (
      <div>
        <h1>Platform Overview</h1>
        <div className="grid4 mt">
          {[0, 1, 2, 3].map((i) => <div key={i} className="skel" />)}
        </div>
      </div>
    );
  }
  const t = data.totals;
  const maxFunnel = Math.max(...data.funnel.map((f) => f.v), 1);

  return (
    <div>
      <div className="mc-top">
        <div>
          <h1>Platform Overview</h1>
          <p>Revenue, schools, students and transport — live from the database.</p>
        </div>
      </div>
      <div className="grid4">
        <div className="card stat"><span>Total Schools</span><b>{t.schools}</b><small>tenants on platform</small></div>
        <div className="card stat"><span>Total Students</span><b>{t.students.toLocaleString("en-IN")}</b><small>across all schools</small></div>
        <div className="card stat"><span>Fees Collected</span><b>{inr(t.collected)}</b><small>{t.receipts} receipts</small></div>
        <div className="card stat"><span>Buses Live</span><b>{t.liveBuses}</b><small>{t.offlineBus ? `offline: ${t.offlineBus}` : "all running"}</small></div>
      </div>

      <div className="grid2 mt">
        <div className="ai">
          <h2>AI Collection Predictor <span className="bdg b">NEW</span></h2>
          <p className="small">Highest-risk outstanding accounts, computed live.</p>
          {data.risk.slice(0, 3).map((x) => (
            <div key={x.id} style={{ display: "flex", gap: 10, alignItems: "center", background: "#fff", border: "1px solid #e9e2fb", borderRadius: 11, padding: "10px 13px", marginTop: 9 }}>
              <div style={{ flex: 1 }}>
                <b style={{ fontSize: 13 }}>{x.name}</b> <span className="small">• {x.class} • {inr(x.due)}</span>
                <div className="risk" style={{ marginTop: 6 }}>
                  <i style={{ width: `${x.risk}%`, background: x.risk > 65 ? "#ef4444" : x.risk > 35 ? "#f59e0b" : "#10b981" }} />
                </div>
              </div>
              <span className={`bdg ${x.risk > 65 ? "r" : x.risk > 35 ? "a" : "g"}`}>{x.risk}%</span>
            </div>
          ))}
          <div className="mt"><Link className="btn btn-d btn-sm" href="/console/fees">Open Fees + AI</Link></div>
        </div>
        <div className="card">
          <h2>Admissions Funnel</h2>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            {data.funnel.map((f) => (
              <div key={f.k} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ height: 120, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                  <div style={{ width: "70%", height: `${Math.round((f.v / maxFunnel) * 100)}%`, background: "#78ce57", borderRadius: "7px 7px 0 0" }} />
                </div>
                <div className="small" style={{ marginTop: 6 }}>{f.k}<br /><b>{f.v}</b></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card mt">
        <h2>Schools — Live Status</h2>
        <div style={{ overflowX: "auto" }}>
          <table className="tbl">
            <tbody>
              <tr><th>School</th><th>Students</th><th>Plan</th><th>Status</th></tr>
              {data.schools.map((s) => (
                <tr key={s.id}>
                  <td><b>{s.name}</b><br /><span className="small">{s.city}</span></td>
                  <td>{s.students}</td>
                  <td>{s.plan}</td>
                  <td>{s.status === "Paid" ? <span className="bdg g">Paid</span> : s.status === "Due" ? <span className="bdg a">{inr(s.due)} Due</span> : s.status === "Off" ? <span className="bdg r">Suspended</span> : <span className="bdg gr">Trial — {s.trialDays}d</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt"><Link className="btn btn-o btn-sm" href="/console/schools">Manage Schools</Link></div>
      </div>
    </div>
  );
}
