import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { authErrorResponse, requireAdminPermission } from "@/lib/auth";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { User } from "@/models/User";

export async function GET() {
  try {
    await requireAdminPermission("dashboard");
    await connectDB();
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const [ordersToday, revenueAgg, lowStock, recentOrders, users, paidOrders] =
      await Promise.all([
        Order.countDocuments({ createdAt: { $gte: start } }),
        Order.aggregate([
          { $match: { paymentStatus: "paid" } },
          { $group: { _id: null, total: { $sum: "$total" } } },
        ]),
        Product.find({ stock: { $lte: 5 }, isActive: true })
          .select("title stock slug")
          .limit(10)
          .lean(),
        Order.find().sort({ createdAt: -1 }).limit(8).lean(),
        // Logged-in accounts (excludes admin + demo review seed accounts)
        User.countDocuments({
          role: "customer",
          email: { $not: /@gaanabajana\.demo$/i },
        }),
        // Paid orders — used to derive customers who actually paid
        Order.find({ paymentStatus: "paid" })
          .select("user shippingAddress.email")
          .lean(),
      ]);

    // Customer = someone who completed payment (account or guest email)
    const customerKeys = new Set<string>();
    for (const order of paidOrders) {
      if (order.user) {
        customerKeys.add(`u:${String(order.user)}`);
      } else if (order.shippingAddress?.email) {
        customerKeys.add(`e:${order.shippingAddress.email.toLowerCase()}`);
      }
    }

    return NextResponse.json({
      ordersToday,
      revenue: revenueAgg[0]?.total || 0,
      lowStock,
      recentOrders,
      users,
      customers: customerKeys.size,
    });
  } catch (e) {
    return authErrorResponse(e);
  }
}
