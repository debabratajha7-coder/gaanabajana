/**
 * Seeds approved, human-sounding reviews onto existing products.
 * Does NOT wipe catalog — safe to run after you already seeded products.
 *
 *   npm run seed:reviews
 */
import { connectDB } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";
import { User } from "../src/models/User";
import { Product } from "../src/models/Product";
import { Review } from "../src/models/Review";

const REVIEWERS: { name: string; email: string }[] = [
  { name: "Aarav Mehta", email: "aarav.mehta.reviews@gaanbajana.demo" },
  { name: "Priya Nair", email: "priya.nair.reviews@gaanbajana.demo" },
  { name: "Rohan Desai", email: "rohan.desai.reviews@gaanbajana.demo" },
  { name: "Sneha Iyer", email: "sneha.iyer.reviews@gaanbajana.demo" },
  { name: "Kabir Singh", email: "kabir.singh.reviews@gaanbajana.demo" },
  { name: "Ananya Rao", email: "ananya.rao.reviews@gaanbajana.demo" },
  { name: "Vikram Shah", email: "vikram.shah.reviews@gaanbajana.demo" },
  { name: "Meera Joshi", email: "meera.joshi.reviews@gaanbajana.demo" },
  { name: "Aditya Banerjee", email: "aditya.banerjee.reviews@gaanbajana.demo" },
  { name: "Fatima Khan", email: "fatima.khan.reviews@gaanbajana.demo" },
  { name: "Nikhil Patil", email: "nikhil.patil.reviews@gaanbajana.demo" },
  { name: "Ishita Gupta", email: "ishita.gupta.reviews@gaanbajana.demo" },
  { name: "Arjun Reddy", email: "arjun.reddy.reviews@gaanbajana.demo" },
  { name: "Diya Kapoor", email: "diya.kapoor.reviews@gaanbajana.demo" },
  { name: "Harsh Vora", email: "harsh.vora.reviews@gaanbajana.demo" },
  { name: "Kavya Menon", email: "kavya.menon.reviews@gaanbajana.demo" },
  { name: "Siddharth Jain", email: "sid.jain.reviews@gaanbajana.demo" },
  { name: "Riya Chatterjee", email: "riya.chatterjee.reviews@gaanbajana.demo" },
  { name: "Manav Pillai", email: "manav.pillai.reviews@gaanbajana.demo" },
  { name: "Pooja Sharma", email: "pooja.sharma.reviews@gaanbajana.demo" },
  { name: "Yash Thakur", email: "yash.thakur.reviews@gaanbajana.demo" },
  { name: "Neha Kulkarni", email: "neha.kulkarni.reviews@gaanbajana.demo" },
  { name: "Rahul Bhatia", email: "rahul.bhatia.reviews@gaanbajana.demo" },
  { name: "Tanvi Agarwal", email: "tanvi.agarwal.reviews@gaanbajana.demo" },
];

type ReviewTemplate = { rating: number; title: string; body: string };

