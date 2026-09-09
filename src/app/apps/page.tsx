"use client";

const APPS = [
  {
    icon: "🎓", name: "Parent App", who: "For parents",
    desc: "Fees, results, notices, attendance and live bus — for your own children only.",
    link: "/parent", cta: "Open Parent App",
  },
  {
    icon: "🚌", name: "Driver App", who: "For drivers",
    desc: "Start trip, live GPS every 10 seconds. Runs in the phone browser — no install needed.",
    link: "/driver", cta: "Open Driver App",
  },
  {
    icon: "📍", name: "Bus Tracking", who: "For parents",
    desc: "Live bus position on a shareable link. Sent by the school on WhatsApp.",
    link: "/console/transport", cta: "How to share",
  },
  {
    icon: "🏫", name: "School Console", who: "For staff",
    desc: "Full dashboard: admissions, fees, attendance, exams, payroll and reports.",
    link: "/login?callbackUrl=/console", cta: "Staff Sign In",
  },
];

export default function AppsPage() {
  return (
    <div className="login-wrap" style={{ justifyContent: "flex-start", paddingTop: 32, maxWidth: 860, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <span className="mc-mark" style={{ width: 48, height: 48, fontSize: 24, margin: "0 auto" }}>M</span>
        <h1 style={{ fontSize: 26, marginTop: 10 }}>Get the Apps</h1>
        <p className="small">No Play Store needed. Open, then <b>Add to Home Screen</b> — works like a native app, including offline pages.</p>
      </div>
      <div className="grid2">
        {APPS.map((a) => (
          <div className="card" key={a.name}>
            <div style={{ fontSize: 34 }}>{a.icon}</div>
            <h2 style={{ marginTop: 8 }}>{a.name} <span className="small">• {a.who}</span></h2>
            <p className="small">{a.desc}</p>
            <div className="mt"><a className="btn btn-g btn-sm" href={a.link}>{a.cta}</a></div>
          </div>
        ))}
      </div>
      <div className="grid2 mt">
        <div className="card soft">
          <h2>Android — Add to Home Screen</h2>
          <p className="small">1. Open the app link in Chrome.<br />2. Tap ⋮ menu → <b>Add to Home screen</b> → Add.<br />3. The MecguraCampus icon appears with your apps.</p>
        </div>
        <div className="card soft">
          <h2>iPhone — Add to Home Screen</h2>
          <p className="small">1. Open the app link in Safari.<br />2. Tap Share → <b>Add to Home Screen</b> → Add.<br />3. Full-screen app icon, no App Store needed.</p>
        </div>
      </div>
      <div className="card mt">
        <h2>Coming to Play Store</h2>
        <p className="small">Native Parent, Staff and Driver apps are on the roadmap. Current web apps already cover every feature — schools can start today, and upgrade later without changing anything.</p>
      </div>
    </div>
  );
}
