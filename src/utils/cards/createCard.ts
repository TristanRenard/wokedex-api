import { sql } from "drizzle-orm"
import { db } from "../../db/index.js"
import { cards, type Card, type NewCard } from "../../db/schema.js"
import { indexCard, type CardDocument } from "../../services/meilisearch.js"
import umami from "../../umami.js"

interface CreateCardParams {
  title: string
  ownerId: string
  username: string
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
): Promise<string> => {
  const baseSlug = generateSlug(username, title)
  const existingCard = await db
    .select()
    .from(cards)
    .where(sql`${cards.slug} = ${baseSlug}`)
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

    // eslint-disable-next-line no-await-in-loop
    const existingCardWithSuffix = await db
      .select()
      .from(cards)
      .where(sql`${cards.slug} = ${uniqueSlug}`)
      .limit(1)

    if (existingCardWithSuffix.length === 0) {
      return uniqueSlug
    }

    attempts++
  } while (attempts < maxAttempts)

  const timestamp = Date.now().toString(36)

  return `${baseSlug}-${timestamp}`
}
// eslint-disable-next-line complexity
const createCard = async ({
  title,
  ownerId,
  username,
  status = "draft",
  level = 0,
  tag1,
  tag2,
  talent,
  object,
  pv = 0,
  acidity = 0,
  based = 0,
  da = 0,
  doom = 0,
  competence1,
  competence1Tag,
  competence2,
  competence2Tag,
  competence3,
  competence3Tag,
  competence4,
  competence4Tag,
  degen = 0,
  imageId,
}: CreateCardParams): Promise<Card> => {
  try {
    await umami.track("create_card_started", {
      hasTitle: title ? "true" : "false",
      hasOwnerId: ownerId ? "true" : "false",
      hasUsername: username ? "true" : "false",
    })

    if (!title || typeof title !== "string") {
      throw new Error("Title is required and must be a string")
    }

    if (!ownerId || typeof ownerId !== "string") {
      throw new Error("Owner ID is required and must be a string")
    }

    if (!username || typeof username !== "string") {
      throw new Error("Username is required and must be a string")
    }

    if (status !== "draft" && status !== "published") {
      throw new Error("Status must be either 'draft' or 'published'")
    }

    const slug = await generateUniqueSlug(username, title)
    const newCard: NewCard = {
      slug,
      status,
      title,
      level,
      tag1: tag1 ?? null,
      tag2: tag2 ?? null,
      talent: talent ?? null,
      object: object ?? null,
      pv,
      acidity,
      based,
      da,
      doom,
      competence1: competence1 ?? null,
      competence1Tag: competence1Tag ?? null,
      competence2: competence2 ?? null,
      competence2Tag: competence2Tag ?? null,
      competence3: competence3 ?? null,
      competence3Tag: competence3Tag ?? null,
      competence4: competence4 ?? null,
      competence4Tag: competence4Tag ?? null,
      degen,
      imageId: imageId ?? null,
      ownerId,
    }
    const [createdCard] = await db.insert(cards).values(newCard).returning()
    const cardDoc: CardDocument = {
      id: createdCard.id,
      slug: createdCard.slug,
      title: createdCard.title ?? "",
      status: createdCard.status ?? "draft",
      level: createdCard.level ?? 0,
      talent: createdCard.talent,
      object: createdCard.object,
      pv: createdCard.pv ?? 0,
      acidity: createdCard.acidity ?? 0,
      based: createdCard.based ?? 0,
      da: createdCard.da ?? 0,
      doom: createdCard.doom ?? 0,
      competence1: createdCard.competence1,
      competence2: createdCard.competence2,
      competence3: createdCard.competence3,
      competence4: createdCard.competence4,
      degen: createdCard.degen ?? 0,
      ownerId: createdCard.ownerId ?? "",
      ownerUsername: username,
      createdAt:
        createdCard.createdAt?.toISOString() ?? new Date().toISOString(),
      updatedAt:
        createdCard.updatedAt?.toISOString() ?? new Date().toISOString(),
    }

    await indexCard(cardDoc)

    await umami.track("create_card_completed", {
      cardId: createdCard.id,
      slug: createdCard.slug,
    })

    return createdCard
  } catch (error) {
    await umami.track("create_card_error", {
      error: error instanceof Error ? error.message : "unknown",
    })
    throw error
  }
}

export default createCard
