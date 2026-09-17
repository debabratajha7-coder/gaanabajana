"use client";

import { FormEvent, useEffect, useState } from "react";
import { ADMIN_PERMISSIONS } from "@/lib/permissions";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "customer" | "admin";
  isSuperAdmin: boolean;
  adminPermissions: string[];
  phoneVerified: boolean;
  emailVerified: boolean;
  isActive: boolean;
  createdAt?: string;
};

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  role: "customer" as "customer" | "admin",
  adminPermissions: [] as string[],
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [me, setMe] = useState<{ isSuperAdmin?: boolean } | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<"all" | "admin" | "customer">("all");

  async function load() {
    const [uRes, meRes] = await Promise.all([
      fetch("/api/admin/users"),
      fetch("/api/auth/me"),
    ]);
    const uData = await uRes.json();
    const meData = await meRes.json();
    if (uRes.ok) setUsers(uData.users || []);
    else setError(uData.error || "Could not load users");
    setMe(meData.user);
  }

  useEffect(() => {
    load().catch(() => setError("Could not load users"));
  }, []);

  function togglePerm(key: string) {
    setForm((f) => ({
      ...f,
      adminPermissions: f.adminPermissions.includes(key)
        ? f.adminPermissions.filter((p) => p !== key)
        : [...f.adminPermissions, key],
    }));
  }

  function startEdit(u: AdminUser) {
    setEditingId(u.id);
    setForm({
      name: u.name,
      email: u.email,
      phone: u.phone.replace(/^\+91/, ""),
      password: "",
      role: u.role,
      adminPermissions: u.adminPermissions || [],
    });
    setError("");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editingId) {
        const res = await fetch("/api/admin/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingId,
            name: form.name,
            phone: form.phone,
            role: form.role,
            adminPermissions: form.adminPermissions,
            ...(form.password ? { password: form.password } : {}),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Update failed");
      } else {
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            phone: form.phone,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Create failed");
      }
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function setActive(id: string, isActive: boolean) {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    await load();
  }

  async function removeUser(id: string) {
    if (!confirm("Delete this user permanently?")) return;
    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Delete failed");
      return;
    }
    await load();
  }

  const visible = users.filter((u) =>
    filter === "all" ? true : u.role === filter
  );

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--fg-muted)]">
          Access control
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[var(--fg)]">
          Users & staff
        </h1>
        <p className="mt-2 max-w-xl text-sm text-[var(--fg-muted)]">
          Create customer or staff accounts with phone numbers. Staff need SMS OTP
          after password on every login. Only the main admin assigns panel permissions.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-4 border border-[var(--line)] bg-[var(--bg-elevated)] p-5"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-semibold">
            {editingId ? "Edit user" : "Create user"}
          </h2>
          {editingId && (
            <button
              type="button"
              className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg)]"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
            >
              Cancel edit
            </button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="field-label">Name</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="field-label">Email</label>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              disabled={Boolean(editingId)}
            />
          </div>
          <div>
            <label className="field-label">Phone</label>
            <div className="flex overflow-hidden rounded-[var(--radius-control)] border border-[var(--line-strong)]">
              <span className="flex items-center border-r border-[var(--line)] px-3 text-sm text-[var(--fg-muted)]">
                +91
              </span>
              <input
                className="input flex-1 border-0 shadow-none"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <label className="field-label">
              {editingId ? "New password (optional)" : "Password"}
            </label>
            <input
              className="input"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={editingId ? undefined : 6}
              required={!editingId}
            />
          </div>
        </div>

        <div>
          <label className="field-label">Role</label>
          <select
            className="input"
            value={form.role}
            onChange={(e) =>
              setForm({
                ...form,
                role: e.target.value as "customer" | "admin",
              })
            }
            disabled={!me?.isSuperAdmin && form.role === "admin"}
          >
            <option value="customer">Customer</option>
            <option value="admin">Staff (admin panel)</option>
          </select>
        </div>

        {form.role === "admin" && me?.isSuperAdmin && (
          <div>
            <p className="field-label mb-2">Panel permissions</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {ADMIN_PERMISSIONS.map((p) => (
                <label
                  key={p.key}
                  className="flex cursor-pointer items-center gap-2 border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={form.adminPermissions.includes(p.key)}
                    onChange={() => togglePerm(p.key)}
                  />
                  {p.label}
                </label>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? "Saving…" : editingId ? "Save changes" : "Create user"}
        </button>
      </form>

      <div className="flex gap-2">
        {(["all", "admin", "customer"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${
              filter === f
                ? "border-[var(--accent)] bg-[var(--bg-soft)]"
                : "border-[var(--line)] text-[var(--fg-muted)]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto border border-[var(--line)]">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-[var(--line)] bg-[var(--bg-soft)] text-xs uppercase tracking-wider text-[var(--fg-muted)]">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Access</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {visible.map((u) => (
              <tr key={u.id} className="border-b border-[var(--line)]">
                <td className="px-4 py-3">
                  <p className="font-medium">{u.name}</p>
                  <p className="text-xs text-[var(--fg-muted)]">{u.email}</p>
                </td>
                <td className="px-4 py-3 text-[var(--fg-muted)]">{u.phone || "—"}</td>
                <td className="px-4 py-3">
                  {u.isSuperAdmin ? "Main admin" : u.role}
                </td>
                <td className="px-4 py-3 text-xs text-[var(--fg-muted)]">
                  {u.isSuperAdmin
                    ? "Full control"
                    : u.role === "admin"
                      ? u.adminPermissions.join(", ") || "No sections"
                      : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      u.isActive ? "text-emerald-600" : "text-[var(--danger)]"
                    }
                  >
                    {u.isActive ? "Active" : "Disabled"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      className="text-xs font-semibold underline-offset-2 hover:underline"
                      onClick={() => startEdit(u)}
                    >
                      Edit
                    </button>
                    {!u.isSuperAdmin && (
                      <button
                        type="button"
                        className="text-xs font-semibold underline-offset-2 hover:underline"
                        onClick={() => setActive(u.id, !u.isActive)}
                      >
                        {u.isActive ? "Disable" : "Enable"}
                      </button>
                    )}
                    {me?.isSuperAdmin && !u.isSuperAdmin && (
                      <button
                        type="button"
                        className="text-xs font-semibold text-[var(--danger)] underline-offset-2 hover:underline"
                        onClick={() => removeUser(u.id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
