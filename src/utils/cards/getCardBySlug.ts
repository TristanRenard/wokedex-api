import { and, eq, or } from "drizzle-orm"
import { alias } from "drizzle-orm/pg-core"
import { db } from "../../db/index.js"
import {
  cards,
  images,
  tags,
  users,
  type Card,
  type Image,
  type Tag,
  type User,
} from "../../db/schema.js"
import umami from "../../umami.js"

interface GetCardBySlugParams {
  slug: string
  userId?: string
  role?: number
}

type CardWithTags = Card & {
  tag1: Tag | null
  tag2: Tag | null
  comp1Tag: Tag | null
  comp2Tag: Tag | null
  comp3Tag: Tag | null
  comp4Tag: Tag | null
  owner: User | null
  image: Image | null
}

const tag1 = alias(tags, "tag1")
const tag2 = alias(tags, "tag2")
const comp1Tag = alias(tags, "comp1Tag")
const comp2Tag = alias(tags, "comp2Tag")
const comp3Tag = alias(tags, "comp3Tag")
const comp4Tag = alias(tags, "comp4Tag")
const owner = alias(users, "owner")
const image = alias(images, "image")
const getCardBySlug = async ({
  slug,
  userId,
  role = 0,
}: GetCardBySlugParams): Promise<CardWithTags | null> => {
  try {
    await umami.track("get_card_by_slug_started", {
      slug,
      hasUserId: userId ? "true" : "false",
      role: role.toString(),
    })

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
    const baseQuery = db
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

    let result = []

    if (role >= 2) {
      result = await baseQuery.where(eq(cards.slug, slug)).limit(1)
    } else if (userId) {
      result = await baseQuery
        .where(
          and(
            eq(cards.slug, slug),
            or(eq(cards.ownerId, userId), eq(cards.status, "published")),
          ),
        )
        .limit(1)
    } else {
      result = await baseQuery
        .where(and(eq(cards.slug, slug), eq(cards.status, "published")))
        .limit(1)
    }

    const cardData = result.length > 0 ? result[0] : null
    // @ts-expect-error card
    const card: CardWithTags | null = cardData
      ? {
          ...cardData.card,
          tag1: cardData.tag1,
          tag2: cardData.tag2,
          comp1Tag: cardData.comp1Tag,
          comp2Tag: cardData.comp2Tag,
          comp3Tag: cardData.comp3Tag,
          comp4Tag: cardData.comp4Tag,
          owner: cardData.owner?.username,
          image: cardData.image,
        }
      : null

    await umami.track("get_card_by_slug_completed", {
      slug,
      hasUserId: userId ? "true" : "false",
      role: role.toString(),
      found: card ? "true" : "false",
    })

    return card
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
    await umami.track("get_card_by_slug_error", {
      error: error instanceof Error ? error.message : "unknown",
    })
    throw error
  }
}

export default getCardBySlug
