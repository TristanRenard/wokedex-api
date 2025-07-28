import type { Context } from "hono"
import type { HandlerResponse } from "hono/types"
import searchImagesInDB from "../utils/images/searchImagesInDB.js"

const searchImagesDBController = async (
  c: Context,
): Promise<HandlerResponse<number>> => {
  try {
    const query = c.req.query("q") ?? "*"
    const limit = parseInt(c.req.query("limit") ?? "20", 10)

    if (!query) {
      return c.json({ message: "Query parameter 'q' is required" }, 400)
    }

    if (limit > 100) {
      return c.json({ message: "Limit cannot exceed 100" }, 400)
    }

    const results = await searchImagesInDB(query, limit)

    return c.json(
      {
        message: "Search completed successfully",
        data: {
          query,
          results,
          total: results.length,
        },
      },
      200,
    )
  } catch (error: unknown) {
    return c.json(
      {
        message: error instanceof Error ? error.message : "Search failed",
      },
      500,
    )
  }
}

export default searchImagesDBController
