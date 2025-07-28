import { MeiliSearch } from "meilisearch"

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
}

export const indexImage = async (imageDoc: ImageDocument): Promise<void> => {
  await ensureImagesIndex()

  const index = meilisearchClient.index(IMAGES_INDEX_NAME)
  await index.addDocuments([imageDoc])
}

export const searchImages = async (
  query: string,
  filters?: string,
  limit: number = 20,
): Promise<ImageDocument[]> => {
  const index = meilisearchClient.index(IMAGES_INDEX_NAME)
  const searchResult = await index.search(query, {
    filter: filters,
    limit,
    sort: ["uploadedAt:desc"],
  })

  return searchResult.hits as ImageDocument[]
}

export const clearImagesIndex = async (): Promise<void> => {
  const index = meilisearchClient.index(IMAGES_INDEX_NAME)
  await index.deleteAllDocuments()
}

export const reindexAllImages = async (
  imageDocs: ImageDocument[],
): Promise<void> => {
  await ensureImagesIndex()

  const index = meilisearchClient.index(IMAGES_INDEX_NAME)
  await index.addDocuments(imageDocs)
}

export default meilisearchClient
