/* eslint-disable no-console */
import { Umami } from "@umami/node"

const isUmamiConfigured =
  process.env.UMAMI_WEBSITE_ID && process.env.UMAMI_HOSTURL
const umami = isUmamiConfigured
  ? new Umami({
      websiteId: process.env.UMAMI_WEBSITE_ID,
      hostUrl: process.env.UMAMI_HOSTURL,
    })
  : null
const track = async (
  eventName: string,
  data?: Record<string, string | number | Date>,
): Promise<void> => {
  if (!umami) {
    return
  }

  try {
    await umami.track(eventName, data)
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error(`[Umami Debug] Tracking failed for ${eventName}:`, {
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        data,
      })
    }
  }
}

export default { track }
