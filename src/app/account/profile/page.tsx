"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { OtpInput } from "@/components/auth/OtpInput";
import { maskPhone } from "@/lib/otp-client";

type ProfileUser = {
  name: string;
  email: string;
  phone?: string;
  role?: string;
  authProvider?: string;
  hasPassword?: boolean;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [name, setName] = useState("");
  const [profileMsg, setProfileMsg] = useState("");
  const [profileError, setProfileError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [saving, setSaving] = useState(false);

  const [newPhone, setNewPhone] = useState("");
  const [phonePassword, setPhonePassword] = useState("");
  const [phoneStep, setPhoneStep] = useState<"form" | "otp">("form");
  const [phoneChallenge, setPhoneChallenge] = useState("");
  const [phoneMasked, setPhoneMasked] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneMsg, setPhoneMsg] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [phoneBusy, setPhoneBusy] = useState(false);

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
      body: JSON.stringify({ name }),
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

  async function requestPhoneChange(e: FormEvent) {
    e.preventDefault();
    setPhoneBusy(true);
    setPhoneError("");
    setPhoneMsg("");
    const res = await fetch("/api/account/phone/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: newPhone,
        ...(user?.role === "admin" ? { currentPassword: phonePassword } : {}),
      }),
    });
    const data = await res.json();
    setPhoneBusy(false);
    if (!res.ok) {
      setPhoneError(data.error || "Could not send code");
      return;
    }
    setPhoneChallenge(data.challengeToken);
    setPhoneMasked(data.maskedPhone || "");
    setPhoneOtp("");
    setPhoneStep("otp");
    setPhoneMsg(`Code sent to ${data.maskedPhone}`);
  }

  async function confirmPhoneChange(e: FormEvent) {
    e.preventDefault();
    setPhoneBusy(true);
    setPhoneError("");
    setPhoneMsg("");
    const res = await fetch("/api/account/phone/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeToken: phoneChallenge, code: phoneOtp }),
    });
    const data = await res.json();
    setPhoneBusy(false);
    if (!res.ok) {
      setPhoneError(data.error || "Could not verify code");
      return;
    }
    setUser((u) => (u ? { ...u, phone: data.phone } : u));
    setNewPhone("");
    setPhonePassword("");
    setPhoneChallenge("");
    setPhoneOtp("");
    setPhoneStep("form");
    setPhoneMsg("Phone updated");
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

  const isAdmin = user.role === "admin";

  return (
    <div className="container-gb max-w-xl py-12">
      <Link href="/account" className="text-sm text-[var(--fg-muted)] hover:text-[var(--accent)]">
        ← Back to account
      </Link>
      <h1 className="display mt-4 text-4xl">Profile & security</h1>
      <p className="mt-2 text-[var(--fg-muted)]">{user.email}</p>
      {isAdmin && (
        <p className="mt-2 text-sm text-[var(--fg-muted)]">
          Admin OTP phone can also be managed in{" "}
          <Link href="/admin/security" className="underline hover:text-[var(--accent)]">
            Admin → Login &amp; security
          </Link>
          .
        </p>
      )}

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
        {profileError && <p className="text-[var(--danger)]">{profileError}</p>}
        {profileMsg && <p className="text-[var(--success)]">{profileMsg}</p>}
        <button className="btn btn-primary" type="submit" disabled={saving}>
          Save name
        </button>
      </form>

      <div className="mt-12 space-y-4 border-t border-[var(--line)] pt-10">
        <h2 className="display text-2xl">Phone number</h2>
        <p className="text-sm text-[var(--fg-muted)]">
          Current:{" "}
          <span className="font-medium text-[var(--fg)]">
            {user.phone ? maskPhone(user.phone) : "Not set"}
          </span>
          {user.phone ? ` (${user.phone})` : ""}
          {isAdmin
            ? ". Admin login OTPs are sent here."
            : "."}
        </p>

        {phoneStep === "form" ? (
          <form onSubmit={requestPhoneChange} className="space-y-4">
            {isAdmin && (
              <div>
                <label className="field-label" htmlFor="phonePassword">
                  Current password
                </label>
                <input
                  id="phonePassword"
                  className="input"
                  type="password"
                  value={phonePassword}
                  onChange={(e) => setPhonePassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            )}
            <div>
              <label className="field-label" htmlFor="newPhone">
                New phone
              </label>
              <input
                id="newPhone"
                className="input"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="10-digit mobile"
                required
                inputMode="tel"
              />
            </div>
            {phoneError && <p className="text-[var(--danger)]">{phoneError}</p>}
            {phoneMsg && <p className="text-[var(--success)]">{phoneMsg}</p>}
            <button className="btn btn-primary" type="submit" disabled={phoneBusy}>
              {phoneBusy ? "Sending…" : "Send OTP to new number"}
            </button>
          </form>
        ) : (
          <form onSubmit={confirmPhoneChange} className="space-y-4">
            <p className="text-sm text-[var(--fg-muted)]">
              Enter the code sent to {phoneMasked || "your new phone"}.
            </p>
            <OtpInput value={phoneOtp} onChange={setPhoneOtp} />
            {phoneError && <p className="text-[var(--danger)]">{phoneError}</p>}
            {phoneMsg && <p className="text-[var(--success)]">{phoneMsg}</p>}
            <div className="flex flex-wrap gap-3">
              <button
                className="btn btn-primary"
                type="submit"
                disabled={phoneBusy || phoneOtp.length < 6}
              >
                {phoneBusy ? "Saving…" : "Confirm phone"}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={phoneBusy}
                onClick={() => {
                  setPhoneStep("form");
                  setPhoneChallenge("");
                  setPhoneOtp("");
                  setPhoneError("");
                  setPhoneMsg("");
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

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
