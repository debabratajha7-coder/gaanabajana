type ShiprocketAuth = { token: string; expiresAt: number };

let cachedAuth: ShiprocketAuth | null = null;

export function isShiprocketConfigured() {
  return Boolean(process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD);
}

async function getToken() {
  if (cachedAuth && cachedAuth.expiresAt > Date.now()) return cachedAuth.token;

  const res = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    }),
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
}) {
  const token = await getToken();
  const res = await fetch("https://apiv2.shiprocket.in/v1/external/orders/create/adhoc", {
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
      billing_phone: payload.billing.phone,
      shipping_is_billing: true,
      order_items: payload.items,
      payment_method: payload.paymentMethod,
      sub_total: payload.subTotal,
      length: payload.length,
      breadth: payload.breadth,
      height: payload.height,
      weight: payload.weight,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || JSON.stringify(data) || "Shiprocket create failed");
  }

  return data as {
    order_id: number | string;
    shipment_id: number | string;
    status: string;
    awb_code?: string;
  };
}

export async function checkServiceability(pickupPincode: string, deliveryPincode: string) {
  if (!isShiprocketConfigured()) return null;
  const token = await getToken();
  const url = new URL("https://apiv2.shiprocket.in/v1/external/courier/serviceability/");
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
