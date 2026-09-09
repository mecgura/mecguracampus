"use client";

import { useCallback, useEffect, useState } from "react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Slot { id: string; day: number; periodNo: number; start: string; end: string; subject: string; teacher: string; className: string }
interface Menu { id: string; day: number; meal: string; items: string }
interface Leave { id: string; date: string; reason: string; substitute: string; status: string; staff: { name: string; role: string } }
interface Staff { id: string; name: string; role: string }
interface Student { id: string; name: string; class: string }

export default function RoutinePage() {
  const [day, setDay] = useState((new Date().getDay() + 6) % 7 === 6 ? 1 : new Date().getDay());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [msg, setMsg] = useState("");
  const [slot, setSlot] = useState({ periodNo: "1", start: "09:00", end: "09:40", subject: "", teacher: "", className: "" });
  const [tiffin, setTiffin] = useState("");
  const [leave, setLeave] = useState({ staffId: "", date: new Date().toISOString().slice(0, 10), reason: "", substitute: "" });
  const [star, setStar] = useState({ studentId: "", points: "1", note: "" });

  const load = useCallback(async () => {
    const [a, b, c, d, e] = await Promise.all([
      fetch("/api/routine/timetable"), fetch("/api/routine/menu"),
      fetch("/api/routine/leaves"), fetch("/api/staff"), fetch("/api/students"),
    ]);
    if (a.ok) setSlots((await a.json()).slots);
    if (b.ok) setMenus((await b.json()).menus);
    if (c.ok) setLeaves((await c.json()).leaves);
    if (d.ok) setStaff((await d.json()).staff);
    if (e.ok) {
      const list: Student[] = (await e.json()).students;
      setStudents(list);
      if (!star.studentId && list.length) setStar((p) => ({ ...p, studentId: list[0].id }));
      if (!leave.staffId) {
        const st: Staff[] = (await (await fetch("/api/staff")).json()).staff;
        if (st.length) setLeave((p) => ({ ...p, staffId: st[0].id }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  async function addSlot() {
    if (!slot.subject.trim()) { setMsg("Subject likho pehla."); return; }
    const r = await fetch("/api/routine/timetable", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...slot, day, periodNo: Number(slot.periodNo) }),
    });
    if (r.ok) { setSlot({ periodNo: String(slots.filter((s) => s.day === day).length + 1), start: "09:00", end: "09:40", subject: "", teacher: "", className: "" }); load(); }
  }

  async function delSlot(id: string) {
    await fetch(`/api/routine/timetable?id=${id}`, { method: "DELETE" });
    load();
  }

  async function saveTiffin() {
    if (!tiffin.trim() && !menus.find((m) => m.day === day)) { setMsg("Tiffin items likho."); return; }
    await fetch("/api/routine/menu", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day, meal: "Lunch", items: tiffin }),
    });
    setTiffin("");
    setMsg("Tiffin menu save — parent app ch turant disuga.");
    load();
  }

  async function addLeave() {
    if (!leave.staffId) return;
    const r = await fetch("/api/routine/leaves", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(leave),
    });
    if (r.ok) { setMsg("Leave marked. Parent app ch substitute nal disuga."); load(); }
  }

  async function decideLeave(id: string, status: string) {
    await fetch("/api/routine/leaves", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
  }

  async function giveStar() {
    if (!star.studentId) return;
    const r = await fetch("/api/routine/stars", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...star, points: Number(star.points) }),
    });
    if (r.ok) { setStar({ ...star, note: "" }); setMsg("Star given — parent app timeline ch gaya."); }
  }

  const daySlots = slots.filter((s) => s.day === day);
  const dayMenu = menus.find((m) => m.day === day);

  return (
    <div>
      <div className="mc-top">
        <div>
          <h1>Daily Routine — Timetable, Tiffin, Leaves, Stars</h1>
          <p>Jo ethe pavoge, ohi parent app ch LIVE disuga. Eh tuhada foreign-school wala hissa hai.</p>
        </div>
      </div>
      {msg ? <p className="alert info">{msg}</p> : null}
      <div className="toolbar">
        {DAYS.map((d, i) => (
          <button key={d} className={`btn btn-sm ${day === i ? "btn-d" : "btn-o"}`} onClick={() => setDay(i)} type="button">{d}</button>
        ))}
      </div>

      <div className="grid2">
        <div className="card">
          <h2>{DAYS[day]} — Periods ({daySlots.length})</h2>
          {daySlots.length === 0 ? <p className="small">Koi period nahi — holiday ya add karo.</p> : (
            <table className="tbl"><tbody>
              <tr><th>#</th><th>Time</th><th>Subject</th><th>Teacher</th><th></th></tr>
              {daySlots.map((s) => (
                <tr key={s.id}>
                  <td>{s.periodNo}</td>
                  <td className="small">{s.start}–{s.end}</td>
                  <td><b>{s.subject}</b><br /><span className="small">{s.className}</span></td>
                  <td className="small">{s.teacher || "—"}</td>
                  <td><button className="btn btn-o btn-sm" onClick={() => delSlot(s.id)} type="button">✕</button></td>
                </tr>
              ))}
            </tbody></table>
          )}
          <div className="frow mt">
            <div className="fld"><label>Subject</label><input className="inp" value={slot.subject} onChange={(e) => setSlot({ ...slot, subject: e.target.value })} placeholder="Mathematics" /></div>
            <div className="fld"><label>Teacher</label><input className="inp" value={slot.teacher} onChange={(e) => setSlot({ ...slot, teacher: e.target.value })} /></div>
          </div>
          <div className="frow">
            <div className="fld"><label>Start</label><input className="inp" type="time" value={slot.start} onChange={(e) => setSlot({ ...slot, start: e.target.value })} /></div>
            <div className="fld"><label>End</label><input className="inp" type="time" value={slot.end} onChange={(e) => setSlot({ ...slot, end: e.target.value })} /></div>
          </div>
          <button className="btn btn-g btn-sm" onClick={addSlot} type="button">+ Add Period</button>
        </div>

        <div>
          <div className="card">
            <h2>Tiffin — {DAYS[day]}</h2>
            {dayMenu ? <p><b>{dayMenu.items}</b></p> : <p className="small">Ajj da menu set nahi.</p>}
            <div className="fld mt"><label>Set menu (comma separated)</label>
              <input className="inp" value={tiffin} onChange={(e) => setTiffin(e.target.value)} placeholder="Rajma + Rice + Salad" />
            </div>
            <button className="btn btn-g btn-sm" onClick={saveTiffin} type="button">Save Menu</button>
          </div>

          <div className="card mt">
            <h2>Star a Student (ClassDojo style)</h2>
            <div className="fld"><label>Student</label>
              <select className="inp" value={star.studentId} onChange={(e) => setStar({ ...star, studentId: e.target.value })}>
                {students.map((s) => <option key={s.id} value={s.id}>{s.name} • {s.class}</option>)}
              </select>
            </div>
            <div className="frow">
              <div className="fld"><label>Stars (1-10)</label><input className="inp" type="number" min={1} max={10} value={star.points} onChange={(e) => setStar({ ...star, points: e.target.value })} /></div>
              <div className="fld"><label>Note</label><input className="inp" value={star.note} onChange={(e) => setStar({ ...star, note: e.target.value })} placeholder="Excellent test" /></div>
            </div>
            <button className="btn btn-g btn-sm" onClick={giveStar} type="button">Give Star</button>
          </div>
        </div>
      </div>

      <div className="card mt">
        <h2>Staff Leaves</h2>
        <div className="toolbar">
          <select className="inp" value={leave.staffId} onChange={(e) => setLeave({ ...leave, staffId: e.target.value })}>
            {staff.map((s) => <option key={s.id} value={s.id}>{s.name} • {s.role}</option>)}
          </select>
          <input className="inp" type="date" value={leave.date} onChange={(e) => setLeave({ ...leave, date: e.target.value })} />
          <input className="inp" placeholder="Reason" value={leave.reason} onChange={(e) => setLeave({ ...leave, reason: e.target.value })} />
          <input className="inp" placeholder="Substitute teacher" value={leave.substitute} onChange={(e) => setLeave({ ...leave, substitute: e.target.value })} />
          <button className="btn btn-g btn-sm" onClick={addLeave} type="button">Mark Leave</button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="tbl"><tbody>
            <tr><th>Date</th><th>Staff</th><th>Reason</th><th>Substitute</th><th>Status</th><th></th></tr>
            {leaves.slice(0, 20).map((l) => (
              <tr key={l.id}>
                <td>{l.date}</td>
                <td><b>{l.staff.name}</b><br /><span className="small">{l.staff.role}</span></td>
                <td className="small">{l.reason || "—"}</td>
                <td className="small">{l.substitute || "—"}</td>
                <td>{l.status === "Approved" ? <span className="bdg g">Approved</span> : l.status === "Rejected" ? <span className="bdg r">Rejected</span> : <span className="bdg a">Pending</span>}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  {l.status === "Pending" ? (
                    <><button className="btn btn-g btn-sm" onClick={() => decideLeave(l.id, "Approved")} type="button">Approve</button>{" "}
                    <button className="btn btn-o btn-sm" onClick={() => decideLeave(l.id, "Rejected")} type="button">Reject</button></>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody></table>
        </div>
      </div>
    </div>
  );
}
