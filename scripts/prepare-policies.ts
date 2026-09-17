/**
 * Upserts PhonePe-ready policy/contact pages and restocks the catalog
 * if the shop looks empty — without wiping SiteSettings.
 *
 *   npm run prepare:policies
 */
import { connectDB } from "../src/lib/db";
import { PageContent } from "../src/models/PageContent";
import { Product } from "../src/models/Product";
import { Brand } from "../src/models/Brand";
import { Category } from "../src/models/Category";
import { slugify } from "../src/lib/utils";

const CONTACT = {
  phones: "+91 9563754563 / +91 7679586321",
  email: "hello@gaanbajana.com",
  address: "M9VC F4C Medical More, Kawakhari, West Bengal, 734011, India",
};

const pages = [
  {
    key: "about",
    title: "About Gaanabajana",
    body: `<p><strong>Gaanabajana</strong> is an online store for musical instruments and audio gear in India. We sell guitars, keyboards, drums, studio equipment, and related accessories for beginners, students, and performing musicians.</p>
<p>Orders are placed online with prepaid checkout. After payment confirmation we pack and ship through courier partners. You can track deliveries from your account or the Track Order page.</p>
<p><strong>Registered / business address:</strong> ${CONTACT.address}</p>
<p><strong>Contact:</strong> ${CONTACT.phones} · ${CONTACT.email}</p>`,
  },
  {
    key: "shipping",
    title: "Shipping Policy",
    body: `<p>This Shipping Policy applies to orders placed on <strong>Gaanabajana</strong> (${CONTACT.email}).</p>
<h3>Processing</h3>
<p>Orders are processed after successful prepaid payment. We aim to hand parcels to our courier partners within 1–3 business days, subject to stock and location.</p>
<h3>Delivery</h3>
<p>We ship across serviceable pincodes in India via courier partners. Estimated delivery times depend on your pincode and the courier’s network. Tracking details (AWB) are shared when available via Account → Orders or Track Order.</p>
<h3>Shipping charges</h3>
<p>Shipping fees (or free-shipping thresholds) are shown at checkout before you pay. Remote or non-serviceable areas may not be fulfilled; we will contact you if we cannot ship.</p>
<h3>Wrong / incomplete address</h3>
<p>Please ensure your shipping name, phone, and address are correct. Delays or failed deliveries caused by incorrect details may require re-shipment at additional cost.</p>
<p>Questions: ${CONTACT.phones} · ${CONTACT.email}</p>`,
  },
  {
    key: "returns",
    title: "Refund & Cancellation Policy",
    body: `<p>This Refund &amp; Cancellation Policy applies to purchases from <strong>Gaanabajana</strong>.</p>
<h3>Cancellations</h3>
<p>You may request cancellation before the order is shipped. Once handed to the courier, cancellation may not be possible; you can refuse delivery or request a return after receipt as below.</p>
<h3>Returns</h3>
<p>Unused products in original packaging may be eligible for return within <strong>7 days of delivery</strong>, subject to inspection and stock policy. Opened consumables, custom/special orders, and items damaged by misuse may not qualify.</p>
<h3>Refunds</h3>
<p>Approved refunds are issued to the original payment method (via our payment partner PhonePe) after we receive and inspect the returned item. Processing typically takes 5–10 business days after approval, depending on your bank/UPI provider.</p>
<h3>How to request</h3>
<p>Email ${CONTACT.email} or call ${CONTACT.phones} with your order number, reason, and photos if the item arrived damaged.</p>
<p><strong>Business address for returns correspondence:</strong> ${CONTACT.address}</p>`,
  },
  {
    key: "warranty",
    title: "Warranty",
    body: `<p>Most products sold by Gaanabajana carry the <strong>manufacturer’s warranty</strong> as stated on the product page or included documentation.</p>
<p>Warranty covers manufacturing defects under the brand’s terms. It does not cover physical damage, misuse, unauthorized repairs, or normal wear.</p>
<p>We help with claim documentation and service-centre guidance. Contact ${CONTACT.email} or ${CONTACT.phones} with your order number and product serial (if any).</p>`,
  },
  {
    key: "privacy",
    title: "Privacy Policy",
    body: `<p>This Privacy Policy describes how <strong>Gaanabajana</strong> collects and uses information when you use our website and place orders.</p>
<h3>Information we collect</h3>
<ul>
<li>Account details (name, email, phone) when you register or check out</li>
<li>Shipping and billing addresses for order fulfilment</li>
<li>Order history and support messages</li>
<li>Basic device/browser data for security and site performance</li>
</ul>
<h3>Payments</h3>
<p>Card, UPI, and netbanking payments are processed by <strong>PhonePe</strong>. We do not store your full card number or UPI PIN on our servers.</p>
<h3>How we use data</h3>
<p>We use your information to process orders, arrange shipping, provide support, prevent fraud, and improve the store. We do not sell your personal data.</p>
<h3>Sharing</h3>
<p>We share data only with service providers needed to run the business (payment gateway, courier/shipping partners, email delivery) under appropriate safeguards.</p>
<h3>Contact</h3>
<p>For privacy requests: ${CONTACT.email} · ${CONTACT.phones}<br/>Address: ${CONTACT.address}</p>`,
  },
  {
    key: "terms",
    title: "Terms & Conditions",
    body: `<p>Welcome to <strong>Gaanabajana</strong>. By accessing our website or placing an order you agree to these Terms &amp; Conditions.</p>
<h3>Store &amp; products</h3>
<p>We sell musical instruments, audio equipment, and related accessories online in India. Product descriptions and images are provided for accuracy in good faith; minor variations may occur. Prices and stock can change without prior notice until payment is completed.</p>
<h3>Accounts</h3>
<p>You are responsible for keeping login credentials secure and for providing accurate delivery information.</p>
<h3>Orders &amp; payment</h3>
<p>Orders are confirmed after successful prepaid payment through our payment partner (PhonePe). We reserve the right to cancel orders in case of pricing errors, stock unavailability, suspected fraud, or non-serviceable addresses, with a refund where payment was captured.</p>
<h3>Shipping &amp; returns</h3>
<p>Delivery and returns are governed by our Shipping Policy and Refund &amp; Cancellation Policy.</p>
<h3>Limitation</h3>
<p>To the extent permitted by law, Gaanabajana is not liable for indirect or consequential losses arising from use of the site or delayed courier events outside our reasonable control.</p>
<h3>Contact</h3>
<p>${CONTACT.email} · ${CONTACT.phones}<br/>${CONTACT.address}</p>`,
  },
  {
    key: "faqs",
    title: "Frequently Asked Questions",
    body: `<h3>What do you sell?</h3><p>Musical instruments and audio gear — guitars, keys, drums, studio equipment, and accessories — for customers in India.</p>
<h3>How do I pay?</h3><p>Prepaid checkout via PhonePe: UPI, cards, netbanking, and supported wallets.</p>
<h3>Do you ship pan-India?</h3><p>Yes, to serviceable pincodes through courier partners. Shipping cost or free-shipping threshold is shown at checkout.</p>
<h3>How do I track my order?</h3><p>Use Track Order or Account → Orders once tracking is available.</p>
<h3>How do I contact you?</h3><p>${CONTACT.phones} · ${CONTACT.email}<br/>${CONTACT.address}</p>`,
  },
  {
    key: "contact",
    title: "Contact Us",
    body: `<p>We are happy to help with product questions, orders, and returns.</p>
<p><strong>Phone:</strong> ${CONTACT.phones}<br/>
<strong>Email:</strong> ${CONTACT.email}<br/>
<strong>Address:</strong> ${CONTACT.address}</p>
<p>Business hours: Monday–Saturday, 10:00 AM – 7:00 PM IST. We typically reply within one business day.</p>`,
  },
];

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1510915361894-db8b50135cf0?auto=format&fit=crop&w=800&q=80";
const IMAGES = [
  "https://images.unsplash.com/photo-1510915361894-db8b50135cf0?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1556449895-a33c06b37117?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1519892306165-0729e2e0d1a8?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=800&q=80",
];

