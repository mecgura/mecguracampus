"use client";

import { useCallback, useEffect, useState } from "react";

interface School { id: string; name: string; plan: string; status: string; due: number }

function inr(n: number) {
  if (n >= 100000) return "Rs. " + (n / 100000).toFixed(1) + "L";
  return "Rs. " + n.toLocaleString("en-IN");
}

export default function BillingPage() {
  const [rows, setRows] = useState<School[]>([]);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const r = await fetch("/api/schools");
    if (r.ok) setRows((await r.json()).schools);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function collect(id: string, name: string) {
    await fetch(`/api/schools/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "collectSaaS" }),
    });
    setMsg(`Subscription payment recorded for ${name}.`);
    load();
  }

  const paying = rows.filter((s) => s.status === "Paid").length;
  const due = rows.reduce((a, s) => a + s.due, 0);

  return (
    <div>
      <div className="mc-top">
        <div>
          <h1>Plans &amp; Billing — Your Revenue</h1>
          <p>Every rupee from every school, tracked here.</p>
        </div>
      </div>
      {msg ? <p className="alert info">{msg}</p> : null}
      <div className="grid4">
        <div className="card stat"><span>Paying schools</span><b>{paying}</b><small>active subscriptions</small></div>
        <div className="card stat"><span>SaaS overdue</span><b>{inr(due)}</b><small>to recover</small></div>
        <div className="card stat"><span>Trials live</span><b>{rows.filter((s) => s.status === "Trial").length}</b><small>convert in 7 days</small></div>
        <div className="card stat"><span>Annual target</span><b>50 schools</b><small>= Rs. 10L+ / year</small></div>
      </div>
      <div className="grid2 mt">
        <div className="card"><h2>Trial — 7 Days</h2><b style={{ fontSize: 26 }}>Rs. 0</b><p className="small mt">Full system, up to 100 students. No card required.</p></div>
        <div className="card" style={{ border: "2px solid #3b82f6" }}><h2>Micro <span className="bdg b">Tuition &amp; Coaching</span></h2><b style={{ fontSize: 26 }}>Rs. 999</b><span className="small"> / month</span><p className="small mt">Up to 200 students. Fees + attendance + 1,000 WhatsApps. Small institutes start here.</p></div>
        <div className="card" style={{ border: "2px solid #78ce57" }}><h2>Monthly <span className="bdg br">Most Popular</span></h2><b style={{ fontSize: 26 }}>Rs. 2,499</b><span className="small"> / month</span><p className="small mt">Unlimited students, 5,000 WhatsApps, bus GPS, support.</p></div>
        <div className="card" style={{ border: "2px solid #0C160D" }}><h2>Annual <span className="bdg b">2 Months Free</span></h2><b style={{ fontSize: 26 }}>Rs. 24,999</b><span className="small"> / year</span><p className="small mt">Everything plus AI Predictor and free onboarding.</p></div>
      </div>
      <div className="card mt">
        <h2>School Subscriptions</h2>
        <div style={{ overflowX: "auto" }}>
          <table className="tbl">
            <tbody>
              <tr><th>School</th><th>Plan</th><th>Status</th><th></th></tr>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td><b>{s.name}</b></td>
                  <td className="small">{s.plan}</td>
                  <td>{s.status === "Paid" ? <span className="bdg g">Active</span> : s.status === "Due" ? <span className="bdg a">Overdue</span> : <span className="bdg gr">{s.status}</span>}</td>
                  <td>{s.status === "Due" ? <button className="btn btn-g btn-sm" onClick={() => collect(s.id, s.name)} type="button">Record Payment</button> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
