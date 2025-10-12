/* eslint-disable complexity */
import { and, sql } from "drizzle-orm"
import { db } from "../../db/index.js"
import { cards, type Card } from "../../db/schema.js"
import { indexCard, type CardDocument } from "../../services/meilisearch.js"
import umami from "../../umami.js"
import getUserById from "../users/getUserById.js"

interface UpdateCardParams {
  cardId: string
  userId: string
  role: number
  title?: string
  username?: string
  status?: string
  level?: number
  tag1?: string
  tag2?: string
  talent?: string
  object?: string
  pv?: number
  acidity?: number
  based?: number
  da?: number
  doom?: number
  competence1?: string
  competence1Tag?: string
  competence2?: string
  competence2Tag?: string
  competence3?: string
  competence3Tag?: string
  competence4?: string
  competence4Tag?: string
  degen?: number
  imageId?: string
}

const generateSlug = (username: string, title: string): string => {
  const baseSlug = `${username}/${title.toLowerCase().replace(/\s+/g, "-")}`

  return baseSlug
}
const generateUniqueSlug = async (
  username: string,
  title: string,
  excludeCardId?: string,
): Promise<string> => {
  const baseSlug = generateSlug(username, title)
  const conditions = [sql`${cards.slug} = ${baseSlug}`]

  if (excludeCardId) {
    conditions.push(sql`${cards.id} != ${excludeCardId}`)
  }

  const existingCard = await db
    .select()
    .from(cards)
    .where(and(...conditions))
    .limit(1)

  if (existingCard.length === 0) {
    return baseSlug
  }

  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  let uniqueSlug: string = ""
  let attempts = 0
  const maxAttempts = 10

  do {
    const suffix = Array.from(
      { length: 3 },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join("")
    uniqueSlug = `${baseSlug}-${suffix}`

    const conditionsWithSuffix = [sql`${cards.slug} = ${uniqueSlug}`]

    if (excludeCardId) {
      conditionsWithSuffix.push(sql`${cards.id} != ${excludeCardId}`)
    }

    // eslint-disable-next-line no-await-in-loop
    const existingCardWithSuffix = await db
      .select()
      .from(cards)
      .where(and(...conditionsWithSuffix))
      .limit(1)

    if (existingCardWithSuffix.length === 0) {
      return uniqueSlug
    }

    attempts++
  } while (attempts < maxAttempts)

  const timestamp = Date.now().toString(36)

  return `${baseSlug}-${timestamp}`
}
const updateCard = async ({
  cardId,
  userId,
  role,
  title,
  username,
  status,
  level,
  tag1,
  tag2,
  talent,
  object,
  pv,
  acidity,
  based,
  da,
  doom,
  competence1,
  competence1Tag,
  competence2,
  competence2Tag,
  competence3,
  competence3Tag,
  competence4,
  competence4Tag,
  degen,
  imageId,
}: UpdateCardParams): Promise<Card> => {
  try {
    await umami.track("update_card_started", {
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
      await umami.track("update_card_error", {
        error: "card_not_found_or_not_owned",
      })
      throw new Error("Card not found or not owned by user")
    }

    const [currentCard] = existingCard
    const updateData: Partial<Card> = {
      updatedAt: new Date(),
    }

    if (status !== undefined) {
      updateData.status = status
    }

    if (level !== undefined) {
      updateData.level = level
    }

    if (tag1 !== undefined) {
      updateData.tag1 = tag1 ?? null
    }

    if (tag2 !== undefined) {
      updateData.tag2 = tag2 ?? null
    }

    if (talent !== undefined) {
      updateData.talent = talent ?? null
    }

    if (object !== undefined) {
      updateData.object = object ?? null
    }

    if (pv !== undefined) {
      updateData.pv = pv
    }

    if (acidity !== undefined) {
      updateData.acidity = acidity
    }

    if (based !== undefined) {
      updateData.based = based
    }

    if (da !== undefined) {
      updateData.da = da
    }

    if (doom !== undefined) {
      updateData.doom = doom
    }

    if (competence1 !== undefined) {
      updateData.competence1 = competence1 ?? null
    }

    if (competence1Tag !== undefined) {
      updateData.competence1Tag = competence1Tag ?? null
    }

    if (competence2 !== undefined) {
      updateData.competence2 = competence2 ?? null
    }

    if (competence2Tag !== undefined) {
      updateData.competence2Tag = competence2Tag ?? null
    }

    if (competence3 !== undefined) {
      updateData.competence3 = competence3 ?? null
    }

    if (competence3Tag !== undefined) {
      updateData.competence3Tag = competence3Tag ?? null
    }

    if (competence4 !== undefined) {
      updateData.competence4 = competence4 ?? null
    }

    if (competence4Tag !== undefined) {
      updateData.competence4Tag = competence4Tag ?? null
    }

    if (degen !== undefined) {
      updateData.degen = degen
    }

    if (imageId !== undefined) {
      updateData.imageId = imageId ?? null
    }

    if (title !== undefined || username !== undefined) {
      const newTitle = title ?? currentCard.title
      let newUsername = username
      let owner = null

      if (!newUsername) {
        if (!currentCard.ownerId) {
          throw new Error("Card has no owner")
        }

        owner = await getUserById(currentCard.ownerId)

        if (!owner?.username) {
          throw new Error("Owner user not found or has no username")
        }

        newUsername = owner.username
      }

      if (
        newTitle &&
        newUsername &&
        (newTitle !== currentCard.title || currentCard.ownerId !== owner?.id)
      ) {
        const newSlug = await generateUniqueSlug(newUsername, newTitle, cardId)
        updateData.slug = newSlug
        updateData.title = newTitle
      }
    }

    const [updatedCard] = await db
      .update(cards)
      .set(updateData)
      .where(sql`${cards.id} = ${cardId}`)
      .returning()

    try {
      const owner = await getUserById(updatedCard.ownerId ?? "")
      const cardDoc: CardDocument = {
        id: updatedCard.id,
        slug: updatedCard.slug,
        title: updatedCard.title ?? "",
        status: updatedCard.status ?? "draft",
        level: updatedCard.level ?? 0,
        talent: updatedCard.talent,
        object: updatedCard.object,
        pv: updatedCard.pv ?? 0,
        acidity: updatedCard.acidity ?? 0,
        based: updatedCard.based ?? 0,
        da: updatedCard.da ?? 0,
        doom: updatedCard.doom ?? 0,
        competence1: updatedCard.competence1,
        competence2: updatedCard.competence2,
        competence3: updatedCard.competence3,
        competence4: updatedCard.competence4,
        degen: updatedCard.degen ?? 0,
        ownerId: updatedCard.ownerId ?? "",
        ownerUsername: owner?.username ?? "",
        createdAt:
          updatedCard.createdAt?.toISOString() ?? new Date().toISOString(),
        updatedAt:
          updatedCard.updatedAt?.toISOString() ?? new Date().toISOString(),
      }

      await indexCard(cardDoc)
    } catch (indexError) {
      // eslint-disable-next-line no-console
      console.error("Failed to index updated card:", indexError)
    }

    await umami.track("update_card_completed", {
      cardId,
      userId,
    })

    return updatedCard
  } catch (error) {
    await umami.track("update_card_error", {
      error: error instanceof Error ? error.message : "unknown",
    })
    throw error
  }
}

export default updateCard
