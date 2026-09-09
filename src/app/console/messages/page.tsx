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
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeBody, setNoticeBody] = useState("");
  const [voiceText, setVoiceText] = useState("");
  const [voiceLang, setVoiceLang] = useState("Punjabi");
  const [voiceTo, setVoiceTo] = useState("Fee Defaulters (5)");
  const [voiceList, setVoiceList] = useState<{ id: string; recipient: string; text: string; language: string; status: string }[]>([]);

  const load = useCallback(async () => {
    const r = await fetch("/api/messages");
    if (r.ok) {
      const j = await r.json();
      setLog(j.messages);
      setLive(!!j.live);
    }
    const v = await fetch("/api/voice");
    if (v.ok) setVoiceList((await v.json()).queue);
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

  async function sendNotice() {
    setMsg("");
    if (noticeTitle.trim().length < 2) { setMsg("Write a notice title first."); return; }
    const r = await fetch("/api/notices", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: noticeTitle.trim(), body: noticeBody.trim(), audience: "Parents", sendWhatsapp: true }),
    });
    if (r.ok) { setNoticeTitle(""); setNoticeBody(""); setMsg("Notice published to Parent Apps + WhatsApp log."); load(); }
    else setMsg("Notice failed.");
  }

  function previewVoice() {
    if (!voiceText.trim()) { setMsg("Write the voice message first."); return; }
    try {
      const u = new SpeechSynthesisUtterance(voiceText);
      u.lang = voiceLang === "Hindi" ? "hi-IN" : voiceLang === "English" ? "en-IN" : "pa-IN";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch { setMsg("Voice preview not supported in this browser."); }
  }

  async function queueVoice() {
    setMsg("");
    if (voiceText.trim().length < 2) { setMsg("Write the voice message first."); return; }
    const r = await fetch("/api/voice", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipient: voiceTo, text: voiceText.trim(), language: voiceLang }),
    });
    if (r.ok) { setVoiceText(""); setMsg("Voice reminder queued — auto-call provider next, log today."); load(); }
    else setMsg("Voice queue failed.");
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
      <div className="card mt">
        <h2>School Notice — publishes to Parent Apps</h2>
        <div className="fld"><label>Title</label>
          <input className="inp" value={noticeTitle} onChange={(e) => setNoticeTitle(e.target.value)} placeholder="e.g. PTM on Saturday at 10 AM" />
        </div>
        <div className="fld"><label>Details</label>
          <input className="inp" value={noticeBody} onChange={(e) => setNoticeBody(e.target.value)} placeholder="Where, when, what to bring…" />
        </div>
        <button className="btn btn-d btn-sm" onClick={sendNotice} type="button">Publish Notice</button>
        <span className="small"> Appears instantly in every parent&apos;s app + WhatsApp log.</span>
      </div>
      <div className="card mt">
        <h2>Voice Reminders <span className="bdg b">NEW</span></h2>
        <p className="small">For parents who listen instead of reading. Preview plays here; queued messages auto-call when a voice provider is connected.</p>
        <div className="fld"><label>Message (Punjabi/Hindi/English)</label>
          <input className="inp" value={voiceText} onChange={(e) => setVoiceText(e.target.value)} placeholder="Sat Sri Akal ji, kal fees jama karva dvo ji" />
        </div>
        <div className="frow">
          <div className="fld"><label>Language</label>
            <select className="inp" value={voiceLang} onChange={(e) => setVoiceLang(e.target.value)}>
              <option>Punjabi</option><option>Hindi</option><option>English</option>
            </select>
          </div>
          <div className="fld"><label>Recipients</label>
            <select className="inp" value={voiceTo} onChange={(e) => setVoiceTo(e.target.value)}>
              <option>Fee Defaulters (5)</option>
              <option>Class 10-A Parents (86)</option>
              <option>Low Attendance Parents</option>
              <option>All Parents (2,960)</option>
            </select>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn-o btn-sm" onClick={previewVoice} type="button">Play Preview</button>
          <button className="btn btn-g btn-sm" onClick={queueVoice} type="button">Queue Voice Call</button>
        </div>
        {voiceList.length > 0 ? (
          <div className="mt">
            {voiceList.slice(0, 5).map((v) => (
              <p className="small" key={v.id}>• {v.recipient} — “{v.text.slice(0, 60)}” <span className="bdg br">{v.language}</span> <span className="bdg gr">{v.status}</span></p>
            ))}
          </div>
        ) : null}
      </div>
      <div className="grid2 mt">
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
