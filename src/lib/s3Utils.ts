// src/lib/s3Utils.ts
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_KEY!,
    secretAccessKey: process.env.S3_SECRET!,
  },
});

/**
 * Upload a file to S3
 * @param buffer File content
 * @param key S3 key
 * @param mimeType File MIME type
 * @param assetType Optional asset type: PDF, IMAGE, VIDEO
 */
export async function uploadToS3(
  buffer: Buffer,
  key: string,
  mimeType: string,
  assetType?: "PDF" | "IMAGE" | "VIDEO"
) {
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ContentDisposition: assetType === "PDF" ? "inline" : undefined, // PDFs will preview
    })
  );
  return key;
}

/**
 * Generate a signed URL for accessing an S3 object
 * @param key S3 key
 * @param assetType Optional asset type
 */
export async function getSignedUrlForKey(
  key: string,
  assetType?: "PDF" | "IMAGE" | "VIDEO"
) {
  if (!key) return null;

  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key.replace(/^\//, ""),
    ResponseContentDisposition: assetType === "PDF" ? "inline" : undefined,
    ResponseContentType:
      assetType === "PDF"
        ? "application/pdf"
        : assetType === "IMAGE"
        ? "image/jpeg"
        : assetType === "VIDEO"
        ? "video/mp4"
        : undefined,
  });

  return getSignedUrl(s3, command, { expiresIn: 3600 });
}

/**
 * Delete a file from S3
 * @param key S3 key
 */
export async function deleteFromS3(key: string) {
  if (!key) return;

  const command = new DeleteObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key.replace(/^\//, ""),
  });

  await s3.send(command);
}

/**
 * Get metadata of an S3 object
 * @param key S3 key
 */
export async function getS3Metadata(key: string) {
  if (!key) return null;

  const command = new HeadObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key.replace(/^\//, ""),
  });

  const metadata = await s3.send(command);
  return {
    contentType: metadata.ContentType,
    contentDisposition: metadata.ContentDisposition,
    contentLength: metadata.ContentLength,
    lastModified: metadata.LastModified,
  };
}
