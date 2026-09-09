"use client";

import { useState } from "react";
import Link from "next/link";

type Lang = "en" | "hinglish";

const COPY: Record<Lang, {
  sub: string; print: string; script: string;
  say: string; do: string; open: string;
  rate: string; rateNote: string; objection: string; objectionBody: string; back: string;
  steps: { min: string; title: string; say: string; do: string; link: string }[];
  plans: { name: string; price: string; per: string; hot?: string; points: string[] }[];
}> = {
  en: {
    sub: "10-minute pitch + rate card. Print this page before visiting a school.",
    print: "Print Pack", script: "The 10-Minute Demo Script",
    say: "Say:", do: "Do:", open: "Open screen",
    rate: "Rate Card — leave this behind",
    rateNote: "One-time onboarding: Rs. 4,999–9,999 (data import + training included). Prices exclusive of GST.",
    objection: "Handling “It is expensive”",
    objectionBody: "“Sir, what is one admission worth — Rs. 20–25 thousand? If the CRM brings just 2 extra admissions, the full year is paid for. The remaining 12 months are pure profit. And we do the setup — zero minutes of your staff's time.”",
    back: "Back to Console",
    steps: [
      { min: "0–2", title: "Open with their pain, not your product", say: "“Sir, one question — how much fees arrived on time last month, and how many admissions slipped away? If you cannot see the exact number in 10 seconds, that is the problem we eliminate.”", do: "Open the Super Dashboard. Point at live numbers.", link: "/console" },
      { min: "2–4", title: "Admissions CRM — money they are losing today", say: "“Every enquiry is saved here, with a follow-up date. When a child is admitted, the student record creates itself — no re-typing.”", do: "Move one demo lead New → Visited → Admitted. Show the auto-created student.", link: "/console/admissions" },
      { min: "4–6", title: "AI Fee Predictor — the jaw-drop moment", say: "“This predicts which parent will delay fees — early warning, early message.”", do: "Show the risk-ranked list. Press Send Reminder on one HIGH account.", link: "/console/fees" },
      { min: "6–8", title: "Live bus — parents' favourite", say: "“Mothers watch the bus from home. App on the driver's phone, live map with you. Parents admit their children just for this.”", do: "Open Transport and a parent link side by side. Move the demo slider.", link: "/console/transport" },
      { min: "8–10", title: "Close with done-for-you setup", say: "“We will do the entire setup — your school live in 15 minutes. You just teach. 7-day free trial, no card needed. Shall we start tomorrow?”", do: "Show the onboarding checklist at 100%. Ask for the Excel sheet of students.", link: "/console/onboarding" },
    ],
    plans: [
      { name: "Trial", price: "Rs. 0", per: "7 days", points: ["Full system, 100 students", "No card required", "Free onboarding call"] },
      { name: "Monthly", price: "Rs. 2,499", per: "/ month", hot: "Most Popular", points: ["Unlimited students", "5,000 WhatsApp messages", "Bus GPS + support"] },
      { name: "Annual", price: "Rs. 24,999", per: "/ year", points: ["2 months free", "AI Predictor included", "Free setup (Rs. 9,999 value)"] },
    ],
  },
  hinglish: {
    sub: "10-minute pitch + rate card. School jaan ton pehla eh page print kar lavo.",
    print: "Print Karo", script: "10-Minute Demo Script",
    say: "Bolo:", do: "Karo:", open: "Screen kholo",
    rate: "Rate Card — school kol chhad aao",
    rateNote: "Ik vari setup fees: Rs. 4,999–9,999 (data + training nal). GST alag.",
    objection: "“Mehnga hai” da jawab",
    objectionBody: "“Sir, ik admission di fees kinni — 20-25 hazar? CRM sirf 2 vadh admission devave ta saal di cost nikal gayi. Baki 12 mahine profit. Te setup asi karange — tuhade staff da 1 minute vi nahi lagna.”",
    back: "Console te wapas",
    steps: [
      { min: "0–2", title: "Unade dard nal kholo, product nal nahi", say: "“Sir, ik sawal — pichle mahine kinni fees time te aayi, te kinne admission hathcho nikle? Je exact number 10 second ch na disda hove, ohi problem asi khatam karde haan.”", do: "Super Dashboard kholo. Live numbers dikhao.", link: "/console" },
      { min: "2–4", title: "Admissions CRM — ajj da ghata", say: "“Har enquiry ethe save hundi hai, follow-up date nal. Je bacha admit hunda, student record khud ban janda — dobara typing nahi.”", do: "Ik demo lead New → Visited → Admitted karo. Auto-banya student dikhao.", link: "/console/admissions" },
      { min: "4–6", title: "AI Fee Predictor — dang kar den wala", say: "“Eh dasda hai kehda parent fees late karuga — pehla pata, pehla message.”", do: "Risk wali list dikhao. Ik HIGH account te Send Reminder dabao.", link: "/console/fees" },
      { min: "6–8", title: "Live bus — parents da favourite", say: "“Maa ghar baithe bus dekhdi hai. Driver de phone ch app, tuhade kol live map. Sirf eh dekh ke admission kara lain ge.”", do: "Transport + parent link nal-nal kholo. Demo slider hilao.", link: "/console/transport" },
      { min: "8–10", title: "Setup wale promise nal close karo", say: "“Setup asi karke devange — 15 minute ch tuhada school live. Tusi bas bachche padhao. 7 din trial free, card di lod nahi. Kal ton shuru kariye?”", do: "100% wali checklist dikhao. Students di Excel sheet mango.", link: "/console/onboarding" },
    ],
    plans: [
      { name: "Trial", price: "Rs. 0", per: "7 din", points: ["Poora system, 100 students", "Card di lod nahi", "Free setup call"] },
      { name: "Monthly", price: "Rs. 2,499", per: "/ mahina", hot: "Sab ton popular", points: ["Unlimited students", "5,000 WhatsApp", "Bus GPS + support"] },
      { name: "Annual", price: "Rs. 24,999", per: "/ saal", points: ["2 mahine free", "AI Predictor nal", "Free setup (Rs. 9,999 value)"] },
    ],
  },
};

