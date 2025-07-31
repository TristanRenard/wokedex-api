import { MeiliSearch, type Index, type RecordAny } from "meilisearch"
import umami from "../umami.js"

const MEILISEARCH_URL = process.env.MEILISEARCH_URL ?? "http://localhost:7700"
const MEILISEARCH_MASTER_KEY =
  process.env.MEILISEARCH_MASTER_KEY ??
  "8e5977f29a6f9c241fa7d49990fb96dcbacc7f03ca66e1c23965de7da499c5da"

if (!MEILISEARCH_URL || !MEILISEARCH_MASTER_KEY) {
  throw new Error("Meilisearch environment variables not configured")
}

const meilisearchClient = new MeiliSearch({
  host: MEILISEARCH_URL,
  apiKey: MEILISEARCH_MASTER_KEY,
})
const IMAGES_INDEX_NAME = "images"
const CARDS_INDEX_NAME = "woke_cards"

export interface ImageDocument {
  id: string
  url: string
  keywords: string[]
  uploadedBy: string
  uploadedAt: string
  mimeType: string
  size: number
}

export interface CardDocument {
  id: string
  slug: string
  title: string
  status: string
  level: number
  talent: string | null
  object: string | null
  pv: number
  acidity: number
  based: number
  da: number
  doom: number
  competence1: string | null
  competence2: string | null
  competence3: string | null
  competence4: string | null
  degen: number
  ownerId: string
  ownerUsername: string
  createdAt: string
  updatedAt: string
}

export const ensureImagesIndex = async (): Promise<void> => {
  try {
    await umami.track("meilisearch_ensure_index_started", {
      indexName: IMAGES_INDEX_NAME,
    })

    const index = meilisearchClient.index(IMAGES_INDEX_NAME)

    await index.updateSettings({
      searchableAttributes: ["keywords", "uploadedBy"],
      filterableAttributes: ["uploadedBy", "mimeType"],
      sortableAttributes: ["uploadedAt"],
      rankingRules: [
        "words",
        "typo",
        "proximity",
        "attribute",
        "sort",
        "exactness",
      ],
    })

    await umami.track("meilisearch_index_settings_updated", {
      indexName: IMAGES_INDEX_NAME,
    })
  } catch (error) {
    await umami.track("meilisearch_ensure_index_error", {
      error: error instanceof Error ? error.message : "unknown",
      indexName: IMAGES_INDEX_NAME,
    })
    throw error
  }
}

export const indexImage = async (imageDoc: ImageDocument): Promise<void> => {
  try {
    await umami.track("meilisearch_index_image_started", {
      imageId: imageDoc.id,
      keywordsCount: imageDoc.keywords.length.toString(),
    })

    await ensureImagesIndex()

    const index = meilisearchClient.index(IMAGES_INDEX_NAME)
    await index.addDocuments([imageDoc])

    await umami.track("meilisearch_image_indexed", { imageId: imageDoc.id })
  } catch (error) {
    await umami.track("meilisearch_index_image_error", {
      error: error instanceof Error ? error.message : "unknown",
      imageId: imageDoc.id,
    })
    throw error
  }
}

export const searchImages = async (
  query: string,
  filters?: string,
  limit: number = 20,
): Promise<ImageDocument[]> => {
  try {
    await umami.track("meilisearch_search_started", {
      query: query === "*" ? "all" : query.substring(0, 50),
      hasFilters: filters ? "true" : "false",
      limit: limit.toString(),
    })

    const index = meilisearchClient.index(IMAGES_INDEX_NAME)
    const searchResult = await index.search(query, {
      filter: filters,
      limit,
      sort: ["uploadedAt:desc"],
    })

    await umami.track("meilisearch_search_completed", {
      resultsCount: searchResult.hits.length.toString(),
      query: query === "*" ? "all" : query.substring(0, 50),
      estimatedTotalHits: searchResult.estimatedTotalHits?.toString() ?? "0",
    })

    return searchResult.hits as ImageDocument[]
  } catch (error) {
    await umami.track("meilisearch_search_error", {
      error: error instanceof Error ? error.message : "unknown",
      query: query === "*" ? "all" : query.substring(0, 50),
    })
    throw error
  }
}

export const clearImagesIndex = async (): Promise<void> => {
  try {
    await umami.track("meilisearch_clear_index_started", {
      indexName: IMAGES_INDEX_NAME,
    })

    const index = meilisearchClient.index(IMAGES_INDEX_NAME)
    await index.deleteAllDocuments()

    await umami.track("meilisearch_index_cleared", {
      indexName: IMAGES_INDEX_NAME,
    })
  } catch (error) {
    await umami.track("meilisearch_clear_index_error", {
      error: error instanceof Error ? error.message : "unknown",
      indexName: IMAGES_INDEX_NAME,
    })
    throw error
  }
}

export const reindexAllImages = async (
  imageDocs: ImageDocument[],
): Promise<void> => {
  try {
    await umami.track("meilisearch_reindex_started", {
      documentsCount: imageDocs.length.toString(),
    })

    await ensureImagesIndex()

    const index = meilisearchClient.index(IMAGES_INDEX_NAME)
    await index.addDocuments(imageDocs)

    await umami.track("meilisearch_reindex_completed", {
      documentsCount: imageDocs.length.toString(),
    })
  } catch (error) {
    await umami.track("meilisearch_reindex_error", {
      error: error instanceof Error ? error.message : "unknown",
      documentsCount: imageDocs.length.toString(),
    })
    throw error
  }
}

