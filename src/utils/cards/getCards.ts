import { and, sql } from "drizzle-orm"
import { db } from "../../db/index.js"
import { cards, type Card } from "../../db/schema.js"
import umami from "../../umami.js"

interface GetCardsParams {
  ownerId?: string
  status?: string
  limit?: number
  offset?: number
}

const getCards = async ({
  ownerId,
  status,
  limit = 50,
  offset = 0,
}: GetCardsParams = {}): Promise<Card[]> => {
  try {
    await umami.track("get_cards_started", {
      hasOwnerId: ownerId ? "true" : "false",
      hasStatus: status ? "true" : "false",
      limit: limit.toString(),
      offset: offset.toString(),
    })

    const conditions = []

    if (ownerId) {
      conditions.push(sql`${cards.ownerId} = ${ownerId}`)
    }

    if (status) {
      conditions.push(sql`${cards.status} = ${status}`)
    }

    const result = await db
      .select()
      .from(cards)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(cards.createdAt)
      .limit(limit)
      .offset(offset)

    await umami.track("get_cards_completed", {
      cardsCount: result.length.toString(),
      hasOwnerId: ownerId ? "true" : "false",
      hasStatus: status ? "true" : "false",
    })

    return result
  } catch (error) {
    await umami.track("get_cards_error", {
      error: error instanceof Error ? error.message : "unknown",
    })
    throw error
  }
}

export default getCards
