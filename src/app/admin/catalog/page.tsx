import { redirect } from "next/navigation";

export default function AdminCatalogRedirect() {
  redirect("/admin/shop-by-category");
}
