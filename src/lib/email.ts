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