export const ensureCardsIndex = async (): Promise<void> => {
  try {
    await umami.track("meilisearch_ensure_cards_index_started", {
      indexName: CARDS_INDEX_NAME,
    })

    let index: Index<RecordAny> | null = null

    try {
      index = meilisearchClient.index(CARDS_INDEX_NAME)
      const rawInfo = await index.getRawInfo()

      if (!rawInfo.primaryKey) {
        await meilisearchClient.deleteIndex(CARDS_INDEX_NAME)
        throw new Error("Need to recreate index with primary key")
      }
    } catch (error) {
      await umami.track("meilisearch_ensure_cards_index_error", {
        error: error instanceof Error ? error.message : "unknown",
        indexName: CARDS_INDEX_NAME,
      })
      const createResult = await meilisearchClient.createIndex(
        CARDS_INDEX_NAME,
        {
          primaryKey: "id",
        },
      )

      await meilisearchClient.tasks.waitForTask(createResult.taskUid)

      index = meilisearchClient.index(CARDS_INDEX_NAME)

      await umami.track("meilisearch_ensure_cards_index_created", {
        indexName: CARDS_INDEX_NAME,
      })
    }

    const settingsTask = await index.updateSettings({
      searchableAttributes: [
        "title",
        "talent",
        "object",
        "competence1",
        "competence2",
        "competence3",
        "competence4",
        "ownerUsername",
      ],
      filterableAttributes: ["status", "ownerId", "level"],
      sortableAttributes: [
        "createdAt",
        "updatedAt",
        "level",
        "pv",
        "acidity",
        "based",
        "da",
        "doom",
        "degen",
      ],
      rankingRules: [
        "words",
        "typo",
        "proximity",
        "attribute",
        "sort",
        "exactness",
      ],
    })

    await meilisearchClient.tasks.waitForTask(settingsTask.taskUid)

    await umami.track("meilisearch_cards_index_settings_updated", {
      indexName: CARDS_INDEX_NAME,
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Meilisearch: Error ensuring cards index:", error)
    await umami.track("meilisearch_ensure_cards_index_error", {
      error: error instanceof Error ? error.message : "unknown",
      indexName: CARDS_INDEX_NAME,
    })
    throw error
  }
}

export const indexCard = async (cardDoc: CardDocument): Promise<void> => {
  try {
    await umami.track("meilisearch_index_card_started", {
      cardId: cardDoc.id,
      title: cardDoc.title,
    })

    await ensureCardsIndex()

    const index = meilisearchClient.index(CARDS_INDEX_NAME)
    const task = await index.addDocuments([cardDoc])
    const finalTask = await meilisearchClient.tasks.waitForTask(task.taskUid)

    if (finalTask.status !== "succeeded") {
      throw new Error(`Task failed with status: ${finalTask.status}`)
    }

    await umami.track("meilisearch_card_indexed", { cardId: cardDoc.id })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Meilisearch: Error indexing card:", error)
    await umami.track("meilisearch_index_card_error", {
      error: error instanceof Error ? error.message : "unknown",
      cardId: cardDoc.id,
    })
    throw error
  }
}

export const searchCards = async (
  query: string,
  filters?: string,
  limit: number = 20,
): Promise<CardDocument[]> => {
  try {
    await umami.track("meilisearch_search_cards_started", {
      query: query === "*" ? "all" : query.substring(0, 50),
      hasFilters: filters ? "true" : "false",
      limit: limit.toString(),
    })

    const index = meilisearchClient.index(CARDS_INDEX_NAME)
    const searchResult = await index.search(query, {
      filter: filters,
      limit,
      sort: ["createdAt:desc"],
    })

    await umami.track("meilisearch_search_cards_completed", {
      resultsCount: searchResult.hits.length.toString(),
      query: query === "*" ? "all" : query.substring(0, 50),
      estimatedTotalHits: searchResult.estimatedTotalHits?.toString() ?? "0",
    })

    return searchResult.hits as CardDocument[]
  } catch (error) {
    await umami.track("meilisearch_search_cards_error", {
      error: error instanceof Error ? error.message : "unknown",
      query: query === "*" ? "all" : query.substring(0, 50),
    })
    throw error
  }
}

export const clearCardsIndex = async (): Promise<void> => {
  try {
    await umami.track("meilisearch_clear_cards_index_started", {
      indexName: CARDS_INDEX_NAME,
    })

    const index = meilisearchClient.index(CARDS_INDEX_NAME)
    await index.deleteAllDocuments()

    await umami.track("meilisearch_cards_index_cleared", {
      indexName: CARDS_INDEX_NAME,
    })
  } catch (error) {
    await umami.track("meilisearch_clear_cards_index_error", {
      error: error instanceof Error ? error.message : "unknown",
      indexName: CARDS_INDEX_NAME,
    })
    throw error
  }
}

export const deleteCardsIndex = async (): Promise<void> => {
  try {
    await meilisearchClient.deleteIndex(CARDS_INDEX_NAME)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Meilisearch: Error deleting cards index:", error)
    throw error
  }
}

export const reindexAllCards = async (
  cardDocs: CardDocument[],
): Promise<void> => {
  try {
    await umami.track("meilisearch_reindex_cards_started", {
      documentsCount: cardDocs.length.toString(),
    })

    await ensureCardsIndex()

    const index = meilisearchClient.index(CARDS_INDEX_NAME)
    await index.addDocuments(cardDocs)

    await umami.track("meilisearch_reindex_cards_completed", {
      documentsCount: cardDocs.length.toString(),
    })
  } catch (error) {
    await umami.track("meilisearch_reindex_cards_error", {
      error: error instanceof Error ? error.message : "unknown",
      documentsCount: cardDocs.length.toString(),
    })
    throw error
  }
}

export default meilisearchClient
