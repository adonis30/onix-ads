import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_KEY!,
    secretAccessKey: process.env.S3_SECRET!,
  },
});

export async function getSignedUrlForKey(key: string) {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key.replace(/^\//, ""),
  });
  return getSignedUrl(s3, command, { expiresIn: 3600 });
}

// You can add more S3 utility functions here as needed

export async function deleteFromS3(key: string) {
    // Implement S3 deletion logic here if needed
    // For example, using AWS SDK's DeleteObjectCommand
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const command = new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: key.replace(/^\//, ""),
    });
    await s3.send(command);
    return;
            
    }
