import { Umami } from "@umami/node"

const isUmamiConfigured =
  process.env.UMAMI_WEBSITE_ID && process.env.UMAMI_HOSTURL
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
const track = async (
  eventName: string,
  data?: Record<string, string | number | Date>,
): Promise<void> => {
  if (isTestEnvironment) {
    return
  }

  if (umami) {
    try {
      await umami.track(eventName, data)
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.warn(`Umami tracking failed for ${eventName}:`, error)
      }
    }
  }
}

export default { track }
