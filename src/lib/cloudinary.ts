import { v2 as cloudinary } from "cloudinary";

export function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
}

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

type UploadResult = {
  public_id: string;
  secure_url: string;
  bytes: number;
  format: string;
};

function toResult(result: {
  public_id?: string;
  secure_url?: string;
  bytes?: number;
  format?: string;
}): UploadResult {
  if (!result.public_id || !result.secure_url) {
    throw new Error("Upload failed");
  }
  return {
    public_id: result.public_id,
    secure_url: result.secure_url,
    bytes: result.bytes ?? 0,
    format: result.format ?? "",
  };
}

/**
 * AI once at upload: upscale tiny sources + remove background, then re-save
 * so the stored asset is permanent PNG (no live AI on every page view).
 */
async function bakeProductAsset(publicId: string): Promise<UploadResult> {
  const c = configureCloudinary();
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  // Delivery URL runs AI once; uploading that URL back stores the result.
  const bakeUrl = `https://res.cloudinary.com/${cloud}/image/upload/if_iw_lt_700/e_upscale/if_end/e_background_removal/e_trim/f_png/${publicId}`;
  const baked = await c.uploader.upload(bakeUrl, {
    public_id: publicId,
    overwrite: true,
    invalidate: true,
    resource_type: "image",
  });
  return toResult(baked);
}

export async function uploadBuffer(
  buffer: Buffer,
  folder = "gaanabajana",
  opts?: { prepareProduct?: boolean }
) {
  const c = configureCloudinary();
  const uploaded = await new Promise<UploadResult>((resolve, reject) => {
    const stream = c.uploader.upload_stream(
      { folder, resource_type: "image" },
      (err, result) => {
        if (err || !result) reject(err ?? new Error("Upload failed"));
        else resolve(toResult(result));
      }
    );
    stream.end(buffer);
  });

  if (!opts?.prepareProduct) return uploaded;

  try {
    return await bakeProductAsset(uploaded.public_id);
  } catch (err) {
    // Don't lose the upload if AI bake fails (quota / addon). Return original.
    console.error("[cloudinary] product bake failed, keeping original:", err);
    return uploaded;
  }
}

/** Re-bake an existing Cloudinary public_id (one-time migration helper). */
export async function bakeExistingProductImage(publicId: string) {
  return bakeProductAsset(publicId);
}

export async function deleteMedia(publicId: string) {
  const c = configureCloudinary();
  return c.uploader.destroy(publicId);
}
