import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import { getSiteSettings } from "@/models/SiteSettings";
import { createPhonePePayment, isPhonePeConfigured } from "@/lib/phonepe";
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
    if (!isPhonePeConfigured()) {
      return NextResponse.json(
        {
          error:
            "PhonePe is not configured. Add PHONEPE_CLIENT_ID and PHONEPE_CLIENT_SECRET to .env.local",
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
      phonepeMerchantOrderId: orderNumber,
      timeline: [{ status: "created", at: new Date() }],
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const pay = await createPhonePePayment({
      merchantOrderId: orderNumber,
      amountInr: total,
      redirectUrl: `${appUrl}/checkout/success?order_id=${orderNumber}`,
      message: `Gaanbajna order ${orderNumber}`,
    });

    order.phonepeOrderId = pay.orderId;
    await order.save();

    return NextResponse.json({
      orderNumber,
      redirectUrl: pay.redirectUrl,
      total,
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
