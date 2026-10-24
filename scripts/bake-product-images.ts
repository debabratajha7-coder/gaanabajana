/**
 * One-time: bake AI cutout + upscale into stored Cloudinary assets, then
 * rewrite MongoDB URLs. Run only against the NEW cloud after photos exist there.
 *
 *   npx tsx scripts/bake-product-images.ts --dry-run
 *   npx tsx scripts/bake-product-images.ts --limit 5
 *   npx tsx scripts/bake-product-images.ts
 */
import "dotenv/config";
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import mongoose from "mongoose";
import {
  bakeExistingProductImage,
  configureCloudinary,
  isCloudinaryConfigured,
} from "../src/lib/cloudinary";

const OLD_CLOUD = "hjudwj5u";

function parseArgs() {
  const argv = process.argv.slice(2);
  return {
    dryRun: argv.includes("--dry-run"),
    limit: Number(argv.find((a) => a.startsWith("--limit="))?.split("=")[1] || 0) || 0,
  };
}

function publicIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("cloudinary.com")) return null;
    const marker = "/upload/";
    const idx = u.pathname.indexOf(marker);
    if (idx === -1) return null;
    const rest = u.pathname.slice(idx + marker.length);
    // strip transforms + version
    const parts = rest.split("/").filter(Boolean);
    let i = 0;
    while (i < parts.length) {
      const p = parts[i];
      if (/^v\d+$/.test(p)) {
        i++;
        break;
      }
      if (/[_:,]/.test(p) || p.startsWith("if_") || p === "if_end") {
        i++;
        continue;
      }
      break;
    }
    const id = parts.slice(i).join("/");
    return id.replace(/\.[a-z0-9]+$/i, "") || null;
  } catch {
    return null;
  }
}

function cloudFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("cloudinary.com")) return null;
    // res.cloudinary.com/<cloud>/image/upload/...
    const segs = u.pathname.split("/").filter(Boolean);
    return segs[0] || null;
  } catch {
    return null;
  }
}

async function main() {
  const { dryRun, limit } = parseArgs();
  if (!isCloudinaryConfigured()) {
    throw new Error("CLOUDINARY_* env missing");
  }
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI missing");

  configureCloudinary();
  const cloud = process.env.CLOUDINARY_CLOUD_NAME!;
  console.log(`Cloud: ${cloud}  dryRun=${dryRun}  limit=${limit || "all"}`);

  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db!;

  type Ref = { collection: string; id: string; field: string; url: string };
  const refs: Ref[] = [];

  const push = (
    collection: string,
    id: string,
    field: string,
    url: unknown
  ) => {
    if (typeof url === "string" && url.includes("res.cloudinary.com")) {
      refs.push({ collection, id, field, url });
    }
  };

  for (const p of await db
    .collection("products")
    .find({})
    .project({ images: 1, colorOptions: 1 })
    .toArray()) {
    const id = String(p._id);
    (p.images || []).forEach((u: string, i: number) =>
      push("products", id, `images.${i}`, u)
    );
    (p.colorOptions || []).forEach(
      (
        c: { images?: string[] },
        ci: number
      ) => {
        (c.images || []).forEach((u, ii) =>
          push("products", id, `colorOptions.${ci}.images.${ii}`, u)
        );
      }
    );
  }

  for (const c of await db
    .collection("categories")
    .find({})
    .project({ image: 1 })
    .toArray()) {
    push("categories", String(c._id), "image", c.image);
  }

  for (const b of await db
    .collection("brands")
    .find({})
    .project({ logo: 1 })
    .toArray()) {
    push("brands", String(b._id), "logo", b.logo);
  }

  for (const m of await db
    .collection("media")
    .find({})
    .project({ url: 1, publicId: 1 })
    .toArray()) {
    push("media", String(m._id), "url", m.url);
  }

  // unique by public id (on current cloud only)
  const byPublicId = new Map<string, Ref[]>();
  let skippedOld = 0;
  for (const ref of refs) {
    const cld = cloudFromUrl(ref.url);
    if (cld === OLD_CLOUD) {
      skippedOld++;
      continue;
    }
    if (cld && cld !== cloud) continue;
    const pid = publicIdFromUrl(ref.url);
    if (!pid) continue;
    const list = byPublicId.get(pid) || [];
    list.push(ref);
    byPublicId.set(pid, list);
  }

  console.log(
    `Refs: ${refs.length}  unique bakeable: ${byPublicId.size}  skipped old-cloud: ${skippedOld}`
  );

  let done = 0;
  for (const [publicId, list] of byPublicId) {
    if (limit && done >= limit) break;
    done++;
    console.log(`[${done}/${limit || byPublicId.size}] bake ${publicId}`);
    if (dryRun) continue;

    try {
      const baked = await bakeExistingProductImage(publicId);
      for (const ref of list) {
        if (ref.collection === "media") {
          await db.collection("media").updateOne(
            { _id: new mongoose.Types.ObjectId(ref.id) },
            {
              $set: {
                url: baked.secure_url,
                publicId: baked.public_id,
                bytes: baked.bytes,
                format: baked.format,
              },
            }
          );
        } else if (ref.field === "image" || ref.field === "logo") {
          await db.collection(ref.collection).updateOne(
            { _id: new mongoose.Types.ObjectId(ref.id) },
            { $set: { [ref.field]: baked.secure_url } }
          );
        } else if (ref.field.startsWith("images.")) {
          const idx = Number(ref.field.split(".")[1]);
          const doc = await db
            .collection("products")
            .findOne({ _id: new mongoose.Types.ObjectId(ref.id) });
          if (!doc?.images) continue;
          const images = [...doc.images];
          images[idx] = baked.secure_url;
          await db.collection("products").updateOne(
            { _id: new mongoose.Types.ObjectId(ref.id) },
            { $set: { images } }
          );
        } else if (ref.field.startsWith("colorOptions.")) {
          const [, ci, , ii] = ref.field.split(".");
          const doc = await db
            .collection("products")
            .findOne({ _id: new mongoose.Types.ObjectId(ref.id) });
          if (!doc?.colorOptions?.[Number(ci)]) continue;
          const colorOptions = structuredClone(doc.colorOptions);
          colorOptions[Number(ci)].images[Number(ii)] = baked.secure_url;
          await db.collection("products").updateOne(
            { _id: new mongoose.Types.ObjectId(ref.id) },
            { $set: { colorOptions } }
          );
        }
      }
      console.log(`  -> ${baked.secure_url}`);
    } catch (e) {
      console.error(`  FAIL ${publicId}:`, e instanceof Error ? e.message : e);
    }
  }

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
