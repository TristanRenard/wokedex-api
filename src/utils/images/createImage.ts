import { db as dbInstance } from "../../db/index.js"
import { images, type NewImage } from "../../db/schema.js"
import umami from "../../umami.js"

const createImage = async (
  imageData: Omit<NewImage, "id" | "createdAt" | "updatedAt">,
  db = dbInstance,
): Promise<string> => {
  try {
    await umami.track("create_image_started", {
      hasUrl: imageData.url ? "true" : "false",
      keywordsCount: imageData.keywords?.length?.toString() ?? "0",
    })

    const [image] = await db
      .insert(images)
      .values(imageData)
      .returning({ id: images.id })

    await umami.track("create_image_success", {
      imageId: image.id,
    })

    return image.id
  } catch (error) {
    await umami.track("create_image_error", {
      error: error instanceof Error ? error.message : "unknown",
    })
    throw error
  }
}

export default createImage
