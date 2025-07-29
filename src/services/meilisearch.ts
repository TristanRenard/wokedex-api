import { MeiliSearch } from "meilisearch"
import umami from "../umami.js"

if (!process.env.MEILISEARCH_URL || !process.env.MEILISEARCH_MASTER_KEY) {
  throw new Error("Meilisearch environment variables not configured")
}

const meilisearchClient = new MeiliSearch({
  host: process.env.MEILISEARCH_URL,
  apiKey: process.env.MEILISEARCH_MASTER_KEY,
})
const IMAGES_INDEX_NAME = "images"

export interface ImageDocument {
  id: string
  url: string
  keywords: string[]
  uploadedBy: string
  uploadedAt: string
  mimeType: string
  size: number
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

export default meilisearchClient
