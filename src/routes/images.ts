import type { Context } from "hono"
import minioClient from "../services/minio.js"

const serveImage = async (c: Context): Promise<Response> => {
  try {
    const key = c.req.param("key")

    if (!key) {
      return c.json({ message: "Image key required" }, 400)
    }

    const fullKey = `images/${key}`
    const objectStream = await minioClient.getObject(
      process.env.MINIO_BUCKET_NAME ?? "wokedex-images",
      fullKey,
    )
    const chunks: Buffer[] = []
    for await (const chunk of objectStream) {
      chunks.push(chunk)
    }

    const buffer = Buffer.concat(chunks)
    const extension = key.split(".").pop()?.toLowerCase()
    let contentType = "image/jpeg"

    switch (extension) {
      case "png":
        contentType = "image/png"

        break

      case "gif":
        contentType = "image/gif"

        break

      case "webp":
        contentType = "image/webp"

        break

      case "svg":
        contentType = "image/svg+xml"

        break

      default:
        contentType = "image/jpeg"
    }

    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000",
      },
    })
  } catch {
    return c.json({ message: "Image not found" }, 404)
  }
}

export default serveImage
