import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { authErrorResponse, requireAdmin } from "@/lib/auth";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { User } from "@/models/User";

export async function GET() {
  try {
    await requireAdmin();
    await connectDB();
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const [ordersToday, revenueAgg, lowStock, recentOrders, customers] =
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
        User.countDocuments({ role: "customer" }),
      ]);

    return NextResponse.json({
      ordersToday,
      revenue: revenueAgg[0]?.total || 0,
      lowStock,
      recentOrders,
      customers,
    });
  } catch (e) {
    return authErrorResponse(e);
  }
}
