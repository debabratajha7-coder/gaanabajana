import { connectDB } from "@/lib/db";
import {
  createShiprocketOrder,
  hasShiprocketOrderId,
  isShiprocketConfigured,
} from "@/lib/shiprocket";
import { sendOrderEmail } from "@/lib/email";
import { Order } from "@/models/Order";
import { getSiteSettings } from "@/models/SiteSettings";
import { format } from "date-fns";

export async function markOrderPaid(orderNumber: string, paymentId?: string) {
  await connectDB();
  const order = await Order.findOne({ orderNumber });
  if (!order) throw new Error("Order not found");
  if (order.paymentStatus === "paid") return order;

  order.paymentStatus = "paid";
  order.status = "confirmed";
  if (paymentId) order.phonepeTransactionId = paymentId;
  order.timeline.push({ status: "paid", at: new Date(), note: "Payment confirmed" });
  await order.save();

  await pushOrderToShiprocket(order.orderNumber);

  if (order.shippingAddress?.email) {
    await sendOrderEmail({
      to: order.shippingAddress.email,
      orderNumber: order.orderNumber,
      total: order.total,
      status: "confirmed",
    });
  }

  return Order.findOne({ orderNumber });
}

export async function pushOrderToShiprocket(orderNumber: string) {
  await connectDB();
  const order = await Order.findOne({ orderNumber });
  if (!order) throw new Error("Order not found");

  // Clear bogus ids from earlier bugs so retry can run
  if (!hasShiprocketOrderId(order.shiprocketOrderId)) {
    order.shiprocketOrderId = undefined;
    order.shiprocketShipmentId = undefined;
  }

  if (hasShiprocketOrderId(order.shiprocketOrderId)) return order;

  if (!isShiprocketConfigured()) {
    order.timeline.push({
      status: "shiprocket_skipped",
      at: new Date(),
      note: "Shiprocket credentials not configured",
    });
    await order.save();
    return order;
  }

  const settings = await getSiteSettings();
  const [firstName, ...rest] = order.shippingAddress.fullName.split(" ");
  const weight = Math.max(
    0.5,
    order.items.reduce(
      (sum: number, i: { weightKg?: number; qty: number }) =>
        sum + (i.weightKg || 1) * i.qty,
      0
    )
  );
  const length = Math.max(...order.items.map(() => 40), 10);
  const breadth = 20;
  const height = Math.min(40, 10 + order.items.length * 5);

  try {
    const result = await createShiprocketOrder({
      orderId: order.orderNumber,
      orderDate: format(new Date(), "yyyy-MM-dd HH:mm"),
      pickupLocation:
        process.env.SHIPROCKET_PICKUP_LOCATION ||
        settings.pickupLocationName ||
        "Primary",
      billing: {
        firstName: firstName || "Customer",
        lastName: rest.join(" ") || "",
        address: order.shippingAddress.line1,
        address2: order.shippingAddress.line2,
        city: order.shippingAddress.city,
        pincode: order.shippingAddress.pincode,
        state: order.shippingAddress.state,
        country: order.shippingAddress.country || "India",
        email: order.shippingAddress.email,
        phone: order.shippingAddress.phone,
      },
      items: order.items.map(
        (i: {
          title: string;
          sku?: string;
          slug: string;
          qty: number;
          price: number;
        }) => ({
          name: i.title,
          sku: i.sku || i.slug,
          units: i.qty,
          selling_price: i.price,
        })
      ),
      paymentMethod: "Prepaid",
      subTotal: order.subtotal,
      length,
      breadth,
      height,
      weight,
    });

    order.shiprocketOrderId = result.order_id;
    order.shiprocketShipmentId = result.shipment_id;
    if (result.awb_code) order.awb = result.awb_code;
    if (result.courier_name) order.courierName = result.courier_name;
    order.status = "processing";
    order.timeline.push({
      status: "shiprocket_created",
      at: new Date(),
      note: `Shiprocket order ${result.order_id} · shipment ${result.shipment_id}`,
    });
    await order.save();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Shiprocket error";
    order.timeline.push({
      status: "shiprocket_error",
      at: new Date(),
      note: message,
    });
    await order.save();
    console.error("Shiprocket push failed", message);
  }

  return order;
}

export function generateOrderNumber() {
  const now = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `GB${now}${rand}`;
}
