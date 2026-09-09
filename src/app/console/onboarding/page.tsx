"use client";

import { useCallback, useEffect, useState } from "react";

const ALL = [
  "Account created",
  "Plan selected (Trial / Monthly / Annual)",
  "Classes configured",
  "Students imported (Excel)",
  "Fee heads defined",
  "Staff logins created",
  "Bus routes + GPS linked",
  "WhatsApp connected",
  "Go-live + welcome message",
];

interface School { id: string; name: string; city: string; onboarding: string }

export default function OnboardingPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [id, setId] = useState("");
  const [done, setDone] = useState<string[]>([]);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const r = await fetch("/api/schools");
    if (!r.ok) return;
    const list: School[] = (await r.json()).schools;
    setSchools(list);
    const cur = list.find((s) => s.id === id) ?? list[0];
    if (cur) {
      setId(cur.id);
      try { setDone(JSON.parse(cur.onboarding || "[]")); } catch { setDone([]); }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const cur = schools.find((s) => s.id === id);
    if (cur) {
      try { setDone(JSON.parse(cur.onboarding || "[]")); } catch { setDone([]); }
    }
  }, [id, schools]);

  async function persist(next: string[]) {
    setDone(next);
    await fetch(`/api/schools/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onboarding: JSON.stringify(next) }),
    });
  }

  function next() {
    const nxt = ALL.find((s) => !done.includes(s));
    if (!nxt) { setMsg("All steps complete. This school is ready for Go-Live."); return; }
    persist([...done, nxt]);
  }

  const cur = schools.find((s) => s.id === id);
  const pct = Math.round((done.length / ALL.length) * 100);

  return (
    <div>
      <div className="mc-top">
        <div>
          <h1>New School Onboarding — Live in 15 Minutes</h1>
          <p>Checklist progress is saved to the database per school.</p>
        </div>
      </div>
      {msg ? <p className="alert info">{msg}</p> : null}
      <div className="card">
        <div className="toolbar">
          <select className="inp" value={id} onChange={(e) => setId(e.target.value)}>
            {schools.map((s) => <option key={s.id} value={s.id}>{s.name} • {s.city}</option>)}
          </select>
          <span className="bdg br">{pct}% complete</span>
        </div>
        <div style={{ display: "flex", gap: 6, margin: "16px 0 22px" }}>
          {ALL.map((s) => (
            <div key={s} style={{ flex: 1, height: 8, borderRadius: 100, background: done.includes(s) ? "#78ce57" : "#e5ece5" }} />
          ))}
        </div>
        {ALL.map((s) => {
          const d = done.includes(s);
          return (
            <div className={`check ${d ? "done" : ""}`} key={s}>
              <span className="box">{d ? "✓" : ""}</span>
              <span>{s}</span>
            </div>
          );
        })}
        <div className="toolbar mt">
          <button className="btn btn-g btn-sm" onClick={next} type="button">Complete Next Step</button>
          <button className="btn btn-d btn-sm" onClick={() => persist(ALL)} type="button">Mark All + Go Live</button>
        </div>
        {cur ? <p className="small">Onboarding: {cur.name}</p> : null}
      </div>
    </div>
  );
}
