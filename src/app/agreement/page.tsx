"use client";

import { useState } from "react";
import Link from "next/link";

export default function AgreementPage() {
  const [f, setF] = useState({
    school: "", city: "", plan: "Monthly — Rs. 2,499",
    setup: "4,999", monthly: "2,499", start: new Date().toISOString().slice(0, 10),
  });
  const set = (k: string, v: string) => setF({ ...f, [k]: v });

  return (
    <div className="login-wrap" style={{ justifyContent: "flex-start", paddingTop: 28, maxWidth: 800, margin: "0 auto" }}>
      <div className="no-print" style={{ textAlign: "center", marginBottom: 16 }}>
        <span className="mc-mark" style={{ width: 44, height: 44, fontSize: 22, margin: "0 auto" }}>M</span>
        <h1 style={{ fontSize: 22, marginTop: 8 }}>Pilot Agreement — fill, print (2 copies), sign</h1>
      </div>

      <div className="card no-print">
        <h2>Fill details</h2>
        <div className="frow">
          <div className="fld"><label>School / Institute name</label><input className="inp" value={f.school} onChange={(e) => set("school", e.target.value)} placeholder="e.g. DAV Public School, New Shimla" /></div>
          <div className="fld"><label>City</label><input className="inp" value={f.city} onChange={(e) => set("city", e.target.value)} placeholder="Shimla" /></div>
        </div>
        <div className="frow">
          <div className="fld"><label>Plan</label>
            <select className="inp" value={f.plan} onChange={(e) => set("plan", e.target.value)}>
              <option>Trial — 7 days free</option>
              <option>Micro — Rs. 999 / month</option>
              <option>Monthly — Rs. 2,499</option>
              <option>Annual — Rs. 24,999</option>
            </select>
          </div>
          <div className="fld"><label>Start date</label><input className="inp" type="date" value={f.start} onChange={(e) => set("start", e.target.value)} /></div>
        </div>
        <div className="frow">
          <div className="fld"><label>Setup fee (Rs.)</label><input className="inp" value={f.setup} onChange={(e) => set("setup", e.target.value)} /></div>
          <div className="fld"><label>Monthly fee (Rs.)</label><input className="inp" value={f.monthly} onChange={(e) => set("monthly", e.target.value)} /></div>
        </div>
        <button className="btn btn-d" onClick={() => window.print()} type="button">Print Agreement</button>{" "}
        <Link className="btn btn-o" href="/console">Back</Link>
      </div>

      <div className="card mt" style={{ fontSize: 13.5, lineHeight: 1.8 }}>
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <b style={{ fontSize: 18 }}>MecguraCampus — Pilot Service Agreement</b>
          <div className="small">One platform for every school • This is a simple service agreement, not legal advice</div>
        </div>
        <p><b>1. Parties.</b> Provider: <b>Mecgura</b> (“we”). Client: <b>{f.school || "_______________"}</b>, {f.city || "________"} (“school”). Start date: <b>{f.start}</b>.</p>
        <p><b>2. Services.</b> We provide the MecguraCampus system (admissions CRM, fees + AI follow-up, attendance, exams, transport GPS, parent app, WhatsApp Center) plus <b>complete setup</b> (data import, staff training) and <b>support</b> (WhatsApp, Mon–Sat 9am–7pm, weekly check-in in the first month).</p>
        <p><b>3. Fees.</b> One-time setup Rs. <b>{f.setup}</b> (50% advance, 50% on go-live). Subscription <b>{f.plan}</b>, payable by the 5th of each month. 7-day free trial before billing starts.</p>
        <p><b>4. Honest promise.</b> The system helps fee follow-up, admissions tracking and parent communication. <b>We do not guarantee any specific recovery or admission numbers.</b> Results depend on the school&apos;s own follow-up using the system.</p>
        <p><b>5. Data ownership.</b> All student, fee and school data belongs to the <b>school</b>. On request we provide a full Excel/CSV export within 7 days, free. We keep encrypted backups; logins are never shared.</p>
        <p><b>6. Exit anytime.</b> Either side may end this with 30 days&apos; notice. Pending dues must be cleared; data export is provided before closure. No lock-in, no hidden charges.</p>
        <p><b>7. Fair use.</b> One subscription covers one institute&apos;s own students and staff. Misuse (spam, unlawful content) may lead to suspension after one written warning.</p>
        <div style={{ display: "flex", gap: 40, marginTop: 26 }}>
          <div style={{ flex: 1 }}>For Mecgura<br /><br />Sign: __________<br />Name/Date: __________</div>
          <div style={{ flex: 1 }}>For School<br /><br />Sign + Stamp: __________<br />Name/Date: __________</div>
        </div>
      </div>
    </div>
  );
}