/** Tag → review pool. Generic pool used as fallback. */
const BY_TAG: Record<string, ReviewTemplate[]> = {
  electric: [
    {
      rating: 5,
      title: "Finally upgraded from my old strat copy",
      body: "Been eyeing this for months and finally pulled the trigger during the sale. Setup out of the box was decent — I still got a local tech to lower the action a bit. Pickups are clear, not muddy at all on the neck. Played two gigs with it already, no issues. Packaging was solid, arrived in Pune in 4 days.",
    },
    {
      rating: 4,
      title: "Good guitar, frets needed a tiny polish",
      body: "Tone is what I wanted for blues / rock. Frets were a little sharp on the high end so I took it for a quick polish (₹500). After that it's buttery. Gaanbajana support answered my WhatsApp the same evening when I asked about the case. Would buy again.",
    },
    {
      rating: 5,
      title: "Sounds expensive for the price",
      body: "Was comparing this with a shop in Bangalore that wanted 8k more. Same model. Went online, got it cheaper, and the serial matched what they listed. Sustain is crazy on the bridge pickup. Only wish they threw in a better strap.",
    },
    {
      rating: 3,
      title: "Nice but the stock strings are meh",
      body: "Guitar itself is fine — neck feels great. Stock strings felt dead after a week so I swapped to Elixir and it woke up. Not a complaint against the instrument really, just FYI for beginners. Delivery was on time.",
    },
    {
      rating: 5,
      title: "My first 'real' electric",
      body: "Coming from a ₹4k starter. Night and day. Intonation held after I changed tunings for a cover band set. Neighbours hate me, I love it lol. Photos on the site were accurate.",
    },
  ],
  acoustic: [
    {
      rating: 5,
      title: "Warm tone, sits well for singing",
      body: "I record covers at home and this doesn't fight my voice in the midrange. Top is responsive without being too bright. Came with a gig bag that actually fits. Ordered Sunday, reached Hyderabad Wednesday.",
    },
    {
      rating: 4,
      title: "Solid for the money",
      body: "Action was a tad high for me out of the box but after a truss tweak it's comfortable for 2-hour practice. Finish has one tiny scratch near the bridge — honestly fine for the discount. Support was polite about it.",
    },
    {
      rating: 5,
      title: "Gifted this to my brother",
      body: "He started lessons last month. Teacher said the neck profile is good for beginners (not too chunky). Tuners hold okay. Better than the no-name ones at the local market for sure.",
    },
    {
      rating: 4,
      title: "Projection surprised me",
      body: "Small flat, thought it'd be quiet. Nope — fills the room. Bass is controlled though, not boom-y. Only 4 stars because tracking update lagged one day, but the parcel showed up fine.",
    },
  ],
  beginner: [
    {
      rating: 5,
      title: "Perfect starter kit vibes",
      body: "Bought for my 14yo. She actually practices now which is wild. Bag, strap, picks — all usable, not junk. Strings hurt her fingers the first week (normal) then she got used to it. Happy parent here.",
    },
    {
      rating: 4,
      title: "Does the job for learning chords",
      body: "Don't expect boutique tone. Expect something that stays in tune long enough to learn G-C-D. That's what I got. Value for money is honest.",
    },
    {
      rating: 5,
      title: "Wish I had this when I started",
      body: "My first guitar was a nightmare. This one's neck is smoother and the frets aren't cheese-grater sharp. Recommended it to two friends already.",
    },
  ],
  piano: [
    {
      rating: 5,
      title: "Graded hammer feels legit",
      body: "Practicing for Grade 5. Weighted keys finally make sense after years on a plastic keyboard. Pedal is quiet. Neighbours thank me for headphones mode. Heavy to move — plan for two people.",
    },
    {
      rating: 4,
      title: "Great keys, speakers are just okay",
      body: "When I plug into monitors it shines. Built-in speakers are fine for practice, a bit thin at full volume. Still keeping it. Setup help from Gaanbajana chat was useful.",
    },
    {
      rating: 5,
      title: "Worth saving up for",
      body: "Took EMI, no regrets. Action is consistent across the board. UI on the panel is simple which I prefer. Arrived with foam packing that actually protected the corners.",
    },
  ],
  keyboard: [
    {
      rating: 5,
      title: "Styles are fun for family functions",
      body: "Used the arranger styles at my cousin's housewarming — everyone thought I was a pro (I'm not). Keys are semi-weighted enough. Manual is clearer than expected.",
    },
    {
      rating: 4,
      title: "Portable and loud enough",
      body: "Carry it to tuition class twice a week. Battery option would've been nice but I use a power bank adapter trick. Speakers don't distort until you push them dumb-loud.",
    },
    {
      rating: 3,
      title: "Good but wish more Indian voices",
      body: "Western sounds are solid. Indian instrument presets are a bit thin. Still usable for practice. Packaging was neat.",
    },
  ],
  midi: [
    {
      rating: 5,
      title: "Plug and play with Ableton",
      body: "Mapped pads in like 10 mins. Keys are a little light but for MIDI that's fine. USB cable in the box was short — used my own longer one. No driver drama on Mac.",
    },
    {
      rating: 4,
      title: "Solid controller for the desk",
      body: "Knobs have a nice resistance, not flimsy. Aftertouch would've been cool at this price but eh. Does what I need for beats + soft synths.",
    },
  ],
  studio: [
    {
      rating: 5,
      title: "Clean recordings finally",
      body: "Moved off laptop mic forever. Interface + headphones combo from here cleaned up my vocals a lot. Latency is low enough for tracking. Support sent me a gain-staging tip that helped.",
    },
    {
      rating: 4,
      title: "Honest gear, no hype",
      body: "Not magic — just proper tools. Mic rejects room noise better than my old USB stick mic. Boom arm not included, buy one. Delivery to Noida was quick.",
    },
    {
      rating: 5,
      title: "Monitors opened up my mixes",
      body: "Was mixing on earbuds like an idiot. These 5\" pairs showed me the muddy low-mids I was missing. Break-in took a week. Placement matters — put them on stands.",
    },
    {
      rating: 5,
      title: "Closed backs for late nights",
      body: "Apartment life. These don't leak much so I can track after 11. Clamp is firm but not headache-inducing. Cable is detachable which I appreciate.",
    },
  ],
  drums: [
    {
      rating: 5,
      title: "Mesh heads saved my marriage",
      body: "Acoustic kit was a non-starter in our flat. This e-kit is quiet enough with headphones. Kick feels surprisingly real. Took an evening to assemble — watch a YouTube video, don't wing it.",
    },
    {
      rating: 4,
      title: "Great kit, module learning curve",
      body: "Sounds are good stock. Editing kits in the module UI is a bit fiddly. Once set, it's solid for practice and recording MIDI. Heavy boxes — delivery guys were careful though.",
    },
    {
      rating: 5,
      title: "Shell pack sounds huge",
      body: "Tuned them up over a weekend. Kick has that thump I wanted. Hardware feels sturdy. Only bought shells so budget for cymbals separately — fair warning.",
    },
  ],
  percussion: [
    {
      rating: 5,
      title: "Cajon snare is crispy",
      body: "Church worship team. Snare wires cut clean, bass tone is deep without being muddy. Finish looks nicer in person. Lightweight to carry.",
    },
    {
      rating: 4,
      title: "Nice build for the price",
      body: "Corners are smooth, no splinters. Sitting comfort is good for long sets. Wish it came with a bag but that's on me for not checking.",
    },
  ],
  ukulele: [
    {
      rating: 5,
      title: "Cute and actually in tune",
      body: "Bought on a whim. Intonation is good up the neck which cheap ukes usually mess up. Bag is soft but okay for local travel. Kids at home fight over whose turn it is.",
    },
    {
      rating: 4,
      title: "Warm mahogany sound",
      body: "Not loud, but sweet. Perfect for couch playing. Strings stretched for two days then settled. Happy with it.",
    },
  ],
  violin: [
    {
      rating: 4,
      title: "Decent student outfit",
      body: "Teacher approved the setup after a minor bridge tweak. Bow is okay for beginners. Case foam is a bit thin — don't throw it around. Fine for grade exams practice.",
    },
    {
      rating: 5,
      title: "Better than the rental we had",
      body: "My daughter sounds clearer already (or maybe I'm biased). Pegs turn smoothly. Rosin included which helped day one.",
    },
  ],
  pedal: [
    {
      rating: 5,
      title: "Nasty in the best way",
      body: "Stacked after a clean amp — exactly the rock crunch I wanted. True bypass seems fine, no tone suck I can hear. Tiny footprint on the board.",
    },
    {
      rating: 4,
      title: "Simple controls, good range",
      body: "Gain goes from mild push to full send. Battery compartment is a little stiff. Otherwise love it.",
    },
  ],
  amp: [
    {
      rating: 5,
      title: "Bedroom practice hero",
      body: "20W is plenty at home. Clean channel is usable, overdrive is more 'fun' than accurate but I dig it. Headphone jack is essential for me.",
    },
    {
      rating: 4,
      title: "Loud enough for jams",
      body: "Small band practice in a garage — holds up. Not a stadium amp, don't expect that. Build feels tough.",
    },
  ],
  bass: [
    {
      rating: 5,
      title: "Groove machine",
      body: "Neck is comfortable for long sessions. Pickups are even. Had to adjust the bridge slightly. String buzz gone after that. Happy purchase.",
    },
    {
      rating: 4,
      title: "Solid P-style tone",
      body: "Classic thump. Weight is manageable. Case not included so factor that in. Shipping was careful with the neck support.",
    },
  ],
  classical: [
    {
      rating: 5,
      title: "Nylon comfort for fingerstyle",
      body: "Coming from steel string, my fingertips thanked me. Tone is mellow for evening practice. Tuners are stable enough.",
    },
    {
      rating: 4,
      title: "Good student classical",
      body: "Teacher said action is acceptable. Finish is clean. Not a concert guitar and that's okay — priced right.",
    },
  ],
  dj: [
    {
      rating: 5,
      title: "Learned transitions on this",
      body: "Serato/compatible software setup was smoother than I feared. Jog wheels feel okay. Great for bedrooms-to-small-parties. Manual could be clearer but YouTube fills the gap.",
    },
    {
      rating: 4,
      title: "Fun starter controller",
      body: "Pads are responsive. Wish it had a standalone mode but laptop dock works. Packed well.",
    },
  ],
  pa: [
    {
      rating: 5,
      title: "Saved our society function",
      body: "Clarity for speeches + enough thump for playlist. Wheels help a lot. Set gain carefully or you'll get feedback near mics — normal PA stuff.",
    },
    {
      rating: 4,
      title: "Portable power",
      body: "Two people can lift it into a car. Sound is even outdoors at medium volume. Remote is basic but fine.",
    },
  ],
  wind: [
    {
      rating: 5,
      title: "Surprisingly airtight",
      body: "For a budget diatonic, seals are good. Tone is bright. Learning bends slowly. Pocket friendly obviously.",
    },
    {
      rating: 4,
      title: "Nice gift harmonica",
      body: "Bought two — one for me one for a friend. Both played clean. Case is plastic but protects it.",
    },
  ],
  indian: [
    {
      rating: 5,
      title: "Tabla tone is rich",
      body: "Syahi looks even. Bayan has good bass. Came with covers. Tuning hammer included. Playing for riyaaz daily now.",
    },
    {
      rating: 4,
      title: "Professional enough for home",
      body: "Not a stage set from a master maker, but way above tourist junk. Happy with the pair for the price.",
    },
  ],
  cymbal: [
    {
      rating: 5,
      title: "Crash opens nicely",
      body: "Not trashy, not too dark. Fits a rock kit. Lathe marks look clean. Hang it properly and it'll last.",
    },
    {
      rating: 4,
      title: "Good mid crash",
      body: "Cuts without washing out the whole mix. Pairing with my old hats still. Packaging had good foam rings.",
    },
  ],
  accessories: [
    {
      rating: 5,
      title: "Strings feel fresh",
      body: "Phosphor bronze sparkle without being ice-picky. Lasted about 3 weeks of daily practice before dulling — normal. Cheap enough to keep spares.",
    },
    {
      rating: 4,
      title: "Does what strings should",
      body: "No broken string in the pack. Tuned up fine. Nothing fancy, just reliable.",
    },
  ],
  synth: [
    {
      rating: 5,
      title: "Knob-twiddling heaven",
      body: "Hands-on synth finally. Filters scream in a good way. MIDI out to my DAW works. Manual is dense but patching is intuitive after a night.",
    },
    {
      rating: 4,
      title: "Compact and deep",
      body: "Small footprint on the desk. Menus aren't too nested. Wish it had more polyphony but for the style I make it's fine.",
    },
  ],
  "open-box": [
    {
      rating: 4,
      title: "Honest open-box condition",
      body: "Box had a ding, mic itself looks unused. Saved a few thousand. They listed it clearly as open box so no surprises. Would grab open-box again from here.",
    },
    {
      rating: 5,
      title: "Basically new, lower price",
      body: "Tested it the night it arrived — works perfect. Serial intact. Felt like a smart buy not a gamble.",
    },
  ],
  software: [
    {
      rating: 4,
      title: "License activated fine",
      body: "Got the code in email within an hour. Install was standard. Good starter DAW bundle if you're new. Support replied when my spam folder ate the first mail.",
    },
  ],
};

