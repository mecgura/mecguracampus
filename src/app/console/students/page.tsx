"use client";

import { useCallback, useEffect, useState } from "react";

interface Student {
  id: string; name: string; class: string; feeDue: number; phone: string; attendance: number;
  school: { name: string };
}
interface School { id: string; name: string }

export default function StudentsPage() {
  const [rows, setRows] = useState<Student[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [q, setQ] = useState("");
  const [f, setF] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", class: "", schoolId: "", feeMonthly: "3500", phone: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const [a, b] = await Promise.all([
      fetch(`/api/students?q=${encodeURIComponent(q)}&schoolId=${encodeURIComponent(f)}`),
      fetch("/api/schools"),
    ]);
    if (a.ok) setRows((await a.json()).students);
    if (b.ok) {
      const list: School[] = (await b.json()).schools;
      setSchools(list);
      if (!form.schoolId && list.length) setForm((p) => ({ ...p, schoolId: list[0].id }));
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, f]);

  useEffect(() => { load(); }, [load]);

  async function add() {
    if (form.name.trim().length < 2 || !form.schoolId) return;
    const r = await fetch("/api/students", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, feeMonthly: Number(form.feeMonthly) || 0 }),
    });
    if (r.ok) { setShowAdd(false); setForm({ name: "", class: "", schoolId: form.schoolId, feeMonthly: "3500", phone: "" }); load(); }
  }

  return (
    <div>
      <div className="mc-top">
        <div>
          <h1>Students</h1>
          <p>Every child, every class — stored in the real database.</p>
        </div>
        <div className="mc-actions">
          <button className="btn btn-g" onClick={() => setShowAdd(true)} type="button">+ Add Student</button>
        </div>
      </div>
      <div className="card">
        <div className="toolbar">
          <input className="inp" placeholder="Search by name or class…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="inp" value={f} onChange={(e) => setF(e.target.value)}>
            <option value="">All schools</option>
            {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        {loading ? <div className="skel" /> : (
          <div style={{ overflowX: "auto" }}>
            <table className="tbl">
              <tbody>
                <tr><th>Student</th><th>Attendance</th><th>Fees</th><th>Parent Contact</th></tr>
                {rows.map((s) => (
                  <tr key={s.id}>
                    <td><b>{s.name}</b><br /><span className="small">{s.class} • {s.school.name}</span></td>
                    <td>{s.attendance >= 85 ? <span className="bdg g">{s.attendance}%</span> : s.attendance >= 75 ? <span className="bdg a">{s.attendance}%</span> : <span className="bdg r">{s.attendance}%</span>}</td>
                    <td>{s.feeDue > 0 ? <span className="bdg a">Rs. {s.feeDue.toLocaleString("en-IN")} due</span> : <span className="bdg g">Clear</span>}</td>
                    <td className="small">{s.phone}</td>
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
            <h2>New Student</h2>
            <div className="fld"><label>Full name</label><input className="inp" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="frow">
              <div className="fld"><label>Class / Section</label><input className="inp" value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })} /></div>
              <div className="fld"><label>Monthly fee (Rs.)</label><input className="inp" type="number" value={form.feeMonthly} onChange={(e) => setForm({ ...form, feeMonthly: e.target.value })} /></div>
            </div>
            <div className="fld"><label>School</label>
              <select className="inp" value={form.schoolId} onChange={(e) => setForm({ ...form, schoolId: e.target.value })}>
                {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="fld"><label>Parent mobile number</label><input className="inp" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-g" onClick={add} type="button">Add Student</button>
              <button className="btn btn-o" onClick={() => setShowAdd(false)} type="button">Cancel</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
