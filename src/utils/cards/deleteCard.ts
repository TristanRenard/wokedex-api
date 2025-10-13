import { sql } from "drizzle-orm"
import { db } from "../../db/index.js"
import { cards, type Card } from "../../db/schema.js"
import meilisearchClient from "../../services/meilisearch.js"
import umami from "../../umami.js"

interface DeleteCardParams {
  cardId: string
  userId: string
  role: number
}

const deleteCard = async ({
  cardId,
  userId,
  role = 0,
}: DeleteCardParams): Promise<boolean> => {
  try {
    await umami.track("delete_card_started", {
      cardId,
      userId,
      role: role.toString(),
    })

    let existingCard: Card[] = []

    if (role >= 2) {
      existingCard = await db
        .select()
        .from(cards)
        .where(sql`${cards.id} = ${cardId}`)
        .limit(1)
    } else {
      existingCard = await db
        .select()
        .from(cards)
        .where(sql`${cards.id} = ${cardId} AND ${cards.ownerId} = ${userId}`)
        .limit(1)
    }

    if (existingCard.length === 0) {
      await umami.track("delete_card_error", {
        error: "card_not_found_or_not_owned",
      })
      throw new Error("Card not found or not owned by user")
    }

    if (role >= 2) {
      await db.delete(cards).where(sql`${cards.id} = ${cardId}`)
    } else {
      await db
        .delete(cards)
        .where(sql`${cards.id} = ${cardId} AND ${cards.ownerId} = ${userId}`)
    }

    try {
      const index = meilisearchClient.index("cards")
      await index.deleteDocument(cardId)
    } catch (indexError) {
      // eslint-disable-next-line no-console
      console.error("Failed to remove card from index:", indexError)
    }

    await umami.track("delete_card_completed", {
      cardId,
      userId,
    })

    return true
  } catch (error) {
    await umami.track("delete_card_error", {
      error: error instanceof Error ? error.message : "unknown",
    })
    throw error
  }
}

export default deleteCard
