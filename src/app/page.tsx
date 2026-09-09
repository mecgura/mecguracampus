import Link from "next/link";

export default function Home() {
  return (
    <div className="login-wrap">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <span className="mc-mark" style={{ width: 48, height: 48, fontSize: 24 }}>M</span>
        <span>
          <b style={{ fontSize: 22 }}>MecguraCampus</b>
          <br />
          <span className="small">Multi-School ERP • One Platform. Every School.</span>
        </span>
      </div>
      <div className="grid2" style={{ maxWidth: 720, width: "100%" }}>
        <div className="card">
          <h2>Live Console</h2>
          <p className="small" style={{ marginBottom: 14 }}>
            Real database, role-based logins, fee collection and billing. For owners and school admins.
          </p>
          <Link className="btn btn-g" href="/login">Sign In to Console</Link>
        </div>
        <div className="card soft">
          <h2>Design Preview</h2>
          <p className="small" style={{ marginBottom: 14 }}>
            The original 14-page interactive prototype (AI predictor, WhatsApp center, GPS demo).
          </p>
          <Link className="btn btn-o" href="/demo/">Open Demo Preview</Link>
        </div>
      </div>
      <p className="small mt">Super admin: owner@mecguracampus.com • School demo: school@gnps.com</p>
    </div>
  );
}
