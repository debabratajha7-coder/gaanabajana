import Link from "next/link";
import { connectDB } from "@/lib/db";
import { getSiteSettings } from "@/models/SiteSettings";

export const dynamic = "force-dynamic";

export default async function StoresPage() {
  let address = "M9VC F4C Medical More, Kawakhari, West Bengal, 734011, India";
  let phone = "+91 9563754563, +91 7679586321";
  let hours = "Open daily until 9:00 PM";
  let storeName = "Gaana Bajana";

  try {
    await connectDB();
    const settings = await getSiteSettings();
    address = settings.address || address;
    phone = settings.phone || phone;
    hours = settings.storeHours || hours;
    storeName = settings.storeName || storeName;
  } catch {
    /* keep defaults */
  }

  const tel = phone.split(",")[0]?.replace(/[^\d+]/g, "") || "";
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return (
    <div className="container-gb py-12">
      <p className="eyebrow">Visit</p>
      <h1 className="display mt-2 text-4xl">{storeName}</h1>
      <p className="mt-4 max-w-2xl text-[var(--fg-muted)]">
        Come try instruments in person at our Siliguri store.
      </p>
      <div className="mt-8 max-w-lg space-y-3 text-sm leading-relaxed">
        <p>{address}</p>
        <p>
          <a href={`tel:${tel}`} className="hover:text-[var(--accent)]">
            {phone}
          </a>
        </p>
        <p className="text-[var(--fg-muted)]">{hours}</p>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <a href={`tel:${tel}`} className="btn btn-primary">
          Call now
        </a>
        <a
          href={maps}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost"
        >
          Get directions
        </a>
        <Link href="/contact" className="btn btn-ghost">
          Contact
        </Link>
      </div>
    </div>
  );
}