const GENERIC: ReviewTemplate[] = [
  {
    rating: 5,
    title: "Smooth buy, no drama",
    body: "Ordered late night, got dispatch update next morning. Product matched the photos. I'm not a gear nerd essay guy — it works, I like it, that's the review.",
  },
  {
    rating: 4,
    title: "Happy overall",
    body: "One star off because courier called twice for the landmark (my fault, address was vague). Gear itself is clean. Will shop here again for accessories.",
  },
  {
    rating: 5,
    title: "As described",
    body: "Tired of marketplaces where the listing lies. This was straightforward. Packed with enough bubble wrap. Tuning / setup needed the usual 10 minutes.",
  },
  {
    rating: 3,
    title: "Decent, not mind-blowing",
    body: "Does the job. If you're expecting boutique magic at this price you'll be disappointed. If you want reliable gear for practice, you're fine. Middle-of-the-road in a good way.",
  },
  {
    rating: 5,
    title: "Support actually replied",
    body: "Had a dumb question about warranty card. Someone answered with clear steps same day. That alone makes me trust the store. Product is good too obviously.",
  },
  {
    rating: 4,
    title: "Would recommend to friends",
    body: "Already told my college band. Price was fair vs local shops. Only wait was a festival weekend delay — understandable.",
  },
  {
    rating: 5,
    title: "Second order from Gaanbajana",
    body: "Bought cables last month, came back for this. Consistent packing quality. Feels like a real store not a random reseller.",
  },
  {
    rating: 4,
    title: "Looks better in person",
    body: "Photos are honest but the finish popped more under room light. Minor QC: one dust speck under the clear coat you only see if you hunt for it. Keeping it.",
  },
];

