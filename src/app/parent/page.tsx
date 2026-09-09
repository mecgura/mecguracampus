"use client";

import { useCallback, useEffect, useState } from "react";

interface Kid {
  id: string; name: string; class: string; school: string; schoolId: string;
  feeMonthly: number; feeDue: number; attendance: number;
  presentToday: boolean | null; stars: number;
  exams: { subject: string; marks: number }[];
  receipts: { amount: number; date: string; mode: string }[];
}
interface DayInfo {
  school: string; date: string; time: string; status: string;
  current: { subject: string; teacher: string; className: string; start: string; end: string } | null;
  minsLeft: number;
  next: { subject: string; start: string } | null;
  periods: { subject: string; start: string; end: string }[];
  tiffin: { meal: string; items: string }[];
  leavesOn: { name: string; role: string; reason: string; substitute: string }[];
}
interface Notice { id: string; title: string; body: string; audience: string; createdAt: string; school: { name: string } | null }
interface Bus { id: string; number: string; route: string; status: string }
interface Msg { id: string; recipient: string; template: string; language: string; status: string }

function inr(n: number) {
  return "Rs. " + n.toLocaleString("en-IN");
}

export default function ParentHome() {
  const [name, setName] = useState("");
  const [kids, setKids] = useState<Kid[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [payMsg, setPayMsg] = useState("");
  const [day, setDay] = useState<DayInfo | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/parent/overview");
    if (r.ok) {
      const j = await r.json();
      setName(j.parent.name);
      setKids(j.kids);
      setNotices(j.notices);
      setBuses(j.buses);
      setMsgs(j.messages);
      const firstSchool = j.kids?.[0]?.schoolId;
      if (firstSchool) {
        const d = await fetch(`/api/school-day?schoolId=${firstSchool}`);
        if (d.ok) setDay(await d.json());
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function pay(kidId: string, amount: number) {
    setPayMsg("");
    const r = await fetch("/api/payments/order", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: kidId, amount, mode: "Online" }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setPayMsg("Payment failed: " + (j.error ?? "try again")); return; }
    if (j.demo) {
      setPayMsg(`Demo order ${j.order.id} for ${inr(amount)} — recorded. Pay at school office or via UPI to complete.`);
    } else {
      // Live Razorpay checkout
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => {
        const Rzp = (window as unknown as { Razorpay: new (o: object) => { open: () => void } }).Razorpay;
        new Rzp({
          key: j.keyId, amount: j.order.amount, currency: "INR",
          name: "MecguraCampus Fees", order_id: j.order.id,
          handler: () => { setPayMsg("Payment successful. Receipt is on its way."); load(); },
        }).open();
      };
      document.body.appendChild(s);
    }
  }

  if (loading) {
    return (<div><h1>Parent App</h1><div className="skel mt" /><div className="skel mt" /></div>);
  }

  return (
    <div>
      <h1 style={{ fontSize: 22 }}>Sat Sri Akal, {name}</h1>
      <p className="small">Your children, fees, results and school bus — all here.</p>
      {payMsg ? <p className="alert info mt">{payMsg}</p> : null}

      {day ? (
        <div className="card mt" style={{ border: "2px solid #78ce57" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <h2 style={{ margin: 0 }}>Today at {day.school}</h2>
            <span className={`bdg ${day.status === "In Session" ? "g" : day.status === "Holiday" ? "gr" : "a"}`}>
              {day.status === "In Session" ? "● LIVE" : day.status} • {day.time}
            </span>
          </div>
          {day.current ? (
            <p className="mt"><b>Now: {day.current.subject}</b> <span className="small">• {day.current.teacher} • ends in {day.minsLeft} min</span></p>
          ) : day.next ? (
            <p className="mt"><b>Next: {day.next.subject}</b> <span className="small">• at {day.next.start}</span></p>
          ) : (
            <p className="small mt">{day.status === "Holiday" ? "No classes today — enjoy the holiday." : "School hours are over for today."}</p>
          )}
          {kids.map((k) => (
            <p className="small" key={k.id}>
              <b>{k.name}</b> — today: {k.presentToday === null ? "not marked yet" : k.presentToday ? "Present ✓" : "Absent"} • ⭐ {k.stars} stars
            </p>
          ))}
          {day.tiffin.length > 0 ? <p className="small">🍱 Tiffin: <b>{day.tiffin.map((t) => t.items).join(" | ")}</b></p> : null}
          {day.leavesOn.length > 0 ? (
            <p className="small">📝 On leave today: {day.leavesOn.map((l) => `${l.name} (${l.role}) — substitute: ${l.substitute}`).join("; ")}</p>
          ) : <p className="small">📝 All teachers present today.</p>}
        </div>
      ) : null}

      {kids.map((k) => (
        <div className="card mt" key={k.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div>
              <b style={{ fontSize: 17 }}>{k.name}</b>
              <div className="small">Class {k.class} • {k.school} • Attendance {k.attendance}%</div>
            </div>
            {k.feeDue > 0
              ? <span className="bdg a">{inr(k.feeDue)} due</span>
              : <span className="bdg g">Fees clear</span>}
          </div>
          {k.feeDue > 0 ? (
            <div className="mt">
              <button className="btn btn-g" onClick={() => pay(k.id, k.feeDue)} type="button">
                Pay {inr(k.feeDue)} Online
              </button>
            </div>
          ) : null}
          {k.exams.length > 0 ? (
            <div className="mt">
              <b style={{ fontSize: 13 }}>Latest results</b>
              <table className="tbl"><tbody>
                {k.exams.map((e) => (
                  <tr key={e.subject}><td>{e.subject}</td><td><b>{e.marks} / 100</b></td></tr>
                ))}
              </tbody></table>
            </div>
          ) : null}
          {k.receipts.length > 0 ? (
            <p className="small mt">Last paid: {inr(k.receipts[0].amount)} on {new Date(k.receipts[0].date).toLocaleDateString("en-IN")} ({k.receipts[0].mode})</p>
          ) : null}
        </div>
      ))}

      <div className="card mt">
        <h2>School Notices</h2>
        {notices.length === 0 ? <p className="small">No notices right now.</p> : notices.map((n) => (
          <div className="bubble" key={n.id}>
            <b>{n.title}</b>
            <div className="small">{n.body}</div>
            <div className="small">{n.school?.name} • {new Date(n.createdAt).toLocaleDateString("en-IN")}</div>
          </div>
        ))}
      </div>

      <div className="card mt">
        <h2>School Bus — Live</h2>
        {buses.length === 0 ? <p className="small">No buses assigned.</p> : buses.map((b) => (
          <div className="check" key={b.id}>
            <span className="box" style={{ border: "none", fontSize: 18 }}>🚌</span>
            <span style={{ flex: 1 }}><b>{b.number}</b> <span className="small">• {b.route}</span><br />
              <span className="small">{b.status === "Live" ? "Running now" : "Offline"}</span></span>
            <a className="btn btn-o btn-sm" href={`/track/${b.id}`} target="_blank" rel="noreferrer">Track</a>
          </div>
        ))}
      </div>

      {msgs.length > 0 ? (
        <div className="card mt">
          <h2>Recent Messages</h2>
          {msgs.slice(0, 5).map((m) => (
            <p className="small" key={m.id}>• {m.template} <span className="bdg br">{m.language}</span></p>
          ))}
        </div>
      ) : null}

      <div className="mt" style={{ textAlign: "center" }}>
        <a className="btn btn-o btn-sm" href="/apps">Get Mobile App</a>
      </div>
    </div>
  );
}
