import { ilike, or } from "drizzle-orm"
import { db as dbInstance } from "../../db/index.js"
import { type Image, images } from "../../db/schema.js"
import umami from "../../umami.js"

const searchImagesInDB = async (
  query: string,
  limit: number = 20,
  db = dbInstance,
): Promise<Image[]> => {
  try {
    await umami.track("search_images_db_started", {
      query: query === "*" ? "all" : query.substring(0, 50),
      limit: limit.toString(),
    })

    const searchTerm = `%${query}%`
    const results = await db
      .select()
      .from(images)
      .where(or(ilike(images.keywords, searchTerm)))
      .orderBy(images.createdAt)
      .limit(limit)

    await umami.track("search_images_db_completed", {
      resultsCount: results.length.toString(),
      query: query === "*" ? "all" : query.substring(0, 50),
    })

    return results
  } catch (error) {
    await umami.track("search_images_db_error", {
      error: error instanceof Error ? error.message : "unknown",
    })
    throw error
  }
}

export default searchImagesInDB
