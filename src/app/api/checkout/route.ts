import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import { getSiteSettings } from "@/models/SiteSettings";
import { createCashfreeOrder, isCashfreeConfigured } from "@/lib/cashfree";
import { generateOrderNumber } from "@/lib/orders";

const itemSchema = z.object({
  productId: z.string(),
  qty: z.number().int().min(1),
  variantName: z.string().optional(),
});

const schema = z.object({
  items: z.array(itemSchema).min(1),
  shippingAddress: z.object({
    fullName: z.string().min(2),
    phone: z.string().min(8),
    email: z.string().email(),
    line1: z.string().min(3),
    line2: z.string().optional(),
    city: z.string().min(2),
    state: z.string().min(2),
    pincode: z.string().min(5),
    country: z.string().default("India"),
  }),
  note: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    if (!isCashfreeConfigured()) {
      return NextResponse.json(
        {
          error:
            "Cashfree is not configured. Add CASHFREE_APP_ID and CASHFREE_SECRET_KEY to .env.local",
        },
        { status: 503 }
      );
    }

    const body = schema.parse(await req.json());
    await connectDB();
    const session = await getSession();
    const settings = await getSiteSettings();

    const orderItems = [];
    let subtotal = 0;
    for (const line of body.items) {
      const product = await Product.findById(line.productId);
      if (!product || !product.isActive) {
        return NextResponse.json({ error: "Product unavailable" }, { status: 400 });
      }
      const variant =
        product.variants.find(
          (v: { name: string }) => v.name === line.variantName
        ) || product.variants[0];
      const price = variant?.price ?? product.price;
      const stock = variant?.stock ?? product.stock;
      if (stock < line.qty) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.title}` },
          { status: 400 }
        );
      }
      subtotal += price * line.qty;
      orderItems.push({
        product: product._id,
        title: product.title,
        slug: product.slug,
        image: variant?.image || product.images[0],
        variantName: variant?.name,
        sku: variant?.sku,
        price,
        qty: line.qty,
        weightKg: product.weightKg,
      });
    }

    const shippingFee =
      subtotal >= settings.freeShippingThreshold ? 0 : settings.shippingFee;
    const total = subtotal + shippingFee;
    const orderNumber = generateOrderNumber();

    const order = await Order.create({
      orderNumber,
      user: session?.id,
      items: orderItems,
      shippingAddress: body.shippingAddress,
      billingAddress: body.shippingAddress,
      subtotal,
      shippingFee,
      discount: 0,
      total,
      note: body.note,
      paymentStatus: "pending",
      status: "pending_payment",
      cashfreeOrderId: orderNumber,
      timeline: [{ status: "created", at: new Date() }],
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const cf = await createCashfreeOrder({
      orderId: orderNumber,
      amount: total,
      customer: {
        id: session?.id || `guest_${orderNumber}`,
        email: body.shippingAddress.email,
        phone: body.shippingAddress.phone.replace(/\D/g, "").slice(-10),
        name: body.shippingAddress.fullName,
      },
      returnUrl: `${appUrl}/checkout/success?order_id={order_id}`,
    });

    order.cashfreePaymentSessionId = cf.payment_session_id;
    await order.save();

    return NextResponse.json({
      orderNumber,
      paymentSessionId: cf.payment_session_id,
      total,
      env: process.env.CASHFREE_ENV === "production" ? "production" : "sandbox",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
