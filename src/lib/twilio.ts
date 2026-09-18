import { shouldExposeDevOtp } from "@/lib/otp";

/** Simple Twilio Programmable SMS. Never throws — returns skipped + code on failure. */

export function isTwilioConfigured() {
  const sid = (process.env.TWILIO_ACCOUNT_SID || "").trim();
  const token = (process.env.TWILIO_AUTH_TOKEN || "").trim();
  const from = (process.env.TWILIO_FROM_NUMBER || "").trim();
  return Boolean(sid.startsWith("AC") && token && from);
}

function logOtpFallback(to: string, code: string, reason: string) {
  if (shouldExposeDevOtp()) {
    console.log(`[sms ${reason}] OTP ${code} → ${to}`);
  } else {
    console.log(`[sms ${reason}] OTP suppressed in production → ${to}`);
  }
}

export async function sendSmsOtp(to: string, code: string) {
  const sid = (process.env.TWILIO_ACCOUNT_SID || "").trim();
  const token = (process.env.TWILIO_AUTH_TOKEN || "").trim();
  const from = (process.env.TWILIO_FROM_NUMBER || "").trim();

  if (!sid.startsWith("AC") || !token || !from) {
    logOtpFallback(to, code, "skipped");
    return { skipped: true as const, code };
  }

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization:
            "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: to,
          From: from,
          Body: `Your Gaanabajana code is ${code}. Valid for 15 minutes.`,
        }),
      }
    );
    if (!res.ok) {
      console.error("Twilio SMS error", await res.text());
      logOtpFallback(to, code, "fallback");
      return { skipped: true as const, code };
    }
    return { skipped: false as const, code };
  } catch (err) {
    console.error("Twilio SMS exception", err);
    logOtpFallback(to, code, "fallback");
    return { skipped: true as const, code };
  }
}
