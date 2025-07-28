import type { HandlerResponse } from "hono/types"
import type { AuthenticatedContext } from "../middleware/auth.js"
import { processImage } from "../services/imageProcessor.js"
import { indexImage, type ImageDocument } from "../services/meilisearch.js"
import { uploadImage as uploadToMinio } from "../services/minio.js"
import createImage from "../utils/images/createImage.js"

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
]
const MAX_FILE_SIZE = 10 * 1024 * 1024
const uploadController = async (
  c: AuthenticatedContext,
): Promise<HandlerResponse<number>> => {
  try {
    const formData = await c.req.formData()
    const file = formData.get("image") as File | null
    const keywords = formData.get("keywords") as string | null

    if (!file) {
      return c.json({ message: "No image file provided" }, 400)
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return c.json(
        {
          message:
            "Invalid file type. Allowed types: JPEG, PNG, GIF, WebP, SVG",
        },
        400,
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return c.json(
        {
          message: `File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        },
        400,
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const processedImage = await processImage(buffer, file.type)
    const { url } = await uploadToMinio(
      processedImage.buffer,
      `image.${processedImage.extension}`,
      processedImage.mimeType,
    )
    const keywordsArray = keywords
      ? keywords
          .split(",")
          .map((k) => k.trim())
          .filter((k) => k.length > 0)
      : []
    const imageId = await createImage({
      url,
      keywords: keywordsArray,
    })
    const imageDoc: ImageDocument = {
      id: imageId,
      url,
      keywords: keywordsArray,
      uploadedBy: c.user.id,
      uploadedAt: new Date().toISOString(),
      mimeType: processedImage.mimeType,
      size: processedImage.buffer.length,
    }

    await indexImage(imageDoc)

    return c.json(
      {
        message: "Image uploaded successfully",
        data: {
          id: imageId,
          url,
          keywords: keywordsArray,
          size: processedImage.buffer.length,
          mimeType: processedImage.mimeType,
        },
      },
      201,
    )
  } catch (error: unknown) {
    return c.json(
      {
        message: error instanceof Error ? error.message : "Upload failed",
      },
      500,
    )
  }
}

export default uploadController
