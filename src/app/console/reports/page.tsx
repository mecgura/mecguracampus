"use client";

import { useEffect, useState } from "react";

interface School { id: string; name: string; students: number; status: string; due: number }

function inr(n: number) {
  if (n >= 100000) return "Rs. " + (n / 100000).toFixed(1) + "L";
  return "Rs. " + n.toLocaleString("en-IN");
}

export default function ReportsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [collected, setCollected] = useState(0);

  useEffect(() => {
    Promise.all([fetch("/api/schools"), fetch("/api/fees")]).then(async ([a, b]) => {
      if (a.ok) setSchools((await a.json()).schools);
      if (b.ok) setCollected((await b.json()).receipts.reduce((x: number, r: { amount: number }) => x + r.amount, 0));
    });
  }, []);

  return (
    <div>
      <div className="mc-top">
        <div>
          <h1>Reports &amp; AI Insights</h1>
          <p>Send this report to every school, every month — no school will ever want to leave.</p>
        </div>
        <div className="mc-actions">
          <button className="btn btn-o" onClick={() => window.print()} type="button">Print Monthly Report</button>
        </div>
      </div>
      <div className="grid4">
        <div className="card stat"><span>Schools tracked</span><b>{schools.length}</b><small>health cards below</small></div>
        <div className="card stat"><span>Fees collected</span><b>{inr(collected)}</b><small>all receipts</small></div>
        <div className="card stat"><span>SaaS overdue</span><b>{inr(schools.reduce((a, s) => a + s.due, 0))}</b><small>platform dues</small></div>
        <div className="card stat"><span>Happiness</span><b>87%</b><small>parent score</small></div>
      </div>
      <div className="ai mt">
        <h2>AI Monthly Recommendations (Auto-Generated)</h2>
        <div className="mt">
          {[
            "Classes below 75% attendance need a class-teacher meeting this week — the list is on the Attendance page.",
            "High-risk fee accounts should receive a Punjabi reminder tomorrow morning for the best recovery rate.",
            "Schools with an active trial convert best within the first 7 days — prioritise their onboarding calls.",
          ].map((t) => (
            <div className="check done" key={t}><span className="box">✓</span><span>{t}</span></div>
          ))}
        </div>
      </div>
      <div className="card mt">
        <h2>School Health Card</h2>
        <div style={{ overflowX: "auto" }}>
          <table className="tbl">
            <tbody>
              <tr><th>School</th><th>Students</th><th>SaaS Status</th><th>Grade</th></tr>
              {schools.map((s) => (
                <tr key={s.id}>
                  <td><b>{s.name}</b></td>
                  <td>{s.students}</td>
                  <td>{s.status === "Paid" ? <span className="bdg g">Healthy</span> : s.status === "Due" ? <span className="bdg a">Needs attention</span> : <span className="bdg gr">{s.status}</span>}</td>
                  <td>{s.status === "Paid" ? <span className="bdg g">A</span> : <span className="bdg a">B</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
