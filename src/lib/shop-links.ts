export type ShopLink = {
  label: string;
  href: string;
  /** Display name in the coming-soon dialog */
  name: string;
  empty: boolean;
};

export const DEFAULT_SHOP_LINKS: ShopLink[] = [
  {
    label: "Guitars",
    name: "Guitars",
    href: "/collections/guitars",
    empty: false,
  },
  {
    label: "Keyboards",
    name: "Keyboards",
    href: "/collections/keyboards-and-pianos",
    empty: true,
  },
  {
    label: "Drums",
    name: "Drums",
    href: "/collections/drums-and-percussion",
    empty: true,
  },
  { label: "Deals", name: "Deals", href: "/deals", empty: true },
];
