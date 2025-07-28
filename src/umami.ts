import { Umami } from "@umami/node"

// Vérifier si Umami est configuré
const isUmamiConfigured =
  process.env.UMAMI_WEBSITE_ID && process.env.UMAMI_HOSTURL
// Vérifier si on est en mode test
const isTestEnvironment =
  process.env.NODE_ENV === "test" ||
  (process.env.VITEST ?? false) ||
  (process.env.JEST ?? false)
const umami = isUmamiConfigured
  ? new Umami({
      websiteId: process.env.UMAMI_WEBSITE_ID,
      hostUrl: process.env.UMAMI_HOSTURL,
    })
  : null
// Wrapper pour éviter les erreurs si Umami n'est pas configuré
const track = async (
  eventName: string,
  data?: Record<string, string | number | Date>,
): Promise<void> => {
  // Ne pas tracker en mode test
  if (isTestEnvironment) {
    return
  }

  if (umami) {
    try {
      await umami.track(eventName, data)
    } catch (error) {
      // Silently fail in development/test environment
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.warn(`Umami tracking failed for ${eventName}:`, error)
      }
    }
  }
}

export default { track }
