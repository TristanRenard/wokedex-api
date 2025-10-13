import { sql } from "drizzle-orm"
import { db } from "../../db/index.js"
import { cards, type Card } from "../../db/schema.js"
import umami from "../../umami.js"

interface GetCardByIdParams {
  cardId: string
  userId?: string
  role?: number
}

const getCardById = async ({
  cardId,
  userId,
  role = 0,
}: GetCardByIdParams): Promise<Card | null> => {
  try {
    await umami.track("get_card_by_id_started", {
      cardId,
      hasUserId: userId ? "true" : "false",
      role: role.toString(),
    })

    let result: Card[] = []

    if (role >= 2) {
      result = await db
        .select()
        .from(cards)
        .where(sql`${cards.id} = ${cardId}`)
        .limit(1)
    } else if (userId) {
      result = await db
        .select()
        .from(cards)
        .where(
          sql`${cards.id} = ${cardId} AND (${cards.ownerId} = ${userId} OR ${cards.status} = 'published')`,
        )
        .limit(1)
    } else {
      result = await db
        .select()
        .from(cards)
        .where(sql`${cards.id} = ${cardId} AND ${cards.status} = 'published'`)
        .limit(1)
    }

    const card = result.length > 0 ? result[0] : null

    await umami.track("get_card_by_id_completed", {
      cardId,
      hasUserId: userId ? "true" : "false",
      role: role.toString(),
      found: card ? "true" : "false",
    })

    return card
  } catch (error) {
    await umami.track("get_card_by_id_error", {
      error: error instanceof Error ? error.message : "unknown",
    })
    throw error
  }
}

export default getCardById
