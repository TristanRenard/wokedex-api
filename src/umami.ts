/* eslint-disable no-console */
import { Umami } from "@umami/node"

const isUmamiConfigured =
  process.env.UMAMI_WEBSITE_ID && process.env.UMAMI_HOSTURL
const isTestEnvironment =
  process.env.NODE_ENV === "test" ||
  (process.env.VITEST ?? false) ||
  (process.env.JEST ?? false)

// Debug: Log de la configuration au démarrage
if (process.env.NODE_ENV !== "production") {
  console.log("[Umami Debug] Configuration:", {
    isConfigured: isUmamiConfigured,
    hasWebsiteId: Boolean(process.env.UMAMI_WEBSITE_ID),
    hasHostUrl: Boolean(process.env.UMAMI_HOSTURL),
    isTestEnvironment,
    nodeEnv: process.env.NODE_ENV,
  })
}

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
  // Debug: Log de l'appel de tracking
  if (process.env.NODE_ENV !== "production") {
    console.log("[Umami Debug] Track called:", {
      eventName,
      data,
      willTrack: !isTestEnvironment && Boolean(umami),
    })
  }

  if (isTestEnvironment) {
    if (process.env.NODE_ENV !== "production") {
      console.log("[Umami Debug] Skipping tracking in test environment")
    }

    return
  }

  if (!umami) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[Umami Debug] Umami not configured, skipping tracking")
    }

    return
  }

  try {
    const startTime = Date.now()
    await umami.track(eventName, data)

    if (process.env.NODE_ENV !== "production") {
      console.log("[Umami Debug] Track successful:", {
        eventName,
        duration: `${Date.now() - startTime}ms`,
      })
    }
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
