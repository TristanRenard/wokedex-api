import { createId } from "@paralleldrive/cuid2"
import "dotenv/config"
import { Client } from "minio"
import umami from "../umami.js"

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
  try {
    await umami.track("minio_ensure_bucket_started", {
      bucketName: BUCKET_NAME,
    })

    const exists = await minioClient.bucketExists(BUCKET_NAME)

    if (!exists) {
      await umami.track("minio_creating_bucket", { bucketName: BUCKET_NAME })
      await minioClient.makeBucket(BUCKET_NAME, "us-east-1")
      await umami.track("minio_bucket_created", { bucketName: BUCKET_NAME })
    } else {
      await umami.track("minio_bucket_exists", { bucketName: BUCKET_NAME })
    }
  } catch (error) {
    await umami.track("minio_ensure_bucket_error", {
      error: error instanceof Error ? error.message : "unknown",
      bucketName: BUCKET_NAME,
    })
    throw error
  }
}

export const uploadImage = async (
  file: Buffer,
  originalName: string,
  mimeType: string,
): Promise<{ url: string; key: string }> => {
  try {
    await umami.track("minio_upload_started", {
      originalName,
      mimeType,
      fileSize: file.length.toString(),
    })

    await ensureBucket()

    const extension = originalName.split(".").pop() ?? "jpg"
    const key = `images/${createId()}.${extension}`

    await umami.track("minio_uploading_file", { key, extension })

    await minioClient.putObject(BUCKET_NAME, key, file, undefined, {
      "Content-Type": mimeType,
      "Cache-Control": "public, max-age=31536000",
    })

    const url = `/${key}`

    await umami.track("minio_upload_success", { key, url })

    return { url, key }
  } catch (error) {
    await umami.track("minio_upload_error", {
      error: error instanceof Error ? error.message : "unknown",
      originalName,
      mimeType,
    })
    throw error
  }
}

export default minioClient
