import type { Context } from "hono"
import { searchCards } from "../services/meilisearch.js"
import umami from "../umami.js"

export const searchCardsController = async (c: Context): Promise<Response> => {
  try {
    await umami.track("search_cards_controller_started")

    const query = c.req.query("q") ?? "*"
    const filters = c.req.query("filters")
    const limit = parseInt(c.req.query("limit") ?? "20", 10)

    if (limit > 100) {
      await umami.track("search_cards_controller_error", {
        error: "limit_too_high",
      })

      return c.json({ error: "Limit cannot exceed 100" }, 400)
    }

    const cards = await searchCards(query, filters, limit)

    await umami.track("search_cards_controller_completed", {
      query: query === "*" ? "all" : query.substring(0, 50),
      resultsCount: cards.length.toString(),
      hasFilters: filters ? "true" : "false",
    })

    return c.json(cards, 200)
  } catch (error) {
    await umami.track("search_cards_controller_error", {
      error: error instanceof Error ? error.message : "unknown",
    })

    return c.json({ error: "Internal server error" }, 500)
  }
}