const catalogProducts: Array<{
  title: string;
  brand: string;
  category: string;
  price: number;
  mrp: number;
  featured?: boolean;
  onSale?: boolean;
  openBox?: boolean;
  tags?: string[];
}> = [
  {
    title: "StageStrat Electric Guitar — Maple Fingerboard",
    brand: "Fender",
    category: "Electric Guitars",
    price: 45990,
    mrp: 52990,
    featured: true,
    onSale: true,
    tags: ["electric", "bestseller"],
  },
  {
    title: "Auditorium Electro Acoustic with Gig Bag",
    brand: "Yamaha",
    category: "Electro Acoustic Guitars",
    price: 28990,
    mrp: 34990,
    featured: true,
    onSale: true,
    tags: ["acoustic", "bestseller"],
  },
  {
    title: "Cutaway Acoustic Starter Kit 38 Inch",
    brand: "Henrix",
    category: "Acoustic Guitars",
    price: 3499,
    mrp: 5499,
    featured: true,
    onSale: true,
    tags: ["beginner", "bestseller"],
  },
  {
    title: "Premium Solid Spruce Acoustic 41 Inch",
    brand: "Vault",
    category: "Acoustic Guitars",
    price: 8299,
    mrp: 14999,
    onSale: true,
    tags: ["acoustic"],
  },
  {
    title: "RG Series Double Cutaway Electric",
    brand: "Ibanez",
    category: "Electric Guitars",
    price: 26125,
    mrp: 27500,
    featured: true,
    tags: ["electric"],
  },
  {
    title: "88-Key Graded Hammer Digital Piano",
    brand: "Casio",
    category: "Digital Pianos",
    price: 66990,
    mrp: 74990,
    featured: true,
    onSale: true,
    tags: ["piano", "bestseller"],
  },
  {
    title: "Portable Arranger Keyboard 61 Keys",
    brand: "Yamaha",
    category: "Portable Keyboards",
    price: 18990,
    mrp: 22990,
    onSale: true,
    tags: ["keyboard"],
  },
  {
    title: "USB Condenser Microphone for Podcasts",
    brand: "Shure",
    category: "Microphones",
    price: 12990,
    mrp: 15990,
    featured: true,
    tags: ["studio", "bestseller"],
  },
  {
    title: "2-In 2-Out USB Audio Interface",
    brand: "Focusrite",
    category: "Audio Interfaces",
    price: 15990,
    mrp: 18990,
    featured: true,
    onSale: true,
    tags: ["studio"],
  },
  {
    title: "Mesh Head Electronic Drum Kit 8 Piece",
    brand: "Roland",
    category: "Electronic Drumkits",
    price: 71990,
    mrp: 81990,
    featured: true,
    onSale: true,
    tags: ["drums", "bestseller"],
  },
  {
    title: "Concert Ukulele Mahogany with Bag",
    brand: "Yamaha",
    category: "Ukuleles",
    price: 6990,
    mrp: 8490,
    featured: true,
    tags: ["ukulele"],
  },
  {
    title: "Practice Combo Amp 20W",
    brand: "Fender",
    category: "Guitar Amplifiers",
    price: 11990,
    mrp: 13990,
    onSale: true,
    tags: ["amp"],
  },
];

