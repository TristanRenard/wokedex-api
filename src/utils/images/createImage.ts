import { db as dbInstance } from "../../db/index.js"
import { images, type NewImage } from "../../db/schema.js"

const createImage = async (
  imageData: Omit<NewImage, "id" | "createdAt" | "updatedAt">,
  db = dbInstance,
): Promise<string> => {
  const [image] = await db
    .insert(images)
    .values(imageData)
    .returning({ id: images.id })

  return image.id
}

export default createImage