export default function DemoPackPage() {
  const [lang, setLang] = useState<Lang>("en");
  const t = COPY[lang];

  return (
    <div className="login-wrap" style={{ justifyContent: "flex-start", paddingTop: 32, maxWidth: 960, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <span className="mc-mark" style={{ width: 48, height: 48, fontSize: 24, margin: "0 auto" }}>M</span>
        <h1 style={{ fontSize: 26, marginTop: 10 }}>School Demo Pack — MecguraCampus</h1>
        <p className="small">{t.sub}</p>
        <div className="mt no-print" style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <button className={`btn btn-sm ${lang === "en" ? "btn-d" : "btn-o"}`} onClick={() => setLang("en")} type="button">English</button>
          <button className={`btn btn-sm ${lang === "hinglish" ? "btn-d" : "btn-o"}`} onClick={() => setLang("hinglish")} type="button">Hinglish (ਹਿੰਗਲਿਸ਼)</button>
          <button className="btn btn-o btn-sm" onClick={() => window.print()} type="button">{t.print}</button>
        </div>
      </div>

      <div className="card">
        <h2>{t.script}</h2>
        {t.steps.map((s, i) => (
          <div className="check" key={s.title} style={{ alignItems: "flex-start" }}>
            <span className="box" style={{ background: "#0C160D", borderColor: "#0C160D" }}>{i + 1}</span>
            <span>
              <b>Minute {s.min} — {s.title}</b>
              <div className="small" style={{ marginTop: 4, color: "#0C160D" }}>{t.say} {s.say}</div>
              <div className="small" style={{ marginTop: 4 }}>{t.do} {s.do}</div>
              <div className="mt"><Link className="btn btn-o btn-sm no-print" href={s.link}>{t.open}</Link></div>
            </span>
          </div>
        ))}
      </div>

      <div className="card mt">
        <h2>{t.rate}</h2>
        <div className="grid3">
          {t.plans.map((p) => (
            <div key={p.name} className="card soft" style={p.hot ? { border: "2px solid #78ce57" } : undefined}>
              <h2>{p.name} {p.hot ? <span className="bdg br">{p.hot}</span> : null}</h2>
              <b style={{ fontSize: 24 }}>{p.price}</b> <span className="small">{p.per}</span>
              <ul className="small" style={{ marginTop: 8, paddingLeft: 18 }}>
                {p.points.map((x) => <li key={x}>{x}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <p className="small mt">{t.rateNote}</p>
      </div>

      <div className="card mt">
        <h2>{t.objection}</h2>
        <p className="small">{t.objectionBody}</p>
      </div>

      <div className="mt no-print" style={{ textAlign: "center" }}>
        <Link className="btn btn-g" href="/console">{t.back}</Link>
      </div>
    </div>
  );
}
