"use client";

import { useCallback, useEffect, useState } from "react";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  schoolName: string | null;
  schoolId: string | null;
  createdAt: string;
}

interface School { id: string; name: string }

const ROLE_COLORS: Record<string, string> = {
  super: "#7c3aed",
  school: "#2563eb",
  parent: "#059669",
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "school",
    schoolId: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const [a, b] = await Promise.all([fetch("/api/users"), fetch("/api/schools")]);
    if (a.ok) setUsers((await a.json()).users);
    if (b.ok) setSchools((await b.json()).schools);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setMsg("");
    const r = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await r.json();
    if (!r.ok) { setErr(data.error || "Failed to create user."); return; }
    setMsg(`User "${data.user.name}" created! Login: ${data.user.email}`);
    setShowModal(false);
    setForm({ name: "", email: "", password: "", role: "school", schoolId: "" });
    load();
  }

  async function deleteUser(id: string) {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    load();
  }

  const superCount = users.filter((u) => u.role === "super").length;
  const schoolCount = users.filter((u) => u.role === "school").length;
  const parentCount = users.filter((u) => u.role === "parent").length;

  return (
    <div>
      <div className="mc-top">
        <div>
          <h1>User Management</h1>
          <p>Create and manage admin, school, and parent login accounts.</p>
        </div>
        <div className="mc-actions">
          <button className="btn btn-g" onClick={() => setShowModal(true)} type="button">+ Create User</button>
        </div>
      </div>

      {msg ? <p className="alert ok">{msg}</p> : null}
      {err ? <p className="alert err">{err}</p> : null}

      <div className="grid4" style={{ marginBottom: 16 }}>
        <div className="card stat"><span>Total Users</span><b>{users.length}</b><small>all accounts</small></div>
        <div className="card stat"><span>Super Admins</span><b>{superCount}</b><small style={{ color: ROLE_COLORS.super }}>platform owners</small></div>
        <div className="card stat"><span>School Admins</span><b>{schoolCount}</b><small style={{ color: ROLE_COLORS.school }}>school logins</small></div>
        <div className="card stat"><span>Parent Accounts</span><b>{parentCount}</b><small style={{ color: ROLE_COLORS.parent }}>parent access</small></div>
      </div>

      <div className="card">
        {loading ? <p className="small">Loading users...</p> : (
          <div style={{ overflowX: "auto" }}>
            <table className="tbl">
              <tbody>
                <tr>
                  <th>Name</th><th>Email</th><th>Role</th><th>School</th><th>Created</th><th></th>
                </tr>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td><b>{u.name}</b></td>
                    <td><span className="small">{u.email}</span></td>
                    <td>
                      <span className="bdg" style={{ background: ROLE_COLORS[u.role] || "#666", color: "#fff" }}>
                        {u.role === "super" ? "Super Admin" : u.role === "school" ? "School Admin" : "Parent"}
                      </span>
                    </td>
                    <td><span className="small">{u.schoolName || "—"}</span></td>
                    <td><span className="small">{new Date(u.createdAt).toLocaleDateString("en-IN")}</span></td>
                    <td>
                      {u.role !== "super" ? (
                        <button className="btn btn-sm" style={{ background: "#fee2e2", color: "#dc2626" }}
                          onClick={() => deleteUser(u.id)} type="button">Delete</button>
                      ) : null}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && <tr><td colSpan={6} className="small">No users found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create New User</h2>
            <p className="small" style={{ marginBottom: 12 }}>Create a login for school admin, teacher, or parent.</p>
            <form onSubmit={createUser} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input className="inp" placeholder="Full Name" required value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className="inp" type="email" placeholder="Email (login ID)" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input className="inp" type="password" placeholder="Password (min 6 chars)" required minLength={6} value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <select className="inp" value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="super">Super Admin</option>
                <option value="school">School Admin</option>
                <option value="parent">Parent</option>
              </select>
              {(form.role === "school" || form.role === "parent") && (
                <select className="inp" value={form.schoolId}
                  onChange={(e) => setForm({ ...form, schoolId: e.target.value })}>
                  <option value="">— Select School —</option>
                  {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button className="btn btn-g" type="submit">Create User</button>
                <button className="btn btn-o" type="button" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
