import type { Context } from "hono"
import type { HandlerResponse } from "hono/types"
import { searchImages } from "../services/meilisearch.js"
import umami from "../umami.js"

const searchImagesController = async (
  c: Context,
): Promise<HandlerResponse<number>> => {
  try {
    await umami.track("search_controller_started")

    const query = c.req.query("q") ?? "*"
    const filters = c.req.query("filters")
    const page = Number(c.req.query("page") ?? 1)
    const limit = parseInt(c.req.query("limit") ?? "20", 10)

    await umami.track("search_controller_parameters", {
      query: query === "*" ? "all" : "specific",
      hasFilters: filters ? "true" : "false",
      limit: limit.toString(),
    })

    if (!query) {
      await umami.track("search_controller_missing_query")

      return c.json({ message: "Query parameter 'q' is required" }, 400)
    }

    if (limit > 100) {
      await umami.track("search_controller_limit_exceeded", {
        limit: limit.toString(),
      })

      return c.json({ message: "Limit cannot exceed 100" }, 400)
    }

    await umami.track("search_controller_executing_search")
    const results = await searchImages(query, filters, limit, page)
    await umami.track("search_controller_search_completed", {
      resultsCount: results.totalHits.toString(),
      query: query === "*" ? "all" : query.substring(0, 50),
    })

    return c.json(
      {
        message: "Search completed successfully",
        data: {
          query,
          results: results.hits,
          total: results.totalHits,
        },
      },
      200,
    )
  } catch (error: unknown) {
    await umami.track("search_controller_error", {
      error: error instanceof Error ? error.message : "unknown",
    })

    return c.json(
      {
        message: error instanceof Error ? error.message : "Search failed",
      },
      500,
    )
  }
}

export default searchImagesController
