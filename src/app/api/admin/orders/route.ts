import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { authErrorResponse, requireAdminPermission } from "@/lib/auth";
import { Order } from "@/models/Order";
import { pushOrderToShiprocket } from "@/lib/orders";

export async function GET() {
  try {
    await requireAdminPermission("orders");
    await connectDB();
    const orders = await Order.find().sort({ createdAt: -1 }).limit(100).lean();
    return NextResponse.json({ orders });
  } catch (e) {
    return authErrorResponse(e);
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdminPermission("orders");
    const body = z
      .object({
        orderNumber: z.string(),
        status: z
          .enum([
            "pending_payment",
            "confirmed",
            "processing",
            "shipped",
            "delivered",
            "cancelled",
          ])
          .optional(),
        awb: z.string().optional(),
        trackingUrl: z.string().optional(),
        retryShiprocket: z.boolean().optional(),
      })
      .parse(await req.json());

    await connectDB();

    if (body.retryShiprocket) {
      const order = await pushOrderToShiprocket(body.orderNumber);
      return NextResponse.json({ order });
    }

    const order = await Order.findOneAndUpdate(
      { orderNumber: body.orderNumber },
      {
        ...(body.status ? { status: body.status } : {}),
        ...(body.awb ? { awb: body.awb } : {}),
        ...(body.trackingUrl ? { trackingUrl: body.trackingUrl } : {}),
        $push: {
          timeline: {
            status: body.status || "updated",
            at: new Date(),
          },
        },
      },
      { new: true }
    );
    return NextResponse.json({ order });
  } catch (e) {
    return authErrorResponse(e);
  }
}
