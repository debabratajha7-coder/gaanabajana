import { connectDB } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";
import { User } from "../src/models/User";
import { Category } from "../src/models/Category";
import { Brand } from "../src/models/Brand";
import { Product } from "../src/models/Product";
import { PageContent } from "../src/models/PageContent";
import { SiteSettings } from "../src/models/SiteSettings";
import { BlogPost } from "../src/models/BlogPost";
import { slugify } from "../src/lib/utils";

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

async function upsertCategory(
  name: string,
  parentId: string | null,
  sortOrder: number,
  description?: string
) {
  const slug = slugify(name);
  return Category.findOneAndUpdate(
    { slug },
    {
      name,
      slug,
      parent: parentId,
      sortOrder,
      description,
      isActive: true,
      image: PLACEHOLDER,
    },
    { upsert: true, new: true }
  );
}

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error("Set MONGODB_URI before seeding (copy .env.example to .env.local)");
    process.exit(1);
  }

  await connectDB();
  console.log("Connected. Seeding…");

  const adminEmail = process.env.ADMIN_EMAIL || "admin@gaanabajana.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe123!";
  const passwordHash = await hashPassword(adminPassword);
  await User.findOneAndUpdate(
    { email: adminEmail },
    {
      name: "Gaanabajana Admin",
      email: adminEmail,
      passwordHash,
      authProvider: "local",
      role: "admin",
      isSuperAdmin: true,
      adminPermissions: [],
      emailVerified: true,
      phoneVerified: Boolean(process.env.ADMIN_PHONE),
      phone: process.env.ADMIN_PHONE
        ? process.env.ADMIN_PHONE.replace(/\s/g, "")
        : undefined,
      isActive: true,
    },
    { upsert: true, new: true }
  );
  console.log(`Admin: ${adminEmail} / ${adminPassword}`);
  if (!process.env.ADMIN_PHONE) {
    console.log(
      "Tip: set ADMIN_PHONE=+91XXXXXXXXXX once for the initial OTP number. Change it later in Admin → Login & security."
    );
  }

  const existingSettings = await SiteSettings.findOne();
  if (!existingSettings) {
    await SiteSettings.create({
      storeName: "Gaana Bajana",
      tagline: "Musical instruments & audio gear for every stage",
      phone: "+91 9563754563, +91 7679586321",
      email: "hello@gaanbajana.com",
      whatsapp: "+919563754563",
      address: "M9VC F4C Medical More, Kawakhari, West Bengal, 734011, India",
      freeShippingThreshold: 1000,
      shippingFee: 99,
      heroHeadline: "Find the instrument that finds your sound",
      heroSubheadline:
        "Guitars, keys, drums, and studio gear — curated for Indian musicians.",
      heroCtaLabel: "Shop bestsellers",
      heroCtaHref: "/collections/guitars",
      pickupLocationName: process.env.SHIPROCKET_PICKUP_LOCATION || "Primary",
      social: {
        instagram: "https://instagram.com/gaanabajana",
        youtube: "https://youtube.com/@gaanabajana",
        facebook: "https://facebook.com/gaanabajana",
      },
    });
    console.log("Created default SiteSettings");
  } else {
    console.log("Kept existing SiteSettings (hero/images/CMS unchanged)");
  }

  const tree: { name: string; children?: string[] }[] = [
    {
      name: "Guitars",
      children: [
        "Electric Guitars",
        "Acoustic Guitars",
        "Electro Acoustic Guitars",
        "Classical Guitars",
        "Bass Guitars",
        "Guitar Accessories",
        "Guitar Pedals",
        "Guitar Amplifiers",
      ],
    },
    {
      name: "Ukuleles & Violins",
      children: ["Ukuleles", "Violins", "Mandolins", "Ukulele Accessories"],
    },
    {
      name: "Keyboards & Pianos",
      children: [
        "Portable Keyboards",
        "Digital Pianos",
        "MIDI Keyboards",
        "Synthesizers",
        "Keyboard Accessories",
      ],
    },
    {
      name: "Studio & Recording",
      children: [
        "Microphones",
        "Audio Interfaces",
        "Monitor Speakers",
        "Headphones",
        "Mixers",
        "Studio Accessories",
      ],
    },
    {
      name: "Drums & Percussion",
      children: [
        "Acoustic Drumkits",
        "Electronic Drumkits",
        "Cajons",
        "Cymbals",
        "Percussion",
        "Drum Accessories",
      ],
    },
    {
      name: "Other",
      children: ["DJ Gear", "Wind Instruments", "Live Sound", "Indian Instruments"],
    },
    { name: "Deals", children: ["Sale", "Open Box Gear"] },
  ];

  // Hide software category from the live shop if it was seeded earlier
  await Category.updateMany(
    {
      $or: [
        { slug: "software-plugins" },
        { name: /software\s*&\s*plugins/i },
        { slug: /^(daw-software|virtual-instruments|effect-plugins)$/ },
      ],
    },
    { isActive: false }
  );

  const categoryMap = new Map<string, string>();
  let sort = 0;
  for (const top of tree) {
    const parent = await upsertCategory(top.name, null, sort++);
    categoryMap.set(top.name, String(parent._id));
    for (const child of top.children || []) {
      const c = await upsertCategory(child, String(parent._id), sort++);
      categoryMap.set(child, String(c._id));
    }
  }

  const brandNames = [
    "Fender",
    "PRS",
    "Yamaha",
    "Ibanez",
    "Roland",
    "Vault",
    "Tama",
    "Cort",
    "Mackie",
    "Kala",
    "Gibson",
    "Alesis",
    "Casio",
    "Pearl",
    "Shure",
    "Focusrite",
    "Henrix",
  ];
  const brandMap = new Map<string, string>();
  for (const name of brandNames) {
    const b = await Brand.findOneAndUpdate(
      { slug: slugify(name) },
      { name, slug: slugify(name), isActive: true },
      { upsert: true, new: true }
    );
    brandMap.set(name, String(b._id));
  }

  const products: Array<{
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
      title: "Compact MIDI Controller 49 Keys",
      brand: "Roland",
      category: "MIDI Keyboards",
      price: 14990,
      mrp: 16990,
      tags: ["midi"],
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
      title: "Studio Monitor Pair 5 Inch",
      brand: "Yamaha",
      category: "Monitor Speakers",
      price: 24990,
      mrp: 28990,
      tags: ["studio"],
    },
    {
      title: "Closed-Back Studio Headphones",
      brand: "Shure",
      category: "Headphones",
      price: 8990,
      mrp: 10990,
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
      title: "4-Piece Acoustic Shell Pack",
      brand: "Pearl",
      category: "Acoustic Drumkits",
      price: 89990,
      mrp: 99990,
      tags: ["drums"],
    },
    {
      title: "Handcrafted Cajon with Snare Wires",
      brand: "Vault",
      category: "Cajons",
      price: 5990,
      mrp: 7990,
      onSale: true,
      tags: ["percussion"],
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
      title: "Student Violin Outfit 4/4",
      brand: "Yamaha",
      category: "Violins",
      price: 12990,
      mrp: 14990,
      tags: ["violin"],
    },
    {
      title: "Distortion Pedal Compact",
      brand: "Ibanez",
      category: "Guitar Pedals",
      price: 4990,
      mrp: 5990,
      tags: ["pedal"],
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
    {
      title: "Bass Guitar 4-String Precision Style",
      brand: "Fender",
      category: "Bass Guitars",
      price: 22990,
      mrp: 26990,
      tags: ["bass"],
    },
    {
      title: "Classical Nylon String Guitar",
      brand: "Yamaha",
      category: "Classical Guitars",
      price: 9990,
      mrp: 11990,
      tags: ["classical"],
    },
    {
      title: "DJ Controller 2-Deck Starter",
      brand: "Roland",
      category: "DJ Gear",
      price: 34990,
      mrp: 39990,
      onSale: true,
      tags: ["dj"],
    },
    {
      title: "Portable PA System 300W",
      brand: "Yamaha",
      category: "Live Sound",
      price: 45990,
      mrp: 52990,
      tags: ["pa"],
    },
    {
      title: "Harmonica Diatonic C Major",
      brand: "Henrix",
      category: "Wind Instruments",
      price: 1499,
      mrp: 1999,
      tags: ["wind"],
    },
    {
      title: "Tabla Pair Professional",
      brand: "Vault",
      category: "Indian Instruments",
      price: 8990,
      mrp: 11990,
      featured: true,
      tags: ["indian"],
    },
    {
      title: "DAW Starter License Bundle",
      brand: "Focusrite",
      category: "DAW Software",
      price: 9990,
      mrp: 12990,
      tags: ["software"],
    },
    {
      title: "Open Box Studio Condenser Mic",
      brand: "Shure",
      category: "Open Box Gear",
      price: 9990,
      mrp: 15990,
      openBox: true,
      onSale: true,
      tags: ["open-box"],
    },
    {
      title: "Crash Cymbal 16 Inch",
      brand: "Pearl",
      category: "Cymbals",
      price: 7990,
      mrp: 9490,
      tags: ["cymbal"],
    },
    {
      title: "Guitar String Set Acoustic Phosphor",
      brand: "Henrix",
      category: "Guitar Accessories",
      price: 499,
      mrp: 799,
      onSale: true,
      tags: ["accessories"],
    },
    {
      title: "Synthesizer Compact Analog Style",
      brand: "Roland",
      category: "Synthesizers",
      price: 54990,
      mrp: 59990,
      featured: true,
      tags: ["synth"],
    },
  ];

  const productCount = await Product.countDocuments();
  if (productCount > 0) {
    console.log(`Kept existing products (${productCount}) — catalog images unchanged`);
  } else {
    let i = 0;
    for (const p of products) {
      const brandId = brandMap.get(p.brand);
      const catId = categoryMap.get(p.category);
      const img = IMAGES[i % IMAGES.length];
      i++;
      await Product.create({
        title: p.title,
        slug: slugify(p.title),
        brand: brandId,
        categories: catId ? [catId] : [],
        description: `<p>${p.title} from Gaanabajana. Built for practice rooms, home studios, and live stages. Includes manufacturer warranty and our support desk guidance.</p><ul><li>Checked and packed by our team</li><li>Secure prepaid checkout</li><li>Pan-India shipping via partner couriers</li></ul>`,
        shortDescription: `Shop ${p.title} online at Gaanabajana with fast shipping across India.`,
        images: [img],
        variants: [
          {
            sku: `${slugify(p.title).slice(0, 12)}-std`,
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
        weightKg: p.category.includes("Drum") ? 18 : p.category.includes("Piano") ? 12 : 3.5,
        lengthCm: 100,
        breadthCm: 40,
        heightCm: 15,
        tags: p.tags || [],
        featured: Boolean(p.featured),
        onSale: Boolean(p.onSale),
        openBox: Boolean(p.openBox),
        isActive: true,
        ratingAvg: 0,
        ratingCount: 0,
      });
    }
    console.log(`Seeded ${products.length} products`);
  }

  const pages = [
    {
      key: "about",
      title: "About Gaanabajana",
      body: `<p>Gaanabajana is an online music store built for Indian musicians — from first-chord beginners to session players stocking a home studio.</p><p>We curate guitars, keyboards, drums, studio gear, and Indian instruments with transparent pricing, prepaid checkout, and courier partners you can track.</p>`,
    },
    {
      key: "shipping",
      title: "Shipping Policy",
      body: `<p>Orders are packed after payment confirmation and handed to our courier partners via Shiprocket.</p><p>Free shipping applies above the threshold shown at checkout. Delivery timelines vary by pincode and courier.</p>`,
    },
    {
      key: "returns",
      title: "Return Policy",
      body: `<p>Unused items in original packaging may be eligible for return within 7 days of delivery, subject to inspection.</p><p>Contact support with your order number to start a return request.</p>`,
    },
    {
      key: "warranty",
      title: "Warranty",
      body: `<p>Products carry manufacturer warranty as listed on the product page. Gaanabajana assists with claim documentation and service centre guidance.</p>`,
    },
    {
      key: "privacy",
      title: "Privacy Policy",
      body: `<p>We collect account, order, and delivery details to fulfil purchases and improve the store. Payment data is processed by PhonePe; we do not store card numbers.</p>`,
    },
    {
      key: "terms",
      title: "Terms of Service",
      body: `<p>By shopping at Gaanabajana you agree to accurate shipping details, prepaid payment terms, and our return windows. Prices and stock can change without notice.</p>`,
    },
    {
      key: "faqs",
      title: "Frequently Asked Questions",
      body: `<h3>Do you ship pan-India?</h3><p>Yes, via Shiprocket courier partners to serviceable pincodes.</p><h3>Which payments are accepted?</h3><p>UPI, cards, netbanking, and wallets through PhonePe Payment Gateway.</p><h3>Can I track my order?</h3><p>Yes — use Track Order or your account order history once the AWB is assigned.</p>`,
    },
    {
      key: "contact",
      title: "Contact Us",
      body: `<p>Call +91 9563754563 / +91 7679586321 or email hello@gaanbajana.com. Visit us at M9VC F4C Medical More, Kawakhari, West Bengal, 734011. We typically reply within one business day.</p>`,
    },
  ];

  for (const page of pages) {
    await PageContent.findOneAndUpdate({ key: page.key }, page, {
      upsert: true,
      new: true,
    });
  }

  const blogCount = await BlogPost.countDocuments();
  if (blogCount === 0) {
    await BlogPost.create([
      {
        title: "How to choose your first acoustic guitar",
        slug: "first-acoustic-guitar",
        excerpt: "Size, top wood, and budget tips for beginners shopping in India.",
        body: `<p>Start with a comfortable body size, a reliable truss rod, and a starter kit that includes a bag and picks. Try a few necks if you can — then buy online with a clear return window.</p>`,
        coverImage: IMAGES[0],
        published: true,
        publishedAt: new Date(),
      },
      {
        title: "Home studio starter checklist",
        slug: "home-studio-checklist",
        excerpt: "Interface, headphones, mic, and treatment — what actually matters first.",
        body: `<p>Prioritise a solid audio interface and closed-back headphones before expensive monitors. Add a condenser mic when your room is quieter.</p>`,
        coverImage: IMAGES[3],
        published: true,
        publishedAt: new Date(),
      },
    ]);
    console.log("Seeded blog posts");
  } else {
    console.log(`Kept existing blog posts (${blogCount})`);
  }

  console.log("Seed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
