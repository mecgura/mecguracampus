"use client";

import { useCallback, useEffect, useState } from "react";

interface Risk { id: string; name: string; class: string; school: string; due: number; risk: number }
interface Receipt { id: string; studentName: string; schoolName: string; amount: number; date: string; mode: string }

function inr(n: number) {
  if (n >= 100000) return "Rs. " + (n / 100000).toFixed(1) + "L";
  return "Rs. " + n.toLocaleString("en-IN");
}
function riskOf(due: number, att: number) {
  let s = 0;
  if (due >= 10000) s += 45; else if (due >= 5000) s += 30; else if (due > 0) s += 15;
  return s + 8; // attendance unknown here; server list carries true risk
}

export default function FeesPage() {
  const [risk, setRisk] = useState<Risk[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [debtors, setDebtors] = useState<{ id: string; name: string; feeDue: number; attendance: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPay, setShowPay] = useState(false);
  const [payId, setPayId] = useState("");
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("UPI");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [o, s, f] = await Promise.all([fetch("/api/overview"), fetch("/api/students"), fetch("/api/fees")]);
    if (o.ok) setRisk((await o.json()).risk ?? []);
    if (s.ok) {
      const list = (await s.json()).students;
      const d = list.filter((x: { feeDue: number }) => x.feeDue > 0);
      setDebtors(d);
      if (!payId && d.length) setPayId(d[0].id);
    }
    if (f.ok) setReceipts((await f.json()).receipts);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  async function collect() {
    setMsg("");
    const r = await fetch("/api/fees", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: payId, amount: Number(amount) || 0, mode }),
    });
    if (r.ok) { setShowPay(false); setAmount(""); setMsg("Payment recorded. Receipt logged."); load(); }
    else setMsg("Payment failed: " + (await r.json()).error);
  }

  async function remind(name: string) {
    const r = await fetch("/api/fees", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reminderFor: name + " (Parent)" }),
    });
    if (r.ok) { setMsg("AI reminder queued for " + name + "."); load(); }
  }

  const totalDue = risk.reduce((a, x) => a + x.due, 0);
  const collected = receipts.reduce((a, x) => a + x.amount, 0);

  return (
    <div>
      <div className="mc-top">
        <div>
          <h1>Fees + AI Predictor</h1>
          <p>Live dues, live collection, live risk ranking.</p>
        </div>
        <div className="mc-actions">
          <button className="btn btn-g" onClick={() => setShowPay(true)} type="button">+ Collect Fee</button>
        </div>
      </div>
      {msg ? <p className="alert info">{msg}</p> : null}
      <div className="grid4">
        <div className="card stat"><span>Outstanding</span><b>{inr(totalDue)}</b><small>{risk.length} accounts</small></div>
        <div className="card stat"><span>Collected</span><b>{inr(collected)}</b><small>{receipts.length} receipts</small></div>
        <div className="card stat"><span>High risk</span><b>{risk.filter((x) => x.risk > 65).length}</b><small>contact tomorrow</small></div>
        <div className="card stat"><span>Risk model</span><b>Live</b><small>dues + attendance</small></div>
      </div>
      <div className="ai mt">
        <h2>AI Defaulter Prediction — Priority Follow-up List</h2>
        {loading ? <div className="skel mt" /> : (
          <div style={{ overflowX: "auto" }} className="mt">
            <table className="tbl" style={{ background: "#fff", borderRadius: 12 }}>
              <tbody>
                <tr><th>Parent</th><th>Outstanding</th><th>AI Risk</th><th>Priority</th><th></th></tr>
                {risk.map((x) => (
                  <tr key={x.id}>
                    <td><b>{x.name}</b><br /><span className="small">{x.class} • {x.school}</span></td>
                    <td>{inr(x.due)}</td>
                    <td style={{ minWidth: 130 }}>
                      <div className="risk"><i style={{ width: `${x.risk}%`, background: x.risk > 65 ? "#ef4444" : x.risk > 35 ? "#f59e0b" : "#10b981" }} /></div>
                      <span className="small">{x.risk}%</span>
                    </td>
                    <td>{x.risk > 65 ? <span className="bdg r">HIGH</span> : x.risk > 35 ? <span className="bdg a">MEDIUM</span> : <span className="bdg g">LOW</span>}</td>
                    <td><button className="btn btn-g btn-sm" onClick={() => remind(x.name)} type="button">Send Reminder</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="card mt">
        <h2>Recent Receipts</h2>
        <div style={{ overflowX: "auto" }}>
          <table className="tbl">
            <tbody>
              <tr><th>Receipt</th><th>School</th><th>Amount</th><th>Date • Mode</th></tr>
              {receipts.slice(0, 20).map((x) => (
                <tr key={x.id}>
                  <td><b>{x.studentName}</b></td>
                  <td className="small">{x.schoolName}</td>
                  <td><b>{inr(x.amount)}</b></td>
                  <td className="small">{new Date(x.date).toLocaleDateString("en-IN")} • {x.mode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showPay ? (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99, padding: 16 }}>
          <div className="card" style={{ width: "100%", maxWidth: 480 }}>
            <h2>Collect Fee</h2>
            <div className="fld"><label>Student with dues</label>
              <select className="inp" value={payId} onChange={(e) => setPayId(e.target.value)}>
                {debtors.map((d) => <option key={d.id} value={d.id}>{d.name} — Rs. {d.feeDue.toLocaleString("en-IN")} due</option>)}
              </select>
            </div>
            <div className="frow">
              <div className="fld"><label>Amount (Rs.)</label><input className="inp" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
              <div className="fld"><label>Mode</label>
                <select className="inp" value={mode} onChange={(e) => setMode(e.target.value)}>
                  <option>UPI</option><option>Cash</option><option>Online</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-g" onClick={collect} type="button">Collect + Send Receipt</button>
              <button className="btn btn-o" onClick={() => setShowPay(false)} type="button">Cancel</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// keep tree-shaken helper referenced for future client-side estimates
void riskOf;