async function ensureCatalog() {
  const count = await Product.countDocuments({ isActive: true });
  if (count >= 8) {
    console.log(`Catalog OK (${count} active products).`);
    return;
  }

  console.log(`Only ${count} products — restocking showcase catalog…`);
  const brandNames = [
    "Fender",
    "Yamaha",
    "Ibanez",
    "Roland",
    "Casio",
    "Pearl",
    "Shure",
    "Focusrite",
    "Vault",
    "Henrix",
  ];
  const brandMap = new Map<string, string>();
  for (const name of brandNames) {
    const b = await Brand.findOneAndUpdate(
      { slug: slugify(name) },
      { name, slug: slugify(name), isActive: true },
      { upsert: true, returnDocument: "after" }
    );
    brandMap.set(name, String(b!._id));
  }

  const catMap = new Map<string, string>();
  for (const name of [
    "Electric Guitars",
    "Acoustic Guitars",
    "Electro Acoustic Guitars",
    "Digital Pianos",
    "Portable Keyboards",
    "Microphones",
    "Audio Interfaces",
    "Electronic Drumkits",
    "Ukuleles",
    "Guitar Amplifiers",
  ]) {
    const c = await Category.findOneAndUpdate(
      { slug: slugify(name) },
      {
        name,
        slug: slugify(name),
        isActive: true,
        image: PLACEHOLDER,
        sortOrder: 0,
      },
      { upsert: true, returnDocument: "after" }
    );
    catMap.set(name, String(c!._id));
  }

  let i = 0;
  for (const p of catalogProducts) {
    const slug = slugify(p.title);
    const img = IMAGES[i % IMAGES.length];
    i++;
    const brandId = brandMap.get(p.brand);
    const catId = catMap.get(p.category);
    await Product.findOneAndUpdate(
      { slug },
      {
        title: p.title,
        slug,
        brand: brandId,
        categories: catId ? [catId] : [],
        description: `<p>${p.title} from Gaanabajana. Built for practice rooms, home studios, and live stages. Includes manufacturer warranty support guidance.</p><ul><li>Checked and packed by our team</li><li>Secure prepaid checkout</li><li>Pan-India shipping via courier partners</li></ul>`,
        shortDescription: `Shop ${p.title} online at Gaanabajana with clear pricing and prepaid checkout.`,
        images: [img],
        variants: [
          {
            sku: `${slug.slice(0, 12)}-std`,
            name: "Standard",
            color: "Natural",
            price: p.price,
            mrp: p.mrp,
            stock: 25,
            image: img,
          },
        ],
        price: p.price,
        mrp: p.mrp,
        stock: 25,
        weightKg: 3.5,
        lengthCm: 100,
        breadthCm: 40,
        heightCm: 15,
        tags: p.tags || [],
        featured: Boolean(p.featured),
        onSale: Boolean(p.onSale),
        openBox: Boolean(p.openBox),
        isActive: true,
      },
      { upsert: true }
    );
  }
  console.log(`Upserted ${catalogProducts.length} products.`);
}

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error("Set MONGODB_URI in .env.local");
    process.exit(1);
  }
  await connectDB();
  console.log("Upserting compliance pages…");
  for (const page of pages) {
    await PageContent.findOneAndUpdate({ key: page.key }, page, {
      upsert: true,
      returnDocument: "after",
    });
  }
  await ensureCatalog();
  console.log("Done — site is ready for PhonePe review.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
