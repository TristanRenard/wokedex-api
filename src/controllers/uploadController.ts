import type { HandlerResponse } from "hono/types"
import type { AuthenticatedContext } from "../middleware/auth.js"
import { processImage } from "../services/imageProcessor.js"
import { indexImage, type ImageDocument } from "../services/meilisearch.js"
import { uploadImage as uploadToMinio } from "../services/minio.js"
import umami from "../umami.js"
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
    await umami.track("upload_controller_started", { userId: c?.user?.id || 0 })

    const formData = await c.req.formData()
    const file = formData.get("image") as File | null
    const keywords = formData.get("keywords") as string | null

    if (!file) {
      await umami.track("upload_controller_no_file_provided")

      return c.json({ message: "No image file provided" }, 400)
    }

    await umami.track("upload_controller_file_received", {
      fileType: file.type,
      fileSize: file.size.toString(),
    })

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      await umami.track("upload_controller_invalid_file_type", {
        fileType: file.type,
      })

      return c.json(
        {
          message:
            "Invalid file type. Allowed types: JPEG, PNG, GIF, WebP, SVG",
        },
        400,
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      await umami.track("upload_controller_file_too_large", {
        fileSize: file.size.toString(),
        maxSize: MAX_FILE_SIZE.toString(),
      })

      return c.json(
        {
          message: `File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        },
        400,
      )
    }

    await umami.track("upload_controller_processing_image")
    const buffer = Buffer.from(await file.arrayBuffer())
    const processedImage = await processImage(buffer, file.type)
    await umami.track("upload_controller_image_processed", {
      processedSize: processedImage.buffer.length.toString(),
      extension: processedImage.extension,
    })

    await umami.track("upload_controller_uploading_to_minio")
    const { url } = await uploadToMinio(
      processedImage.buffer,
      `image.${processedImage.extension}`,
      processedImage.mimeType,
    )
    await umami.track("upload_controller_minio_upload_success", { url })

    const keywordsArray = keywords
      ? keywords
          .split(",")
          .map((k) => k.trim())
          .filter((k) => k.length > 0)
      : []

    await umami.track("upload_controller_creating_image_record", {
      keywordsCount: keywordsArray.length.toString(),
    })

    const imageId = await createImage({
      url,
      keywords: keywordsArray,
    })
    await umami.track("upload_controller_image_record_created", { imageId })

    const imageDoc: ImageDocument = {
      id: imageId,
      url,
      keywords: keywordsArray,
      uploadedBy: c.user.id,
      uploadedAt: new Date().toISOString(),
      mimeType: processedImage.mimeType,
      size: processedImage.buffer.length,
    }

    await umami.track("upload_controller_indexing_image")
    await indexImage(imageDoc)
    await umami.track("upload_controller_image_indexed")

    await umami.track("upload_controller_success", {
      imageId,
      finalSize: processedImage.buffer.length.toString(),
    })

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
    await umami.track("upload_controller_error", {
      error: error instanceof Error ? error.message : "unknown",
    })

    return c.json(
      {
        message: error instanceof Error ? error.message : "Upload failed",
      },
      500,
    )
  }
}

export default uploadController
