import { Product } from "@/models/Product";
import { Review } from "@/models/Review";

export async function refreshProductRating(productId: string) {
  const approved = await Review.find({ product: productId, approved: true });
  const avg = approved.length
    ? approved.reduce((s, r) => s + r.rating, 0) / approved.length
    : 0;
  await Product.findByIdAndUpdate(productId, {
    ratingAvg: Math.round(avg * 100) / 100,
    ratingCount: approved.length,
  });
}
