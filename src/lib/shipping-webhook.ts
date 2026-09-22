import type { IOrder } from "@/models/Order";

export type ShiprocketWebhookPayload = {
  awb?: string | number;
  awb_code?: string;
  courier_name?: string;
  current_status?: string;
  current_status_id?: number | string;
  shipment_status?: string;
  shipment_status_id?: number | string;
  current_timestamp?: string;
  order_id?: string | number;
  channel_order_id?: string | number;
  sr_order_id?: string | number;
  shipment_id?: string | number;
  tracking_url?: string;
  etd?: string;
  scans?: Array<{
    date?: string;
    activity?: string;
    location?: string;
    status?: string;
    "sr-status-label"?: string;
  }>;
  shipment_track_activities?: Array<{
    date?: string;
    activity?: string;
    location?: string;
  }>;
};

export function extractWebhookToken(req: {
  headers: Headers;
  url: string;
}): string | null {
  const apiKey = req.headers.get("x-api-key");
  if (apiKey?.trim()) return apiKey.trim();

  const auth = req.headers.get("authorization") || req.headers.get("Authorization");
  if (auth?.trim()) {
    return auth.replace(/^Bearer\s+/i, "").trim();
  }

  const secret = req.headers.get("x-shiprocket-secret");
  if (secret?.trim()) return secret.trim();

  try {
    const u = new URL(req.url);
    const q = u.searchParams.get("token") || u.searchParams.get("secret");
    if (q?.trim()) return q.trim();
  } catch {
    /* ignore */
  }
  return null;
}

export function verifyShiprocketWebhookToken(
  provided: string | null,
  expected = process.env.SHIPROCKET_WEBHOOK_TOKEN
) {
  if (!expected) return false;
  if (!provided) return false;
  return provided === expected;
}

export function pickTrackingLabel(payload: ShiprocketWebhookPayload): string {
  const raw =
    payload.current_status ||
    payload.shipment_status ||
    payload.scans?.[payload.scans.length - 1]?.["sr-status-label"] ||
    payload.scans?.[payload.scans.length - 1]?.activity ||
    payload.shipment_track_activities?.[
      payload.shipment_track_activities.length - 1
    ]?.activity ||
    "Update";
  return String(raw).trim() || "Update";
}

export function pickLatestActivity(payload: ShiprocketWebhookPayload): {
  activity?: string;
  location?: string;
} {
  const scan = payload.scans?.[payload.scans.length - 1];
  const act =
    payload.shipment_track_activities?.[
      payload.shipment_track_activities.length - 1
    ];
  return {
    activity: scan?.activity || act?.activity,
    location: scan?.location || act?.location,
  };
}

/** Map courier status → our order.status */
export function mapCourierStatusToOrderStatus(
  label: string
): IOrder["status"] | null {
  const s = label.toLowerCase();
  if (/delivered/.test(s) && !/undelivered|failed/.test(s)) {
    return "delivered";
  }
  if (/^cancel|cancelled|canceled|lost|destroyed/.test(s) || /\bcancel/.test(s)) {
    return "cancelled";
  }
  if (
    /shipped|in transit|picked|pickup|out for delivery|dispatched|manifest|ofd|in_transit|reached/.test(
      s
    )
  ) {
    return "shipped";
  }
  if (/processing|confirmed|pending|ready to ship|packed|new order/.test(s)) {
    return "processing";
  }
  return null;
}

export function pickAwb(payload: ShiprocketWebhookPayload): string | undefined {
  const v = payload.awb ?? payload.awb_code;
  if (v == null || v === "") return undefined;
  return String(v);
}

export function defaultTrackingUrl(awb?: string) {
  if (!awb) return undefined;
  return `https://shiprocket.co/tracking/${encodeURIComponent(awb)}`;
}
