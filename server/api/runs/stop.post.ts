import { stopCheckerRun } from '../../utils/checker'

export default defineEventHandler(async () => {
  const result = await stopCheckerRun()

  if (!result.stopped) {
    throw createError({
      statusCode: 409,
      statusMessage: 'No checker run is currently in progress.'
    })
  }

  return result
})
