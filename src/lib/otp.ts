import crypto from "crypto";
import { createChallengeToken, verifyChallengeToken } from "@/lib/auth";

export function generateOtpCode() {
  return String(crypto.randomInt(100000, 999999));
}

export function hashOtp(code: string) {
  return crypto
    .createHash("sha256")
    .update(`gb-otp:${String(code).trim()}`)
    .digest("hex");
}

export function normalizeIndianPhone(input: string) {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) {
    return `+91${digits.slice(1)}`;
  }
  if (input.trim().startsWith("+") && digits.length >= 10) {
    return `+${digits}`;
  }
  throw new Error("Enter a valid 10-digit Indian mobile number");
}

export function maskPhone(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (d.length < 4) return phone;
  return `+${d.slice(0, 2)} ******${d.slice(-4)}`;
}

export function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  const visible = user.slice(0, Math.min(2, user.length));
  return `${visible}***@${domain}`;
}

/** Signed OTP challenge — no database. */
export async function issueOtpChallenge(
  payload: Record<string, unknown> & { purpose: string },
  expiresIn = "15m"
) {
  const code = generateOtpCode();
  const token = await createChallengeToken(
    { ...payload, otpHash: hashOtp(code) },
    expiresIn
  );
  return { code, token };
}

export async function consumeOtpChallenge<T extends Record<string, unknown>>(
  token: string,
  code: string,
  expectedPurpose: string | string[]
) {
  const payload = await verifyChallengeToken<
    T & { purpose?: string; otpHash?: string }
  >(token);
  const purposes = Array.isArray(expectedPurpose)
    ? expectedPurpose
    : [expectedPurpose];
  if (!payload?.otpHash || !payload.purpose || !purposes.includes(payload.purpose)) {
    return {
      ok: false as const,
      error: "Code expired. Go back and sign in again.",
    };
  }
  if (hashOtp(code) !== payload.otpHash) {
    return { ok: false as const, error: "Incorrect code. Try again." };
  }
  return { ok: true as const, payload };
}
