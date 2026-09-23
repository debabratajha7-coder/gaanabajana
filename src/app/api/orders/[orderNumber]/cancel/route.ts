import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Order } from "@/models/Order";
import { cancelCustomerOrder, isOrderCancellable } from "@/lib/orders";
import { normalizeIndianPhone } from "@/lib/otp";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const bodySchema = z.object({
  reason: z.string().max(280).optional(),
  phone: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const limited = rateLimit(`order-cancel:${clientIp(req)}`, 8, 15 * 60_000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  try {
    const { orderNumber } = await params;
    if (!orderNumber || !/^GB[A-Z0-9]+$/i.test(orderNumber)) {
      return NextResponse.json({ error: "Invalid order" }, { status: 400 });
    }

    const body = bodySchema.parse(await req.json().catch(() => ({})));
    await connectDB();
    const order = await Order.findOne({ orderNumber });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const session = await getSession();
    const isOwner =
      Boolean(session) &&
      Boolean(order.user) &&
      String(order.user) === session!.id;
    const isAdmin = session?.role === "admin";

    let phoneMatch = false;
    if (body.phone && order.shippingAddress?.phone) {
      try {
        phoneMatch =
          normalizeIndianPhone(body.phone) ===
          normalizeIndianPhone(order.shippingAddress.phone);
      } catch {
        phoneMatch = false;
      }
    }

    if (!isOwner && !isAdmin && !phoneMatch) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    if (!isOrderCancellable(order.status)) {
      return NextResponse.json(
        {
          error:
            "This order can no longer be cancelled online. Contact us if you need help.",
          status: order.status,
        },
        { status: 400 }
      );
    }

    const updated = await cancelCustomerOrder(orderNumber, body.reason);
    return NextResponse.json({ order: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }
    console.error("order cancel", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not cancel order",
      },
      { status: 400 }
    );
  }
}
