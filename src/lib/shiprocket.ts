type ShiprocketAuth = { token: string; expiresAt: number };

let cachedAuth: ShiprocketAuth | null = null;

export function isShiprocketConfigured() {
  return Boolean(
    process.env.SHIPROCKET_EMAIL?.trim() &&
      process.env.SHIPROCKET_PASSWORD?.trim()
  );
}

/** True when we have a real Shiprocket order id (not the string "undefined"). */
export function hasShiprocketOrderId(id?: string | null) {
  if (!id) return false;
  const s = String(id).trim();
  return Boolean(s) && s !== "undefined" && s !== "null";
}

async function getToken() {
  if (cachedAuth && cachedAuth.expiresAt > Date.now()) return cachedAuth.token;

  const email = process.env.SHIPROCKET_EMAIL?.trim();
  const password = process.env.SHIPROCKET_PASSWORD?.trim();
  if (!email || !password) {
    throw new Error("Shiprocket credentials missing");
  }

  const res = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok || !data.token) {
    throw new Error(data?.message || "Shiprocket auth failed");
  }
  cachedAuth = {
    token: data.token,
    expiresAt: Date.now() + 9 * 24 * 60 * 60 * 1000,
  };
  return data.token as string;
}

export type ShiprocketCreateResult = {
  order_id: string;
  shipment_id: string;
  status: string;
  awb_code?: string;
  courier_name?: string;
};

function pickId(v: unknown): string | undefined {
  if (v == null) return undefined;
  const s = String(v).trim();
  if (!s || s === "undefined" || s === "null") return undefined;
  return s;
}

function parseCreateResponse(data: Record<string, unknown>): ShiprocketCreateResult {
  const nested =
    data.payload && typeof data.payload === "object"
      ? (data.payload as Record<string, unknown>)
      : data.data && typeof data.data === "object"
        ? (data.data as Record<string, unknown>)
        : data;

  const orderId = pickId(nested.order_id ?? nested.orderId);
  const shipmentId = pickId(nested.shipment_id ?? nested.shipmentId);
  const status = String(nested.status || nested.new_order_status || "NEW");
  const awb = pickId(nested.awb_code ?? nested.awb);
  const courier = pickId(nested.courier_name);

  const statusCode = nested.status_code ?? data.status_code;
  if (statusCode != null && Number(statusCode) >= 5 && !orderId) {
    throw new Error(
      String(nested.message || data.message || `Shiprocket status_code ${statusCode}`)
    );
  }

  if (!orderId || !shipmentId) {
    throw new Error(
      String(
        nested.message ||
          data.message ||
          `Shiprocket create returned no order/shipment id: ${JSON.stringify(data).slice(0, 400)}`
      )
    );
  }

  return {
    order_id: orderId,
    shipment_id: shipmentId,
    status,
    awb_code: awb,
    courier_name: courier,
  };
}

export async function createShiprocketOrder(payload: {
  orderId: string;
  orderDate: string;
  pickupLocation: string;
  billing: {
    firstName: string;
    lastName?: string;
    address: string;
    address2?: string;
    city: string;
    pincode: string;
    state: string;
    country: string;
    email: string;
    phone: string;
  };
  items: {
    name: string;
    sku: string;
    units: number;
    selling_price: number;
  }[];
  paymentMethod: "Prepaid" | "COD";
  subTotal: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
}): Promise<ShiprocketCreateResult> {
  const token = await getToken();
  const phone = payload.billing.phone.replace(/\D/g, "").slice(-10);

  const res = await fetch(
    "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        order_id: payload.orderId,
        order_date: payload.orderDate,
        pickup_location: payload.pickupLocation,
        billing_customer_name: payload.billing.firstName,
        billing_last_name: payload.billing.lastName || "",
        billing_address: payload.billing.address,
        billing_address_2: payload.billing.address2 || "",
        billing_city: payload.billing.city,
        billing_pincode: payload.billing.pincode,
        billing_state: payload.billing.state,
        billing_country: payload.billing.country,
        billing_email: payload.billing.email,
        billing_phone: phone,
        shipping_is_billing: true,
        order_items: payload.items,
        payment_method: payload.paymentMethod,
        sub_total: payload.subTotal,
        length: payload.length,
        breadth: payload.breadth,
        height: payload.height,
        weight: payload.weight,
      }),
    }
  );

  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(
      String(data?.message || JSON.stringify(data) || "Shiprocket create failed")
    );
  }

  return parseCreateResponse(data);
}

export async function checkServiceability(
  pickupPincode: string,
  deliveryPincode: string
) {
  if (!isShiprocketConfigured()) return null;
  const token = await getToken();
  const url = new URL(
    "https://apiv2.shiprocket.in/v1/external/courier/serviceability/"
  );
  url.searchParams.set("pickup_postcode", pickupPincode);
  url.searchParams.set("delivery_postcode", deliveryPincode);
  url.searchParams.set("cod", "0");
  url.searchParams.set("weight", "1");
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}
