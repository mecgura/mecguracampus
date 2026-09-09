"use client";

import { useCallback, useEffect, useState } from "react";

interface Row { id: string; name: string; class: string; school: string; attendance: number; present: boolean }

export default function AttendancePage() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const load = useCallback(async (d: string) => {
    setLoading(true);
    const r = await fetch(`/api/attendance?date=${d}`);
    if (r.ok) setRows((await r.json()).students);
    setLoading(false);
  }, []);

  useEffect(() => { load(date); }, [date, load]);

  function toggle(id: string) {
    setRows((prev) => prev.map((x) => (x.id === id ? { ...x, present: !x.present } : x)));
  }

  async function save() {
    setMsg("");
    const r = await fetch("/api/attendance", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, records: rows.map((x) => ({ studentId: x.id, present: x.present })) }),
    });
    if (r.ok) {
      const j = await r.json();
      setMsg(`Attendance saved. ${j.saved - j.absent} present, ${j.absent} absent.`);
    } else setMsg("Save failed.");
  }

  const present = rows.filter((x) => x.present).length;

  return (
    <div>
      <div className="mc-top">
        <div>
          <h1>Attendance — {date}</h1>
          <p>Saved to the database. Below 75% average → parent alert from WhatsApp Center.</p>
        </div>
        <div className="mc-actions">
          <input className="inp" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <button className="btn btn-g" onClick={save} type="button">Save Attendance</button>
        </div>
      </div>
      {msg ? <p className="alert info">{msg}</p> : null}
      <div className="grid4">
        <div className="card stat"><span>Present</span><b>{present} / {rows.length}</b><small>selected day</small></div>
        <div className="card stat"><span>Absent</span><b>{rows.length - present}</b><small>parents notified</small></div>
        <div className="card stat"><span>Low average</span><b>{rows.filter((x) => x.attendance < 75).length}</b><small>alerts ready</small></div>
        <div className="card stat"><span>Storage</span><b>Database</b><small>per-day records</small></div>
      </div>
      <div className="card mt">
        <h2>Mark Attendance</h2>
        {loading ? <div className="skel" /> : rows.map((s) => (
          <div key={s.id} className={`check ${s.present ? "done" : ""}`} onClick={() => toggle(s.id)} style={{ cursor: "pointer" }}>
            <span className="box">{s.present ? "✓" : ""}</span>
            <span><b>{s.name}</b> <span className="small">• {s.class} • {s.school} • avg {s.attendance}%</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}
