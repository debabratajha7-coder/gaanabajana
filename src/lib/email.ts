export async function sendOrderEmail(input: {
  to: string;
  orderNumber: string;
  total: number;
  status: string;
}) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Gaanbajana <onboarding@resend.dev>";
  if (!key) {
    console.log("[email skipped]", input);
    return { skipped: true };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: `Gaanbajana order ${input.orderNumber} — ${input.status}`,
      html: `<p>Thanks for shopping at Gaanbajana.</p>
        <p>Order <strong>${input.orderNumber}</strong> is now <strong>${input.status}</strong>.</p>
        <p>Total: ₹${input.total}</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/account/orders">View your orders</a></p>`,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Resend error", text);
    return { error: text };
  }
  return res.json();
}

export async function sendEmailOtp(to: string, code: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Gaanbajana <onboarding@resend.dev>";
  if (!key) {
    console.log(`[email otp skipped] ${code} → ${to}`);
    return { skipped: true as const, code };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Your Gaanbajna verification code",
      html: `
        <div style="font-family:Georgia,serif;max-width:440px;margin:0 auto;padding:28px;background:#0a0a0a;color:#f5f5f5;border:1px solid #222;">
          <p style="letter-spacing:0.2em;text-transform:uppercase;font-size:11px;color:#888;margin:0 0 18px;">Gaanbajna</p>
          <h1 style="font-size:28px;margin:0 0 12px;font-weight:700;">Verify your email</h1>
          <p style="color:#aaa;line-height:1.5;margin:0 0 22px;">Use this one-time code to finish securing your account. It expires in 10 minutes.</p>
          <p style="font-size:36px;letter-spacing:0.35em;font-weight:700;margin:0 0 22px;color:#fff;">${code}</p>
          <p style="color:#666;font-size:12px;margin:0;">If you didn’t request this, you can ignore this email.</p>
        </div>`,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Resend OTP error", text);
    // Domain not verified / bad from-address — don't strand signup; fall back to local OTP
    console.log(`[email otp fallback] ${code} → ${to}`);
    return { skipped: true as const, code, error: text };
  }

  return { skipped: false as const };
}

