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

export async function uploadBuffer(buffer: Buffer, folder = "gaanbajana") {
  const c = configureCloudinary();
  return new Promise<{
    public_id: string;
    secure_url: string;
    bytes: number;
    format: string;
  }>((resolve, reject) => {
    const stream = c.uploader.upload_stream(
      { folder, resource_type: "image" },
      (err, result) => {
        if (err || !result) reject(err ?? new Error("Upload failed"));
        else
          resolve({
            public_id: result.public_id,
            secure_url: result.secure_url,
            bytes: result.bytes,
            format: result.format ?? "",
          });
      }
    );
    stream.end(buffer);
  });
}

export async function deleteMedia(publicId: string) {
  const c = configureCloudinary();
  return c.uploader.destroy(publicId);
}
