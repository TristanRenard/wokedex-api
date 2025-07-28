import sharp from "sharp"

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
  let sharpInstance = sharp(buffer)

  const metadata = await sharpInstance.metadata()

  if (!metadata.width || !metadata.height) {
    throw new Error("Invalid image metadata")
  }

  const { width, height } = metadata

  if (width > MAX_WIDTH || height > MAX_HEIGHT) {
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
  }

  let processedBuffer: Buffer = buffer
  let mimeType: string = originalMimeType
  let extension: string = ""

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

    case "image/gif":
      processedBuffer = await sharpInstance.gif().toBuffer()
      mimeType = "image/gif"
      extension = "gif"

      break

    case "image/svg+xml":
      processedBuffer = buffer
      mimeType = "image/svg+xml"
      extension = "svg"

      break

    default:
      processedBuffer = await sharpInstance
        .jpeg({ quality: QUALITY, progressive: true })
        .toBuffer()
      mimeType = "image/jpeg"
      extension = "jpg"
  }

  return {
    buffer: processedBuffer,
    mimeType,
    extension,
  }
}