function pickPool(tags: string[]): ReviewTemplate[] {
  for (const tag of tags) {
    if (BY_TAG[tag]?.length) return [...BY_TAG[tag], ...GENERIC];
  }
  return GENERIC;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(10 + (n % 8), (n * 7) % 60, 0, 0);
  return d;
}

export async function seedProductReviews() {
  const passwordHash = await hashPassword("ReviewerDemo!23");
  const reviewerIds: string[] = [];

  for (const r of REVIEWERS) {
    const user = await User.findOneAndUpdate(
      { email: r.email },
      {
        name: r.name,
        email: r.email,
        passwordHash,
        authProvider: "local",
        role: "customer",
      },
      { upsert: true, new: true }
    );
    reviewerIds.push(String(user._id));
  }

  // Remove prior demo reviews so re-runs stay clean
  await Review.deleteMany({ user: { $in: reviewerIds } });

  const products = await Product.find({ isActive: true }).select("_id title tags").lean();
  if (!products.length) {
    console.log("No products found — run npm run seed first.");
    return { products: 0, reviews: 0 };
  }

  let reviewCount = 0;
  let reviewerCursor = 0;

  for (let pIndex = 0; pIndex < products.length; pIndex++) {
    const product = products[pIndex];
    const pool = pickPool(product.tags || []);
    // 5–8 reviews per product, vary by index
    const count = 5 + (pIndex % 4);
    const usedBodies = new Set<string>();

    for (let i = 0; i < count; i++) {
      const reviewerId = reviewerIds[reviewerCursor % reviewerIds.length];
      reviewerCursor += 1;

      let template = pool[(pIndex * 3 + i * 5) % pool.length];
      // Avoid duplicate body on same product when pool is small
      let guard = 0;
      while (usedBodies.has(template.body) && guard < pool.length) {
        template = pool[(pIndex + i + guard) % pool.length];
        guard++;
      }
      usedBodies.add(template.body);

      const createdAt = daysAgo(3 + ((pIndex * 5 + i * 11) % 120));
      await Review.create({
        product: product._id,
        user: reviewerId,
        rating: template.rating,
        title: template.title,
        body: template.body,
        approved: true,
        createdAt,
        updatedAt: createdAt,
      });
      reviewCount++;
    }

    const approved = await Review.find({ product: product._id, approved: true });
    const avg =
      approved.reduce((s, r) => s + r.rating, 0) / Math.max(approved.length, 1);
    await Product.findByIdAndUpdate(product._id, {
      ratingAvg: Math.round(avg * 100) / 100,
      ratingCount: approved.length,
    });
  }

  return { products: products.length, reviews: reviewCount };
}

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error("Set MONGODB_URI (use .env.local)");
    process.exit(1);
  }
  await connectDB();
  console.log("Seeding product reviews…");
  const result = await seedProductReviews();
  console.log(
    `Done — ${result.reviews} reviews across ${result.products} products.`
  );
  process.exit(0);
}

const isDirectRun = process.argv[1]?.includes("seed-reviews");
if (isDirectRun) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
