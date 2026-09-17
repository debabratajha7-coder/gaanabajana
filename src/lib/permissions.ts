export const ADMIN_PERMISSIONS = [
  { key: "dashboard", label: "Dashboard", href: "/admin" },
  { key: "products", label: "Products", href: "/admin/products" },
  { key: "orders", label: "Orders", href: "/admin/orders" },
  { key: "catalog", label: "Categories & brands", href: "/admin/shop-by-category" },
  { key: "website", label: "Site / CMS", href: "/admin/website" },
  { key: "blog", label: "Blog", href: "/admin/blog" },
  { key: "reviews", label: "Reviews", href: "/admin/reviews" },
  { key: "media", label: "Media", href: "/admin/media" },
  { key: "users", label: "Users & staff", href: "/admin/users" },
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number]["key"];

export const ALL_ADMIN_PERMISSIONS = ADMIN_PERMISSIONS.map((p) => p.key);

export function permissionForPath(pathname: string): AdminPermission | null {
  if (pathname === "/admin" || pathname === "/admin/") return "dashboard";
  if (pathname.startsWith("/admin/products")) return "products";
  if (pathname.startsWith("/admin/orders")) return "orders";
  if (
    pathname.startsWith("/admin/shop-by-category") ||
    pathname.startsWith("/admin/brands") ||
    pathname.startsWith("/admin/catalog")
  ) {
    return "catalog";
  }
  if (pathname.startsWith("/admin/website")) return "website";
  if (pathname.startsWith("/admin/blog") || pathname.startsWith("/admin/blogs")) {
    return "blog";
  }
  if (pathname.startsWith("/admin/reviews")) return "reviews";
  if (pathname.startsWith("/admin/media")) return "media";
  if (pathname.startsWith("/admin/users")) return "users";
  return null;
}

export function hasAdminPermission(
  user: {
    role: string;
    isSuperAdmin?: boolean;
    adminPermissions?: string[];
  },
  permission: AdminPermission
) {
  if (user.role !== "admin") return false;
  if (user.isSuperAdmin) return true;
  return (user.adminPermissions || []).includes(permission);
}
