/** Browser-safe phone/email masks (no Node crypto). */

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
