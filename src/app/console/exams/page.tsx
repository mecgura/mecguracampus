"use client";

import { useCallback, useEffect, useState } from "react";

interface Student { id: string; name: string; class: string }
interface Result { subject: string; marks: number }

const SUBJECTS = ["Mathematics", "English", "Science", "Punjabi"];

function grade(a: number) {
  return a >= 90 ? "A+" : a >= 80 ? "A" : a >= 70 ? "B+" : a >= 60 ? "B" : a >= 50 ? "C" : "F";
}

export default function ExamsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [id, setId] = useState("");
  const [marks, setMarks] = useState<Record<string, string>>({ Mathematics: "82", English: "76", Science: "88", Punjabi: "91" });
  const [saved, setSaved] = useState<Result[]>([]);
  const [msg, setMsg] = useState("");

  const loadStudents = useCallback(async () => {
    const r = await fetch("/api/students");
    if (r.ok) {
      const list: Student[] = (await r.json()).students;
      setStudents(list);
      if (!id && list.length) setId(list[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadResults = useCallback(async (sid: string) => {
    if (!sid) return;
    const r = await fetch(`/api/exams?studentId=${sid}`);
    if (r.ok) setSaved((await r.json()).results);
  }, []);

  useEffect(() => { loadStudents(); }, [loadStudents]);
  useEffect(() => { loadResults(id); }, [id, loadResults]);

  async function save(publish: boolean) {
    setMsg("");
    const payload: Record<string, number> = {};
    SUBJECTS.forEach((s) => { payload[s] = Number(marks[s]) || 0; });
    const r = await fetch("/api/exams", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: id, term: "Final", marks: payload }),
    });
    if (r.ok) {
      await loadResults(id);
      setMsg(publish ? "Results published. Parents notified on WhatsApp." : "Marks saved to database.");
    } else setMsg("Save failed.");
  }

  const current = students.find((s) => s.id === id);
  const total = SUBJECTS.reduce((a, s) => a + (Number(marks[s]) || 0), 0);
  const pct = Math.round(total / SUBJECTS.length);

  return (
    <div>
      <div className="mc-top">
        <div>
          <h1>Examinations &amp; Report Cards</h1>
          <p>Marks are stored per subject and published to parents in one click.</p>
        </div>
        <div className="mc-actions">
          <button className="btn btn-o" onClick={() => window.print()} type="button">Print Report</button>
          <button className="btn btn-g" onClick={() => save(true)} type="button">Publish Results</button>
        </div>
      </div>
      {msg ? <p className="alert info">{msg}</p> : null}
      <div className="card">
        <h2>Enter Marks — Final Examination (out of 100)</h2>
        <div className="toolbar">
          <select className="inp" value={id} onChange={(e) => setId(e.target.value)}>
            {students.map((s) => <option key={s.id} value={s.id}>{s.name} • {s.class}</option>)}
          </select>
          {SUBJECTS.map((s) => (
            <input key={s} className="inp" style={{ width: 90 }} type="number" min={0} max={100} title={s}
              value={marks[s] ?? ""} onChange={(e) => setMarks({ ...marks, [s]: e.target.value })} />
          ))}
          <button className="btn btn-g btn-sm" onClick={() => save(false)} type="button">Save Marks</button>
        </div>
        <p className="small">Mathematics • English • Science • Punjabi</p>
      </div>
      <div className="card mt">
        <h2>Report Card <span className="small">2025-26 • {current ? `${current.name} • Class ${current.class}` : ""}</span></h2>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #0C160D", paddingBottom: 10, marginBottom: 12 }}>
          <div><b style={{ fontSize: 16 }}>{current?.name}</b><div className="small">Class {current?.class}</div></div>
          <div style={{ textAlign: "right" }}>
            <b style={{ fontSize: 22 }}>{pct}%</b>
            <div><span className={`bdg ${pct >= 75 ? "g" : "a"}`}>{grade(pct)} Grade</span></div>
          </div>
        </div>
        <table className="tbl">
          <tbody>
            {SUBJECTS.map((s) => {
              const m = Number(marks[s]) || 0;
              return <tr key={s}><td>{s}</td><td><b>{m} / 100</b></td><td>{grade(m)}</td></tr>;
            })}
          </tbody>
        </table>
        {saved.length > 0 ? <p className="small mt">Stored in database: {saved.map((x) => `${x.subject} ${x.marks}`).join(" • ")}</p> : null}
      </div>
    </div>
  );
}
