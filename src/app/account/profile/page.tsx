"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type ProfileUser = {
  name: string;
  email: string;
  phone?: string;
  authProvider?: string;
  hasPassword?: boolean;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileMsg, setProfileMsg] = useState("");
  const [profileError, setProfileError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) {
          router.push("/login");
          return;
        }
        setUser(d.user);
        setName(d.user.name || "");
        setPhone(d.user.phone || "");
      });
  }, [router]);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setProfileMsg("");
    setProfileError("");
    const res = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setProfileError(data.error || "Could not update profile");
      return;
    }
    setUser((u) => (u ? { ...u, ...data.user } : data.user));
    setProfileMsg("Profile updated");
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault();
    setPasswordMsg("");
    setPasswordError("");
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }
    const res = await fetch("/api/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: user?.hasPassword ? currentPassword : undefined,
        newPassword,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setPasswordError(data.error || "Could not update password");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setUser((u) => (u ? { ...u, hasPassword: true } : u));
    setPasswordMsg(user?.hasPassword ? "Password updated" : "Password set");
  }

  if (!user) return <div className="container-gb py-16">Loading…</div>;

  return (
    <div className="container-gb max-w-xl py-12">
      <Link href="/account" className="text-sm text-[var(--fg-muted)] hover:text-[var(--accent)]">
        ← Back to account
      </Link>
      <h1 className="display mt-4 text-4xl">Profile & security</h1>
      <p className="mt-2 text-[var(--fg-muted)]">{user.email}</p>

      <form onSubmit={saveProfile} className="mt-8 space-y-4">
        <div>
          <label className="field-label" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="field-label" htmlFor="phone">
            Phone
          </label>
          <input
            id="phone"
            className="input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Optional"
          />
        </div>
        {profileError && <p className="text-[var(--danger)]">{profileError}</p>}
        {profileMsg && <p className="text-[var(--success)]">{profileMsg}</p>}
        <button className="btn btn-primary" type="submit" disabled={saving}>
          Save profile
        </button>
      </form>

      <form onSubmit={savePassword} className="mt-12 space-y-4 border-t border-[var(--line)] pt-10">
        <h2 className="display text-2xl">
          {user.hasPassword ? "Change password" : "Set a password"}
        </h2>
        <p className="text-sm text-[var(--fg-muted)]">
          {user.hasPassword
            ? "Use a strong password you do not reuse elsewhere."
            : "You signed in with Google. Set a password to also use email login."}
        </p>
        {user.hasPassword && (
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <label className="field-label mb-0" htmlFor="currentPassword">
                Current password
              </label>
              <Link
                href={`/forgot-password?identifier=${encodeURIComponent(user.email)}`}
                className="text-xs text-[var(--fg-muted)] hover:text-[var(--accent)]"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="currentPassword"
              className="input"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
        )}
        <div>
          <label className="field-label" htmlFor="newPassword">
            New password
          </label>
          <input
            id="newPassword"
            className="input"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>
        <div>
          <label className="field-label" htmlFor="confirmPassword">
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            className="input"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>
        {passwordError && <p className="text-[var(--danger)]">{passwordError}</p>}
        {passwordMsg && <p className="text-[var(--success)]">{passwordMsg}</p>}
        <button className="btn btn-primary" type="submit">
          {user.hasPassword ? "Update password" : "Set password"}
        </button>
      </form>
    </div>
  );
}
