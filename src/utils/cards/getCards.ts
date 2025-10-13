import { and, eq, sql } from "drizzle-orm"
import { alias } from "drizzle-orm/pg-core"
import { db } from "../../db/index.js"
import { cards, images, tags, users } from "../../db/schema.js"
import umami from "../../umami.js"
import type { CardWithTags } from "./getCardBySlug.js"

interface GetCardsParams {
  ownerId?: string
  status?: string
  limit?: number
  offset?: number
}
// Interface CardWithRelations extends Card {
//   image: Image | null
//   owner: User | null
//   tags: (Tag | null)[]
// }

const tag1 = alias(tags, "tag1")
const tag2 = alias(tags, "tag2")
const comp1Tag = alias(tags, "comp1Tag")
const comp2Tag = alias(tags, "comp2Tag")
const comp3Tag = alias(tags, "comp3Tag")
const comp4Tag = alias(tags, "comp4Tag")
const owner = alias(users, "owner")
const image = alias(images, "image")
const getCards = async ({
  ownerId,
  status,
  limit = 50,
  offset = 0,
}: GetCardsParams = {}): Promise<CardWithTags[]> => {
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

    const baseSelect = {
      card: cards,
      tag1,
      tag2,
      comp1Tag,
      comp2Tag,
      comp3Tag,
      comp4Tag,
      owner,
      image,
    }
    const result = await db
      .select(baseSelect)
      .from(cards)
      .leftJoin(tag1, eq(cards.tag1, tag1.id))
      .leftJoin(tag2, eq(cards.tag2, tag2.id))
      .leftJoin(comp1Tag, eq(cards.competence1Tag, comp1Tag.id))
      .leftJoin(comp2Tag, eq(cards.competence2Tag, comp2Tag.id))
      .leftJoin(comp3Tag, eq(cards.competence3Tag, comp3Tag.id))
      .leftJoin(comp4Tag, eq(cards.competence4Tag, comp4Tag.id))
      .leftJoin(owner, eq(cards.ownerId, owner.id))
      .leftJoin(image, eq(cards.imageId, image.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(cards.createdAt)
      .limit(limit)
      .offset(offset)

    await umami.track("get_cards_completed", {
      cardsCount: result.length.toString(),
      hasOwnerId: ownerId ? "true" : "false",
      hasStatus: status ? "true" : "false",
    })

    const r = result.map((cardData) => ({
      ...cardData.card,
      tag1: cardData.tag1,
      tag2: cardData.tag2,
      comp1Tag: cardData.comp1Tag,
      comp2Tag: cardData.comp2Tag,
      comp3Tag: cardData.comp3Tag,
      comp4Tag: cardData.comp4Tag,
      owner: cardData.owner?.username,
      image: cardData.image,
    })) as never as CardWithTags[]

    return r
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
    await umami.track("get_cards_error", {
      error: error instanceof Error ? error.message : "unknown",
    })
    throw error
  }
}

export default getCards
