import { triggerCheckerRun } from '../../utils/checker'

export default defineEventHandler(async () => {
  const result = await triggerCheckerRun()

  if (!result.started) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Checker run is already in progress.'
    })
  }

  return result
})
