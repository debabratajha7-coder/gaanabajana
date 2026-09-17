/** Simple Twilio Programmable SMS. Never throws — returns skipped + code on failure. */

export function isTwilioConfigured() {
  const sid = (process.env.TWILIO_ACCOUNT_SID || "").trim();
  const token = (process.env.TWILIO_AUTH_TOKEN || "").trim();
  const from = (process.env.TWILIO_FROM_NUMBER || "").trim();
  return Boolean(sid.startsWith("AC") && token && from);
}

export async function sendSmsOtp(to: string, code: string) {
  const sid = (process.env.TWILIO_ACCOUNT_SID || "").trim();
  const token = (process.env.TWILIO_AUTH_TOKEN || "").trim();
  const from = (process.env.TWILIO_FROM_NUMBER || "").trim();

  if (!sid.startsWith("AC") || !token || !from) {
    console.log(`[sms skipped] OTP ${code} → ${to}`);
    return { skipped: true as const, code };
  }

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: to,
          From: from,
          Body: `Your Gaanbajna code is ${code}. Valid for 15 minutes.`,
        }),
      }
    );
    if (!res.ok) {
      console.error("Twilio SMS error", await res.text());
      console.log(`[sms fallback] OTP ${code} → ${to}`);
      return { skipped: true as const, code };
    }
    return { skipped: false as const, code };
  } catch (err) {
    console.error("Twilio SMS exception", err);
    console.log(`[sms fallback] OTP ${code} → ${to}`);
    return { skipped: true as const, code };
  }
}
