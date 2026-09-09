"use client";

import { useCallback, useEffect, useState } from "react";

interface Member { id: string; name: string; role: string; salary: number; status: string; school: { name: string } }
interface School { id: string; name: string }

function inr(n: number) {
  if (n >= 100000) return "Rs. " + (n / 100000).toFixed(1) + "L";
  return "Rs. " + n.toLocaleString("en-IN");
}

export default function StaffPage() {
  const [rows, setRows] = useState<Member[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [a, b] = await Promise.all([fetch("/api/staff"), fetch("/api/schools")]);
    if (a.ok) setRows((await a.json()).staff);
    if (b.ok) setSchools((await b.json()).schools);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function pay(id: string) {
    await fetch(`/api/staff/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "pay" }),
    });
    load();
  }

  async function payAll() {
    const r = await fetch("/api/staff", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "payAll" }),
    });
    if (r.ok) setMsg(`${(await r.json()).paid} salaries released.`);
    load();
  }

  const total = rows.reduce((a, s) => a + s.salary, 0);
  const pend = rows.filter((s) => s.status === "Pending");

  return (
    <div>
      <div className="mc-top">
        <div>
          <h1>Staff &amp; Payroll</h1>
          <p>Salaries release straight from this screen.</p>
        </div>
        <div className="mc-actions">
          <button className="btn btn-g" onClick={payAll} type="button">Release All Salaries</button>
        </div>
      </div>
      {msg ? <p className="alert info">{msg}</p> : null}
      <div className="grid4">
        <div className="card stat"><span>Total staff</span><b>{rows.length}</b><small>on payroll</small></div>
        <div className="card stat"><span>Monthly payroll</span><b>{inr(total)}</b><small>combined</small></div>
        <div className="card stat"><span>Pending</span><b>{pend.length}</b><small>{inr(pend.reduce((a, s) => a + s.salary, 0))} outstanding</small></div>
        <div className="card stat"><span>Paid</span><b>{rows.length - pend.length}</b><small>slips sent</small></div>
      </div>
      <div className="card mt">
        {loading ? <div className="skel" /> : (
          <div style={{ overflowX: "auto" }}>
            <table className="tbl">
              <tbody>
                <tr><th>Staff Member</th><th>School</th><th>Salary</th><th>Status</th><th></th></tr>
                {rows.map((s) => (
                  <tr key={s.id}>
                    <td><b>{s.name}</b><br /><span className="small">{s.role}</span></td>
                    <td className="small">{s.school.name}</td>
                    <td><b>{inr(s.salary)}</b></td>
                    <td>{s.status === "Paid" ? <span className="bdg g">Paid</span> : <span className="bdg a">Pending</span>}</td>
                    <td>{s.status === "Paid" ? null : <button className="btn btn-g btn-sm" onClick={() => pay(s.id)} type="button">Pay Now</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="small mt">New hires are added during school onboarding. {schools.length} schools on platform.</p>
      </div>
    </div>
  );
}
