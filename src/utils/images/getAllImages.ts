import { db as dbInstance } from "../../db/index.js"
import { type Image, images } from "../../db/schema.js"
import umami from "../../umami.js"

const getAllImages = async (db = dbInstance): Promise<Image[]> => {
  try {
    await umami.track("get_all_images_started")

    const allImages = await db.select().from(images)

    await umami.track("get_all_images_completed", {
      imagesCount: allImages.length.toString(),
    })

    return allImages
  } catch (error) {
    await umami.track("get_all_images_error", {
      error: error instanceof Error ? error.message : "unknown",
    })
    throw error
  }
}

export default getAllImages
