"use client";

import { useCallback, useEffect, useState } from "react";

const STAGES = ["Applied", "Screening", "Interview", "Demo", "Offer", "Hired", "Rejected"];

interface Job { id: string; title: string; jobType: string; salary: string; status: string; school: { name: string } | null; _count: { applications: number } }
interface App { id: string; name: string; phone: string; qualification: string; experience: string; stage: string; score: number; job: { title: string } }

export default function HiringPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobId, setJobId] = useState("");
  const [apps, setApps] = useState<App[]>([]);
  const [msg, setMsg] = useState("");
  const [showJob, setShowJob] = useState(false);
  const [showApp, setShowApp] = useState(false);
  const [job, setJob] = useState({ title: "", jobType: "Teacher", salary: "" });
  const [cand, setCand] = useState({ name: "", phone: "", qualification: "", experience: "" });

  const loadJobs = useCallback(async () => {
    const r = await fetch("/api/hiring/jobs");
    if (!r.ok) return;
    const list: Job[] = (await r.json()).jobs;
    setJobs(list);
    if (!jobId && list.length) setJobId(list[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadApps = useCallback(async (jid: string) => {
    if (!jid) return;
    const r = await fetch(`/api/hiring/applications?jobId=${jid}`);
    if (r.ok) setApps((await r.json()).applications);
  }, []);

  useEffect(() => { loadJobs(); }, [loadJobs]);
  useEffect(() => { loadApps(jobId); }, [jobId, loadApps]);

  async function createJob() {
    if (job.title.trim().length < 2) return;
    const r = await fetch("/api/hiring/jobs", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(job),
    });
    if (r.ok) { setShowJob(false); setJob({ title: "", jobType: "Teacher", salary: "" }); setMsg("Position published."); loadJobs(); }
  }

  async function addCandidate() {
    if (cand.name.trim().length < 2 || !jobId) return;
    const r = await fetch("/api/hiring/applications", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...cand, jobId }),
    });
    if (r.ok) { setShowApp(false); setCand({ name: "", phone: "", qualification: "", experience: "" }); loadApps(jobId); }
  }

  async function move(id: string, dir: 1 | -1) {
    const a = apps.find((x) => x.id === id);
    if (!a) return;
    const i = STAGES.indexOf(a.stage);
    const next = STAGES[Math.max(0, Math.min(STAGES.length - 1, i + dir))];
    if (next === a.stage) return;
    const r = await fetch(`/api/hiring/applications/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: next }),
    });
    if (r.ok) {
      const j = await r.json();
      if (j.hired) setMsg(`${a.name} hired — staff record + payroll created automatically.`);
      loadApps(jobId);
    }
  }

  return (
    <div>
      <div className="mc-top">
        <div>
          <h1>Teacher Hiring — ATS Pipeline</h1>
          <p>From application to staff payroll with zero re-entry. Hiring a teacher? They flow straight into Staff &amp; Payroll.</p>
        </div>
        <div className="mc-actions">
          <button className="btn btn-o" onClick={() => setShowJob(true)} type="button">+ New Position</button>
          <button className="btn btn-g" onClick={() => setShowApp(true)} type="button" disabled={!jobId}>+ Add Candidate</button>
        </div>
      </div>
      {msg ? <p className="alert info">{msg}</p> : null}
      <div className="card">
        <div className="toolbar">
          <select className="inp" value={jobId} onChange={(e) => setJobId(e.target.value)}>
            {jobs.map((j) => <option key={j.id} value={j.id}>{j.title} • {j.school?.name ?? "Platform"} ({j._count.applications}) [{j.status}]</option>)}
          </select>
        </div>
        {jobs.length === 0 ? <p className="small">No open positions yet — publish the first one.</p> : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10 }}>
            {STAGES.map((s) => (
              <div key={s} style={{ background: "#F7FAF7", border: "1px solid #E6EEE6", borderRadius: 12, padding: 10 }}>
                <b style={{ fontSize: 12 }}>{s.toUpperCase()} ({apps.filter((a) => a.stage === s).length})</b>
                <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                  {apps.filter((a) => a.stage === s).map((a) => (
                    <div key={a.id} className="card" style={{ padding: 10, boxShadow: "none" }}>
                      <b style={{ fontSize: 13 }}>{a.name}</b>
                      <div className="small">{a.qualification} • {a.experience}</div>
                      <div className="small">{a.phone}</div>
                      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                        <button className="btn btn-o btn-sm" onClick={() => move(a.id, -1)} type="button">◀</button>
                        <button className="btn btn-g btn-sm" onClick={() => move(a.id, 1)} type="button">▶</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {showJob ? (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99, padding: 16 }}>
          <div className="card" style={{ width: "100%", maxWidth: 480 }}>
            <h2>New Position</h2>
            <div className="fld"><label>Title</label><input className="inp" value={job.title} onChange={(e) => setJob({ ...job, title: e.target.value })} placeholder="e.g. Mathematics Teacher" /></div>
            <div className="frow">
              <div className="fld"><label>Type</label><select className="inp" value={job.jobType} onChange={(e) => setJob({ ...job, jobType: e.target.value })}><option>Teacher</option><option>Accountant</option><option>Driver</option><option>Receptionist</option><option>Other</option></select></div>
              <div className="fld"><label>Salary (Rs./month)</label><input className="inp" value={job.salary} onChange={(e) => setJob({ ...job, salary: e.target.value })} placeholder="28000" /></div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-g" onClick={createJob} type="button">Publish</button>
              <button className="btn btn-o" onClick={() => setShowJob(false)} type="button">Cancel</button>
            </div>
          </div>
        </div>
      ) : null}
      {showApp ? (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99, padding: 16 }}>
          <div className="card" style={{ width: "100%", maxWidth: 480 }}>
            <h2>New Candidate</h2>
            <div className="fld"><label>Full name</label><input className="inp" value={cand.name} onChange={(e) => setCand({ ...cand, name: e.target.value })} /></div>
            <div className="frow">
              <div className="fld"><label>Phone</label><input className="inp" value={cand.phone} onChange={(e) => setCand({ ...cand, phone: e.target.value })} /></div>
              <div className="fld"><label>Experience</label><input className="inp" value={cand.experience} onChange={(e) => setCand({ ...cand, experience: e.target.value })} placeholder="5 years" /></div>
            </div>
            <div className="fld"><label>Qualification</label><input className="inp" value={cand.qualification} onChange={(e) => setCand({ ...cand, qualification: e.target.value })} placeholder="B.Ed, M.Sc Maths" /></div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-g" onClick={addCandidate} type="button">Add to Pipeline</button>
              <button className="btn btn-o" onClick={() => setShowApp(false)} type="button">Cancel</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
