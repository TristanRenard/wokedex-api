import { ilike, or } from "drizzle-orm"
import { db as dbInstance } from "../../db/index.js"
import { type Image, images } from "../../db/schema.js"

const searchImagesInDB = async (
  query: string,
  limit: number = 20,
  db = dbInstance,
): Promise<Image[]> => {
  const searchTerm = `%${query}%`
  const results = await db
    .select()
    .from(images)
    .where(or(ilike(images.keywords, searchTerm)))
    .orderBy(images.createdAt)
    .limit(limit)

  return results
}

export default searchImagesInDB
