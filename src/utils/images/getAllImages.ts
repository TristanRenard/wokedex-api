import { db as dbInstance } from "../../db/index.js"
import { type Image, images } from "../../db/schema.js"

const getAllImages = async (db = dbInstance): Promise<Image[]> => {
  const allImages = await db.select().from(images)

  return allImages
}

export default getAllImages
