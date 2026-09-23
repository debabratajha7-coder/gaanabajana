import { shouldExposeDevOtp } from "@/lib/otp";

export async function sendOrderEmail(input: {
  to: string;
  orderNumber: string;
  total: number;
  status: string;
}) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Gaanabajana <onboarding@resend.dev>";
  if (!key) {
    console.log("[email skipped]", { to: input.to, orderNumber: input.orderNumber });
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
      subject: `Gaanabajana order ${input.orderNumber} — ${input.status}`,
      html: `<p>Thanks for shopping at Gaanabajana.</p>
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

export async function sendCancellationEmail(input: {
  to: string;
  orderNumber: string;
  total: number;
  prepaid?: boolean;
}) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Gaanabajana <onboarding@resend.dev>";
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://www.gaanabajana.com";
  if (!key) {
    console.log("[cancel email skipped]", {
      to: input.to,
      orderNumber: input.orderNumber,
    });
    return { skipped: true };
  }

  const refundLine = input.prepaid
    ? "<p>If you paid online, your refund will be processed within <strong>5–7 business days</strong>.</p>"
    : "<p>No payment was collected for this cash-on-delivery order.</p>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: `Gaanabajana order ${input.orderNumber} — cancelled`,
      html: `<p>Your order <strong>${input.orderNumber}</strong> has been cancelled.</p>
        <p>Total: ₹${input.total}</p>
        ${refundLine}
        <p>Need help? <a href="${appUrl}/contact">Contact us</a> or reply to this email.</p>
        <p><a href="${appUrl}/account/orders/${input.orderNumber}">View order</a></p>`,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Resend cancel email error", text);
    return { error: text };
  }
  return res.json();
}

/** Tracking / courier status change notification */
export async function sendShippingUpdateEmail(input: {
  to: string;
  orderNumber: string;
  statusLabel: string;
  awb?: string;
  trackingUrl?: string;
  courierName?: string;
  activity?: string;
  location?: string;
}) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Gaanabajana <onboarding@resend.dev>";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gaanabajana.com";
  if (!key) {
    console.log("[shipping email skipped]", {
      to: input.to,
      orderNumber: input.orderNumber,
      status: input.statusLabel,
    });
    return { skipped: true };
  }

  const trackHref = `${appUrl}/track-order`;
  const details = [
    input.courierName ? `<li>Courier: <strong>${input.courierName}</strong></li>` : "",
    input.awb ? `<li>AWB: <strong>${input.awb}</strong></li>` : "",
    input.activity ? `<li>${input.activity}</li>` : "",
    input.location ? `<li>Location: ${input.location}</li>` : "",
  ]
    .filter(Boolean)
    .join("");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: `Order ${input.orderNumber} update — ${input.statusLabel}`,
      html: `
        <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:28px;background:#0a0a0a;color:#f5f5f5;border:1px solid #222;">
          <p style="letter-spacing:0.2em;text-transform:uppercase;font-size:11px;color:#888;margin:0 0 18px;">Gaanabajana</p>
          <h1 style="font-size:24px;margin:0 0 12px;font-weight:700;">Shipment update</h1>
          <p style="color:#aaa;line-height:1.5;margin:0 0 16px;">
            Order <strong style="color:#fff;">${input.orderNumber}</strong> is now
            <strong style="color:#fff;">${input.statusLabel}</strong>.
          </p>
          ${details ? `<ul style="color:#ccc;line-height:1.6;padding-left:18px;margin:0 0 18px;">${details}</ul>` : ""}
          ${
            input.trackingUrl
              ? `<p style="margin:0 0 12px;"><a href="${input.trackingUrl}" style="color:#c8102e;">Open courier tracking</a></p>`
              : ""
          }
          <p style="margin:0;"><a href="${trackHref}" style="color:#c8102e;">Track on Gaanabajana</a></p>
        </div>`,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Resend shipping update error", text);
    return { error: text };
  }
  return res.json();
}

export async function sendEmailOtp(to: string, code: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Gaanabajana <onboarding@resend.dev>";
  if (!key) {
    if (shouldExposeDevOtp()) {
      console.log(`[email otp skipped] ${code} → ${to}`);
    } else {
      console.log("[email otp skipped] RESEND_API_KEY missing");
    }
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
      subject: "Your Gaanabajana verification code",
      html: `
        <div style="font-family:Georgia,serif;max-width:440px;margin:0 auto;padding:28px;background:#0a0a0a;color:#f5f5f5;border:1px solid #222;">
          <p style="letter-spacing:0.2em;text-transform:uppercase;font-size:11px;color:#888;margin:0 0 18px;">Gaanabajana</p>
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
    if (shouldExposeDevOtp()) {
      console.log(`[email otp fallback] ${code} → ${to}`);
    }
    return { skipped: true as const, code, error: text };
  }

  return { skipped: false as const };
}

