"use client";

import { useCallback, useEffect, useState } from "react";

interface Msg { id: string; recipient: string; template: string; language: string; status: string; createdAt: string }

const TEMPLATES = ["Fee Reminder", "Low Attendance Alert", "Result Published", "Bus Delay Information", "Welcome (new admission)", "Payment Receipt"];

export default function MessagesPage() {
  const [log, setLog] = useState<Msg[]>([]);
  const [live, setLive] = useState(false);
  const [tpl, setTpl] = useState(TEMPLATES[0]);
  const [lang, setLang] = useState("Punjabi");
  const [to, setTo] = useState("Class 10-A Parents (86)");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const r = await fetch("/api/messages");
    if (r.ok) {
      const j = await r.json();
      setLog(j.messages);
      setLive(!!j.live);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function send() {
    setMsg("");
    const r = await fetch("/api/messages", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipient: to, template: tpl, language: lang }),
    });
    if (r.ok) { setMsg(`Message queued to ${to} (${lang}).${live ? "" : " Demo mode — add WHATSAPP_API_KEY to go live."}`); load(); }
    else setMsg("Send failed.");
  }

  return (
    <div>
      <div className="mc-top">
        <div>
          <h1>WhatsApp Center <span className="bdg b">NEW</span></h1>
          <p>{live ? "Live provider connected." : "Demo mode — every message is logged to the database. Add WHATSAPP_API_KEY in Settings to go live."}</p>
        </div>
      </div>
      {msg ? <p className="alert info">{msg}</p> : null}
      <div className="grid2">
        <div className="card">
          <h2>Compose &amp; Send</h2>
          <div className="fld"><label>Template</label>
            <select className="inp" value={tpl} onChange={(e) => setTpl(e.target.value)}>
              {TEMPLATES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="fld"><label>Language</label>
            <select className="inp" value={lang} onChange={(e) => setLang(e.target.value)}>
              <option>Punjabi</option><option>Hindi</option><option>English</option>
            </select>
          </div>
          <div className="fld"><label>Recipients</label>
            <select className="inp" value={to} onChange={(e) => setTo(e.target.value)}>
              <option>Class 10-A Parents (86)</option>
              <option>Fee Defaulters (5)</option>
              <option>Bus Route 1 Parents (42)</option>
              <option>All Parents (2,960)</option>
            </select>
          </div>
          <button className="btn btn-g" onClick={send} type="button">Send Now</button>
        </div>
        <div className="card soft">
          <h2>Delivery Log</h2>
          {log.slice(0, 10).map((m) => (
            <div className="check done" key={m.id}>
              <span className="box">✓</span>
              <span><b>{m.recipient}</b> — {m.template} <span className="bdg br">{m.language}</span><br />
              <span className="small">{new Date(m.createdAt).toLocaleDateString("en-IN")} • {m.status}</span></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
