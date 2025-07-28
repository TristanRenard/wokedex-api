import { createId } from "@paralleldrive/cuid2"
import "dotenv/config"
import { Client } from "minio"

if (
  !process.env.MINIO_ENDPOINT ||
  !process.env.MINIO_ACCESS_KEY ||
  !process.env.MINIO_SECRET_KEY
) {
  throw new Error("MinIO environment variables not configured")
}

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: parseInt(process.env.MINIO_PORT ?? "9000", 10),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
})
const BUCKET_NAME = process.env.MINIO_BUCKET_NAME ?? "wokedex-images"

export const ensureBucket = async (): Promise<void> => {
  const exists = await minioClient.bucketExists(BUCKET_NAME)

  if (!exists) {
    await minioClient.makeBucket(BUCKET_NAME, "us-east-1")
  }
}

export const uploadImage = async (
  file: Buffer,
  originalName: string,
  mimeType: string,
): Promise<{ url: string; key: string }> => {
  await ensureBucket()

  const extension = originalName.split(".").pop() ?? "jpg"
  const key = `images/${createId()}.${extension}`

  await minioClient.putObject(BUCKET_NAME, key, file, undefined, {
    "Content-Type": mimeType,
    "Cache-Control": "public, max-age=31536000",
  })

  const url = `/${key}`

  return { url, key }
}

export default minioClient
