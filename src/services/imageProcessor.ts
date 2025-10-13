import sharp from "sharp"
import umami from "../umami.js"

const MAX_WIDTH = 1920
const MAX_HEIGHT = 1080
const QUALITY = 85

export interface ProcessedImage {
  buffer: Buffer
  mimeType: string
  extension: string
}

export const processImage = async (
  buffer: Buffer,
  originalMimeType: string,
): Promise<ProcessedImage> => {
  try {
    await umami.track("image_processor_started", {
      originalMimeType,
      originalSize: buffer.length.toString(),
    })

    // Pour les GIFs, on les retourne tels quels sans traitement Sharp
    // car Sharp détruit l'animation lors du traitement
    if (originalMimeType === "image/gif") {
      await umami.track("image_processor_gif_passthrough", {
        size: buffer.length.toString(),
      })

      return {
        buffer,
        mimeType: "image/gif",
        extension: "gif",
      }
    }

    // Pour les SVG, on les retourne aussi tels quels
    if (originalMimeType === "image/svg+xml") {
      await umami.track("image_processor_svg_passthrough", {
        size: buffer.length.toString(),
      })

      return {
        buffer,
        mimeType: "image/svg+xml",
        extension: "svg",
      }
    }

    let sharpInstance = sharp(buffer)

    await umami.track("image_processor_reading_metadata")
    const metadata = await sharpInstance.metadata()

    if (!metadata.width || !metadata.height) {
      await umami.track("image_processor_invalid_metadata")
      throw new Error("Invalid image metadata")
    }

    const { width, height } = metadata

    await umami.track("image_processor_metadata_loaded", {
      originalWidth: width.toString(),
      originalHeight: height.toString(),
    })

    if (width > MAX_WIDTH || height > MAX_HEIGHT) {
      await umami.track("image_processor_resizing_needed", {
        originalWidth: width.toString(),
        originalHeight: height.toString(),
        maxWidth: MAX_WIDTH.toString(),
        maxHeight: MAX_HEIGHT.toString(),
      })

      const aspectRatio = width / height

      if (width > height) {
        sharpInstance = sharpInstance.resize(
          MAX_WIDTH,
          Math.round(MAX_WIDTH / aspectRatio),
        )
      } else {
        sharpInstance = sharpInstance.resize(
          Math.round(MAX_HEIGHT * aspectRatio),
          MAX_HEIGHT,
        )
      }
    } else {
      await umami.track("image_processor_no_resize_needed")
    }

    let processedBuffer: Buffer = buffer
    let mimeType: string = originalMimeType
    let extension: string = ""

    await umami.track("image_processor_processing_format", {
      format: originalMimeType,
    })

    switch (originalMimeType) {
      case "image/jpeg":
        processedBuffer = await sharpInstance
          .jpeg({ quality: QUALITY, progressive: true })
          .toBuffer()
        mimeType = "image/jpeg"
        extension = "jpeg"

        break

      case "image/jpg":
        processedBuffer = await sharpInstance
          .jpeg({ quality: QUALITY, progressive: true })
          .toBuffer()
        mimeType = "image/jpeg"
        extension = "jpg"

        break

      case "image/png":
        processedBuffer = await sharpInstance
          .png({ quality: QUALITY, progressive: true })
          .toBuffer()
        mimeType = "image/png"
        extension = "png"

        break

      case "image/webp":
        processedBuffer = await sharpInstance
          .webp({ quality: QUALITY })
          .toBuffer()
        mimeType = "image/webp"
        extension = "webp"

        break

      default:
        processedBuffer = await sharpInstance
          .jpeg({ quality: QUALITY, progressive: true })
          .toBuffer()
        mimeType = "image/jpeg"
        extension = "jpg"
    }

    await umami.track("image_processor_completed", {
      finalMimeType: mimeType,
      finalSize: processedBuffer.length.toString(),
      extension,
      compressionRatio: (
        ((buffer.length - processedBuffer.length) / buffer.length) *
        100
      ).toFixed(2),
    })

    return {
      buffer: processedBuffer,
      mimeType,
      extension,
    }
  } catch (error) {
    await umami.track("image_processor_error", {
      error: error instanceof Error ? error.message : "unknown",
      originalMimeType,
    })
    throw error
  }
}
