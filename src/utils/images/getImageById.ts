import { eq } from "drizzle-orm"
import { db as dbInstance } from "../../db/index.js"
import { type Image, images } from "../../db/schema.js"

const getImageById = async (
  id: string,
  db = dbInstance,
): Promise<Image | undefined> => {
  const [image] = await db.select().from(images).where(eq(images.id, id))

  return image
}

export default getImageById
